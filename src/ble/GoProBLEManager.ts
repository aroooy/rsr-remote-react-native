/*
 * Copyright (C) 2026 SPORT-SERVICE RS★R
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {
  BleManager,
  Device,
  BleError,
  Subscription,
  State as BleAdapterNativeState,
} from 'react-native-ble-plx';
import { Platform } from 'react-native';
import { t } from '../i18n';
import {
  warnUnexpectedDisconnect,
  startConnectionForegroundService,
  stopConnectionForegroundService,
} from '../notifications/notifications';
import { BleUiBridge, defaultBleUiBridge } from './BleUiBridge';
import {
  useGoProStore,
  CameraSpecificState,
  createDefaultCameraState,
  BluetoothAdapterState,
  selectActiveCameraState,
  selectCameraStateFor,
} from '../store/GoProStore';
import { PacketParser } from './PacketParser';
import { processQueryResponse } from './QueryResponseProcessor';
import { Buffer } from 'buffer';
import { areSettingValuesEquivalent, GOPRO_SETTINGS_METADATA } from '../constants/GoProMetadata';
import {
  CAPABILITY_REFRESH_TRIGGER_IDS,
  PRESET_REFRESH_TRIGGER_IDS,
  PRESET_RESTORE_SYSTEM_SETTING_IDS,
  RESTORE_PRIORITY_ORDER,
} from '../constants/capabilityDependencies';
import { GoProSettingId } from '../constants/GoProSettingId';
import { GoProPresetGroup, GoProPresetGroupSelectId } from '../constants/GoProPresetGroup';
import { getCapabilityDependencyRefreshIds, getDisplaySettingPlan, FOUR_BYTE_SETTING_IDS } from '../constants/layout';
import { isSystemSetting } from '../constants/SystemSettings';
import { CommandQueue, BusyRejectedError } from './CommandQueue';
import { selectIsShortTermBusy, CommandCategory } from '../store/GoProSelectors';
import {
  encodeRequestGetPresetStatus,
  encodeRequestCustomPresetUpdate,
  decodeNotifyPresetStatus,
  decodeResponseGeneric,
  GoProPresetGroupData,
  PRESET_TITLE_USER_DEFINED_CUSTOM_NAME,
  RESULT_SUCCESS,
} from './PresetProtobuf';
import { getCustomPresetNameValidationError } from './presetRenameValidation';
import { HardwareInfo, KnownDevice } from '../types/KnownDevice';
import {
  getKnownDeviceById,
  initKnownDeviceTable,
  upsertKnownDeviceConnected,
} from '../device/KnownDeviceRepository';
import {
  initPresetMetaCacheTable,
  loadPresetMetaCache,
  savePresetMetaCache,
  updatePresetMetaCacheEntry,
} from '../device/PresetMetaCacheRepository';
import {
  initCapabilityCacheTable,
  loadCapabilityCache,
  saveCapabilityCache,
  clearAllCapabilityCaches as clearAllCapabilityCachesFromDb,
} from '../device/CapabilityCacheRepository';
import { debugDebug, debugLog, debugWarn } from '../utils/debugLogging';
import { isSettingModelSupported } from '../constants/settingConstraints';
import { isHero11OrNewerModel, isHero12Or13Model } from '../cameraModels/shared/modelNoHelpers';
import { resolveCameraModelFromHardwareInfo } from '../cameraModels/shared/modelNumber';
import {
  resolveOutgoingBleSettingId,
  INCOMING_SETTING_SYNC_RULES,
} from '../constants/settingIdAliases';
import { buildGoProPacketChunks, parseHardwareInfo } from './GoProPacketCodec';
import { buildCapabilityCacheKey } from './capabilityCacheKey';
import * as CapabilityPlanning from './capabilityPlanning';

type GoProConnectionTarget = {
  id: string;
  name?: string | null;
};

export type CapabilityRecoveryReason =
  'cache_integrity_check' | 'manual_debug_audit' | 'capability_state_repair';

/** Why a scan session ended. Reported to the startScan onStop callback. */
export type ScanStopReason = 'timeout' | 'stopped' | 'error' | 'adapterOff';

const toAdapterState = (state: BleAdapterNativeState): BluetoothAdapterState => {
  switch (state) {
    case BleAdapterNativeState.PoweredOn:
      return 'PoweredOn';
    case BleAdapterNativeState.PoweredOff:
      return 'PoweredOff';
    case BleAdapterNativeState.Unauthorized:
      return 'Unauthorized';
    case BleAdapterNativeState.Unsupported:
      return 'Unsupported';
    case BleAdapterNativeState.Resetting:
      return 'Resetting';
    default:
      return 'Unknown';
  }
};

// GoPro BLE UUIDs (from Doc 02)
const GOPRO_SERVICE = '0000fea6-0000-1000-8000-00805f9b34fb';
const CMD_SEND = 'b5f90072-aa8d-11e3-9046-0002a5d5c51b';
const CMD_NOTIFY = 'b5f90073-aa8d-11e3-9046-0002a5d5c51b';
const SETTINGS_SEND = 'b5f90074-aa8d-11e3-9046-0002a5d5c51b';
const SETTINGS_NOTIFY = 'b5f90075-aa8d-11e3-9046-0002a5d5c51b';
const QUERY_SEND = 'b5f90076-aa8d-11e3-9046-0002a5d5c51b';
const QUERY_NOTIFY = 'b5f90077-aa8d-11e3-9046-0002a5d5c51b';
const WIFI_AP_SERVICE = 'b5f90001-aa8d-11e3-9046-0002a5d5c51b';
const WIFI_AP_PASSWORD_CHAR = 'b5f90003-aa8d-11e3-9046-0002a5d5c51b';

interface DeviceConnection {
  deviceId: string;
  connectedDevice: Device;
  keepAliveInterval: ReturnType<typeof setInterval> | null;
  keepAliveFailureCount: number;
  disconnectedSubscription: Subscription | null;
  notifySubscriptions: Subscription[];
  plannedCapabilityRefreshPromise: Promise<void> | null;
  queuedPlannedCapabilityRefresh: boolean;
  pendingPresetResolver: ((groups: GoProPresetGroupData[]) => void) | null;
  pendingHardwareInfoResolver: ((info: HardwareInfo) => void) | null;
  pendingPresetUpdateResolver: ((result: number) => void) | null;
  presetRefreshTimer: ReturnType<typeof setTimeout> | null;
  presetStateQueryTimer: ReturnType<typeof setTimeout> | null;
  pendingTimeouts: Map<number, ReturnType<typeof setTimeout>>;
  commandQueue: CommandQueue;
  queryWriteTail: Promise<void>;
  latestPresetLoadRequestId: number;
  capabilityQueuePromise: Promise<void>;
  deferredCapabilityIds: Set<number>;
  pendingCapabilityCacheKeys: Map<number, string[]>;
  capabilityRefreshDebounceTimer: ReturnType<typeof setTimeout> | null;
  pendingDebouncedCapabilityIds: Set<number>;
  isBooting: boolean;
  bootingTimeoutId: ReturnType<typeof setTimeout> | null;
  queryParser: PacketParser;
  cmdParser: PacketParser;
}

class GoProBLEManager {
  private manager: BleManager;
  private connections = new Map<string, DeviceConnection>();
  private connectingDeviceId: string | null = null;
  private cancelledDeviceIds = new Set<string>();
  // Device IDs whose disconnect was initiated by the app (explicit disconnect /
  // power-off). Used to suppress the "unexpected disconnect" warning for these.
  private intentionalDisconnectIds = new Set<string>();
  private stateChangeSubscription: Subscription | null = null;
  private currentScan: { sessionId: number; onStop?: (reason: ScanStopReason) => void } | null =
    null;
  private scanSessionCounter = 0;
  private scanTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private ui: BleUiBridge = defaultBleUiBridge;

  /** Override the UI bridge (e.g. inject a stub in tests). */
  public setUiBridge(bridge: BleUiBridge) {
    this.ui = bridge;
  }

  private getConn(deviceId?: string): DeviceConnection | undefined {
    const id = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!id) return undefined;
    return this.connections.get(id);
  }

  private get activeConn(): DeviceConnection | undefined {
    const id = useGoProStore.getState().connectedDeviceId;
    if (!id) return undefined;
    return this.connections.get(id);
  }

  constructor() {
    this.manager = new BleManager();
    this.subscribeToAdapterState();
    useGoProStore.subscribe((state, prevState) => {
      // When the camera recovers from a busy state (such as transitional mode switching),
      // we re-fetch capabilities based on the finalized last state.
      if (
        selectIsShortTermBusy(selectActiveCameraState(prevState)) &&
        !selectIsShortTermBusy(selectActiveCameraState(state))
      ) {
        if (!state.autoNavigateToControl) {
          return;
        }
        const deviceId = state.connectedDeviceId;
        if (deviceId) {
          const conn = this.connections.get(deviceId);
          if (conn) {
            const cameraState = state.cameraStates[deviceId] || createDefaultCameraState();
            const quickIds = this.getDefaultCapabilityPrefetchIds(cameraState);
            const deferredIds = Array.from(conn.deferredCapabilityIds);
            conn.deferredCapabilityIds.clear();
            const idsToRefresh = Array.from(new Set([...quickIds, ...deferredIds]));
            if (idsToRefresh.length > 0) {
              void this.fetchCapabilitiesByIds(idsToRefresh, true, deviceId);
            }
          }
        }
      }
    });
  }

  private recreateManager() {
    this.finishScanSession('error');
    this.stateChangeSubscription?.remove();
    this.stateChangeSubscription = null;
    try {
      this.manager.destroy();
    } catch {
      // ignore
    }
    this.manager = new BleManager();
    this.connectingDeviceId = null;
    for (const conn of Array.from(this.connections.values())) {
      this.deleteConnection(conn.deviceId);
    }
    this.subscribeToAdapterState();
  }

  /**
   * Mirrors the Bluetooth adapter state into the store so the UI can react
   * (e.g. show a "Bluetooth is off" banner) and stops any running scan when
   * the adapter becomes unavailable. emitCurrentState=true delivers the
   * current state immediately on subscription.
   */
  private subscribeToAdapterState() {
    this.stateChangeSubscription?.remove();
    this.stateChangeSubscription = this.manager.onStateChange((state) => {
      useGoProStore.getState().setBluetoothState(toAdapterState(state));
      if (state !== BleAdapterNativeState.PoweredOn) {
        this.finishScanSession('adapterOff');
      }
    }, true);
  }

  /** True while a startScan session is running. */
  public get isScanActive(): boolean {
    return this.currentScan !== null;
  }

  /**
   * Starts a BLE device scan. Only one scan session runs at a time; starting
   * a new one supersedes (stops) the previous session. Returns false without
   * scanning when the Bluetooth adapter is not powered on.
   */
  public async startScan(options: {
    onDevice: (device: Device) => void;
    timeoutMs?: number;
    onStop?: (reason: ScanStopReason) => void;
  }): Promise<boolean> {
    let adapterState: BleAdapterNativeState;
    try {
      adapterState = await this.manager.state();
    } catch (e) {
      if (!this.isManagerDestroyedError(e)) throw e;
      this.recreateManager();
      adapterState = await this.manager.state();
    }
    useGoProStore.getState().setBluetoothState(toAdapterState(adapterState));
    if (adapterState !== BleAdapterNativeState.PoweredOn) {
      debugWarn('ble', '[BLE] startScan blocked: adapter state =', adapterState);
      return false;
    }

    this.finishScanSession('stopped');

    const sessionId = ++this.scanSessionCounter;
    this.currentScan = { sessionId, onStop: options.onStop };

    this.manager.startDeviceScan(null, null, (error, device) => {
      // Ignore callbacks from superseded sessions (start/stop races)
      if (this.currentScan?.sessionId !== sessionId) return;
      if (error) {
        debugWarn('ble', '[BLE] device scan error', error);
        this.finishScanSession('error');
        return;
      }
      if (device) {
        options.onDevice(device);
      }
    });

    this.scanTimeoutTimer = setTimeout(() => {
      if (this.currentScan?.sessionId === sessionId) {
        this.finishScanSession('timeout');
      }
    }, options.timeoutMs ?? 10000);

    return true;
  }

  public stopScan() {
    this.finishScanSession('stopped');
  }

  private finishScanSession(reason: ScanStopReason) {
    if (this.scanTimeoutTimer) {
      clearTimeout(this.scanTimeoutTimer);
      this.scanTimeoutTimer = null;
    }
    const scan = this.currentScan;
    if (!scan) return;
    this.currentScan = null;
    try {
      this.manager.stopDeviceScan();
    } catch (e) {
      if (!this.isManagerDestroyedError(e)) {
        debugWarn('ble', '[BLE] stopDeviceScan failed', e);
      }
    }
    scan.onStop?.(reason);
  }

  private clearNotifySubscriptions(conn: DeviceConnection) {
    conn.notifySubscriptions.forEach((subscription) => subscription.remove());
    conn.notifySubscriptions = [];
  }

  private clearPendingResources(conn: DeviceConnection) {
    if (conn.presetRefreshTimer) {
      clearTimeout(conn.presetRefreshTimer);
      conn.presetRefreshTimer = null;
    }
    if (conn.presetStateQueryTimer) {
      clearTimeout(conn.presetStateQueryTimer);
      conn.presetStateQueryTimer = null;
    }
    conn.pendingPresetResolver = null;
    conn.pendingHardwareInfoResolver = null;
    conn.pendingPresetUpdateResolver = null;
    conn.pendingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    conn.pendingTimeouts.clear();
    if (conn.capabilityRefreshDebounceTimer) {
      clearTimeout(conn.capabilityRefreshDebounceTimer);
      conn.capabilityRefreshDebounceTimer = null;
    }
    conn.pendingDebouncedCapabilityIds.clear();
    conn.deferredCapabilityIds.clear();
    conn.pendingCapabilityCacheKeys.clear();
    conn.queryWriteTail = Promise.resolve();
    conn.capabilityQueuePromise = Promise.resolve();
    conn.queryParser.reset();
    conn.cmdParser.reset();
  }

  private initConnection(deviceId: string, device: Device): DeviceConnection {
    const conn: DeviceConnection = {
      deviceId,
      connectedDevice: device,
      keepAliveInterval: null,
      keepAliveFailureCount: 0,
      disconnectedSubscription: null,
      notifySubscriptions: [],
      plannedCapabilityRefreshPromise: null,
      queuedPlannedCapabilityRefresh: false,
      pendingPresetResolver: null,
      pendingHardwareInfoResolver: null,
      pendingPresetUpdateResolver: null,
      presetRefreshTimer: null,
      presetStateQueryTimer: null,
      pendingTimeouts: new Map(),
      commandQueue: new CommandQueue(),
      queryWriteTail: Promise.resolve(),
      latestPresetLoadRequestId: 0,
      capabilityQueuePromise: Promise.resolve(),
      deferredCapabilityIds: new Set(),
      pendingCapabilityCacheKeys: new Map(),
      capabilityRefreshDebounceTimer: null,
      pendingDebouncedCapabilityIds: new Set(),
      isBooting: false,
      bootingTimeoutId: null,
      queryParser: new PacketParser(),
      cmdParser: new PacketParser(),
    };
    this.connections.set(deviceId, conn);
    void this.syncConnectionForegroundService();
    return conn;
  }

  private deleteConnection(deviceId: string) {
    const conn = this.connections.get(deviceId);
    if (conn) {
      if (conn.keepAliveInterval) clearInterval(conn.keepAliveInterval);
      conn.disconnectedSubscription?.remove();
      this.clearNotifySubscriptions(conn);
      this.clearPendingResources(conn);
      this.connections.delete(deviceId);
      void this.syncConnectionForegroundService();
    }
  }

  private enqueuePendingCapabilityCacheKey(settingId: number, cacheKey: string, deviceId?: string) {
    const conn = this.getConn(deviceId);
    if (!conn) return;
    const queue = conn.pendingCapabilityCacheKeys.get(settingId) ?? [];
    queue.push(cacheKey);
    conn.pendingCapabilityCacheKeys.set(settingId, queue);
  }

  private consumePendingCapabilityCacheKey(settingId: number, deviceId?: string): string | null {
    const conn = this.getConn(deviceId);
    if (!conn) return null;
    const queue = conn.pendingCapabilityCacheKeys.get(settingId);
    if (!queue || queue.length === 0) return null;
    const cacheKey = queue.shift() ?? null;
    if (queue.length === 0) {
      conn.pendingCapabilityCacheKeys.delete(settingId);
    } else {
      conn.pendingCapabilityCacheKeys.set(settingId, queue);
    }
    return cacheKey;
  }

  private clearConnectionResources(deviceId: string) {
    this.deleteConnection(deviceId);
  }

  private handleDisconnectedToTop(deviceId: string) {
    const store = useGoProStore.getState();
    const prevStatus = store.deviceConnectionStatuses[deviceId] || 'disconnected';
    const wasIntentional = this.intentionalDisconnectIds.delete(deviceId);
    this.clearConnectionResources(deviceId);
    if (prevStatus === 'disconnected') return;
    store.beginDisconnectForDevice(deviceId);
    // Only warn when an established connection drops without the app asking for it
    // (out of range / silent power-off). App-initiated disconnects are suppressed.
    if (!wasIntentional && prevStatus === 'connected') {
      void warnUnexpectedDisconnect(this.resolveDeviceName(deviceId));
    }
  }

  /** Mark a disconnect as app-initiated so it is not reported as unexpected. */
  private markIntentionalDisconnect(deviceId: string) {
    this.intentionalDisconnectIds.add(deviceId);
    // Self-clear if no disconnect actually follows, so a later genuine drop is
    // still reported.
    setTimeout(() => this.intentionalDisconnectIds.delete(deviceId), 15000);
  }

  private resolveDeviceName(deviceId: string): string {
    const cs = useGoProStore.getState().cameraStates[deviceId];
    return cs?.hardwareInfo?.ssid || cs?.hardwareInfo?.modelName || 'GoPro';
  }

  /** Keep the Android foreground service running while any camera is connected. */
  private async syncConnectionForegroundService(): Promise<void> {
    if (this.connections.size > 0) {
      await startConnectionForegroundService();
    } else {
      await stopConnectionForegroundService();
    }
  }

  private setupDisconnectMonitor(conn: DeviceConnection) {
    conn.disconnectedSubscription?.remove();
    conn.disconnectedSubscription = this.manager.onDeviceDisconnected(conn.deviceId, () => {
      this.handleDisconnectedToTop(conn.deviceId);
    });
  }

  private isCancellationError(error: any, deviceId?: string) {
    const message = String(error?.message || error || '').toLowerCase();
    return (
      message.includes('operation was cancelled') ||
      message.includes('cancelled') ||
      (!!deviceId && this.cancelledDeviceIds.has(deviceId))
    );
  }

  private isManagerDestroyedError(error: any) {
    const message = String(error?.message || error || '').toLowerCase();
    return message.includes('ble manager was destroyed');
  }

  public isDeviceConnected(deviceId: string) {
    return this.connections.has(deviceId);
  }

  public get isConnected() {
    return this.activeConn !== undefined;
  }

  public get currentConnectingDeviceId() {
    return this.connectingDeviceId;
  }

  private async waitForBleStabilization(delayMs: number) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  private async connectWithRetry(
    target: GoProConnectionTarget,
    maxAttempts: number,
  ): Promise<Device> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (this.cancelledDeviceIds.has(target.id)) {
        throw new Error('Connection cancelled');
      }

      try {
        return await this.manager.connectToDevice(target.id, { autoConnect: false });
      } catch (e) {
        if (this.isCancellationError(e, target.id)) {
          throw e;
        }
        if (this.isManagerDestroyedError(e)) {
          this.recreateManager();
        }
        debugLog('ble', `Connection attempt ${attempt + 1} failed. Retrying...`);
        if (attempt === maxAttempts - 1) throw e;
        await this.waitForBleStabilization(1500);
      }
    }

    throw new Error('Failed to connect');
  }

  private async cleanupRecoveryConnectionAttempt(deviceId: string) {
    this.clearConnectionResources(deviceId);
    const store = useGoProStore.getState();
    store.beginDisconnectForDevice(deviceId);
    store.setConnectedDeviceId(null);
    store.setDeviceConnectionStatus(deviceId, 'scanning');
    this.connectingDeviceId = deviceId;

    try {
      await this.manager.cancelDeviceConnection(deviceId);
    } catch (e) {
      if (!this.isManagerDestroyedError(e)) {
        debugLog('ble', '[BLE] cleanupRecoveryConnectionAttempt cancel failed:', String(e));
      }
    }
  }

  private async completeConnectionSetup(
    target: GoProConnectionTarget,
    connected: Device,
    gattReadyDelayMs: number,
  ): Promise<Device> {
    const store = useGoProStore.getState();

    debugLog('ble', 'Connected to:', connected.name ?? target.name ?? target.id);

    if (Platform.OS === 'android') {
      try {
        await connected.requestMTU(512);
      } catch (e) {
        if (this.isCancellationError(e, target.id)) {
          throw e;
        }
        debugWarn('ble', 'MTU request failed', e);
      }
    }

    await this.waitForBleStabilization(gattReadyDelayMs);

    if (this.cancelledDeviceIds.has(target.id)) {
      throw new Error('Connection cancelled');
    }

    const discover = await connected.discoverAllServicesAndCharacteristics();
    const conn = this.initConnection(discover.id, discover);

    store.setDeviceConnectionStatus(discover.id, 'connected');
    store.setActiveDevice(discover.id);
    this.setupDisconnectMonitor(conn);

    this.setupNotifications(conn);

    const persistedHwInfo = await this.loadPersistedHardwareInfo(discover.id);
    if (persistedHwInfo) {
      store.updateDeviceState(discover.id, { hardwareInfo: persistedHwInfo });
      debugLog(
        'ble',
        '[BLE] HardwareInfo hydrated from DB modelName:',
        persistedHwInfo.modelName,
        '/ modelNo:',
        persistedHwInfo.modelNo,
      );
    }

    const hwInfo = await this.fetchHardwareInfoWithRetry(3, discover.id);
    const effectiveHwInfo = hwInfo ?? persistedHwInfo;
    store.updateDeviceState(discover.id, { hardwareInfo: effectiveHwInfo });
    await this.persistKnownDevice(target, hwInfo);

    if (!effectiveHwInfo) {
      throw new Error(
        'Failed to fetch GoPro hardware information. Please reconnect and try again.',
      );
    }

    debugLog(
      'ble',
      '[BLE] HardwareInfo modelName:',
      effectiveHwInfo.modelName,
      '/ modelNo:',
      effectiveHwInfo.modelNo,
    );
    debugLog('ble', '[BLE] hardwareInfo confirmed — modelNo:', effectiveHwInfo.modelNo);
    if (store.autoNavigateToControl) {
      store.setActiveScreen('control');
    }

    this.startKeepAlive(conn);

    store.setDeviceConnectionStatus(discover.id, 'connected');
    this.connectingDeviceId = null;
    this.cancelledDeviceIds.delete(target.id);

    conn.isBooting = true;
    if (conn.bootingTimeoutId) clearTimeout(conn.bootingTimeoutId);
    conn.bootingTimeoutId = setTimeout(() => {
      conn.isBooting = false;
      conn.bootingTimeoutId = null;
      const storeState = useGoProStore.getState();
      if (!storeState.autoNavigateToControl) {
        return;
      }
      const cameraState = storeState.cameraStates[conn.deviceId];
      if (cameraState) {
        const quickIds = this.getDefaultCapabilityPrefetchIds(cameraState);
        const deferredIds = Array.from(conn.deferredCapabilityIds);
        conn.deferredCapabilityIds.clear();
        const idsToFetch = Array.from(new Set([...quickIds, ...deferredIds]));
        if (idsToFetch.length > 0)
          void this.fetchCapabilitiesByIds(idsToFetch, true, conn.deviceId);
      }
    }, 3000);

    void this.bootstrapConnectedDevice(discover.id);
    return discover;
  }

  private async bootstrapConnectedDevice(deviceId: string) {
    try {
      // Always restore the persistent cache to the Store before retrieving settings (0x52) and letting the UI react.
      // If we don't do this, 0x52 receipt will trigger an empty cache evaluation, causing redundant 0x32 (Capability) re-fetches.
      try {
        await initPresetMetaCacheTable();
        await initCapabilityCacheTable();
        const cached = await loadPresetMetaCache(deviceId);
        if (cached.length > 0) {
          useGoProStore.getState().setPresets(cached, deviceId);
          debugLog('ble', '[BLE] Preset meta cache loaded:', cached.length, 'groups');
        }
        const capabilityCache = await loadCapabilityCache(deviceId);
        useGoProStore.getState().updateDeviceState(deviceId, { capabilityCache });
        if (Object.keys(capabilityCache).length > 0) {
          debugLog('bleCache', '[BLE] Capability cache loaded from DB');
        }
      } catch (e) {
        debugWarn('bleCache', '[BLE] cache load failed', e);
      }

      await this.sendQuery([0x01, 0x12], deviceId);
      await new Promise((resolve) => setTimeout(resolve, 300));
      await this.sendQuery([0x01, 0x52], deviceId);
      await new Promise((resolve) => setTimeout(resolve, 300));
      await this.sendQuery([0x01, 0x53], deviceId);
      // To mimic the legacy app, automatic capability fetching is not performed.
      // Capabilities are only fetched for items needed during UI interaction.
      // (The cache load process that was here has been moved up)
      // Get the preset list via Protobuf (including custom presets).
      await new Promise((resolve) => setTimeout(resolve, 500));
      await this.fetchPresetStatus(deviceId);
    } catch (e) {
      debugWarn('ble', 'bootstrapConnectedDevice failed', e);
    }
  }

  private async persistKnownDevice(
    target: GoProConnectionTarget,
    hardwareInfo: HardwareInfo | null,
  ) {
    try {
      await initKnownDeviceTable();
      await upsertKnownDeviceConnected({
        id: target.id,
        name: target.name ?? target.id,
        modelNo: hardwareInfo?.modelNo,
        modelName: hardwareInfo?.modelName,
        boardType: hardwareInfo?.boardType,
        firmwareVersion: hardwareInfo?.firmwareVersion,
        serialNumber: hardwareInfo?.serialNumber,
        ssid: hardwareInfo?.ssid,
        macAddress: hardwareInfo?.macAddress,
      });
    } catch (e) {
      debugWarn('ble', '[BLE] persistKnownDevice failed', e);
    }
  }

  private async loadPersistedHardwareInfo(deviceId: string): Promise<HardwareInfo | null> {
    try {
      await initKnownDeviceTable();
      const knownDevice = await getKnownDeviceById(deviceId);
      return this.toHardwareInfo(knownDevice);
    } catch (e) {
      debugWarn('ble', '[BLE] loadPersistedHardwareInfo failed', e);
      return null;
    }
  }

  private toHardwareInfo(device: KnownDevice | null): HardwareInfo | null {
    if (
      device?.modelNo == null ||
      device.modelName == null ||
      device.boardType == null ||
      device.firmwareVersion == null ||
      device.serialNumber == null ||
      device.ssid == null ||
      device.macAddress == null
    ) {
      return null;
    }

    return {
      modelNo: device.modelNo,
      modelName: device.modelName,
      boardType: device.boardType,
      firmwareVersion: device.firmwareVersion,
      serialNumber: device.serialNumber,
      ssid: device.ssid,
      macAddress: device.macAddress,
    };
  }

  private getDefaultCapabilityPrefetchIds(cameraState?: CameraSpecificState): number[] {
    const cs = cameraState ?? selectActiveCameraState(useGoProStore.getState());
    return CapabilityPlanning.getDefaultCapabilityPrefetchIds(cs);
  }

  private getPlannedFullCapabilityRefreshIds(cameraState?: CameraSpecificState): number[] {
    const cs = cameraState ?? selectActiveCameraState(useGoProStore.getState());
    return CapabilityPlanning.getPlannedFullCapabilityRefreshIds(cs);
  }

  private filterCapabilityIdsForCurrentContext(
    settingIds: number[],
    cameraState: CameraSpecificState,
  ): number[] {
    return CapabilityPlanning.filterCapabilityIdsForCurrentContext(settingIds, cameraState);
  }

  private getCapabilityCacheKey(
    cameraState: CameraSpecificState,
    deviceId?: string,
  ): string | null {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    const conn = targetId ? this.connections.get(targetId) : undefined;
    const isBooting = conn ? conn.isBooting : false;
    return buildCapabilityCacheKey(cameraState, isBooting);
  }

  private async fetchCapabilitiesByIds(
    settingIds: number[],
    showRefreshing = true,
    deviceId?: string,
  ) {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return;
    const conn = this.connections.get(targetId);
    if (!conn) return;

    const store = useGoProStore.getState();
    const cameraState = store.cameraStates[targetId] || createDefaultCameraState();

    let uniqueIds = this.filterCapabilityIdsForCurrentContext(settingIds, cameraState);
    if (uniqueIds.length === 0) return;

    const cacheKey = this.getCapabilityCacheKey(cameraState, targetId);
    const bypassCapabilityCache = store.bypassCapabilityCache;

    if (!cacheKey) {
      uniqueIds.forEach((id) => conn.deferredCapabilityIds.add(id));
      return;
    }

    if (!bypassCapabilityCache && cameraState.capabilityCache[cacheKey]) {
      const cached = cameraState.capabilityCache[cacheKey];
      const hitIds = uniqueIds.filter((id) => id in cached);
      const missingIds = uniqueIds.filter((id) => !(id in cached));

      if (hitIds.length > 0) {
        store.batchUpdateCapabilitiesForDevice(
          targetId,
          hitIds.map((id) => ({ id, values: cached[id] })),
        );
      }

      if (missingIds.length === 0) {
        debugLog('bleCache', `[BLE Cache] FULL HIT! Key: ${cacheKey}`);
        return;
      }

      debugLog(
        'bleCache',
        `[BLE Cache] PARTIAL MISS! Key: ${cacheKey}. Missing: ${missingIds.length} capabilities. IDs: ${missingIds.join(',')}`,
      );
      uniqueIds = missingIds;
    } else if (!bypassCapabilityCache && cacheKey) {
      debugLog(
        'bleCache',
        `[BLE Cache] FULL MISS! Key: ${cacheKey}. Fetching ${uniqueIds.length} capabilities. IDs: ${uniqueIds.join(',')}`,
      );
    } else {
      debugLog(
        'bleCache',
        `[BLE Cache] BYPASS! Key: ${cacheKey}. Fetching ${uniqueIds.length} capabilities directly. IDs: ${uniqueIds.join(',')}`,
      );
    }

    const requestIds = [...uniqueIds];
    const runBatch = async () => {
      if (showRefreshing) {
        store.updateDeviceState(targetId, { isRefreshingCapabilities: true });
      }

      try {
        for (const id of requestIds) {
          if (!store.bypassCapabilityCache) {
            this.enqueuePendingCapabilityCacheKey(id, cacheKey, targetId);
          }
          await new Promise((resolve) => setTimeout(resolve, 60));
          const ok = await this.sendQuery([0x02, 0x32, id], targetId);
          if (!ok && !store.bypassCapabilityCache) {
            this.consumePendingCapabilityCacheKey(id, targetId);
            debugLog('bleCache', `Failed to fetch caps for ${id}`);
          }
        }
      } finally {
        if (showRefreshing) {
          store.updateDeviceState(targetId, { isRefreshingCapabilities: false });
        }
      }
    };

    const chained = conn.capabilityQueuePromise.then(runBatch, runBatch);
    conn.capabilityQueuePromise = chained.catch(() => undefined);
    await chained;
  }

  public async fetchCapabilityForSetting(settingId: number, deviceId?: string) {
    if (!Number.isFinite(settingId)) return;
    return this.fetchCapabilitiesByIds([settingId], false, deviceId);
  }

  public async clearAllCapabilityCaches() {
    await initCapabilityCacheTable();
    await clearAllCapabilityCachesFromDb();
    const store = useGoProStore.getState();
    store.setCapabilityCache({});
  }

  public async connectToDevice(device: GoProConnectionTarget): Promise<Device | null> {
    // Scanning and connecting at the same time destabilises BLE on both platforms
    this.stopScan();
    const store = useGoProStore.getState();
    store.setActiveDevice(device.id);
    store.setPresets([], device.id);
    store.setDeviceConnectionStatus(device.id, 'scanning');
    this.cancelledDeviceIds.delete(device.id);
    this.connectingDeviceId = device.id;

    try {
      let connected = await this.connectWithRetry(device, 3);

      try {
        return await this.completeConnectionSetup(device, connected, 500);
      } catch (postConnectError) {
        if (this.isCancellationError(postConnectError, device.id)) {
          throw postConnectError;
        }

        debugLog(
          'ble',
          '[BLE] Post-connect setup failed, attempting wake recovery reconnect:',
          String(postConnectError),
        );
        await this.cleanupRecoveryConnectionAttempt(device.id);
        await this.waitForBleStabilization(2000);

        if (this.cancelledDeviceIds.has(device.id)) {
          throw new Error('Connection cancelled');
        }

        connected = await this.connectWithRetry(device, 2);
        return await this.completeConnectionSetup(device, connected, 1500);
      }
    } catch (e: any) {
      if (this.isManagerDestroyedError(e)) {
        this.recreateManager();
      }
      if (!this.isCancellationError(e, device.id)) {
        console.error('Connection failed:', e);
        this.ui.alert(t('ble.connectionError'), e?.message || String(e));
      }
      this.clearConnectionResources(device.id);
      store.beginDisconnectForDevice(device.id);
      store.setActiveScreen('home');
      this.connectingDeviceId = null;
      this.cancelledDeviceIds.delete(device.id);
      return null;
    }
  }

  public async cancelPendingConnection(deviceId?: string) {
    const targetId = deviceId ?? this.connectingDeviceId;
    if (!targetId) return;
    this.cancelledDeviceIds.add(targetId);
    this.clearConnectionResources(targetId);

    try {
      await this.manager.cancelDeviceConnection(targetId);
    } catch (e) {
      if (!this.isManagerDestroyedError(e)) {
        debugWarn('ble', 'cancelPendingConnection failed', e);
      }
    } finally {
      if (this.connectingDeviceId === targetId) {
        this.connectingDeviceId = null;
      }
      const store = useGoProStore.getState();
      store.beginDisconnectForDevice(targetId);
      store.setActiveScreen('home');
    }
  }

  public async powerOffCamera(deviceId?: string) {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) {
      this.ui.alert(t('ble.notConnected'), t('ble.notConnectedDesc'));
      return false;
    }
    const conn = this.connections.get(targetId);
    if (!conn) {
      this.ui.alert(t('ble.notConnected'), t('ble.notConnectedDesc'));
      return false;
    }

    // The camera will drop its BLE link right after this command — mark it so the
    // resulting disconnect is treated as intentional (no warning notification).
    this.markIntentionalDisconnect(targetId);

    try {
      const base64Str = Buffer.from([0x01, 0x05]).toString('base64');
      await conn.connectedDevice.writeCharacteristicWithResponseForService(
        GOPRO_SERVICE,
        CMD_SEND,
        base64Str,
      );
      return true;
    } catch (e: any) {
      // Power-off command failed → the camera stays connected, so clear the mark.
      this.intentionalDisconnectIds.delete(targetId);
      debugWarn('ble', 'powerOffCamera failed', e);
      this.ui.alert(t('ble.powerOffError'), e?.message || String(e));
      return false;
    }
  }

  public async powerOffCameraSafely(deviceId?: string): Promise<boolean> {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) {
      this.ui.alert(t('ble.notConnected'), t('ble.notConnectedDesc'));
      return false;
    }
    const conn = this.connections.get(targetId);
    if (!conn) {
      this.ui.alert(t('ble.notConnected'), t('ble.notConnectedDesc'));
      return false;
    }

    const cameraState =
      useGoProStore.getState().cameraStates[targetId] || createDefaultCameraState();
    const isEncoding = cameraState.isEncoding;

    if (isEncoding) {
      const ok = await this.ui.confirm({
        title: t('ble.currentlyRecording'),
        message: t('ble.currentlyRecordingDesc'),
        cancelText: t('common.cancel'),
        confirmText: t('ble.stopAndPowerOff'),
        destructive: true,
      });
      if (!ok) return false;

      try {
        await this.toggleShutter(false, targetId);
      } catch (e) {
        debugWarn('ble', '[PowerOff] stop shutter failed', e);
      }

      // Poll up to ~5 seconds until isEncoding=false and systemBusy=false
      const READY_TIMEOUT_MS = 5000;
      const POLL_INTERVAL_MS = 200;
      const startedAt = Date.now();
      while (Date.now() - startedAt < READY_TIMEOUT_MS) {
        const freshState = useGoProStore.getState().cameraStates[targetId];
        if (freshState && !freshState.isEncoding && !freshState.systemBusy) {
          break;
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
    }

    return this.powerOffCamera(targetId);
  }

  public async toggleShutterAll(isStart: boolean): Promise<void> {
    const connectedIds = Array.from(this.connections.keys());
    if (connectedIds.length === 0) return;

    await Promise.all(
      connectedIds.map(async (id) => {
        try {
          await this.toggleShutter(isStart, id);
        } catch (e) {
          debugWarn('ble', `[MultiShutter] failed for ${id}`, e);
        }
      }),
    );
  }

  public async powerOffAllConnectedCameras(): Promise<void> {
    const connectedIds = Array.from(this.connections.keys());
    if (connectedIds.length === 0) return;

    const store = useGoProStore.getState();
    const anyEncoding = connectedIds.some((id) => store.cameraStates[id]?.isEncoding);

    if (anyEncoding) {
      const ok = await this.ui.confirm({
        title: t('ble.powerOffAll'),
        message: t('ble.powerOffAllRecordingDesc'),
        cancelText: t('common.cancel'),
        confirmText: t('ble.stopAndPowerOff'),
        destructive: true,
      });
      if (!ok) return;

      // Stop all recording
      await Promise.all(
        connectedIds.map(async (id) => {
          const cameraState = store.cameraStates[id];
          if (cameraState?.isEncoding) {
            try {
              await this.toggleShutter(false, id);
            } catch (e) {
              debugWarn('ble', `[MultiPowerOff] stop shutter failed for ${id}`, e);
            }
          }
        }),
      );

      // Wait by polling (max 5 seconds)
      const READY_TIMEOUT_MS = 5000;
      const POLL_INTERVAL_MS = 200;
      const startedAt = Date.now();
      while (Date.now() - startedAt < READY_TIMEOUT_MS) {
        const freshStore = useGoProStore.getState();
        const stillBusy = connectedIds.some((id) => {
          const s = freshStore.cameraStates[id];
          return s && (s.isEncoding || s.systemBusy);
        });
        if (!stillBusy) break;
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
    } else {
      const ok = await this.ui.confirm({
        title: t('ble.powerOffAll'),
        message: t('ble.powerOffAllDesc'),
        cancelText: t('common.cancel'),
        confirmText: t('ble.powerOff'),
        destructive: true,
      });
      if (!ok) return;
    }

    // Turn off power to all cameras
    await Promise.all(
      connectedIds.map(async (id) => {
        try {
          await this.powerOffCamera(id);
        } catch (e) {
          debugWarn('ble', `[MultiPowerOff] powerOff failed for ${id}`, e);
        }
      }),
    );
  }

  public async fetchAllCapabilities(showRefreshing = true, deviceId?: string) {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return;
    const conn = this.connections.get(targetId);
    if (!conn) return;

    if (conn.plannedCapabilityRefreshPromise) {
      conn.queuedPlannedCapabilityRefresh = true;
      return conn.plannedCapabilityRefreshPromise;
    }

    const run = async () => {
      const storeState = useGoProStore.getState();
      const cameraState = storeState.cameraStates[targetId] || createDefaultCameraState();
      const settingIds = this.getPlannedFullCapabilityRefreshIds(cameraState);

      await this.fetchCapabilitiesByIds(settingIds, showRefreshing, targetId);
    };

    conn.plannedCapabilityRefreshPromise = run().finally(async () => {
      conn.plannedCapabilityRefreshPromise = null;
      if (conn.queuedPlannedCapabilityRefresh) {
        conn.queuedPlannedCapabilityRefresh = false;
        await this.fetchAllCapabilities(false, targetId);
      }
    });

    return conn.plannedCapabilityRefreshPromise;
  }

  public async recoverAllCapabilities(
    reason: CapabilityRecoveryReason,
    showRefreshing = true,
    deviceId?: string,
  ) {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return;
    const conn = this.connections.get(targetId);
    if (!conn) return;

    if (conn.plannedCapabilityRefreshPromise) {
      await conn.plannedCapabilityRefreshPromise;
    }

    const store = useGoProStore.getState();
    const cameraState = store.cameraStates[targetId] || createDefaultCameraState();
    const settingIds = Array.from(
      new Set([
        ...this.getPlannedFullCapabilityRefreshIds(cameraState),
        ...Object.keys(GOPRO_SETTINGS_METADATA).map(Number),
        ...Object.keys(cameraState.settings).map(Number),
        ...Object.keys(cameraState.capabilities).map(Number),
      ]),
    );

    debugLog(
      'ble',
      '[BLE] Running broad capability recovery refresh:',
      reason,
      'count=',
      settingIds.length,
    );

    await this.fetchCapabilitiesByIds(settingIds, showRefreshing, targetId);
  }

  private setupNotifications(conn: DeviceConnection) {
    const device = conn.connectedDevice;
    const deviceId = conn.deviceId;

    // Handler for 0077 (QUERY_NOTIFY)
    const queryNotifyHandler = (error: BleError | null, characteristic: any) => {
      if (error) {
        debugWarn('ble', 'Query Notify error:', error);
        return;
      }
      if (characteristic?.value) {
        const bytes = Array.from(Buffer.from(characteristic.value, 'base64'));
        const packet = conn.queryParser.parse(bytes);
        if (packet.isComplete) {
          const data = packet.data;
          // Protobuf feature response: [feature_id=0xF5, action_id=request|0x80, ...protobuf]
          // RequestGetPresetStatus: request=[0xF5, 0x72, ...], response=[0xF5, 0xF2, ...protobuf]
          // Note: no error code byte — protobuf payload starts immediately at index 2
          if (data.length >= 2 && data[0] === 0xf5) {
            if (data[1] === 0xf2 || data[1] === 0xf3) {
              // 0xF2 = GetPresetStatus sync response  (0x72 | 0x80)
              // 0xF3 = NotifyPresetStatus async push   (0x73 | 0x80)
              const presetBytes = data.slice(2);
              const groups = decodeNotifyPresetStatus(presetBytes);
              if (data[1] === 0xf2 && conn.pendingPresetResolver) {
                conn.pendingPresetResolver(groups);
                conn.pendingPresetResolver = null;
              }
              useGoProStore.getState().setPresets(groups, deviceId);
              // Save to persistent cache (save the latest presets after merge to prevent missing iconId)
              const store = useGoProStore.getState();
              const cameraState = store.cameraStates[deviceId] || createDefaultCameraState();
              const mergedPresets = cameraState.presets;
              const currentModelNo = cameraState.hardwareInfo?.modelNo ?? null;
              if (deviceId && mergedPresets.length > 0) {
                void savePresetMetaCache(deviceId, mergedPresets, {
                  allowCustomNames: isHero12Or13Model(currentModelNo),
                }).catch((e) => {
                  debugWarn('blePreset', '[BLE] savePresetMetaCache failed', e);
                });
              }
              // Camera push-notified the current preset, so clear the pending state
              store.clearPendingSettingForDevice(deviceId, GoProSettingId.MODE_PRESET);
            }
            // Ignore other 0xF5 feature responses (do not issue warnings)
          } else {
            const response = processQueryResponse(data, deviceId);
            if (response && response.capabilityBatch && response.capabilityBatch.length > 0) {
              const store = useGoProStore.getState();
              let updatedCache = false;
              response.capabilityBatch.forEach(({ id, values }) => {
                const cacheKey = this.consumePendingCapabilityCacheKey(id, deviceId);
                if (!cacheKey) return;
                store.mergeCapabilityCacheEntry(cacheKey, [{ id, values }], deviceId);
                updatedCache = true;
              });
              const cameraState = store.cameraStates[deviceId] || createDefaultCameraState();
              if (updatedCache && deviceId && !store.bypassCapabilityCache) {
                void saveCapabilityCache(deviceId, cameraState.capabilityCache);
              }
            }
            const changedIds = response ? response.changedSettingIds : undefined;
            // Received camera notification: cancel the corresponding pending timeout
            if (changedIds) {
              for (const changedId of changedIds) {
                const timer = conn.pendingTimeouts.get(changedId);
                if (timer !== undefined) {
                  clearTimeout(timer);
                  conn.pendingTimeouts.delete(changedId);
                }
                useGoProStore.getState().clearPendingSettingForDevice(deviceId, changedId);
              }
            }
            // Model-specific wire IDs notified by the camera are mirrored onto
            // their canonical setting IDs (table-driven; see constants/settingIdAliases.ts).
            // e.g. HERO11/Mini/MAX notify HORIZONTAL_LEVELING as 150 → settings[165].
            if (changedIds) {
              for (const rule of INCOMING_SETTING_SYNC_RULES) {
                if (!changedIds.includes(rule.wireId)) continue;
                const store = useGoProStore.getState();
                const cameraState = store.cameraStates[deviceId] || createDefaultCameraState();
                if (!rule.appliesTo(cameraState.hardwareInfo?.modelNo)) continue;
                const val = cameraState.settings[rule.wireId];
                if (val !== undefined) {
                  store.batchUpdateSettingsForDevice(deviceId, [
                    { id: rule.canonicalId, value: val },
                  ]);
                }
                // For rules converted on transmission (e.g. 179→131), a matching
                // notification also resolves the canonical pending entry/timeout.
                if (rule.clearPendingOnMatch && val !== undefined) {
                  const expected = cameraState.pendingSettings[rule.canonicalId];
                  if (expected === val) {
                    const timer = conn.pendingTimeouts.get(rule.canonicalId);
                    if (timer !== undefined) {
                      clearTimeout(timer);
                      conn.pendingTimeouts.delete(rule.canonicalId);
                    }
                    store.clearPendingSettingForDevice(deviceId, rule.canonicalId);
                  }
                }
              }
            }
            if (
              changedIds &&
              changedIds.some((id) => CAPABILITY_REFRESH_TRIGGER_IDS.includes(id))
            ) {
              const store = useGoProStore.getState();
              if (store.autoNavigateToControl) {
                const cameraState = store.cameraStates[deviceId] || createDefaultCameraState();
                getCapabilityDependencyRefreshIds(
                  changedIds,
                  cameraState.settings,
                  resolveCameraModelFromHardwareInfo(cameraState.hardwareInfo),
                  cameraState.presets,
                ).forEach((depId) => conn.pendingDebouncedCapabilityIds.add(depId));
                if (conn.pendingDebouncedCapabilityIds.size > 0) {
                  if (conn.capabilityRefreshDebounceTimer) {
                    clearTimeout(conn.capabilityRefreshDebounceTimer);
                  }
                  conn.capabilityRefreshDebounceTimer = setTimeout(() => {
                    conn.capabilityRefreshDebounceTimer = null;
                    const idsToRefresh = Array.from(conn.pendingDebouncedCapabilityIds);
                    conn.pendingDebouncedCapabilityIds.clear();
                    void this.fetchCapabilitiesByIds(idsToRefresh, true, deviceId);
                  }, 300);
                }
              }
            }
            // Upon MODE_PRESET / MODE_PRESET_GROUP change: re-fetch current values of VIDEO_FRAMING, MULTI_SHOT_FRAMING,
            // and MEDIA_FORMAT from the camera.
            // Fixes the issue where UI is not updated when the aspect ratio changes on preset switch.
            // (VIDEO_FRAMING is for Video mode, MULTI_SHOT_FRAMING is for Timelapse-related modes)
            if (
              changedIds &&
              changedIds.some(
                (id) =>
                  id === GoProSettingId.MODE_PRESET || id === GoProSettingId.MODE_PRESET_GROUP,
              )
            ) {
              {
                const store = useGoProStore.getState();
                const cameraState = store.cameraStates[deviceId] || createDefaultCameraState();
                const s = cameraState.settings;
                const presetId = s[GoProSettingId.MODE_PRESET];
                const groupId = s[GoProSettingId.MODE_PRESET_GROUP];
                const lensAttach = s[GoProSettingId.LENS_ATTACHMENT];
                const videoLens = s[GoProSettingId.VIDEO_LENS_HERO13];
                const storePresets = cameraState.presets;
                let presetName: string | undefined;
                outer: for (const g of storePresets) {
                  for (const p of g.presets) {
                    if (p.id === presetId) {
                      presetName =
                        p.customName ??
                        GOPRO_SETTINGS_METADATA[GoProSettingId.MODE_PRESET]?.values[presetId ?? -1];
                      break outer;
                    }
                  }
                }
                if (!presetName && presetId !== undefined) {
                  presetName =
                    GOPRO_SETTINGS_METADATA[GoProSettingId.MODE_PRESET]?.values[presetId];
                }
                debugLog(
                  'blePreset',
                  `[PRESET] changed — presetId=${presetId} (0x${(presetId ?? 0).toString(16)}) "${presetName ?? 'unknown'}"` +
                    ` groupId=${groupId}` +
                    ` LENS_ATTACHMENT(217)=${lensAttach}` +
                    ` VIDEO_LENS_HERO13(229)=${videoLens}`,
                );
              }
              this.schedulePresetStateQueries(deviceId);
            }
            // If settings affecting the preset list change, perform fallback re-fetching
            if (changedIds && changedIds.some((id) => PRESET_REFRESH_TRIGGER_IDS.includes(id))) {
              {
                const store = useGoProStore.getState();
                const cameraState = store.cameraStates[deviceId] || createDefaultCameraState();
                const changedSummary = changedIds
                  .filter((id) => PRESET_REFRESH_TRIGGER_IDS.includes(id))
                  .map((id) => {
                    const name = GOPRO_SETTINGS_METADATA[id]?.name ?? `Setting ${id}`;
                    const value = cameraState.settings[id];
                    const valueName = GOPRO_SETTINGS_METADATA[id]?.values?.[value ?? -1];
                    return `${name}(${id})=${value}${valueName ? `(${valueName})` : ''}`;
                  });
                if (changedSummary.length > 0) {
                  debugLog(
                    'blePreset',
                    `[PRESET] trigger settings changed — ${changedSummary.join(', ')}`,
                  );
                }
              }
              if (conn.presetRefreshTimer) clearTimeout(conn.presetRefreshTimer);
              conn.presetRefreshTimer = setTimeout(() => {
                conn.presetRefreshTimer = null;
                void this.fetchPresetStatus(deviceId).catch(() => {});
              }, 500);
            }
          }
        }
      }
    };

    // Handler for 0075 (SETTINGS_NOTIFY) and 0073 (CMD_NOTIFY)
    const cmdNotifyHandler = (error: BleError | null, characteristic: any) => {
      if (error) return;
      if (!characteristic?.value) return;
      const bytes = Array.from(Buffer.from(characteristic.value, 'base64'));
      const packet = conn.cmdParser.parse(bytes);
      if (!packet.isComplete) return;
      const data = packet.data;
      // Hardware Info response: [0x3C, 0x00(success), ...LV fields]
      if (data.length >= 2 && data[0] === 0x3c && data[1] === 0x00) {
        const hwInfo = parseHardwareInfo(data);
        if (hwInfo && conn.pendingHardwareInfoResolver) {
          conn.pendingHardwareInfoResolver(hwInfo);
          conn.pendingHardwareInfoResolver = null;
        }
        return;
      }
      // RequestCustomPresetUpdate response: [0xF1, 0xE4, ...protobuf ResponseGeneric]
      // Protobuf commands (Feature 0xF1 series) are transmitted and received on the Command channel.
      if (data.length >= 2 && data[0] === 0xf1 && data[1] === 0xe4) {
        const { result } = decodeResponseGeneric(data.slice(2));
        debugLog('ble', '[BLE] CustomPresetUpdate response result =', result);
        if (conn.pendingPresetUpdateResolver) {
          conn.pendingPresetUpdateResolver(result);
          conn.pendingPresetUpdateResolver = null;
        }
        return;
      }
    };

    const simpleNotifyHandler = (error: BleError | null, characteristic: any) => {
      if (error) return;
      if (!characteristic?.value) return;
      const bytes = Array.from(Buffer.from(characteristic.value, 'base64'));
      if (bytes.length < 3) return;
      // GoPro settings SET response: [1-byte-header=length, settingId, resultCode]
      // Header bit layout: bit7=continuation, bit6=2-byte-ext, bit5=12bit-ext, else 1-byte length
      if ((bytes[0] & 0x60) !== 0) return; // Unexpected multi-byte header
      const len = bytes[0] & 0x3f;
      if (len < 2 || bytes.length < 1 + len) return;
      const settingId = bytes[1];
      const resultCode = bytes[2];
      if (resultCode !== 0x00) {
        debugWarn(
          'ble',
          `[BLE] Setting ${settingId} (0x${settingId.toString(16)}) write FAILED: code=0x${resultCode.toString(16).padStart(2, '0')}`,
        );
        // Cancel optimistic update: re-fetch actual current value from the camera
        void this.sendQuery([0x02, 0x12, settingId], deviceId).catch(() => {});
      }
    };

    this.clearNotifySubscriptions(conn);
    conn.notifySubscriptions = [
      device.monitorCharacteristicForService(GOPRO_SERVICE, QUERY_NOTIFY, queryNotifyHandler),
      device.monitorCharacteristicForService(GOPRO_SERVICE, SETTINGS_NOTIFY, simpleNotifyHandler),
      device.monitorCharacteristicForService(GOPRO_SERVICE, CMD_NOTIFY, cmdNotifyHandler),
    ];
  }

  public async fetchHardwareInfo(deviceId?: string): Promise<HardwareInfo | null> {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return null;
    const conn = this.connections.get(targetId);
    if (!conn) return null;

    try {
      const base64Str = Buffer.from([0x01, 0x3c]).toString('base64');
      return new Promise<HardwareInfo | null>((resolve) => {
        const timer = setTimeout(() => {
          conn.pendingHardwareInfoResolver = null;
          debugWarn('ble', 'fetchHardwareInfo timeout');
          resolve(null);
        }, 5000);

        conn.pendingHardwareInfoResolver = (info) => {
          clearTimeout(timer);
          resolve(info);
        };

        conn.connectedDevice
          .writeCharacteristicWithResponseForService(GOPRO_SERVICE, CMD_SEND, base64Str)
          .catch((e) => {
            clearTimeout(timer);
            conn.pendingHardwareInfoResolver = null;
            debugWarn('ble', 'fetchHardwareInfo send failed', e);
            resolve(null);
          });
      });
    } catch (e) {
      debugWarn('ble', 'fetchHardwareInfo failed', e);
      return null;
    }
  }

  private async fetchHardwareInfoWithRetry(
    maxAttempts = 3,
    deviceId?: string,
  ): Promise<HardwareInfo | null> {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const info = await this.fetchHardwareInfo(deviceId);
      if (info) {
        if (attempt > 1) {
          debugLog('ble', `[BLE] fetchHardwareInfo succeeded on attempt ${attempt}`);
        }
        return info;
      }

      if (attempt < maxAttempts) {
        debugWarn('ble', `[BLE] fetchHardwareInfo attempt ${attempt} failed; retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    debugWarn('ble', `[BLE] fetchHardwareInfo failed after ${maxAttempts} attempts`);
    return null;
  }

  public async fetchWiFiPassword(deviceId?: string): Promise<string | null> {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return null;
    const conn = this.connections.get(targetId);
    if (!conn || !conn.connectedDevice) return null;
    try {
      const characteristic = await this.manager.readCharacteristicForDevice(
        conn.connectedDevice.id,
        WIFI_AP_SERVICE,
        WIFI_AP_PASSWORD_CHAR,
      );
      if (characteristic.value) {
        return Buffer.from(characteristic.value, 'base64').toString('utf-8');
      }
      return null;
    } catch (e) {
      debugWarn('wifi', 'fetchWiFiPassword failed', e);
      return null;
    }
  }

  /**
   * Enable Wi-Fi AP on the camera side
   * Packet: [0x03, 0x17, 0x01, 0x01] -> CMD_SEND
   */
  public async enableWiFiAP(deviceId?: string): Promise<void> {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return;
    const conn = this.connections.get(targetId);
    if (!conn || !conn.connectedDevice) return;
    try {
      const packet = [0x03, 0x17, 0x01, 0x01];
      const base64Str = Buffer.from(packet).toString('base64');
      await conn.connectedDevice.writeCharacteristicWithResponseForService(
        GOPRO_SERVICE,
        CMD_SEND,
        base64Str,
      );
    } catch (e) {
      debugWarn('wifi', 'enableWiFiAP failed', e);
    }
  }

  public async sendQuery(command: number[], deviceId?: string) {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return false;
    const conn = this.connections.get(targetId);
    if (!conn) return false;

    const device = conn.connectedDevice;
    const base64Str = Buffer.from(command).toString('base64');

    const runQueryWrite = async () => {
      if (!this.connections.has(targetId)) return;
      await device.writeCharacteristicWithResponseForService(GOPRO_SERVICE, QUERY_SEND, base64Str);
    };

    const nextWrite = conn.queryWriteTail.then(runQueryWrite, runQueryWrite);
    conn.queryWriteTail = nextWrite
      .then(async () => {
        await new Promise((resolve) => setTimeout(resolve, 25));
      })
      .catch(() => undefined);

    try {
      await nextWrite;
      return true;
    } catch (e) {
      debugWarn('ble', 'sendQuery failed', e);
      return false;
    }
  }

  private schedulePresetStateQueries(deviceId?: string) {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return;
    const conn = this.connections.get(targetId);
    if (!conn) return;

    if (conn.presetStateQueryTimer) {
      clearTimeout(conn.presetStateQueryTimer);
    }

    conn.presetStateQueryTimer = setTimeout(() => {
      conn.presetStateQueryTimer = null;
      void (async () => {
        await this.sendQuery([0x02, 0x12, GoProSettingId.VIDEO_FRAMING], targetId).catch(() => {});
        await this.sendQuery([0x02, 0x12, GoProSettingId.MULTI_SHOT_FRAMING], targetId).catch(
          () => {},
        );
        await this.sendQuery([0x02, 0x12, GoProSettingId.MEDIA_FORMAT], targetId).catch(() => {});
        await this.sendQuery([0x02, 0x12, GoProSettingId.VIDEO_LENS_HERO13], targetId).catch(
          () => {},
        );
      })();
    }, 200);
  }

  public async setSetting(settingId: number, value: number, deviceId?: string) {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return;
    const conn = this.connections.get(targetId);
    if (!conn || !conn.connectedDevice) return;

    // Skip redundant writes: if store already holds the same value, don't send.
    // Prevents GATT churn and accidental re-trigger of camera side-effects on repeated taps.
    const cameraState =
      useGoProStore.getState().cameraStates[targetId] || createDefaultCameraState();
    const currentValue = cameraState.settings[settingId];
    if (currentValue === value) {
      debugDebug('ble', `[BLE] skip identical setSetting(${settingId}=${value})`);
      return;
    }
    let category: CommandCategory =
      isSystemSetting(settingId) || PRESET_RESTORE_SYSTEM_SETTING_IDS.includes(settingId)
        ? 'systemSetting'
        : 'setting';
    // HINDSIGHT setting needs to bypass the Shooting Lock (which is active when Hindsight buffering is running)
    // so that the user can send the Hindsight = Off (4) command to stop buffering.
    // We categorize it as 'systemSetting' here to allow it to pass through the CommandQueue lock,
    // while keeping the CommandQueue module generic and decoupled from specific setting IDs.
    if (settingId === GoProSettingId.HINDSIGHT) {
      category = 'systemSetting';
    }
    try {
      await conn.commandQueue.enqueue(
        async () => {
          if (!conn || !conn.connectedDevice) return;
          // Some settings need to be sent as 4-byte big-endian int.
          // Virtual IDs (StarTrail/LightPainting/VehicleLights Shutter) resolve to BLE ID 31.
          // Convert canonical/virtual setting IDs to the model-specific BLE
          // wire ID (table-driven; see constants/settingIdAliases.ts).
          const bleModelNo = selectCameraStateFor(useGoProStore.getState(), targetId).hardwareInfo
            ?.modelNo;
          const bleSetting = resolveOutgoingBleSettingId(settingId, bleModelNo);
          let packet: number[];
          if (FOUR_BYTE_SETTING_IDS.has(bleSetting)) {
            packet = [
              0x06,
              bleSetting,
              0x04,
              (value >>> 24) & 0xff,
              (value >>> 16) & 0xff,
              (value >>> 8) & 0xff,
              value & 0xff,
            ];
          } else {
            packet = [0x03, bleSetting, 0x01, value];
          }
          const base64Str = Buffer.from(packet).toString('base64');
          await conn.connectedDevice.writeCharacteristicWithResponseForService(
            GOPRO_SERVICE,
            SETTINGS_SEND,
            base64Str,
          );
          // BLE transmission registration: register as pending (no optimistic updates until confirmed via camera notification)
          const existingTimeout = conn.pendingTimeouts.get(settingId);
          if (existingTimeout !== undefined) clearTimeout(existingTimeout);
          const store = useGoProStore.getState();
          const freshState = store.cameraStates[targetId] || createDefaultCameraState();
          const nextPending = { ...freshState.pendingSettings, [settingId]: value };
          store.updateDeviceState(targetId, { pendingSettings: nextPending });

          const timeoutId = setTimeout(() => {
            conn.pendingTimeouts.delete(settingId);
            const freshStore = useGoProStore.getState();
            const currentCameraState = freshStore.cameraStates[targetId];
            if (currentCameraState && currentCameraState.pendingSettings[settingId] !== undefined) {
              freshStore.clearPendingSettingForDevice(targetId, settingId);
              if (currentCameraState.settings[settingId] === value) {
                return;
              }
              freshStore.updateDeviceState(targetId, { toastMessage: t('ble.settingUnchanged') });
            }
          }, 5000);
          conn.pendingTimeouts.set(settingId, timeoutId);
        },
        { category, settingId, label: `setSetting(${settingId}=${value})` },
      );
    } catch (e) {
      this.handleCommandFailure(e, 'setSetting');
    }
  }

  public async setScheduledTime(hour: number, minute: number, deviceId?: string): Promise<void> {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return;
    const conn = this.connections.get(targetId);
    if (!conn || !conn.connectedDevice) return;
    try {
      await conn.commandQueue.enqueue(
        async () => {
          if (!conn || !conn.connectedDevice) return;
          const encodedMinute = minute * 4 + 3;
          const packet = [0x06, 0xa8, 0x04, 0x00, 0x00, hour, encodedMinute];
          const base64Str = Buffer.from(packet).toString('base64');
          await conn.connectedDevice.writeCharacteristicWithResponseForService(
            GOPRO_SERVICE,
            SETTINGS_SEND,
            base64Str,
          );
          useGoProStore.getState().updateDeviceState(targetId, { scheduledTime: { hour, minute } });
        },
        { category: 'setting', label: 'setScheduledTime' },
      );
    } catch (e) {
      this.handleCommandFailure(e, 'setScheduledTime');
    }
  }

  /**
   * Disables Scheduled Capture (clears the time).
   * Packet: [0x06, 0xA8, 0x04, 0x00, 0x00, 0x00, 0x00]
   */
  public async clearScheduledTime(deviceId?: string): Promise<void> {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return;
    const conn = this.connections.get(targetId);
    if (!conn || !conn.connectedDevice) return;
    try {
      await conn.commandQueue.enqueue(
        async () => {
          if (!conn || !conn.connectedDevice) return;
          const packet = [0x06, 0xa8, 0x04, 0x00, 0x00, 0x00, 0x00];
          const base64Str = Buffer.from(packet).toString('base64');
          await conn.connectedDevice.writeCharacteristicWithResponseForService(
            GOPRO_SERVICE,
            SETTINGS_SEND,
            base64Str,
          );
          useGoProStore.getState().updateDeviceState(targetId, { scheduledTime: null });
        },
        { category: 'setting', label: 'clearScheduledTime' },
      );
    } catch (e) {
      this.handleCommandFailure(e, 'clearScheduledTime');
    }
  }

  /**
   * Sets the smartphone's current time on the GoPro.
   * Legacy app: Libs/GoProDeviceObserver.cs SetCurrentDatetime / SetCurrentUTCDatetime
   *
   * - Hero11/HeroMini11/Hero12/Hero13: UTC + Command with timezone offset (0x0F)
   *   Packet: [0x0C, 0x0F, 0x0A, YY_H, YY_L, MM, DD, HH, mm, SS, OF_H, OF_L, 0x01]
   * - Hero09/Hero10/MAX (others): Local time command (0x0D)
   *   Packet: [0x09, 0x0D, 0x07, YY_H, YY_L, MM, DD, HH, mm, SS]
   */
  public async setDateTime(modelNo: number | null | undefined, deviceId?: string): Promise<void> {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return;
    const conn = this.connections.get(targetId);
    if (!conn || !conn.connectedDevice) return;
    try {
      await conn.commandQueue.enqueue(
        async () => {
          if (!conn || !conn.connectedDevice) return;

          const now = new Date();
          let packet: number[];

          if (isHero11OrNewerModel(modelNo)) {
            // Send UTC time and correct display time using timezone offset
            const utcYear = now.getUTCFullYear();
            const utcMonth = now.getUTCMonth() + 1;
            const utcDay = now.getUTCDate();
            const utcHour = now.getUTCHours();
            const utcMin = now.getUTCMinutes();
            const utcSec = now.getUTCSeconds();

            // getTimezoneOffset() returns difference from UTC in minutes (UTC+9 -> -540)
            // Legacy app: intValue = utcOffsetMinutes + 60 (big-endian int16)
            const utcOffsetMinutes = -now.getTimezoneOffset();
            const offsetValue = utcOffsetMinutes + 60;
            const ofH = (offsetValue >> 8) & 0xff;
            const ofL = offsetValue & 0xff;

            packet = [
              0x0c,
              0x0f,
              0x0a,
              (utcYear >> 8) & 0xff,
              utcYear & 0xff,
              utcMonth,
              utcDay,
              utcHour,
              utcMin,
              utcSec,
              ofH,
              ofL,
              0x01, // UTC enabled
            ];
          } else {
            // Send local time directly
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const hour = now.getHours();
            const min = now.getMinutes();
            const sec = now.getSeconds();

            packet = [
              0x09,
              0x0d,
              0x07,
              (year >> 8) & 0xff,
              year & 0xff,
              month,
              day,
              hour,
              min,
              sec,
            ];
          }

          const base64Str = Buffer.from(packet).toString('base64');
          await conn.connectedDevice.writeCharacteristicWithResponseForService(
            GOPRO_SERVICE,
            CMD_SEND,
            base64Str,
          );
        },
        { category: 'systemSetting', label: 'setDateTime' },
      );
    } catch (e) {
      this.handleCommandFailure(e, 'setDateTime');
    }
  }

  /**
   * Fetches the preset list from the camera via Protobuf, saves it in the store, and returns it.
   * Send target: QUERY_SEND (GP-0076)
   * Packet: [length, 0xF5, 0x72, ...protobuf]
   *   0xF5 = Protobuf feature command
   *   0x72 = preset status feature ID
   */
  /**
   * Batch-applies a custom preset (JSON snapshot) to the physical device in the specified priority order.
   * Skips if the setting is identical to the current value to improve performance.
   */
  public async applyCustomPreset(
    settingsMap: Record<number, number>,
    includeSystemSettings: boolean,
    deviceId?: string,
  ) {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return;
    const conn = this.connections.get(targetId);
    if (!conn || !conn.connectedDevice) return;

    useGoProStore.getState().updateDeviceState(targetId, { isApplyingCustomPreset: true });

    const formatSettingForPresetLog = (settingId: number, value: number | undefined) => {
      const name = GOPRO_SETTINGS_METADATA[settingId]?.name ?? `Setting ${settingId}`;
      const valueName =
        value === undefined ? undefined : GOPRO_SETTINGS_METADATA[settingId]?.values?.[value];
      return `${name}(${settingId})=${value}${valueName ? `(${valueName})` : ''}`;
    };

    const getRestoreSyncTimeoutMs = (settingId: number) => {
      if (settingId === GoProSettingId.MODE_PRESET) return 6500;
      if (
        PRESET_REFRESH_TRIGGER_IDS.includes(settingId) ||
        settingId === GoProSettingId.MODE_PRESET_GROUP
      ) {
        return 5500;
      }
      return 2500;
    };

    try {
      const keys = Object.keys(settingsMap).map(Number);
      const sortedKeys = keys.sort((a, b) => {
        const indexA = RESTORE_PRIORITY_ORDER.indexOf(a);
        const indexB = RESTORE_PRIORITY_ORDER.indexOf(b);
        const rankA = indexA !== -1 ? indexA : 99;
        const rankB = indexB !== -1 ? indexB : 99;
        return rankA - rankB;
      });

      debugLog('ble', '[BLE] Applying Custom Preset. Total keys:', sortedKeys.length);
      debugLog(
        'blePreset',
        `[PRESET] applyCustomPreset start includeSystemSettings=${includeSystemSettings} order=${sortedKeys
          .map((settingId) => formatSettingForPresetLog(settingId, settingsMap[settingId]))
          .join(' -> ')}`,
      );

      for (const settingId of sortedKeys) {
        if (!Number.isFinite(settingId)) continue;

        if (settingId === GoProSettingId.MODE_PRESET_GROUP) {
          debugLog('ble', `[BLE] Skip MODE_PRESET_GROUP (auto-changed by MODE_PRESET)`);
          continue;
        }

        const targetValue = settingsMap[settingId];
        if (!includeSystemSettings && PRESET_RESTORE_SYSTEM_SETTING_IDS.includes(settingId)) {
          debugLog(
            'blePreset',
            `[PRESET] skip system setting due to toggle: ${formatSettingForPresetLog(settingId, targetValue)}`,
          );
          continue;
        }

        const cameraState =
          useGoProStore.getState().cameraStates[targetId] || createDefaultCameraState();
        const currentValue = cameraState.settings[settingId];
        if (currentValue === targetValue) {
          debugLog('ble', `[BLE] Skip identical settingId: ${settingId} = ${targetValue}`);
          debugLog(
            'blePreset',
            `[PRESET] skip identical ${formatSettingForPresetLog(settingId, targetValue)}`,
          );
          continue;
        }

        debugLog(
          'ble',
          `[BLE] Applying settingId: ${settingId} -> ${targetValue} (current: ${currentValue})`,
        );
        debugLog(
          'blePreset',
          `[PRESET] apply ${formatSettingForPresetLog(settingId, targetValue)} current=${currentValue}` +
            `${currentValue !== undefined ? `(${GOPRO_SETTINGS_METADATA[settingId]?.values?.[currentValue] ?? 'unknown'})` : ''}`,
        );

        try {
          if (settingId === GoProSettingId.MODE_PRESET) {
            await this.loadPreset(targetValue, targetId);
          } else {
            await this.setSetting(settingId, targetValue, targetId);
          }
        } catch (e) {
          debugWarn('ble', `[BLE] Failed to apply settingId ${settingId}:`, e);
          debugLog(
            'blePreset',
            `[PRESET] apply failed ${formatSettingForPresetLog(settingId, targetValue)}`,
          );
        }

        const waitTimeoutMs = getRestoreSyncTimeoutMs(settingId);
        const requireReady =
          settingId === GoProSettingId.MODE_PRESET ||
          PRESET_REFRESH_TRIGGER_IDS.includes(settingId);
        debugLog(
          'blePreset',
          `[PRESET] wait-for-apply ${formatSettingForPresetLog(settingId, targetValue)} timeout=${waitTimeoutMs} requireReady=${requireReady}`,
        );
        const applied = await this.waitForSettingConvergence(
          settingId,
          targetValue,
          waitTimeoutMs,
          requireReady,
          targetId,
        );
        const latestCameraState = selectCameraStateFor(useGoProStore.getState(), targetId);
        debugLog(
          'blePreset',
          `[PRESET] wait result ${applied} ${formatSettingForPresetLog(settingId, latestCameraState.settings[settingId])}` +
            ` pending=${latestCameraState.pendingSettings[settingId]}` +
            ` busy=${selectIsShortTermBusy(latestCameraState)}`,
        );
      }

      debugLog('ble', '[BLE] Custom Preset application complete.');
      {
        const store = useGoProStore.getState();
        const cameraState = store.cameraStates[targetId] || createDefaultCameraState();
        debugLog(
          'blePreset',
          `[PRESET] applyCustomPreset complete currentPreset=${cameraState.settings[GoProSettingId.MODE_PRESET]}` +
            ` group=${cameraState.settings[GoProSettingId.MODE_PRESET_GROUP]}` +
            ` lensAttachment=${cameraState.settings[GoProSettingId.LENS_ATTACHMENT]}`,
        );
      }

      if (targetId && useGoProStore.getState().autoNavigateToControl) {
        const cameraState =
          useGoProStore.getState().cameraStates[targetId] || createDefaultCameraState();
        const finalRefreshIds = this.getDefaultCapabilityPrefetchIds(cameraState);
        if (finalRefreshIds.length > 0) {
          debugLog(
            'ble',
            '[BLE] Post-preset capability refresh for',
            finalRefreshIds.length,
            'settings',
          );
          await this.fetchCapabilitiesByIds(finalRefreshIds, true, targetId);
        }
      }
    } finally {
      useGoProStore.getState().updateDeviceState(targetId, { isApplyingCustomPreset: false });
    }
  }

  private async writeGoProPacketWithResponse(
    characteristic: string,
    payload: number[],
    deviceId?: string,
  ) {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) {
      throw new Error('No connected device');
    }
    const conn = this.connections.get(targetId);
    if (!conn) {
      throw new Error('No connection for device ' + targetId);
    }

    const device = conn.connectedDevice;
    const chunks = buildGoProPacketChunks(payload);

    for (const chunk of chunks) {
      if (!this.connections.has(targetId)) {
        throw new Error('Device disconnected during packet write');
      }

      await device.writeCharacteristicWithResponseForService(
        GOPRO_SERVICE,
        characteristic,
        Buffer.from(chunk).toString('base64'),
      );
    }
  }

  private async waitForSettingConvergence(
    settingId: number,
    targetValue: number,
    timeoutMs: number,
    requireReady: boolean,
    deviceId?: string,
  ): Promise<'matched' | 'mismatch' | 'timeout'> {
    const classifyState = (state: ReturnType<typeof useGoProStore.getState>) => {
      const cs = selectCameraStateFor(state, deviceId);
      const actualValue = cs.settings[settingId];
      const matched =
        actualValue !== undefined &&
        areSettingValuesEquivalent(settingId, actualValue, targetValue, {
          modelKey: resolveCameraModelFromHardwareInfo(cs.hardwareInfo),
          modelNo: cs.hardwareInfo?.modelNo,
        });

      if (matched && (!requireReady || !selectIsShortTermBusy(cs))) {
        return 'matched' as const;
      }

      if (cs.pendingSettings[settingId] === undefined && !matched) {
        return 'mismatch' as const;
      }

      return null;
    };

    const initialState = useGoProStore.getState();
    const initialResult = classifyState(initialState);
    if (initialResult) {
      return initialResult;
    }

    return new Promise<'matched' | 'mismatch' | 'timeout'>((resolve) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve('timeout');
      }, timeoutMs);

      const unsubscribe = useGoProStore.subscribe((state) => {
        const result = classifyState(state);
        if (!result) return;
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(result);
      });
    });
  }

  public async fetchPresetStatus(deviceId?: string): Promise<GoProPresetGroupData[]> {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return [];
    const conn = this.connections.get(targetId);
    if (!conn) return [];

    const protobufPayload = encodeRequestGetPresetStatus();
    const cmd = [0xf5, 0x72, ...protobufPayload];

    return new Promise<GoProPresetGroupData[]>((resolve, reject) => {
      const TIMEOUT_MS = 5000;
      const timer = setTimeout(() => {
        conn.pendingPresetResolver = null;
        reject(new Error('fetchPresetStatus timeout'));
      }, TIMEOUT_MS);

      conn.pendingPresetResolver = (groups) => {
        clearTimeout(timer);
        resolve(groups);
      };

      this.writeGoProPacketWithResponse(QUERY_SEND, cmd, targetId).catch((e) => {
        clearTimeout(timer);
        conn.pendingPresetResolver = null;
        reject(e);
      });
    });
  }

  /**
   * Renames the currently active custom preset.
   * Send target: CMD_SEND (GP-0072)
   * Feature/Action: 0xF1 / 0x64  (Response: 0xF1 / 0xE4 ResponseGeneric)
   *
   * GoPro specifications constraints:
   *   - Supported only on HERO12 / HERO13 / MAX 2
   *   - Succeeds only when the currently active Preset is user_defined=true
   *   - name must be 1 to 16 characters, Latin alphabet characters only
   *
   * @returns true=success, false=failed (e.g. RESULT_NOT_SUPPORTED)
   */
  public async renameActivePreset(
    name: string,
    iconId?: number,
    deviceId?: string,
  ): Promise<boolean> {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return false;
    const conn = this.connections.get(targetId);
    if (!conn) return false;

    const trimmed = name.trim();
    const validationError = getCustomPresetNameValidationError(trimmed);
    if (validationError) {
      debugWarn('blePreset', '[BLE] renameActivePreset: invalid name', validationError);
      return false;
    }

    const protobufPayload = encodeRequestCustomPresetUpdate({
      titleId: PRESET_TITLE_USER_DEFINED_CUSTOM_NAME,
      customName: trimmed,
      iconId,
    });
    const cmd = [0xf1, 0x64, ...protobufPayload];

    return new Promise<boolean>((resolve) => {
      const TIMEOUT_MS = 4000;
      const timer = setTimeout(() => {
        conn.pendingPresetUpdateResolver = null;
        debugWarn('blePreset', '[BLE] renameActivePreset timeout');
        resolve(false);
      }, TIMEOUT_MS);

      conn.pendingPresetUpdateResolver = (result) => {
        clearTimeout(timer);
        const success = result === RESULT_SUCCESS;
        if (success) {
          const state = useGoProStore.getState();
          const activePresetId = state.cameraStates[targetId]?.settings[GoProSettingId.MODE_PRESET];
          if (targetId && activePresetId !== undefined) {
            void updatePresetMetaCacheEntry(targetId, activePresetId, {
              customName: trimmed,
              iconId,
            }).catch((e) => debugWarn('blePreset', '[BLE] updatePresetMetaCacheEntry failed', e));
          }
        }
        resolve(success);
      };

      this.writeGoProPacketWithResponse(CMD_SEND, cmd, targetId).catch((e) => {
        clearTimeout(timer);
        conn.pendingPresetUpdateResolver = null;
        debugWarn('blePreset', '[BLE] renameActivePreset write error', e);
        resolve(false);
      });
    });
  }

  /**
   * Toggles the shutter (starts/stops recording).
   * Send target: CMD_SEND (GP-0072)
   * Packet: [0x03, 0x01, 0x01, 0x01 (start) or 0x00 (stop)]
   */
  public async toggleShutter(isStart: boolean, deviceId?: string): Promise<void> {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return;
    const conn = this.connections.get(targetId);
    if (!conn) return;

    try {
      await conn.commandQueue.enqueue(
        async () => {
          if (!conn.connectedDevice) return;
          const packet = [0x03, 0x01, 0x01, isStart ? 0x01 : 0x00];
          const base64Str = Buffer.from(packet).toString('base64');
          await conn.connectedDevice.writeCharacteristicWithResponseForService(
            GOPRO_SERVICE,
            CMD_SEND,
            base64Str,
          );
        },
        { category: 'shutter', label: `toggleShutter(${isStart ? 'start' : 'stop'})` },
      );
    } catch (e) {
      this.handleCommandFailure(e, 'toggleShutter');
    }
  }

  /**
   * Loads a preset (changes the camera's active preset).
   * Send target: CMD_SEND (GP-0072)
   * Packet: [0x06, 0x40, 0x04, b3, b2, b1, b0]  — 4-byte Big-Endian
   */
  public async loadPreset(presetId: number, deviceId?: string): Promise<void> {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return;
    const conn = this.connections.get(targetId);
    if (!conn || !conn.connectedDevice) return;

    const store = useGoProStore.getState();
    const cameraState = store.cameraStates[targetId] || createDefaultCameraState();
    const currentPreset = cameraState.settings[GoProSettingId.MODE_PRESET];
    if (currentPreset === presetId) {
      debugDebug('ble', `[BLE] skip identical loadPreset(${presetId})`);
      return;
    }
    const requestId = ++conn.latestPresetLoadRequestId;

    try {
      await conn.commandQueue.enqueue(
        async () => {
          if (!conn || !conn.connectedDevice) return;
          const freshStore = useGoProStore.getState();
          const latestPreset =
            freshStore.cameraStates[targetId]?.settings[GoProSettingId.MODE_PRESET];
          if (latestPreset === presetId) {
            debugDebug('ble', `[BLE] skip already-active loadPreset(${presetId})`);
            return;
          }
          const b3 = (presetId >>> 24) & 0xff;
          const b2 = (presetId >>> 16) & 0xff;
          const b1 = (presetId >>> 8) & 0xff;
          const b0 = presetId & 0xff;
          const packet = [0x06, 0x40, 0x04, b3, b2, b1, b0];
          const base64Str = Buffer.from(packet).toString('base64');
          await conn.connectedDevice.writeCharacteristicWithResponseForService(
            GOPRO_SERVICE,
            CMD_SEND,
            base64Str,
          );
          // Pure MVVM architecture: Wait for the camera notification (0xF3) before updating the store.
          // Thus, only the pending state is set here, and no optimistic updates of the actual settings are performed.
          const freshState = freshStore.cameraStates[targetId] || createDefaultCameraState();
          const nextPending = {
            ...freshState.pendingSettings,
            [GoProSettingId.MODE_PRESET]: presetId,
          };
          freshStore.updateDeviceState(targetId, { pendingSettings: nextPending });

          const existingTimeout = conn.pendingTimeouts.get(GoProSettingId.MODE_PRESET);
          if (existingTimeout !== undefined) clearTimeout(existingTimeout);
          const timeoutId = setTimeout(() => {
            conn.pendingTimeouts.delete(GoProSettingId.MODE_PRESET);
            useGoProStore
              .getState()
              .clearPendingSettingForDevice(targetId, GoProSettingId.MODE_PRESET);
          }, 5000);
          conn.pendingTimeouts.set(GoProSettingId.MODE_PRESET, timeoutId);
        },
        {
          category: 'preset',
          label: `loadPreset(${presetId})`,
          shouldSkip: () => requestId !== conn.latestPresetLoadRequestId,
        },
      );
    } catch (e) {
      this.handleCommandFailure(e, 'loadPreset');
    }
  }

  /**
   * Switches the preset group (mode).
   * Send target: CMD_SEND (GP-0072)
   * Packet: [0x04, 0x3E, 0x02, 0x03, selectId]
   *   selectId: Video=232, Photo=233, Timelapse=234
   */
  public async loadPresetGroup(selectId: number, deviceId?: string): Promise<void> {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return;
    const conn = this.connections.get(targetId);
    if (!conn || !conn.connectedDevice) return;

    const requestId = ++conn.latestPresetLoadRequestId;
    try {
      await conn.commandQueue.enqueue(
        async () => {
          if (!conn || !conn.connectedDevice) return;
          const packet = [0x04, 0x3e, 0x02, 0x03, selectId];
          const base64Str = Buffer.from(packet).toString('base64');
          await conn.connectedDevice.writeCharacteristicWithResponseForService(
            GOPRO_SERVICE,
            CMD_SEND,
            base64Str,
          );
          // Pure MVVM architecture: Wait for camera notifications before updating the store
          const groupIdBySelectId: Record<number, number> = {
            [GoProPresetGroupSelectId.VIDEO]: GoProPresetGroup.VIDEO,
            [GoProPresetGroupSelectId.PHOTO]: GoProPresetGroup.PHOTO,
            [GoProPresetGroupSelectId.TIMELAPSE]: GoProPresetGroup.TIMELAPSE,
          };
          const newGroupId = groupIdBySelectId[selectId];
          if (newGroupId !== undefined) {
            const store = useGoProStore.getState();
            const cameraState = store.cameraStates[targetId] || createDefaultCameraState();
            const nextPending = {
              ...cameraState.pendingSettings,
              [GoProSettingId.MODE_PRESET_GROUP]: newGroupId,
            };
            store.updateDeviceState(targetId, { pendingSettings: nextPending });

            const existingTimeout = conn.pendingTimeouts.get(GoProSettingId.MODE_PRESET_GROUP);
            if (existingTimeout !== undefined) clearTimeout(existingTimeout);
            const timeoutId = setTimeout(() => {
              conn.pendingTimeouts.delete(GoProSettingId.MODE_PRESET_GROUP);
              useGoProStore
                .getState()
                .clearPendingSettingForDevice(targetId, GoProSettingId.MODE_PRESET_GROUP);
            }, 5000);
            conn.pendingTimeouts.set(GoProSettingId.MODE_PRESET_GROUP, timeoutId);
          }
        },
        {
          category: 'preset',
          label: `loadPresetGroup(${selectId})`,
          shouldSkip: () => requestId !== conn.latestPresetLoadRequestId,
        },
      );
    } catch (e) {
      this.handleCommandFailure(e, 'loadPresetGroup');
    }
  }

  /**
   * Changes Camera Control Status (claim / release).
   * p=0 IDLE / p=1 CAMERA / p=2 EXTERNAL / p=3 COF_SETUP
   *
   * Ref: docs/technical/09_camera-state-control.md §5
   * BLE opcode (0x69) should be verified in the official BLE command reference. If rejected by the physical device, it is treated as best-effort.
   */
  public async claimControl(deviceId?: string): Promise<void> {
    return this.setCameraControlStatus(2, deviceId);
  }

  public async releaseControl(deviceId?: string): Promise<void> {
    return this.setCameraControlStatus(0, deviceId);
  }

  private async setCameraControlStatus(p: 0 | 1 | 2 | 3, deviceId?: string): Promise<void> {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return;
    const conn = this.connections.get(targetId);
    if (!conn || !conn.connectedDevice) return;
    try {
      await conn.commandQueue.enqueue(
        async () => {
          if (!conn || !conn.connectedDevice) return;
          // BLE CMD Request: [len=2, 0x69, p]
          const packet = [0x02, 0x69, p];
          const base64Str = Buffer.from(packet).toString('base64');
          await conn.connectedDevice.writeCharacteristicWithResponseForService(
            GOPRO_SERVICE,
            CMD_SEND,
            base64Str,
          );
        },
        {
          category: 'control',
          label: `setCameraControlStatus(${p})`,
          waitPolicy: 'rejectImmediately',
        },
      );
    } catch (e) {
      // claim/release はベストエフォート扱い。失敗しても正常動作を妨げないよう沈黙する。
      if (e instanceof BusyRejectedError && e.reason === 'notReady') {
        debugDebug('ble', `setCameraControlStatus(${p}) skipped: camera not ready yet`);
        return;
      }
      debugWarn('ble', `setCameraControlStatus(${p}) failed`, e);
    }
  }

  /**
   * Handles command execution errors.
   * If BusyRejectedError, displays a toast message and remains silent; otherwise logs a warning.
   */
  private handleCommandFailure(e: unknown, context: string): void {
    if (e instanceof BusyRejectedError) {
      const store = useGoProStore.getState();
      const msg =
        e.reason === 'userOnCamera'
          ? t('ble.cannotWhileOperating')
          : e.reason === 'encoding' || e.reason === 'dynamic'
            ? t('ble.cannotWhileRecording')
            : t('ble.cannotWhileProcessing');
      store.setToastMessage(msg);
      debugLog('ble', `[${context}] rejected: ${e.reason}`);
      return;
    }
    debugWarn('ble', `${context} failed`, e);
  }

  private startKeepAlive(conn: DeviceConnection) {
    // Sends [01, 00] to Cmd Send every 15 seconds (Doc 02).
    // If failures occur consecutively, it is treated as a silent disconnection (e.g., when the camera automatically turns off
    // while the mobile device is sleeping), forcing a transition to the disconnected state.
    if (conn.keepAliveInterval) clearInterval(conn.keepAliveInterval);
    conn.keepAliveFailureCount = 0;

    const FAILURE_THRESHOLD = 2; // 2回連続失敗 (= 約30秒応答なし) で切断扱い

    conn.keepAliveInterval = setInterval(async () => {
      if (!this.connections.has(conn.deviceId)) {
        clearInterval(conn.keepAliveInterval!);
        return;
      }
      try {
        // First perform a soft check: determine immediately if isConnected() returns false
        const stillConnected = await conn.connectedDevice.isConnected();
        if (!stillConnected) {
          debugWarn('ble', '[BLE] KeepAlive: device reports not connected');
          this.handleDisconnectedToTop(conn.deviceId);
          return;
        }
        // Base64 encode [0x01, 0x00] -> 'AQA='
        await conn.connectedDevice.writeCharacteristicWithResponseForService(
          GOPRO_SERVICE,
          CMD_SEND,
          'AQA=',
        );
        conn.keepAliveFailureCount = 0;
      } catch (e) {
        conn.keepAliveFailureCount += 1;
        debugWarn(
          'ble',
          `KeepAlive failed (${conn.keepAliveFailureCount}/${FAILURE_THRESHOLD})`,
          e,
        );
        if (conn.keepAliveFailureCount >= FAILURE_THRESHOLD) {
          debugWarn('ble', '[BLE] KeepAlive: treating as disconnected');
          this.handleDisconnectedToTop(conn.deviceId);
        }
      }
    }, 15000);
  }

  /**
   * Called when explicitly checking connection health, such as when the app is brought back to the foreground.
   * - If isConnected() is false, triggers immediate disconnect logic
   * - Even if true, performs a keep-alive write check as a fallback; disconnects if it fails
   */
  public async checkConnectionHealth(deviceId?: string): Promise<boolean> {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    if (!targetId) return false;
    const conn = this.connections.get(targetId);
    if (!conn) return false;

    try {
      const stillConnected = await conn.connectedDevice.isConnected();
      if (!stillConnected) {
        this.handleDisconnectedToTop(targetId);
        return false;
      }
      await conn.connectedDevice.writeCharacteristicWithResponseForService(
        GOPRO_SERVICE,
        CMD_SEND,
        'AQA=',
      );
      conn.keepAliveFailureCount = 0;
      return true;
    } catch (e) {
      debugWarn('ble', '[BLE] checkConnectionHealth failed', e);
      this.handleDisconnectedToTop(targetId);
      return false;
    }
  }

  public disconnect(deviceId?: string) {
    const targetId = deviceId ?? useGoProStore.getState().connectedDeviceId;
    // App-initiated disconnect: suppress the unexpected-disconnect warning.
    if (targetId) {
      this.markIntentionalDisconnect(targetId);
    } else {
      for (const id of this.connections.keys()) this.markIntentionalDisconnect(id);
    }
    if (this.connectingDeviceId && (!targetId || this.connectingDeviceId === targetId)) {
      this.cancelledDeviceIds.add(this.connectingDeviceId);
      this.manager.cancelDeviceConnection(this.connectingDeviceId).catch(() => undefined);
      this.connectingDeviceId = null;
    }

    if (targetId) {
      const conn = this.connections.get(targetId);
      if (conn) {
        this.manager.cancelDeviceConnection(conn.connectedDevice.id).catch(() => undefined);
        this.clearConnectionResources(targetId);
      }
    } else {
      for (const id of this.connections.keys()) {
        const conn = this.connections.get(id);
        if (conn) {
          this.manager.cancelDeviceConnection(conn.connectedDevice.id).catch(() => undefined);
          this.clearConnectionResources(id);
        }
      }
    }

    const store = useGoProStore.getState();
    if (targetId) {
      store.beginDisconnectForDevice(targetId);
    } else {
      for (const id of this.connections.keys()) {
        store.beginDisconnectForDevice(id);
      }
    }
    if (!targetId || store.connectedDeviceId === targetId) {
      store.setActiveScreen('home');
    }
  }
}

export const goProBle = new GoProBLEManager();

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

import { setCategoryEnableProvider } from '../utils/debugLogging';
import { create } from 'zustand';
import { GoProPresetGroupData } from '../ble/PresetProtobuf';
import { HardwareInfo } from '../types/KnownDevice';
import { AppTheme } from '../constants/Theme';
import {
  normalizeBaseDisplayPresetId,
  resolveBaseDisplayPresetId,
} from '../cameraModels/shared/displayPreset';
import { resolveCameraModelKeyFromModelNo } from '../cameraModels/shared/modelNumber';
import type { AppLocale } from '../i18n';

/**
 * Bluetooth adapter state, mirroring react-native-ble-plx's State enum values.
 * Defined locally so the store (and its tests) do not depend on the native module.
 */
export type BluetoothAdapterState =
  'Unknown' | 'Resetting' | 'Unsupported' | 'Unauthorized' | 'PoweredOff' | 'PoweredOn';

export interface CameraSpecificState {
  wifiStatus: 'disconnected' | 'connecting' | 'connected';
  batteryLevel: number;
  batteryPresent: boolean; // status 1
  isCharging: boolean; // status 19
  isEncoding: boolean; // status 10
  captureDelayActive: boolean; // status 101 (countdown timer is running)
  recordingTimeSec: number; // status 13 (seconds since recording started)
  isReady: boolean; // status 82 (camera bootup complete)
  systemBusy: boolean; // status 8 (debounced 150ms)
  cameraControlStatus: 'idle' | 'camera' | 'external' | 'cofSetup'; // status 114
  sdCardStatus: number; // status 33 (-1 Unknown / 0 OK / 1 Full / 2 Removed / 3 Format Error / 4 Busy / 8 Swapped)
  sdRemainingKB: number; // status 54
  sdCapacityKB: number; // status 117
  remainingPhotos: number; // status 34
  remainingVideoSec: number; // status 35
  sdWriteSpeedError: boolean; // status 111
  overheating: boolean; // status 6
  cold: boolean; // status 85
  gpsLockAcquired: boolean; // status 68
  mediaModMicStatus: number; // status 102: 0=not connected, 2=mic only, 3=mic+external
  mediaModStatus: number; // status 110: bitmask, bit0=MediaMod connected
  dynamicShootingLockedIds: Set<number>;
  toastMessage: string | null;
  pendingSettings: { [settingId: number]: number };
  isApplyingCustomPreset: boolean;
  capabilities: { [settingId: number]: number[] }; // e.g.: { 2: [1, 4, 9], 3: [5, 8] }
  settings: { [settingId: number]: number }; // e.g.: { 2: 9, 3: 8 }
  isRefreshingCapabilities: boolean;
  presets: GoProPresetGroupData[];
  hardwareInfo: HardwareInfo | null;
  apPassword: string | null;
  scheduledTime: { hour: number; minute: number } | null;
  capabilityCache: Record<string, Record<number, number[]>>;
  showPreviewModal: boolean;
  showVisibilityModal: boolean;
}

export const createDefaultCameraState = (): CameraSpecificState => ({
  wifiStatus: 'disconnected',
  batteryLevel: 0,
  batteryPresent: true,
  isCharging: false,
  isEncoding: false,
  captureDelayActive: false,
  recordingTimeSec: 0,
  isReady: false,
  systemBusy: false,
  cameraControlStatus: 'idle',
  sdCardStatus: -1,
  sdRemainingKB: 0,
  sdCapacityKB: 0,
  remainingPhotos: 0,
  remainingVideoSec: 0,
  sdWriteSpeedError: false,
  overheating: false,
  cold: false,
  gpsLockAcquired: false,
  mediaModMicStatus: -1,
  mediaModStatus: -1,
  dynamicShootingLockedIds: new Set<number>(),
  toastMessage: null,
  pendingSettings: {},
  isApplyingCustomPreset: false,
  capabilities: {},
  settings: {},
  isRefreshingCapabilities: false,
  presets: [],
  hardwareInfo: null,
  apPassword: null,
  scheduledTime: null,
  capabilityCache: {},
  showPreviewModal: false,
  showVisibilityModal: false,
});

/**
 * Global store shape.
 *
 * All per-camera state lives exclusively in cameraStates[deviceId]; the
 * active camera is identified by connectedDeviceId. Read camera state through
 * selectCameraStateFor / selectActiveCameraState or the useCameraState /
 * useActiveCameraState hooks — never store a second copy at the root.
 * (The previous root-level mirror of the active camera was removed; keeping
 * two copies in sync was the main source of state-divergence bugs.)
 */
export interface GoProState {
  // Connection state
  connectionStatus: 'disconnected' | 'scanning' | 'connected';
  bluetoothState: BluetoothAdapterState;
  activeScreen: 'home' | 'control';
  connectedDeviceId: string | null;

  // App-level UI settings (persisted to app_settings table)
  columnCount: number;
  theme: AppTheme;
  appLanguage: AppLocale;
  bypassCapabilityCache: boolean;
  debugLogBle: boolean;
  debugLogBleCache: boolean;
  debugLogBlePreset: boolean;
  debugLogBleAsync: boolean;
  debugLogBleQueue: boolean;
  debugLogWifi: boolean;
  debugLogIap: boolean;

  // In-app purchases
  purchasedProducts: string[];

  // Per-camera state (single source of truth)
  cameraStates: { [deviceId: string]: CameraSpecificState };
  deviceConnectionStatuses: { [deviceId: string]: 'disconnected' | 'scanning' | 'connected' };
  autoNavigateToControl: boolean;

  // Actions — the camera-field setters target the ACTIVE device's camera
  // state and are no-ops when no device is active.
  setConnectionStatus: (status: 'disconnected' | 'scanning' | 'connected') => void;
  setBluetoothState: (state: BluetoothAdapterState) => void;
  setWifiStatus: (status: 'disconnected' | 'connecting' | 'connected') => void;
  setActiveScreen: (screen: 'home' | 'control') => void;
  setConnectedDeviceId: (deviceId: string | null) => void;
  setBatteryLevel: (level: number) => void;
  setBatteryPresent: (present: boolean) => void;
  setIsCharging: (charging: boolean) => void;
  setIsEncoding: (isEncoding: boolean) => void;
  setCaptureDelayActive: (active: boolean) => void;
  setRecordingTimeSec: (sec: number) => void;
  setIsReady: (isReady: boolean) => void;
  setSystemBusy: (busy: boolean) => void;
  setCameraControlStatus: (status: 'idle' | 'camera' | 'external' | 'cofSetup') => void;
  setSdCardStatus: (status: number) => void;
  setSdRemainingKB: (kb: number) => void;
  setSdCapacityKB: (kb: number) => void;
  setRemainingPhotos: (n: number) => void;
  setRemainingVideoSec: (s: number) => void;
  setSdWriteSpeedError: (err: boolean) => void;
  setOverheating: (hot: boolean) => void;
  setCold: (cold: boolean) => void;
  setGpsLockAcquired: (locked: boolean) => void;
  setMediaModMicStatus: (status: number) => void;
  setMediaModStatus: (status: number) => void;
  addDynamicShootingLockedId: (id: number) => void;
  clearDynamicShootingLockedIds: () => void;
  setToastMessage: (msg: string | null) => void;
  setPendingSetting: (settingId: number, expectedValue: number) => void;
  clearPendingSetting: (settingId: number) => void;
  setIsApplyingCustomPreset: (applying: boolean) => void;
  beginDisconnect: () => void;
  clearConnectedCameraState: () => void;
  updateCapabilities: (settingId: number, values: number[]) => void;
  updateSettings: (settingId: number, value: number) => void;
  batchUpdateSettings: (entries: { id: number; value: number }[]) => void;
  batchUpdateCapabilities: (entries: { id: number; values: number[] }[]) => void;
  mergeCapabilityCacheEntry: (
    cacheKey: string,
    entries: { id: number; values: number[] }[],
    deviceId?: string,
  ) => void;
  setCapabilityCache: (cache: Record<string, Record<number, number[]>>) => void;
  setIsRefreshingCapabilities: (isRefreshing: boolean) => void;
  setPresets: (groups: GoProPresetGroupData[], deviceId?: string) => void;
  setHardwareInfo: (info: HardwareInfo | null) => void;
  setApPassword: (password: string | null) => void;
  setScheduledTime: (time: { hour: number; minute: number } | null) => void;
  setColumnCount: (count: number) => void;
  setTheme: (theme: AppTheme) => void;
  setAppLanguage: (lang: AppLocale) => void;
  setBypassCapabilityCache: (bypass: boolean) => void;
  setDebugLogBle: (enabled: boolean) => void;
  setDebugLogBleCache: (enabled: boolean) => void;
  setDebugLogBlePreset: (enabled: boolean) => void;
  setDebugLogBleAsync: (enabled: boolean) => void;
  setDebugLogBleQueue: (enabled: boolean) => void;
  setDebugLogWifi: (enabled: boolean) => void;
  setDebugLogIap: (enabled: boolean) => void;
  setPurchasedProducts: (products: string[]) => void;
  addPurchasedProduct: (productId: string) => void;
  setShowPreviewModal: (show: boolean) => void;
  setShowVisibilityModal: (show: boolean) => void;

  // Multi-device actions
  setActiveDevice: (deviceId: string) => void;
  updateDeviceState: (deviceId: string, update: Partial<CameraSpecificState>) => void;
  setDeviceConnectionStatus: (
    deviceId: string,
    status: 'disconnected' | 'scanning' | 'connected',
  ) => void;
  removeDeviceState: (deviceId: string) => void;
  batchUpdateSettingsForDevice: (
    deviceId: string,
    entries: { id: number; value: number }[],
  ) => void;
  batchUpdateCapabilitiesForDevice: (
    deviceId: string,
    entries: { id: number; values: number[] }[],
  ) => void;
  clearPendingSettingForDevice: (deviceId: string, settingId: number) => void;
  beginDisconnectForDevice: (deviceId: string) => void;
  setAutoNavigateToControl: (val: boolean) => void;
}

// Debug log categories default ON only in development builds. Release builds
// start silent (the toggles live behind a __DEV__-gated section of the app
// settings screen, so end users could never turn them back off otherwise).
// The typeof guard keeps this module loadable in Node (vitest), where the
// React Native __DEV__ global does not exist.
const DEBUG_LOG_DEFAULT = typeof __DEV__ !== 'undefined' && __DEV__;

export const useGoProStore = create<GoProState>((set) => {
  /** Apply a partial update to the ACTIVE device's camera state. No-op when no device is active. */
  const updateActiveDeviceState = (
    state: GoProState,
    updates: Partial<CameraSpecificState>,
  ): Partial<GoProState> => {
    const id = state.connectedDeviceId;
    if (!id) return {};
    const cameraState = state.cameraStates[id] || createDefaultCameraState();
    return {
      cameraStates: {
        ...state.cameraStates,
        [id]: { ...cameraState, ...updates },
      },
    };
  };

  const updateField =
    <K extends keyof CameraSpecificState>(key: K) =>
    (val: CameraSpecificState[K]) =>
      set((state) =>
        updateActiveDeviceState(state, { [key]: val } as Partial<CameraSpecificState>),
      );

  /** Camera state of the active device for use inside action bodies. */
  const activeCameraState = (state: GoProState): CameraSpecificState => {
    const id = state.connectedDeviceId;
    return (id ? state.cameraStates[id] : undefined) ?? createDefaultCameraState();
  };

  return {
    connectionStatus: 'disconnected',
    bluetoothState: 'Unknown',
    activeScreen: 'home',
    connectedDeviceId: null,

    columnCount: 1,
    theme: 'dark',
    appLanguage: 'auto',
    bypassCapabilityCache: false,
    debugLogBle: DEBUG_LOG_DEFAULT,
    debugLogBleCache: DEBUG_LOG_DEFAULT,
    debugLogBlePreset: DEBUG_LOG_DEFAULT,
    debugLogBleAsync: DEBUG_LOG_DEFAULT,
    debugLogBleQueue: DEBUG_LOG_DEFAULT,
    debugLogWifi: DEBUG_LOG_DEFAULT,
    debugLogIap: DEBUG_LOG_DEFAULT,
    purchasedProducts: [],

    cameraStates: {},
    deviceConnectionStatuses: {},
    autoNavigateToControl: true,

    setConnectionStatus: (status) =>
      set((state) => ({
        connectionStatus: status,
        deviceConnectionStatuses: state.connectedDeviceId
          ? { ...state.deviceConnectionStatuses, [state.connectedDeviceId]: status }
          : state.deviceConnectionStatuses,
      })),
    setBluetoothState: (bluetoothState) => set({ bluetoothState }),
    setWifiStatus: updateField('wifiStatus'),
    setActiveScreen: (screen) => set({ activeScreen: screen }),
    setConnectedDeviceId: (deviceId) => set({ connectedDeviceId: deviceId }),
    setBatteryLevel: updateField('batteryLevel'),
    setBatteryPresent: updateField('batteryPresent'),
    setIsCharging: updateField('isCharging'),
    setIsEncoding: updateField('isEncoding'),
    setCaptureDelayActive: updateField('captureDelayActive'),
    setRecordingTimeSec: updateField('recordingTimeSec'),
    setIsReady: updateField('isReady'),
    setSystemBusy: updateField('systemBusy'),
    setCameraControlStatus: updateField('cameraControlStatus'),
    setSdCardStatus: updateField('sdCardStatus'),
    setSdRemainingKB: updateField('sdRemainingKB'),
    setSdCapacityKB: updateField('sdCapacityKB'),
    setRemainingPhotos: updateField('remainingPhotos'),
    setRemainingVideoSec: updateField('remainingVideoSec'),
    setSdWriteSpeedError: updateField('sdWriteSpeedError'),
    setOverheating: updateField('overheating'),
    setCold: updateField('cold'),
    setGpsLockAcquired: updateField('gpsLockAcquired'),
    setMediaModMicStatus: updateField('mediaModMicStatus'),
    setMediaModStatus: updateField('mediaModStatus'),
    addDynamicShootingLockedId: (id) =>
      set((state) => {
        const currentIds = activeCameraState(state).dynamicShootingLockedIds;
        if (currentIds.has(id)) return state;
        const next = new Set(currentIds);
        next.add(id);
        return updateActiveDeviceState(state, { dynamicShootingLockedIds: next });
      }),
    clearDynamicShootingLockedIds: () =>
      set((state) =>
        updateActiveDeviceState(state, { dynamicShootingLockedIds: new Set<number>() }),
      ),
    setToastMessage: updateField('toastMessage'),
    setPendingSetting: (settingId, expectedValue) =>
      set((state) => {
        const next = { ...activeCameraState(state).pendingSettings, [settingId]: expectedValue };
        return updateActiveDeviceState(state, { pendingSettings: next });
      }),
    clearPendingSetting: (settingId) =>
      set((state) => {
        const next = { ...activeCameraState(state).pendingSettings };
        delete next[settingId];
        return updateActiveDeviceState(state, { pendingSettings: next });
      }),
    setIsApplyingCustomPreset: updateField('isApplyingCustomPreset'),
    // Phase 1: Only change connectionStatus -> App.js useEffect executes navigation
    beginDisconnect: () =>
      set((state) => ({
        connectedDeviceId: null,
        connectionStatus: 'disconnected' as const,
        deviceConnectionStatuses: state.connectedDeviceId
          ? {
              ...state.deviceConnectionStatuses,
              [state.connectedDeviceId]: 'disconnected' as const,
            }
          : state.deviceConnectionStatuses,
      })),
    // Phase 2: Defer until after the navigation transition completes (via InteractionManager.runAfterInteractions)
    // Deferring this prevents Fabric layout conflicts since it runs after CameraSettingsScreen is unmounted.
    // The device's last camera state stays in cameraStates so a reconnect can
    // hydrate from it; with no connectedDeviceId the UI reads default state.
    clearConnectedCameraState: () =>
      set({
        activeScreen: 'home',
        connectedDeviceId: null,
      }),

    updateCapabilities: (settingId, values) =>
      set((state) => {
        const next = { ...activeCameraState(state).capabilities, [settingId]: values };
        return updateActiveDeviceState(state, { capabilities: next });
      }),

    updateSettings: (settingId, value) =>
      set((state) => {
        const next = { ...activeCameraState(state).settings, [settingId]: value };
        return updateActiveDeviceState(state, { settings: next });
      }),

    batchUpdateSettings: (entries) =>
      set((state) => {
        const merged = { ...activeCameraState(state).settings };
        for (const { id, value } of entries) merged[id] = value;
        return updateActiveDeviceState(state, { settings: merged });
      }),

    batchUpdateCapabilities: (entries) =>
      set((state) => {
        const merged = { ...activeCameraState(state).capabilities };
        for (const { id, values } of entries) merged[id] = values;
        return updateActiveDeviceState(state, { capabilities: merged });
      }),
    mergeCapabilityCacheEntry: (cacheKey, entries, deviceId) =>
      set((state) => {
        const id = deviceId ?? state.connectedDeviceId;
        if (!id) return state;
        const cameraState = state.cameraStates[id] || createDefaultCameraState();
        const updatedEntry = { ...(cameraState.capabilityCache[cacheKey] || {}) };
        for (const { id: settingId, values } of entries) {
          updatedEntry[settingId] = values;
        }
        return {
          cameraStates: {
            ...state.cameraStates,
            [id]: {
              ...cameraState,
              capabilityCache: { ...cameraState.capabilityCache, [cacheKey]: updatedEntry },
            },
          },
        };
      }),
    setCapabilityCache: updateField('capabilityCache'),
    setIsRefreshingCapabilities: updateField('isRefreshingCapabilities'),
    setPresets: (groups, deviceId) =>
      set((state) => {
        const id = deviceId ?? state.connectedDeviceId;
        if (!id) return state;
        const cameraState = state.cameraStates[id] || createDefaultCameraState();

        // Push notifications (0xF3) might omit some fields, so reuse already-fetched values
        // for customName / iconId / settings / basePresetId from existing data.
        type Meta = {
          customName: string | null;
          iconId: number;
          basePresetId?: number;
          settings: GoProPresetGroupData['presets'][number]['settings'];
        };
        const metaCache = new Map<string, Meta>();
        for (const group of cameraState.presets) {
          for (const preset of group.presets) {
            metaCache.set(`${group.groupId}:${preset.id}`, {
              customName: preset.customName,
              iconId: preset.iconId,
              basePresetId: preset.basePresetId,
              settings: preset.settings,
            });
          }
        }
        const merged = groups.map((group) => ({
          ...group,
          presets: group.presets.map((preset) => {
            const prev = metaCache.get(`${group.groupId}:${preset.id}`);
            const normalizedBasePresetId = normalizeBaseDisplayPresetId(
              preset.basePresetId ?? prev?.basePresetId,
            );
            const mergedPreset = {
              ...preset,
              customName: preset.customName || prev?.customName || null,
              // iconId=0 is the default value when the field is omitted in a push notification,
              // so retain the existing value if available.
              iconId: preset.iconId !== 0 ? preset.iconId : (prev?.iconId ?? 0),
              basePresetId: normalizedBasePresetId,
              settings: preset.settings.length > 0 ? preset.settings : (prev?.settings ?? []),
            };
            return {
              ...mergedPreset,
              basePresetId:
                normalizeBaseDisplayPresetId(mergedPreset.basePresetId) ??
                resolveBaseDisplayPresetId(mergedPreset, mergedPreset.id, group.groupId),
            };
          }),
        }));

        return {
          cameraStates: {
            ...state.cameraStates,
            [id]: { ...cameraState, presets: merged },
          },
        };
      }),
    setHardwareInfo: updateField('hardwareInfo'),
    setApPassword: updateField('apPassword'),
    setScheduledTime: updateField('scheduledTime'),
    setColumnCount: (count) => set({ columnCount: count }),
    setTheme: (theme) => set({ theme }),
    setAppLanguage: (lang) => set({ appLanguage: lang }),
    setBypassCapabilityCache: (bypass) => set({ bypassCapabilityCache: bypass }),
    setDebugLogBle: (enabled) => set({ debugLogBle: enabled }),
    setDebugLogBleCache: (enabled) => set({ debugLogBleCache: enabled }),
    setDebugLogBlePreset: (enabled) => set({ debugLogBlePreset: enabled }),
    setDebugLogBleAsync: (enabled) => set({ debugLogBleAsync: enabled }),
    setDebugLogBleQueue: (enabled) => set({ debugLogBleQueue: enabled }),
    setDebugLogWifi: (enabled) => set({ debugLogWifi: enabled }),
    setDebugLogIap: (enabled) => set({ debugLogIap: enabled }),
    setPurchasedProducts: (products) => set({ purchasedProducts: products }),
    addPurchasedProduct: (productId) =>
      set((state) => ({
        purchasedProducts: state.purchasedProducts.includes(productId)
          ? state.purchasedProducts
          : [...state.purchasedProducts, productId],
      })),
    setShowPreviewModal: updateField('showPreviewModal'),
    setShowVisibilityModal: updateField('showVisibilityModal'),

    // Multi-device actions implementation
    setActiveDevice: (deviceId) =>
      set((state) => ({
        connectedDeviceId: deviceId,
        connectionStatus: state.deviceConnectionStatuses[deviceId] || 'connected',
        cameraStates: state.cameraStates[deviceId]
          ? state.cameraStates
          : { ...state.cameraStates, [deviceId]: createDefaultCameraState() },
      })),
    updateDeviceState: (deviceId, update) =>
      set((state) => {
        const prevDeviceState = state.cameraStates[deviceId] || createDefaultCameraState();
        return {
          cameraStates: { ...state.cameraStates, [deviceId]: { ...prevDeviceState, ...update } },
        };
      }),
    setDeviceConnectionStatus: (deviceId, status) =>
      set((state) => {
        const nextStatuses = { ...state.deviceConnectionStatuses, [deviceId]: status };
        if (state.connectedDeviceId === deviceId) {
          return {
            deviceConnectionStatuses: nextStatuses,
            connectionStatus: status,
          };
        }
        return {
          deviceConnectionStatuses: nextStatuses,
        };
      }),
    removeDeviceState: (deviceId) =>
      set((state) => {
        const nextCameraStates = { ...state.cameraStates };
        delete nextCameraStates[deviceId];

        const nextStatuses = { ...state.deviceConnectionStatuses };
        delete nextStatuses[deviceId];

        if (state.connectedDeviceId === deviceId) {
          return {
            cameraStates: nextCameraStates,
            deviceConnectionStatuses: nextStatuses,
            connectedDeviceId: null,
            connectionStatus: 'disconnected' as const,
          };
        }

        return {
          cameraStates: nextCameraStates,
          deviceConnectionStatuses: nextStatuses,
        };
      }),
    batchUpdateSettingsForDevice: (deviceId, entries) =>
      set((state) => {
        const cameraState = state.cameraStates[deviceId] || createDefaultCameraState();
        const merged = { ...cameraState.settings };
        for (const { id, value } of entries) merged[id] = value;
        return {
          cameraStates: { ...state.cameraStates, [deviceId]: { ...cameraState, settings: merged } },
        };
      }),
    batchUpdateCapabilitiesForDevice: (deviceId, entries) =>
      set((state) => {
        const cameraState = state.cameraStates[deviceId] || createDefaultCameraState();
        const merged = { ...cameraState.capabilities };
        for (const { id, values } of entries) merged[id] = values;
        return {
          cameraStates: {
            ...state.cameraStates,
            [deviceId]: { ...cameraState, capabilities: merged },
          },
        };
      }),
    clearPendingSettingForDevice: (deviceId, settingId) =>
      set((state) => {
        const cameraState = state.cameraStates[deviceId] || createDefaultCameraState();
        const nextPending = { ...cameraState.pendingSettings };
        delete nextPending[settingId];
        return {
          cameraStates: {
            ...state.cameraStates,
            [deviceId]: { ...cameraState, pendingSettings: nextPending },
          },
        };
      }),
    beginDisconnectForDevice: (deviceId) =>
      set((state) => {
        const nextStatuses = {
          ...state.deviceConnectionStatuses,
          [deviceId]: 'disconnected' as const,
        };
        if (state.connectedDeviceId === deviceId) {
          return {
            deviceConnectionStatuses: nextStatuses,
            connectionStatus: 'disconnected' as const,
            connectedDeviceId: null,
          };
        }
        return {
          deviceConnectionStatuses: nextStatuses,
        };
      }),
    setAutoNavigateToControl: (val) => set({ autoNavigateToControl: val }),
  };
});

// ---------------------------------------------------------------------------
// Camera-state selectors / hooks
//
// All per-camera state lives in cameraStates[deviceId]. These helpers are the
// single supported way to read it — either for a specific device or for the
// currently active (connected) device.
// ---------------------------------------------------------------------------

// Stable fallback so selectors return a referentially-stable object when no
// camera is active. (Returning a fresh object from a zustand selector on every
// snapshot would make useSyncExternalStore re-render indefinitely.)
const DEFAULT_CAMERA_STATE: CameraSpecificState = createDefaultCameraState();

/** Camera state for an explicit device, falling back to the active device, then to defaults. */
export const selectCameraStateFor = (
  state: GoProState,
  deviceId?: string | null,
): CameraSpecificState => {
  const id = deviceId ?? state.connectedDeviceId;
  return (id ? state.cameraStates[id] : undefined) ?? DEFAULT_CAMERA_STATE;
};

/** Camera state of the currently active (connected) device, or defaults when none. */
export const selectActiveCameraState = (state: GoProState): CameraSpecificState =>
  selectCameraStateFor(state);

/**
 * Subscribe to a slice of a specific device's camera state.
 * When deviceId is undefined the active device is used.
 * Wrap the selector with zustand's useShallow when selecting objects/arrays.
 */
export function useCameraState<T>(
  deviceId: string | undefined,
  selector: (cs: CameraSpecificState) => T,
): T {
  return useGoProStore((state) => selector(selectCameraStateFor(state, deviceId)));
}

/** Subscribe to a slice of the active device's camera state. */
export function useActiveCameraState<T>(selector: (cs: CameraSpecificState) => T): T {
  return useGoProStore((state) => selector(selectActiveCameraState(state)));
}

export const useCurrentModelNo = () =>
  useGoProStore((state) => selectActiveCameraState(state).hardwareInfo?.modelNo ?? null);

/**
 * Derived selector — returns the CameraModelKey derived from hardwareInfo.modelNo.
 * Replaces the now-removed `cameraModel` field so that modelNo is the single
 * source of truth and `cameraModel` can never diverge from it.
 */
export const useCameraModel = () =>
  useGoProStore((state) => {
    const modelNo = selectActiveCameraState(state).hardwareInfo?.modelNo ?? null;
    return resolveCameraModelKeyFromModelNo(modelNo);
  });

setCategoryEnableProvider((category) => {
  const state = useGoProStore.getState();
  switch (category) {
    case 'ble':
      return state.debugLogBle;
    case 'bleCache':
      return state.debugLogBleCache;
    case 'blePreset':
      return state.debugLogBlePreset;
    case 'bleAsync':
      return state.debugLogBleAsync;
    case 'bleQueue':
      return state.debugLogBleQueue;
    case 'wifi':
      return state.debugLogWifi;
    case 'iap':
      return state.debugLogIap;
    case 'notif':
    case 'storage':
    case 'ui':
    default:
      return true;
  }
});

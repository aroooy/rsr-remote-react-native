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

import type { GoProPresetGroupData } from '../ble/PresetProtobuf';
import type { HardwareInfo } from '../types/KnownDevice';
import type { AppTheme } from '../constants/Theme';
import type { AppLocale } from '../i18n';

export type BluetoothAdapterState =
  | 'Unknown'
  | 'Resetting'
  | 'Unsupported'
  | 'Unauthorized'
  | 'PoweredOff'
  | 'PoweredOn';

export interface CameraSpecificState {
  wifiStatus: 'disconnected' | 'connecting' | 'connected';
  batteryLevel: number;
  batteryPresent: boolean;
  isCharging: boolean;
  isEncoding: boolean;
  captureDelayActive: boolean;
  recordingTimeSec: number;
  isReady: boolean;
  systemBusy: boolean;
  cameraControlStatus: 'idle' | 'camera' | 'external' | 'cofSetup';
  sdCardStatus: number;
  sdRemainingKB: number;
  sdCapacityKB: number;
  remainingPhotos: number;
  remainingVideoSec: number;
  sdWriteSpeedError: boolean;
  overheating: boolean;
  cold: boolean;
  gpsLockAcquired: boolean;
  mediaModMicStatus: number;
  mediaModStatus: number;
  dynamicShootingLockedIds: Set<number>;
  toastMessage: string | null;
  pendingSettings: { [settingId: number]: number };
  isApplyingCustomPreset: boolean;
  capabilities: { [settingId: number]: number[] };
  settings: { [settingId: number]: number };
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

export interface GoProState {
  // Connection state
  connectionStatus: 'disconnected' | 'scanning' | 'connected';
  bluetoothState: BluetoothAdapterState;
  activeScreen: 'home' | 'control';
  connectedDeviceId: string | null;

  // App-level UI settings
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

  // Per-camera state
  cameraStates: { [deviceId: string]: CameraSpecificState };
  deviceConnectionStatuses: { [deviceId: string]: 'disconnected' | 'scanning' | 'connected' };
  autoNavigateToControl: boolean;

  // Actions
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

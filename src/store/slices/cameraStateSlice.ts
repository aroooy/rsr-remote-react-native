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

import type { StateCreator } from 'zustand';
import type { GoProState, CameraSpecificState } from '../storeTypes';
import { createDefaultCameraState } from '../storeTypes';
import type { HardwareInfo } from '../../types/KnownDevice';

export interface CameraStateSlice {
  cameraStates: { [deviceId: string]: CameraSpecificState };

  setWifiStatus: (status: 'disconnected' | 'connecting' | 'connected') => void;
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
  setHardwareInfo: (info: HardwareInfo | null) => void;
  setApPassword: (password: string | null) => void;
  setScheduledTime: (time: { hour: number; minute: number } | null) => void;
  setShowPreviewModal: (show: boolean) => void;
  setShowVisibilityModal: (show: boolean) => void;

  updateDeviceState: (deviceId: string, update: Partial<CameraSpecificState>) => void;
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
}

export const createCameraStateSlice: StateCreator<
  GoProState,
  [],
  [],
  CameraStateSlice
> = (set) => {
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

  const activeCameraState = (state: GoProState): CameraSpecificState => {
    const id = state.connectedDeviceId;
    return (id ? state.cameraStates[id] : undefined) ?? createDefaultCameraState();
  };

  return {
    cameraStates: {},

    setWifiStatus: updateField('wifiStatus'),
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
    setHardwareInfo: updateField('hardwareInfo'),
    setApPassword: updateField('apPassword'),
    setScheduledTime: updateField('scheduledTime'),
    setShowPreviewModal: updateField('showPreviewModal'),
    setShowVisibilityModal: updateField('showVisibilityModal'),

    updateDeviceState: (deviceId, update) =>
      set((state) => {
        const prevDeviceState = state.cameraStates[deviceId] || createDefaultCameraState();
        return {
          cameraStates: { ...state.cameraStates, [deviceId]: { ...prevDeviceState, ...update } },
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
  };
};

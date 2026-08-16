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

import { describe, it, expect, beforeEach } from 'vitest';
import { useGoProStore, selectActiveCameraState, selectCameraStateFor } from './GoProStore';
import type { GoProPresetGroupData } from '../ble/PresetProtobuf';

const DEVICE_A = 'AA:11';
const DEVICE_B = 'BB:22';

beforeEach(() => {
  useGoProStore.setState(useGoProStore.getInitialState(), true);
});

describe('GoProStore per-device camera state', () => {
  it('setActiveDevice initializes default camera state for brand new device', () => {
    useGoProStore.getState().setActiveDevice(DEVICE_A);
    const cs = useGoProStore.getState().cameraStates[DEVICE_A];
    expect(cs).toBeDefined();
    expect(cs.batteryLevel).toBe(0);
    expect(cs.wifiStatus).toBe('disconnected');
  });

  it('updateDeviceState creates and merges device state', () => {
    useGoProStore.getState().updateDeviceState(DEVICE_A, { batteryLevel: 55 });
    const cs = useGoProStore.getState().cameraStates[DEVICE_A];
    expect(cs.batteryLevel).toBe(55);
    expect(cs.isEncoding).toBe(false); // untouched fields keep defaults
  });

  it('active-device field setters write to the active camera state', () => {
    const s = useGoProStore.getState();
    s.setActiveDevice(DEVICE_A);
    s.setBatteryLevel(42);
    s.setIsEncoding(true);
    const cs = selectActiveCameraState(useGoProStore.getState());
    expect(cs.batteryLevel).toBe(42);
    expect(cs.isEncoding).toBe(true);
    expect(useGoProStore.getState().cameraStates[DEVICE_A].batteryLevel).toBe(42);
  });

  it('field setters without an active device never touch cameraStates', () => {
    useGoProStore.getState().setBatteryLevel(99);
    expect(Object.keys(useGoProStore.getState().cameraStates)).toHaveLength(0);
    expect(selectActiveCameraState(useGoProStore.getState()).batteryLevel).toBe(0);
  });

  it('setActiveDevice switches the active camera state without mixing devices', () => {
    const s = useGoProStore.getState();
    s.setActiveDevice(DEVICE_A);
    s.setBatteryLevel(10);
    s.setActiveDevice(DEVICE_B);
    s.setBatteryLevel(20);
    const state = useGoProStore.getState();
    expect(selectCameraStateFor(state, DEVICE_A).batteryLevel).toBe(10);
    expect(selectCameraStateFor(state, DEVICE_B).batteryLevel).toBe(20);
    expect(selectActiveCameraState(state).batteryLevel).toBe(20);

    useGoProStore.getState().setActiveDevice(DEVICE_A);
    expect(selectActiveCameraState(useGoProStore.getState()).batteryLevel).toBe(10);
  });

  it('batchUpdateSettingsForDevice updates devices independently', () => {
    const s = useGoProStore.getState();
    s.setActiveDevice(DEVICE_A);
    s.batchUpdateSettingsForDevice(DEVICE_A, [{ id: 2, value: 9 }]);
    s.batchUpdateSettingsForDevice(DEVICE_B, [{ id: 2, value: 1 }]);
    const state = useGoProStore.getState();
    expect(selectCameraStateFor(state, DEVICE_A).settings[2]).toBe(9);
    expect(selectCameraStateFor(state, DEVICE_B).settings[2]).toBe(1);
    expect(selectActiveCameraState(state).settings[2]).toBe(9);
  });

  it('batchUpdateCapabilitiesForDevice merges capability lists per device', () => {
    const s = useGoProStore.getState();
    s.setActiveDevice(DEVICE_A);
    s.batchUpdateCapabilitiesForDevice(DEVICE_A, [{ id: 2, values: [1, 4, 9] }]);
    s.batchUpdateCapabilitiesForDevice(DEVICE_A, [{ id: 3, values: [5, 8] }]);
    const cs = selectActiveCameraState(useGoProStore.getState());
    expect(cs.capabilities[2]).toEqual([1, 4, 9]);
    expect(cs.capabilities[3]).toEqual([5, 8]);
  });

  it('pending settings are set on the active device and cleared per device', () => {
    const s = useGoProStore.getState();
    s.setActiveDevice(DEVICE_A);
    s.setPendingSetting(2, 9);
    expect(selectActiveCameraState(useGoProStore.getState()).pendingSettings[2]).toBe(9);
    useGoProStore.getState().clearPendingSettingForDevice(DEVICE_A, 2);
    expect(selectActiveCameraState(useGoProStore.getState()).pendingSettings[2]).toBeUndefined();
  });

  it('addDynamicShootingLockedId accumulates on the active device and clears', () => {
    const s = useGoProStore.getState();
    s.setActiveDevice(DEVICE_A);
    s.addDynamicShootingLockedId(135);
    s.addDynamicShootingLockedId(135);
    expect(
      selectActiveCameraState(useGoProStore.getState()).dynamicShootingLockedIds.has(135),
    ).toBe(true);
    expect(selectActiveCameraState(useGoProStore.getState()).dynamicShootingLockedIds.size).toBe(1);
    useGoProStore.getState().clearDynamicShootingLockedIds();
    expect(selectActiveCameraState(useGoProStore.getState()).dynamicShootingLockedIds.size).toBe(0);
  });

  it('mergeCapabilityCacheEntry stores per-device capability cache', () => {
    const s = useGoProStore.getState();
    s.setActiveDevice(DEVICE_A);
    s.mergeCapabilityCacheEntry('key1', [{ id: 2, values: [1, 4, 9] }], DEVICE_A);
    s.mergeCapabilityCacheEntry('key1', [{ id: 3, values: [5] }], DEVICE_A);
    const cache = selectCameraStateFor(useGoProStore.getState(), DEVICE_A).capabilityCache;
    expect(cache['key1'][2]).toEqual([1, 4, 9]);
    expect(cache['key1'][3]).toEqual([5]);
  });

  it('clearConnectedCameraState keeps the device snapshot and falls back to defaults', () => {
    const s = useGoProStore.getState();
    s.setActiveDevice(DEVICE_A);
    s.setBatteryLevel(77);
    useGoProStore.getState().clearConnectedCameraState();
    const state = useGoProStore.getState();
    expect(state.connectedDeviceId).toBeNull();
    expect(state.activeScreen).toBe('home');
    expect(state.cameraStates[DEVICE_A].batteryLevel).toBe(77);
    expect(selectActiveCameraState(state).batteryLevel).toBe(0);
  });

  it('removeDeviceState removes the device and resets the connection when it was active', () => {
    const s = useGoProStore.getState();
    s.setActiveDevice(DEVICE_A);
    s.setBatteryLevel(5);
    useGoProStore.getState().removeDeviceState(DEVICE_A);
    const state = useGoProStore.getState();
    expect(state.cameraStates[DEVICE_A]).toBeUndefined();
    expect(state.connectedDeviceId).toBeNull();
    expect(state.connectionStatus).toBe('disconnected');
  });

  it('beginDisconnectForDevice for the active device resets global connection state', () => {
    const s = useGoProStore.getState();
    s.setActiveDevice(DEVICE_A);
    useGoProStore.getState().beginDisconnectForDevice(DEVICE_A);
    const state = useGoProStore.getState();
    expect(state.connectedDeviceId).toBeNull();
    expect(state.connectionStatus).toBe('disconnected');
  });
});

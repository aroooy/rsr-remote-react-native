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
import { resolveCameraModelKeyFromModelNo } from '../cameraModels/shared/modelNumber';
import type { CameraSpecificState } from './storeTypes';
import { createDefaultCameraState } from './storeTypes';

import type { ConnectionSlice } from './slices/connectionSlice';
import type { CameraStateSlice } from './slices/cameraStateSlice';
import type { PresetSlice } from './slices/presetSlice';
import type { UiSettingsSlice } from './slices/uiSettingsSlice';

import { createConnectionSlice } from './slices/connectionSlice';
import { createCameraStateSlice } from './slices/cameraStateSlice';
import { createPresetSlice } from './slices/presetSlice';
import { createUiSettingsSlice } from './slices/uiSettingsSlice';

export type { BluetoothAdapterState, CameraSpecificState } from './storeTypes';
export { createDefaultCameraState } from './storeTypes';

export interface GoProState
  extends ConnectionSlice,
    CameraStateSlice,
    PresetSlice,
    UiSettingsSlice {}

export const useGoProStore = create<GoProState>()((...a) => ({
  ...createConnectionSlice(...a),
  ...createCameraStateSlice(...a),
  ...createPresetSlice(...a),
  ...createUiSettingsSlice(...a),
}));

// ---------------------------------------------------------------------------
// Camera-state selectors / hooks
// ---------------------------------------------------------------------------

const DEFAULT_CAMERA_STATE: CameraSpecificState = createDefaultCameraState();

export const selectCameraStateFor = (
  state: GoProState,
  deviceId?: string | null,
): CameraSpecificState => {
  const id = deviceId ?? state.connectedDeviceId;
  return (id ? state.cameraStates[id] : undefined) ?? DEFAULT_CAMERA_STATE;
};

export const selectActiveCameraState = (state: GoProState): CameraSpecificState =>
  selectCameraStateFor(state);

export function useCameraState<T>(
  deviceId: string | undefined,
  selector: (cs: CameraSpecificState) => T,
): T {
  return useGoProStore((state) => selector(selectCameraStateFor(state, deviceId)));
}

export function useActiveCameraState<T>(selector: (cs: CameraSpecificState) => T): T {
  return useGoProStore((state) => selector(selectActiveCameraState(state)));
}

export const useCurrentModelNo = () =>
  useGoProStore((state) => selectActiveCameraState(state).hardwareInfo?.modelNo ?? null);

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

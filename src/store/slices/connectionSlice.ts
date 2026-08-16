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
import type { GoProState, BluetoothAdapterState } from '../storeTypes';
import { createDefaultCameraState } from '../storeTypes';

export interface ConnectionSlice {
  connectionStatus: 'disconnected' | 'scanning' | 'connected';
  bluetoothState: BluetoothAdapterState;
  activeScreen: 'home' | 'control';
  connectedDeviceId: string | null;
  deviceConnectionStatuses: { [deviceId: string]: 'disconnected' | 'scanning' | 'connected' };
  autoNavigateToControl: boolean;

  setConnectionStatus: (status: 'disconnected' | 'scanning' | 'connected') => void;
  setBluetoothState: (state: BluetoothAdapterState) => void;
  setActiveScreen: (screen: 'home' | 'control') => void;
  setConnectedDeviceId: (deviceId: string | null) => void;
  beginDisconnect: () => void;
  clearConnectedCameraState: () => void;
  setActiveDevice: (deviceId: string) => void;
  setDeviceConnectionStatus: (
    deviceId: string,
    status: 'disconnected' | 'scanning' | 'connected',
  ) => void;
  beginDisconnectForDevice: (deviceId: string) => void;
  setAutoNavigateToControl: (val: boolean) => void;
}

export const createConnectionSlice: StateCreator<
  GoProState,
  [],
  [],
  ConnectionSlice
> = (set) => ({
  connectionStatus: 'disconnected',
  bluetoothState: 'Unknown',
  activeScreen: 'home',
  connectedDeviceId: null,
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
  setActiveScreen: (screen) => set({ activeScreen: screen }),
  setConnectedDeviceId: (deviceId) => set({ connectedDeviceId: deviceId }),
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
  clearConnectedCameraState: () =>
    set({
      activeScreen: 'home',
      connectedDeviceId: null,
    }),
  setActiveDevice: (deviceId) =>
    set((state) => ({
      connectedDeviceId: deviceId,
      connectionStatus: state.deviceConnectionStatuses[deviceId] || 'connected',
      cameraStates: state.cameraStates[deviceId]
        ? state.cameraStates
        : { ...state.cameraStates, [deviceId]: createDefaultCameraState() },
    })),
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
});

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

import { Platform } from 'react-native';
import { useGoProStore } from '../store/GoProStore';
import {
  refreshConnectionForegroundService,
  presentRecordingStatus,
  clearRecordingStatus,
  notifyTemperature,
  clearTemperature,
} from './notifications';
import { debugWarn } from '../utils/debugLogging';

/**
 * Bridges live camera state to the status notification.
 *
 * Android: silently refreshes the ongoing foreground-service notification when a
 * meaningful field changes (recording, battery/SD bucket, warnings).
 *
 * iOS: shows one notification on record start, refreshes it only on important
 * events (a new warning), and clears it on stop — never on routine ticks, so it
 * does not re-alert repeatedly. Manual dismissal is respected (we never resurrect
 * it for routine changes).
 */

let started = false;
let prevSig = '';
let prevRecording = false;
let prevWarnSig = '000';
// Per-device temperature state, so warnings track each camera independently.
const prevTemp: Record<string, { overheat: boolean; cold: boolean }> = {};

/**
 * Show/clear high & low temperature warnings for every connected camera.
 * Fires only on transitions, so resolving the condition removes the notification
 * in real time without re-alert spam, and multiple cameras stay independent.
 */
function syncTemperatureWarnings(st: ReturnType<typeof useGoProStore.getState>): void {
  const statuses = st.deviceConnectionStatuses;
  const connectedIds = Object.keys(statuses).filter((id) => statuses[id] === 'connected');
  const connectedSet = new Set(connectedIds);

  // Drop warnings for cameras that are no longer connected.
  for (const id of Object.keys(prevTemp)) {
    if (!connectedSet.has(id)) {
      if (prevTemp[id].overheat) void clearTemperature(id, 'overheat');
      if (prevTemp[id].cold) void clearTemperature(id, 'cold');
      delete prevTemp[id];
    }
  }

  for (const id of connectedIds) {
    const cs = st.cameraStates[id];
    const overheat = !!cs?.overheating;
    const cold = !!cs?.cold;
    const name = cs?.hardwareInfo?.ssid || cs?.hardwareInfo?.modelName || 'GoPro';
    const prev = prevTemp[id] ?? { overheat: false, cold: false };

    if (overheat && !prev.overheat) void notifyTemperature(id, name, 'overheat');
    else if (!overheat && prev.overheat) void clearTemperature(id, 'overheat');

    if (cold && !prev.cold) void notifyTemperature(id, name, 'cold');
    else if (!cold && prev.cold) void clearTemperature(id, 'cold');

    prevTemp[id] = { overheat, cold };
  }
}

function warnSignature(overheat: boolean, lowBattery: boolean, sdFull: boolean): string {
  return `${overheat ? 1 : 0}${lowBattery ? 1 : 0}${sdFull ? 1 : 0}`;
}

export function initStatusNotifications(): () => void {
  if (started) return () => {};
  started = true;

  const handle = () => {
    try {
      const st = useGoProStore.getState();
      // Temperature warnings span all connected cameras (independent of the
      // active-camera status notification handled below).
      syncTemperatureWarnings(st);
      const id = st.connectedDeviceId;
      const cs = id ? st.cameraStates[id] : undefined;
      const connected = !!id && st.deviceConnectionStatuses[id] === 'connected';
      const recording = !!cs?.isEncoding;
      const battery = cs?.batteryLevel ?? 0;
      const cap = cs?.sdCapacityKB ?? 0;
      const rem = cs?.sdRemainingKB ?? 0;
      const sdPct = cap > 0 ? Math.round((rem / cap) * 100) : -1;
      const overheat = !!cs?.overheating;
      const lowBattery = battery > 0 && battery < 15;
      const sdFull = sdPct >= 0 && sdPct <= 1;

      const warnSig = warnSignature(overheat, lowBattery, sdFull);
      const batteryBucket = Math.round(battery / 5) * 5;
      const sdBucket = sdPct < 0 ? -1 : Math.round(sdPct / 5) * 5;
      const sig = `${connected ? 1 : 0}|${recording ? 1 : 0}|${batteryBucket}|${sdBucket}|${warnSig}`;

      if (Platform.OS === 'android') {
        // Only refresh while a camera is connected; never re-render after a
        // disconnect (that would resurrect a stale "connected" notification).
        if (connected && sig !== prevSig) void refreshConnectionForegroundService();
      } else if (Platform.OS === 'ios') {
        if (recording && !prevRecording) {
          void presentRecordingStatus(); // record start
        } else if (!recording && prevRecording) {
          void clearRecordingStatus(); // record stop
        } else if (recording && warnSig !== prevWarnSig && warnSig !== '000') {
          void presentRecordingStatus(); // a new warning appeared while recording
        }
      }

      prevSig = sig;
      prevRecording = recording;
      prevWarnSig = warnSig;
    } catch (e) {
      debugWarn('notif', '[notif] status controller error', e);
    }
  };

  const unsub = useGoProStore.subscribe(handle);
  return () => {
    started = false;
    unsub();
  };
}

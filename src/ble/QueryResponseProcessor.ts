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

import { useGoProStore, createDefaultCameraState, CameraSpecificState } from '../store/GoProStore';
import { areSettingValuesEquivalent } from '../constants/GoProMetadata';
import { GoProSettingId, FOUR_BYTE_SETTING_IDS } from '../constants/GoProSettingIds';
import { debugLog, debugWarn } from '../utils/debugLogging';
import {
  isHero11FamilyOrMaxModel,
  isHero11Model,
  isMaxModel,
} from '../cameraModels/shared/modelNoHelpers';

export type QueryResponseResult = {
  changedSettingIds?: number[];
  capabilityBatch?: { id: number; values: number[] }[];
};

// ─────────────────────────────────────────────────────────────
// SystemBusy (status 8) Debounce
// Commits the value after 150ms to absorb short-term 1 -> 0 -> 1 jitter.
// ─────────────────────────────────────────────────────────────
const systemBusyDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const lastSystemBusyValues = new Map<string, boolean>();

const handleSystemBusyStatus = (value: boolean, deviceId: string) => {
  const lastVal = lastSystemBusyValues.get(deviceId);
  if (lastVal === value) return;
  lastSystemBusyValues.set(deviceId, value);

  const timer = systemBusyDebounceTimers.get(deviceId);
  if (timer) clearTimeout(timer);

  const newTimer = setTimeout(() => {
    if (lastSystemBusyValues.get(deviceId) === value) {
      useGoProStore.getState().updateDeviceState(deviceId, { systemBusy: value });
    }
    systemBusyDebounceTimers.delete(deviceId);
  }, 150);
  systemBusyDebounceTimers.set(deviceId, newTimer);
};

export const processQueryResponse = (
  payload: number[],
  deviceId: string,
): QueryResponseResult | void => {
  if (payload.length < 2) return;

  const head = payload[0];
  const status = payload[1];

  if (status !== 0) {
    if (head !== 0) {
      debugWarn('ble', `Query response error: Head ${head}, Status ${status}`);
    }
    return;
  }

  const dataStartPos = 2; // + status (always 2 since status is 0)
  const store = useGoProStore.getState();
  const changedSettingIds: number[] = [];

  // Settings Response (0x52, 0x92 or 0x12)
  if (head === 0x52 || head === 0x92 || head === 0x12) {
    const batch: { id: number; value: number }[] = [];
    let k = dataStartPos;
    while (k < payload.length) {
      if (k + 1 >= payload.length) break;
      const settingId = payload[k];
      const len = payload[k + 1];

      if (k + 2 + len > payload.length) break;
      const valueBytes = payload.slice(k + 2, k + 2 + len);

      let numericValue = -1;
      if (len === 1) numericValue = valueBytes[0];
      else if (len === 2) numericValue = (valueBytes[0] << 8) | valueBytes[1];
      else if (len === 4)
        numericValue =
          (valueBytes[0] << 24) | (valueBytes[1] << 16) | (valueBytes[2] << 8) | valueBytes[3];

      if (numericValue !== -1) {
        if (head === 0x92) {
          debugLog(
            'bleAsync',
            `[BLE ASYNC] Setting changed: ID=${settingId} (0x${settingId.toString(16).padStart(2, '0')}), value=${numericValue}`,
          );
        }
        batch.push({ id: settingId, value: numericValue });
        changedSettingIds.push(settingId);
        if (settingId === 31) {
          batch.push(
            { id: GoProSettingId.STAR_TRAIL_SHUTTER, value: numericValue },
            { id: GoProSettingId.LIGHT_PAINTING_SHUTTER, value: numericValue },
            { id: GoProSettingId.VEHICLE_LIGHTS_SHUTTER, value: numericValue },
          );
        }
        if (settingId === GoProSettingId.VIDEO_SHUTTER) {
          batch.push({ id: GoProSettingId.TIMELAPSE_VIDEO_SHUTTER, value: numericValue });
        }
      }

      k += 2 + len;
    }
    if (batch.length > 0) {
      store.batchUpdateSettingsForDevice(deviceId, batch);
      if (head === 0x92) {
        const freshStore = useGoProStore.getState();
        const cameraState = freshStore.cameraStates[deviceId] || createDefaultCameraState();
        for (const { id, value: actualValue } of batch) {
          const expectedValue = cameraState.pendingSettings[id];
          if (
            expectedValue !== undefined &&
            areSettingValuesEquivalent(id, actualValue, expectedValue, {
              modelKey: cameraState.cameraModel,
              modelNo: cameraState.hardwareInfo?.modelNo,
            })
          ) {
            store.clearPendingSettingForDevice(deviceId, id);
          }
        }
      }
    }
    return { changedSettingIds };
  }
  // Capabilities Response (0x32)
  else if (head === 0x32) {
    let k = dataStartPos;
    const newCaps: { [id: number]: Set<number> } = {};

    while (k < payload.length) {
      if (k + 1 >= payload.length) break;
      const settingId = payload[k];
      const len = payload[k + 1];

      if (k + 2 + len > payload.length) break;
      const valueBytes = payload.slice(k + 2, k + 2 + len);

      if (!newCaps[settingId]) newCaps[settingId] = new Set<number>();
      if (FOUR_BYTE_SETTING_IDS.has(settingId)) {
        for (let i = 0; i + 3 < valueBytes.length; i += 4) {
          const val =
            ((valueBytes[i] << 24) >>> 0) |
            (valueBytes[i + 1] << 16) |
            (valueBytes[i + 2] << 8) |
            valueBytes[i + 3];
          newCaps[settingId].add(val);
        }
      } else {
        for (let i = 0; i < valueBytes.length; i++) {
          newCaps[settingId].add(valueBytes[i]);
        }
      }

      k += 2 + len;
    }

    const batch = Object.keys(newCaps).map((id) => {
      const idNum = parseInt(id, 10);
      return { id: idNum, values: Array.from(newCaps[idNum]).sort((left, right) => left - right) };
    });
    if (batch.length > 0) {
      batch.forEach(({ id, values }) => {
        debugLog(
          'bleCache',
          `[BLE Cache] Capability response: ID=${id}, values=[${values.join(',')}]`,
        );
      });
      store.batchUpdateCapabilitiesForDevice(deviceId, batch);
    }
    return { capabilityBatch: batch };
  }
  // Status Response (0x53, 0x93 or 0x13)
  else if (head === 0x53 || head === 0x93 || head === 0x13) {
    let k = dataStartPos;
    const updates: Partial<CameraSpecificState> = {};
    const settingsUpdates: { id: number; value: number }[] = [];

    while (k < payload.length) {
      if (k + 1 >= payload.length) break;
      const statusId = payload[k];
      const len = payload[k + 1];

      if (k + 2 + len > payload.length) break;
      const valueBytes = payload.slice(k + 2, k + 2 + len);

      let numericValue = -1;
      if (len === 1) numericValue = valueBytes[0];
      else if (len === 2) numericValue = (valueBytes[0] << 8) | valueBytes[1];
      else if (len === 4)
        numericValue =
          ((valueBytes[0] << 24) >>> 0) +
          ((valueBytes[1] << 16) | (valueBytes[2] << 8) | valueBytes[3]);
      else if (len === 8) {
        numericValue = 0;
        for (let bi = 0; bi < 8; bi++) numericValue = numericValue * 256 + valueBytes[bi];
      }

      if (statusId === 1 && numericValue !== -1) updates.batteryPresent = numericValue === 1;
      else if (statusId === 2 && numericValue !== -1) updates.isCharging = numericValue === 4;
      else if (statusId === 6 && numericValue !== -1) updates.overheating = numericValue === 1;
      else if (statusId === 8 && numericValue !== -1)
        handleSystemBusyStatus(numericValue === 1, deviceId);
      else if (statusId === 10 && numericValue !== -1) updates.isEncoding = numericValue === 1;
      else if (statusId === 13 && numericValue !== -1) updates.recordingTimeSec = numericValue;
      else if (statusId === 19 && numericValue !== -1)
        updates.isCharging = numericValue === 1 || numericValue === 4;
      else if (statusId === 33 && numericValue !== -1) updates.sdCardStatus = numericValue;
      else if (statusId === 34 && numericValue !== -1) updates.remainingPhotos = numericValue;
      else if (statusId === 35 && numericValue !== -1) updates.remainingVideoSec = numericValue;
      else if (statusId === 54 && numericValue !== -1) updates.sdRemainingKB = numericValue;
      else if (statusId === 68 && numericValue !== -1) updates.gpsLockAcquired = numericValue === 1;
      else if (statusId === 70 && numericValue !== -1) updates.batteryLevel = numericValue;
      else if (statusId === 82 && numericValue !== -1) updates.isReady = numericValue === 1;
      else if (statusId === 101 && numericValue !== -1)
        updates.captureDelayActive = numericValue === 1;
      else if (statusId === 85 && numericValue !== -1) updates.cold = numericValue === 1;
      else if (statusId === 96 && numericValue !== -1) {
        settingsUpdates.push({ id: 92, value: numericValue });
        if (head === 0x93) store.clearPendingSettingForDevice(deviceId, 92);
      } else if (statusId === 97 && numericValue !== -1) {
        settingsUpdates.push({ id: 93, value: numericValue });
        if (head === 0x93) store.clearPendingSettingForDevice(deviceId, 93);
      } else if (statusId === 111 && numericValue !== -1)
        updates.sdWriteSpeedError = numericValue === 1;
      else if (statusId === 102 && numericValue !== -1) updates.mediaModMicStatus = numericValue;
      else if (statusId === 110 && numericValue !== -1) updates.mediaModStatus = numericValue;
      else if (statusId === 114 && numericValue !== -1) {
        const map: Record<number, 'idle' | 'camera' | 'external' | 'cofSetup'> = {
          0: 'idle',
          1: 'camera',
          2: 'external',
          3: 'cofSetup',
        };
        const mapped = map[numericValue];
        if (mapped) updates.cameraControlStatus = mapped;
      } else if (statusId === 117 && numericValue !== -1) updates.sdCapacityKB = numericValue;

      k += 2 + len;
    }

    if (Object.keys(updates).length > 0) {
      store.updateDeviceState(deviceId, updates);
    }
    if (settingsUpdates.length > 0) {
      store.batchUpdateSettingsForDevice(deviceId, settingsUpdates);
    }
  }
  // Scheduled Capture time response
  else if (head === 0xa8) {
    if (payload.length >= 4) {
      const hour = payload[2];
      const rawEncoded = payload[3];
      if (hour === 0 && rawEncoded === 0) {
        store.updateDeviceState(deviceId, { scheduledTime: null });
      } else {
        let minute = 0;
        if ((rawEncoded - 3) % 4 === 0) {
          minute = (rawEncoded - 3) / 4;
        } else if ((rawEncoded - 1) % 4 === 0) {
          minute = (rawEncoded - 1) / 4;
        }
        store.updateDeviceState(deviceId, { scheduledTime: { hour, minute } });
      }
    }
  }
};

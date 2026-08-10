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

/**
 * GoPro Store derived selectors.
 *
 * Pure functions to compute values that are not stored directly in the state
 * (derived from other fields). Imported by CommandQueue and UI components.
 *
 * Reference: docs/implementation-plans/camera-state-control-plan.md §4
 */

export type CommandCategory =
  | 'setting' // Camera setting (resolution, FPS, etc.): Locked during recording
  | 'systemSetting' // System setting (LCD brightness, etc.): Allowed during recording
  | 'shutter' // Shutter start/stop (recording)
  | 'preset' // Preset loading
  | 'control' // claimControl / releaseControl operations themselves
  | 'emergency'; // powerOff / keepAlive, etc.: Bypasses the queue

export interface GoProReadableState {
  isEncoding: boolean;
  isReady: boolean;
  systemBusy: boolean;
  cameraControlStatus: 'idle' | 'camera' | 'external' | 'cofSetup';
  settings: { [settingId: number]: number };
  dynamicShootingLockedIds: Set<number>;
}

const MODE_PRESET_GROUP_SETTING_ID = 92;
const VIDEO_PRESET_GROUP = 1000;
const HINDSIGHT_SETTING_ID = 167;
const HINDSIGHT_OFF = 4;

/**
 * Returns true if Hindsight setting (167) is anything other than Off (=4) AND the preset group is Video.
 * We must check the preset group because the 167 setting value might persist when switching to Photo or Timelapse,
 * and checking it without verifying the group would mistakenly lock non-Video presets.
 * For camera models without Hindsight support (e.g. Hero 9), settings[167] is undefined and this returns false.
 */
export const selectHindsightActive = (s: GoProReadableState): boolean => {
  if (s.settings[MODE_PRESET_GROUP_SETTING_ID] !== VIDEO_PRESET_GROUP) return false;
  const v = s.settings[HINDSIGHT_SETTING_ID];
  if (v === undefined) return false;
  return v !== HINDSIGHT_OFF;
};

/** Deemed as currently recording (setting changes rejected) - Encoding or Hindsight Active */
export const selectIsShootingLocked = (s: GoProReadableState): boolean =>
  s.isEncoding || selectHindsightActive(s);

/** Indicates the user is operating the camera body directly (app yields control) */
export const selectIsUserHoldingCamera = (s: GoProReadableState): boolean =>
  s.cameraControlStatus === 'camera';

/** Short-term busy state (commands wait in the queue) - SystemBusy or not Ready */
export const selectIsShortTermBusy = (s: GoProReadableState): boolean => !s.isReady || s.systemBusy;

/**
 * Determines whether a command of the specified category is currently writable.
 * - Lane C (userOnCamera): Deprecated. GoPro accepts BLE commands even during manual body operation.
 * - Lane B (shootingLocked): Only systemSetting, shutter, and control commands are permitted.
 * - Lane A (shortTermBusy): Treated as true since commands will queue up.
 */
export const selectCanWrite = (s: GoProReadableState, category: CommandCategory): boolean => {
  if (category === 'emergency') return true;
  if (selectIsShootingLocked(s)) {
    return category === 'systemSetting' || category === 'shutter' || category === 'control';
  }
  return true;
};

/**
 * Determines whether the specified setting ID is currently operable (for UI presentation).
 * System settings are operable even during recording. Also accounts for dynamically learned locked IDs.
 */
export const selectIsSettingOperable = (
  s: GoProReadableState,
  settingId: number,
  isSystemSetting: boolean,
): boolean => {
  if (selectIsShootingLocked(s)) {
    if (isSystemSetting) return true;
    return false;
  }
  if (s.dynamicShootingLockedIds.has(settingId)) return false;
  return true;
};

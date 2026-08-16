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
 * Capability refresh triggers and dependency graph.
 *
 * - CAPABILITY_REFRESH_TRIGGER_IDS: Settings whose change triggers a capability re-fetch
 * - CAPABILITY_REFRESH_DEPENDENCIES: Map of settingId -> list of dependent settingIds to re-fetch
 * - RESTORE_PRIORITY_ORDER: Priority order for bulk preset restoration
 * - PRESET_REFRESH_TRIGGER_IDS: Settings whose change may alter the preset list
 * - DASHBOARD_SUB_SETTING_IDS: Dashboard override sub-settings
 * - PRESET_RESTORE_SYSTEM_SETTING_IDS: System settings evaluated during preset restoration
 *
 * NOTE: All constants are lazy-initialized to avoid circular-dependency issues
 * with GoProSettingIds.ts (which re-exports these constants).
 */

import { GoProSettingId } from '../GoProSettingId';

// ---------------------------------------------------------------------------
// Lazy initialization — break circular dependency with GoProSettingIds
// ---------------------------------------------------------------------------

let _CAPABILITY_REFRESH_TRIGGER_IDS: readonly number[] | undefined;
let _CAPABILITY_REFRESH_DEPENDENCIES: Readonly<Record<number, readonly number[]>> | undefined;
let _RESTORE_PRIORITY_ORDER: readonly number[] | undefined;
let _PRESET_REFRESH_TRIGGER_IDS: readonly number[] | undefined;
let _DASHBOARD_SUB_SETTING_IDS: readonly number[] | undefined;
let _CAMERA_ADVANCED_SETTING_IDS: readonly number[] | undefined;
let _PRESET_RESTORE_SYSTEM_SETTING_IDS: readonly number[] | undefined;

function init() {
  if (_CAPABILITY_REFRESH_TRIGGER_IDS) return;
  const S = GoProSettingId;

  _CAPABILITY_REFRESH_TRIGGER_IDS = [
    S.MEDIA_FORMAT,
    S.LAPSE_MODE,
    S.MEDIA_MOD,
    S.MEDIA_MOD_MIC,
    S.MODE_PRESET_GROUP,
    S.MODE_PRESET,
    S.VIDEO_PROFILE,
    S.VIDEO_BITRATE,
    S.BIT_DEPTH,
    S.TEN_BIT_COLOR_HERO11,
    S.VIDEO_LENS,
    S.PHOTO_LENS,
    S.VIDEO_FRAMING,
    S.RESOLUTION,
    S.FPS,
    S.ANTI_FLICKER,
    S.VIDEO_ISO_MIN,
    S.VIDEO_ISO_MAX,
    S.DASHBOARD_OVERRIDE,
  ] as const;

  _CAPABILITY_REFRESH_DEPENDENCIES = {
    [S.MEDIA_FORMAT]: [
      S.RESOLUTION,
      S.FPS,
      S.TIME_LAPSE_LENS,
      S.VIDEO_LENS_HERO13,
      S.PHOTO_LENS,
      S.PHOTO_OUTPUT,
      S.TIMELAPSE_PHOTO_OUTPUT,
      S.MULTI_SHOT_FRAMING,
      S.NIGHTLAPSE_PHOTO_SHUTTER,
      S.MULTI_SHOT_ISO_MIN,
      S.MULTI_SHOT_ISO_MAX,
      S.VIDEO_SHUTTER,
      S.VIDEO_ISO_MIN,
      S.VIDEO_ISO_MAX,
    ],
    [S.LAPSE_MODE]: [
      S.RESOLUTION,
      S.FPS,
      S.TIME_LAPSE_LENS,
      S.VIDEO_LENS_HERO13,
      S.PHOTO_LENS,
      S.PHOTO_OUTPUT,
      S.TIMELAPSE_PHOTO_OUTPUT,
      S.MULTI_SHOT_FRAMING,
      S.STAR_TRAILS_LENGTH,
      S.NIGHTLAPSE_PHOTO_SHUTTER,
      S.MULTI_SHOT_ISO_MIN,
      S.MULTI_SHOT_ISO_MAX,
    ],
    [S.MEDIA_MOD]: [S.MEDIA_MOD_MIC],
    [S.MEDIA_MOD_MIC]: [S.MEDIA_MOD_MIC],
    [S.VIDEO_FRAMING]: [S.RESOLUTION, S.FPS, S.HYPERSMOOTH],
    [S.VIDEO_LENS]: [S.RESOLUTION, S.FPS, S.HYPERSMOOTH],
    [S.VIDEO_LENS_HERO13]: [S.RESOLUTION, S.FPS, S.HYPERSMOOTH],
    [S.PHOTO_LENS]: [S.PHOTO_OUTPUT],
    [S.VIDEO_PROFILE]: [S.RESOLUTION, S.FPS, S.VIDEO_BITRATE, S.HYPERSMOOTH],
    [S.BIT_DEPTH]: [S.VIDEO_BITRATE],
    [S.VIDEO_BITRATE]: [S.BIT_DEPTH],
    [S.TEN_BIT_COLOR_HERO11]: [S.VIDEO_BITRATE],
    [S.RESOLUTION]: [
      S.RESOLUTION,
      S.FPS,
      S.VIDEO_LENS,
      S.VIDEO_LENS_HERO13,
      S.HYPERSMOOTH,
      S.VIDEO_SHUTTER,
      S.VIDEO_BITRATE,
    ],
    [S.FPS]: [
      S.RESOLUTION,
      S.FPS,
      S.VIDEO_LENS,
      S.VIDEO_LENS_HERO13,
      S.HYPERSMOOTH,
      S.VIDEO_SHUTTER,
      S.VIDEO_BITRATE,
    ],
    [S.ANTI_FLICKER]: [
      S.VIDEO_SHUTTER,
      S.PHOTO_SHUTTER,
      S.NIGHT_PHOTO_SHUTTER,
      S.NIGHTLAPSE_PHOTO_SHUTTER,
    ],
    [S.VIDEO_ISO_MIN]: [S.VIDEO_ISO_MAX],
    [S.VIDEO_ISO_MAX]: [S.VIDEO_ISO_MIN],
    [S.PHOTO_ISO_MIN]: [S.PHOTO_ISO_MAX],
    [S.PHOTO_ISO_MAX]: [S.PHOTO_ISO_MIN],
    [S.MULTI_SHOT_ISO_MIN]: [S.MULTI_SHOT_ISO_MAX],
    [S.MULTI_SHOT_ISO_MAX]: [S.MULTI_SHOT_ISO_MIN],
    [S.MODE_PRESET]: [
      S.RESOLUTION,
      S.FPS,
      S.VIDEO_LENS,
      S.VIDEO_LENS_HERO13,
      S.PHOTO_LENS,
      S.TIME_LAPSE_LENS,
      S.MULTI_SHOT_LENS,
      S.VIDEO_PROFILE,
      S.VIDEO_BITRATE,
      S.BIT_DEPTH,
      S.HYPERSMOOTH,
      S.VIDEO_SHUTTER,
      S.PHOTO_SHUTTER,
      S.NIGHT_PHOTO_SHUTTER,
      S.NIGHTLAPSE_PHOTO_SHUTTER,
      S.PHOTO_ISO_MIN,
      S.PHOTO_ISO_MAX,
      S.MULTI_SHOT_ISO_MIN,
      S.MULTI_SHOT_ISO_MAX,
      S.STAR_TRAILS_LENGTH,
      S.PHOTO_OUTPUT,
      S.TIMELAPSE_PHOTO_OUTPUT,
      S.VIDEO_FRAMING,
      S.MULTI_SHOT_FRAMING,
      S.MEDIA_FORMAT,
      S.LAPSE_MODE,
    ],
    [S.MODE_PRESET_GROUP]: [
      S.RESOLUTION,
      S.FPS,
      S.VIDEO_LENS,
      S.VIDEO_LENS_HERO13,
      S.PHOTO_LENS,
      S.TIME_LAPSE_LENS,
      S.MULTI_SHOT_LENS,
      S.VIDEO_PROFILE,
      S.VIDEO_BITRATE,
      S.BIT_DEPTH,
      S.HYPERSMOOTH,
      S.VIDEO_SHUTTER,
      S.PHOTO_SHUTTER,
      S.NIGHT_PHOTO_SHUTTER,
      S.NIGHTLAPSE_PHOTO_SHUTTER,
      S.PHOTO_ISO_MIN,
      S.PHOTO_ISO_MAX,
      S.MULTI_SHOT_ISO_MIN,
      S.MULTI_SHOT_ISO_MAX,
      S.PHOTO_OUTPUT,
      S.TIMELAPSE_PHOTO_OUTPUT,
      S.VIDEO_FRAMING,
      S.MULTI_SHOT_FRAMING,
      S.MEDIA_FORMAT,
      S.LAPSE_MODE,
    ],
    [S.DASHBOARD_OVERRIDE]: [
      S.LED,
      S.SCREEN_SAVER,
      S.SCREEN_SAVER_FRONT,
      S.VOICE_CONTROL,
      S.BEEPS,
      S.BEEP_VOLUME,
      S.ENABLE_BEEP,
      S.ORIENTATION,
      S.SCREEN_LOCK,
      S.FRONT_LCD_MODE,
      S.VOICE_LANGUAGE,
      S.VOICE_LANGUAGE_LEGACY,
    ],
  } as const;

  _RESTORE_PRIORITY_ORDER = [
    S.CONTROL_MODE,
    S.SYSTEM_VIDEO_MODE,
    S.VIDEO_PERFORMANCE_MODE,
    S.MAX_LENS_MOD,
    S.MAX_LENS_MOD_HERO13,
    S.MAX_LENS_MOD_ENABLE,
    S.LENS_ATTACHMENT,
    S.ANTI_FLICKER,
    S.MODE_PRESET_GROUP,
    S.MODE_PRESET,
    S.MEDIA_MOD_MIC,
    S.VIDEO_PROFILE,
    S.VIDEO_FRAMING,
    S.RESOLUTION,
    S.FPS,
    S.VIDEO_LENS,
    S.PHOTO_LENS,
    S.TIME_LAPSE_LENS,
  ] as const;

  _PRESET_REFRESH_TRIGGER_IDS = [
    S.CONTROL_MODE,
    S.SYSTEM_VIDEO_MODE,
    S.VIDEO_PERFORMANCE_MODE,
    S.MAX_LENS_MOD,
    S.MAX_LENS_MOD_HERO13,
    S.LENS_ATTACHMENT,
    S.MAX_LENS_MOD_ENABLE,
  ] as const;

  _DASHBOARD_SUB_SETTING_IDS = [
    S.DASHBOARD_VOICE_CONTROL,
    S.DASHBOARD_SCREEN_SAVER,
    S.DASHBOARD_BEEPS,
    S.DASHBOARD_ORIENTATION,
    S.DASHBOARD_FRONT_DISPLAY,
    S.DASHBOARD_SCREEN_LOCK,
    S.DASHBOARD_LED,
  ] as const;

  _CAMERA_ADVANCED_SETTING_IDS = [
    S.CONTROL_MODE,
    S.SYSTEM_VIDEO_MODE,
    S.AUTO_OFF,
    S.QUICK_CAPTURE,
    S.DEFAULT_PRESET,
    S.DEFAULT_PRESET_MAX,
    S.LED,
    S.BEEPS,
    S.ENABLE_BEEP,
    S.BEEP_VOLUME,
    S.VOICE_CONTROL,
    S.VOICE_LANGUAGE,
    S.VOICE_LANGUAGE_LEGACY,
    S.LCD_BRIGHTNESS,
    S.SCREEN_SAVER,
    S.SCREEN_SAVER_REAR,
    S.SCREEN_SAVER_MAX,
    S.SCREEN_SAVER_FRONT,
    S.FRONT_LCD_MODE,
    S.SCREEN_LOCK,
    S.ORIENTATION,
    S.GPS,
    S.LANGUAGE,
    S.MAX_LENS_MOD_HERO13,
    S.MAX_LENS_MOD,
    S.MAX_LENS_MOD_ENABLE,
    S.LENS_ATTACHMENT,
    S.MEDIA_MOD,
    S.VIDEO_PERFORMANCE_MODE,
    S.VIDEO_COMPRESSION,
    S.ANTI_FLICKER,
    S.QUICK_CAPTURE_DEFAULT,
  ] as const;

  _PRESET_RESTORE_SYSTEM_SETTING_IDS = [
    ..._CAMERA_ADVANCED_SETTING_IDS,
    S.MEDIA_MOD_MIC,
  ] as const;
}

// ---------------------------------------------------------------------------
// Public exports — lazy getters via Proxy
// ---------------------------------------------------------------------------

function createLazyArray<T extends readonly unknown[]>(getter: () => T): T {
  return new Proxy([] as unknown as T, {
    get(_, prop) {
      init();
      const target = getter();
      const value = (target as Record<string | symbol, unknown>)[prop];
      return typeof value === 'function' ? (value as Function).bind(target) : value;
    },
  });
}

function createLazyRecord<T extends Record<string, unknown>>(getter: () => T): T {
  return new Proxy({} as T, {
    get(_, prop) {
      init();
      const target = getter();
      return (target as Record<string | symbol, unknown>)[prop];
    },
    ownKeys() {
      init();
      return Reflect.ownKeys(getter());
    },
    getOwnPropertyDescriptor(_, prop) {
      init();
      return Reflect.getOwnPropertyDescriptor(getter(), prop);
    },
    has(_, prop) {
      init();
      return Reflect.has(getter(), prop);
    },
  });
}

export const CAPABILITY_REFRESH_TRIGGER_IDS = createLazyArray<readonly number[]>(() => _CAPABILITY_REFRESH_TRIGGER_IDS!);
export const CAPABILITY_REFRESH_DEPENDENCIES = createLazyRecord(() => _CAPABILITY_REFRESH_DEPENDENCIES!);
export const RESTORE_PRIORITY_ORDER = createLazyArray<readonly number[]>(() => _RESTORE_PRIORITY_ORDER!);
export const PRESET_REFRESH_TRIGGER_IDS = createLazyArray<readonly number[]>(() => _PRESET_REFRESH_TRIGGER_IDS!);
export const DASHBOARD_SUB_SETTING_IDS = createLazyArray<readonly number[]>(() => _DASHBOARD_SUB_SETTING_IDS!);
export const CAMERA_ADVANCED_SETTING_IDS = createLazyArray<readonly number[]>(() => _CAMERA_ADVANCED_SETTING_IDS!);
export const PRESET_RESTORE_SYSTEM_SETTING_IDS = createLazyArray<readonly number[]>(() => _PRESET_RESTORE_SYSTEM_SETTING_IDS!);

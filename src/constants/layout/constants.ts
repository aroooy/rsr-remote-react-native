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

import { GoProSettingId } from '../GoProSettingId';
import { CameraModelKey } from '../ResolutionAspectMap';
import { GoProPresetGroup } from '../GoProPresetGroup';
import {
  EASY_ANAMORPHIC_NIGHT_PHOTO_PRESET_HERO13,
  EASY_ANAMORPHIC_SUPER_PHOTO_PRESET_HERO13,
  EASY_ANAMORPHIC_TIMEWARP_PRESET_HERO13,
  EASY_MACRO_NIGHTLAPSE_PRESET_HERO13,
  EASY_MACRO_NIGHT_PHOTO_PRESET_HERO13,
  EASY_MACRO_PHOTO_PRESET_HERO13,
  EASY_MACRO_TIMELAPSE_PRESET_HERO13,
} from '../hero13PresetIds';
import {
  PRESET_ACTIVITY,
  PRESET_ANAMORPHIC_NIGHT_PHOTO,
  PRESET_BURST,
  PRESET_EASY_BASIC_QUALITY,
  PRESET_EASY_ANAMORPHIC_VIDEO,
  PRESET_EASY_EB_VIDEO,
  PRESET_EASY_HIGHEST_QUALITY,
  PRESET_EASY_LB_VIDEO,
  PRESET_EASY_MACRO_VIDEO,
  PRESET_EASY_MAX_LIGHT_PAINTING,
  PRESET_EASY_MAX_PHOTO,
  PRESET_EASY_MAX_PHOTO_1,
  PRESET_EASY_MAX_STAR_TRAILS,
  PRESET_EASY_MAX_TIMEWARP,
  PRESET_EASY_MAX_VEHICLE_LIGHTS,
  PRESET_EASY_MAX_VIDEO_1,
  PRESET_EASY_MAX_VIDEO,
  PRESET_ANAMORPHIC_TIMEWARP,
  PRESET_EASY_STANDARD_QUALITY,
  PRESET_HERO11_EB_ACTIVITY_VIDEO,
  PRESET_HERO11_EB_CINEMATIC_VIDEO,
  PRESET_HERO11_EB_SLO_MO_VIDEO,
  PRESET_HERO11_EB_STANDARD_VIDEO,
  PRESET_HERO11_LB_ACTIVITY_VIDEO,
  PRESET_HERO11_LB_CINEMATIC_VIDEO,
  PRESET_HERO11_LB_SLO_MO_VIDEO,
  PRESET_HERO11_LB_STANDARD_VIDEO,
  PRESET_LEGACY_EASY_BURST_PHOTO,
  PRESET_LEGACY_EASY_LIGHT_PAINTING,
  PRESET_LEGACY_EASY_NIGHT_PHOTO,
  PRESET_LEGACY_EASY_PHOTO,
  PRESET_LEGACY_EASY_STAR_TRAILS,
  PRESET_LEGACY_EASY_TIMEWARP,
  PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
  PRESET_LIGHT_PAINTING,
  PRESET_LIVE_BURST,
  PRESET_MACRO_NIGHTLAPSE,
  PRESET_MACRO_NIGHT_PHOTO,
  PRESET_MACRO_PHOTO,
  PRESET_MACRO_TIMELAPSE,
  PRESET_MACRO_VIDEO,
  PRESET_MAX_LIGHT_PAINTING_2,
  PRESET_MAX_NIGHTLAPSE,
  PRESET_MAX_PHOTO,
  PRESET_MAX_PHOTO_2,
  PRESET_MAX_STAR_TRAILS_2,
  PRESET_MAX_TIMELAPSE,
  PRESET_MAX_TIMEWARP,
  PRESET_MAX_TIMEWARP_2,
  PRESET_MAX_VEHICLE_LIGHTS_2,
  PRESET_MAX_VIDEO,
  PRESET_MAX_VIDEO_2,
  PRESET_NIGHTLAPSE,
  PRESET_NIGHT_PHOTO,
  PRESET_PHOTO,
  PRESET_STANDARD,
  PRESET_STAR_TRAILS,
  PRESET_TIMELAPSE,
  PRESET_TIMEWARP,
  PRESET_VEHICLE_LIGHTS,
} from '../presetIds';
import type { GoProDisplayLayout } from './types';

// ── Video Presets ────────────────────────────────────────────────────────────────

export const GoProVideoPreset = {
  STANDARD: PRESET_STANDARD,
  ACTIVITY: PRESET_ACTIVITY,
  MAX_VIDEO_2_0: PRESET_MAX_VIDEO_2,
  MACRO_VIDEO: PRESET_MACRO_VIDEO,
} as const;

// ── Fallback Presets By Model ────────────────────────────────────────────────────

type FallbackPresetsByGroup = Readonly<Record<number, readonly number[]>>;

export const fallbackPresetsByModel: Readonly<
  Partial<Record<CameraModelKey, FallbackPresetsByGroup>>
> = {
  hero13: {
    [GoProPresetGroup.VIDEO]: [
      PRESET_STANDARD,
      PRESET_ACTIVITY,
      GoProVideoPreset.MAX_VIDEO_2_0,
      PRESET_MACRO_VIDEO,
    ],
    [GoProPresetGroup.PHOTO]: [
      PRESET_PHOTO,
      PRESET_BURST,
      PRESET_NIGHT_PHOTO,
      PRESET_MAX_PHOTO_2,
      PRESET_MACRO_PHOTO,
      PRESET_MACRO_NIGHT_PHOTO,
    ],
    [GoProPresetGroup.TIMELAPSE]: [
      PRESET_TIMEWARP,
      PRESET_STAR_TRAILS,
      PRESET_LIGHT_PAINTING,
      PRESET_VEHICLE_LIGHTS,
      PRESET_TIMELAPSE,
      PRESET_NIGHTLAPSE,
      PRESET_MACRO_TIMELAPSE,
      PRESET_MACRO_NIGHTLAPSE,
    ],
  },
  hero12: {
    [GoProPresetGroup.VIDEO]: [PRESET_STANDARD],
    [GoProPresetGroup.PHOTO]: [PRESET_PHOTO, PRESET_BURST, PRESET_NIGHT_PHOTO],
    [GoProPresetGroup.TIMELAPSE]: [
      PRESET_TIMEWARP,
      PRESET_STAR_TRAILS,
      PRESET_LIGHT_PAINTING,
      PRESET_VEHICLE_LIGHTS,
      PRESET_TIMELAPSE,
      PRESET_NIGHTLAPSE,
    ],
  },
  hero11: {
    [GoProPresetGroup.VIDEO]: [PRESET_STANDARD, 3, PRESET_ACTIVITY, 2, 4],
    [GoProPresetGroup.PHOTO]: [PRESET_PHOTO, PRESET_BURST, PRESET_NIGHT_PHOTO],
    [GoProPresetGroup.TIMELAPSE]: [
      PRESET_TIMEWARP,
      PRESET_STAR_TRAILS,
      PRESET_LIGHT_PAINTING,
      PRESET_VEHICLE_LIGHTS,
      PRESET_TIMELAPSE,
      PRESET_NIGHTLAPSE,
    ],
  },
  heromi11: {
    [GoProPresetGroup.VIDEO]: [
      PRESET_STANDARD,
      PRESET_TIMEWARP,
      PRESET_STAR_TRAILS,
      PRESET_LIGHT_PAINTING,
      PRESET_VEHICLE_LIGHTS,
      PRESET_TIMELAPSE,
      PRESET_NIGHTLAPSE,
    ],
    [GoProPresetGroup.TIMELAPSE]: [
      PRESET_STANDARD,
      PRESET_TIMEWARP,
      PRESET_STAR_TRAILS,
      PRESET_LIGHT_PAINTING,
      PRESET_VEHICLE_LIGHTS,
      PRESET_TIMELAPSE,
      PRESET_NIGHTLAPSE,
    ],
  },
  hero10: {
    [GoProPresetGroup.VIDEO]: [PRESET_STANDARD, PRESET_ACTIVITY, 2, 4, 5],
    [GoProPresetGroup.PHOTO]: [PRESET_PHOTO, PRESET_LIVE_BURST, PRESET_BURST, PRESET_NIGHT_PHOTO],
    [GoProPresetGroup.TIMELAPSE]: [PRESET_TIMEWARP, PRESET_TIMELAPSE, PRESET_NIGHTLAPSE],
  },
  hero09: {
    [GoProPresetGroup.VIDEO]: [PRESET_STANDARD, PRESET_ACTIVITY, 2, 3],
    [GoProPresetGroup.PHOTO]: [PRESET_PHOTO, PRESET_LIVE_BURST, PRESET_BURST, PRESET_NIGHT_PHOTO],
    [GoProPresetGroup.TIMELAPSE]: [PRESET_TIMEWARP, PRESET_TIMELAPSE, PRESET_NIGHTLAPSE],
  },
  max: {
    [GoProPresetGroup.VIDEO]: [PRESET_STANDARD, PRESET_MAX_VIDEO],
    [GoProPresetGroup.PHOTO]: [PRESET_PHOTO, PRESET_LIVE_BURST, PRESET_MAX_PHOTO],
    [GoProPresetGroup.TIMELAPSE]: [
      PRESET_TIMELAPSE,
      PRESET_MAX_TIMELAPSE,
      PRESET_TIMEWARP,
      PRESET_MAX_TIMEWARP,
    ],
  },
};

// ── Easy Video Presets ───────────────────────────────────────────────────────────

export const EASY_VIDEO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_EASY_HIGHEST_QUALITY,
  PRESET_EASY_STANDARD_QUALITY,
  PRESET_EASY_BASIC_QUALITY,
  PRESET_EASY_EB_VIDEO,
  PRESET_EASY_LB_VIDEO,
  PRESET_EASY_ANAMORPHIC_VIDEO,
  PRESET_EASY_MAX_VIDEO_1,
  PRESET_EASY_MAX_VIDEO,
  PRESET_EASY_MACRO_VIDEO,
]);

// ── Hero11 EB/LB Video Presets ───────────────────────────────────────────────────

export const HERO11_EB_VIDEO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_HERO11_EB_STANDARD_VIDEO,
  PRESET_HERO11_EB_ACTIVITY_VIDEO,
  PRESET_HERO11_EB_CINEMATIC_VIDEO,
  PRESET_HERO11_EB_SLO_MO_VIDEO,
]);

export const HERO11_LB_VIDEO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_HERO11_LB_STANDARD_VIDEO,
  PRESET_HERO11_LB_ACTIVITY_VIDEO,
  PRESET_HERO11_LB_CINEMATIC_VIDEO,
  PRESET_HERO11_LB_SLO_MO_VIDEO,
]);

export const HERO11_NO_87_VIDEO_PRESETS = HERO11_EB_VIDEO_PRESETS;

// ── Hero13 Easy Preset Groups & IDs ──────────────────────────────────────────────

export const HERO13_EASY_NORMAL_PRESET_GROUPS: Readonly<Record<number, readonly number[]>> = {
  [GoProPresetGroup.VIDEO]: [PRESET_EASY_HIGHEST_QUALITY, PRESET_EASY_STANDARD_QUALITY],
  [GoProPresetGroup.PHOTO]: [
    PRESET_LEGACY_EASY_PHOTO,
    PRESET_LEGACY_EASY_NIGHT_PHOTO,
    PRESET_LEGACY_EASY_BURST_PHOTO,
  ],
  [GoProPresetGroup.TIMELAPSE]: [
    PRESET_LEGACY_EASY_TIMEWARP,
    PRESET_LEGACY_EASY_STAR_TRAILS,
    PRESET_LEGACY_EASY_LIGHT_PAINTING,
    PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
  ],
};

export const HERO13_EASY_NORMAL_PRESET_IDS: ReadonlySet<number> = new Set([
  PRESET_EASY_HIGHEST_QUALITY,
  PRESET_EASY_STANDARD_QUALITY,
  PRESET_LEGACY_EASY_PHOTO,
  PRESET_LEGACY_EASY_NIGHT_PHOTO,
  PRESET_LEGACY_EASY_BURST_PHOTO,
  PRESET_LEGACY_EASY_TIMEWARP,
  PRESET_LEGACY_EASY_STAR_TRAILS,
  PRESET_LEGACY_EASY_LIGHT_PAINTING,
  PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
]);

export const HERO13_EASY_MAXLENS2_PRESET_GROUPS: Readonly<Record<number, readonly number[]>> = {
  [GoProPresetGroup.VIDEO]: [PRESET_EASY_MAX_VIDEO],
  [GoProPresetGroup.PHOTO]: [PRESET_EASY_MAX_PHOTO],
  [GoProPresetGroup.TIMELAPSE]: [
    PRESET_EASY_MAX_TIMEWARP,
    PRESET_EASY_MAX_STAR_TRAILS,
    PRESET_EASY_MAX_LIGHT_PAINTING,
    PRESET_EASY_MAX_VEHICLE_LIGHTS,
  ],
};

export const HERO13_EASY_MAXLENS2_PRESET_IDS: ReadonlySet<number> = new Set([
  PRESET_EASY_MAX_VIDEO,
  PRESET_EASY_MAX_PHOTO,
  PRESET_EASY_MAX_TIMEWARP,
  PRESET_EASY_MAX_STAR_TRAILS,
  PRESET_EASY_MAX_LIGHT_PAINTING,
  PRESET_EASY_MAX_VEHICLE_LIGHTS,
]);

export const HERO13_EASY_ANAMORPHIC_PRESET_GROUPS: Readonly<Record<number, readonly number[]>> = {
  [GoProPresetGroup.VIDEO]: [PRESET_EASY_ANAMORPHIC_VIDEO],
  [GoProPresetGroup.PHOTO]: [
    EASY_ANAMORPHIC_SUPER_PHOTO_PRESET_HERO13,
    EASY_ANAMORPHIC_NIGHT_PHOTO_PRESET_HERO13,
  ],
  [GoProPresetGroup.TIMELAPSE]: [EASY_ANAMORPHIC_TIMEWARP_PRESET_HERO13],
};

export const HERO13_EASY_ANAMORPHIC_PRESET_IDS: ReadonlySet<number> = new Set([
  PRESET_EASY_ANAMORPHIC_VIDEO,
  EASY_ANAMORPHIC_SUPER_PHOTO_PRESET_HERO13,
  EASY_ANAMORPHIC_NIGHT_PHOTO_PRESET_HERO13,
  EASY_ANAMORPHIC_TIMEWARP_PRESET_HERO13,
]);

export const HERO13_EASY_MACRO_PRESET_GROUPS: Readonly<Record<number, readonly number[]>> = {
  [GoProPresetGroup.VIDEO]: [PRESET_MACRO_VIDEO],
  [GoProPresetGroup.PHOTO]: [EASY_MACRO_PHOTO_PRESET_HERO13, EASY_MACRO_NIGHT_PHOTO_PRESET_HERO13],
  [GoProPresetGroup.TIMELAPSE]: [
    EASY_MACRO_TIMELAPSE_PRESET_HERO13,
    EASY_MACRO_NIGHTLAPSE_PRESET_HERO13,
  ],
};

export const HERO13_EASY_MACRO_PRESET_IDS: ReadonlySet<number> = new Set([
  PRESET_MACRO_VIDEO,
  EASY_MACRO_PHOTO_PRESET_HERO13,
  EASY_MACRO_NIGHT_PHOTO_PRESET_HERO13,
  EASY_MACRO_TIMELAPSE_PRESET_HERO13,
  EASY_MACRO_NIGHTLAPSE_PRESET_HERO13,
]);

// ── Hero12 Easy Preset Groups & IDs ──────────────────────────────────────────────

export const HERO12_EASY_NORMAL_PRESET_GROUPS: Readonly<Record<number, readonly number[]>> = {
  [GoProPresetGroup.VIDEO]: [
    PRESET_EASY_HIGHEST_QUALITY,
    PRESET_EASY_STANDARD_QUALITY,
    PRESET_EASY_BASIC_QUALITY,
  ],
  [GoProPresetGroup.PHOTO]: [PRESET_LEGACY_EASY_PHOTO, PRESET_LEGACY_EASY_NIGHT_PHOTO],
  [GoProPresetGroup.TIMELAPSE]: [
    PRESET_LEGACY_EASY_TIMEWARP,
    PRESET_LEGACY_EASY_STAR_TRAILS,
    PRESET_LEGACY_EASY_LIGHT_PAINTING,
    PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
  ],
};

export const HERO12_EASY_NORMAL_PRESET_IDS: ReadonlySet<number> = new Set([
  PRESET_EASY_HIGHEST_QUALITY,
  PRESET_EASY_STANDARD_QUALITY,
  PRESET_EASY_BASIC_QUALITY,
  PRESET_LEGACY_EASY_PHOTO,
  PRESET_LEGACY_EASY_NIGHT_PHOTO,
  PRESET_LEGACY_EASY_TIMEWARP,
  PRESET_LEGACY_EASY_STAR_TRAILS,
  PRESET_LEGACY_EASY_LIGHT_PAINTING,
  PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
]);

export const HERO12_EASY_MAXLENS2_PRESET_GROUPS: Readonly<Record<number, readonly number[]>> = {
  [GoProPresetGroup.VIDEO]: [PRESET_EASY_MAX_VIDEO],
  [GoProPresetGroup.PHOTO]: [PRESET_EASY_MAX_PHOTO],
  [GoProPresetGroup.TIMELAPSE]: [
    PRESET_EASY_MAX_TIMEWARP,
    PRESET_EASY_MAX_STAR_TRAILS,
    PRESET_EASY_MAX_LIGHT_PAINTING,
    PRESET_EASY_MAX_VEHICLE_LIGHTS,
  ],
};

export const HERO12_EASY_MAXLENS2_PRESET_IDS: ReadonlySet<number> = new Set([
  PRESET_EASY_MAX_VIDEO,
  PRESET_EASY_MAX_PHOTO,
  PRESET_EASY_MAX_TIMEWARP,
  PRESET_EASY_MAX_STAR_TRAILS,
  PRESET_EASY_MAX_LIGHT_PAINTING,
  PRESET_EASY_MAX_VEHICLE_LIGHTS,
]);

export const HERO12_NO_ASPECT_EASY_VIDEO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_EASY_HIGHEST_QUALITY,
  PRESET_EASY_STANDARD_QUALITY,
  PRESET_EASY_BASIC_QUALITY,
  PRESET_EASY_MAX_VIDEO_1,
]);

// ── Four Byte Setting IDs ────────────────────────────────────────────────────────

export const FOUR_BYTE_SETTING_IDS: ReadonlySet<number> = new Set([30, 31, 32, 127, 141]);

// ── Macro Preset IDs ─────────────────────────────────────────────────────────────

export const MACRO_VIDEO_PRESET_HERO13 = PRESET_MACRO_VIDEO;
export {
  EASY_MACRO_PHOTO_PRESET_HERO13,
  EASY_MACRO_NIGHT_PHOTO_PRESET_HERO13,
  EASY_MACRO_TIMELAPSE_PRESET_HERO13,
  EASY_MACRO_NIGHTLAPSE_PRESET_HERO13,
};

// ── Burst Like Photo Presets ─────────────────────────────────────────────────────

export const BURST_LIKE_PHOTO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_BURST,
  PRESET_LEGACY_EASY_BURST_PHOTO,
]);

export const HERO11_EASY_PHOTO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_LEGACY_EASY_PHOTO,
  PRESET_LEGACY_EASY_NIGHT_PHOTO,
]);

export const HERO11_EASY_TIMELAPSE_PRESETS: ReadonlySet<number> = new Set([
  PRESET_LEGACY_EASY_TIMEWARP,
]);

// ── Timelapse Category ───────────────────────────────────────────────────────────

export type TimelapseCategory = 'lapse_with_photo' | 'trail_like' | 'timewarp_like';

export const LAPSE_WITH_PHOTO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_TIMELAPSE,
  PRESET_NIGHTLAPSE,
  PRESET_MACRO_TIMELAPSE,
  PRESET_MACRO_NIGHTLAPSE,
  EASY_MACRO_TIMELAPSE_PRESET_HERO13,
  EASY_MACRO_NIGHTLAPSE_PRESET_HERO13,
  PRESET_MAX_TIMELAPSE,
]);

const TRAIL_LIKE_PRESETS: ReadonlySet<number> = new Set([
  PRESET_STAR_TRAILS,
  PRESET_LIGHT_PAINTING,
  PRESET_VEHICLE_LIGHTS,
  PRESET_LEGACY_EASY_STAR_TRAILS,
  PRESET_LEGACY_EASY_LIGHT_PAINTING,
  PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
  PRESET_MAX_STAR_TRAILS_2,
  PRESET_MAX_LIGHT_PAINTING_2,
  PRESET_MAX_VEHICLE_LIGHTS_2,
  PRESET_EASY_MAX_STAR_TRAILS,
  PRESET_EASY_MAX_LIGHT_PAINTING,
  PRESET_EASY_MAX_VEHICLE_LIGHTS,
]);

const TIMEWARP_LIKE_PRESETS: ReadonlySet<number> = new Set([
  PRESET_TIMEWARP,
  PRESET_MAX_TIMEWARP,
  PRESET_LEGACY_EASY_TIMEWARP,
  PRESET_ANAMORPHIC_TIMEWARP,
  PRESET_MAX_TIMEWARP_2,
  PRESET_EASY_MAX_TIMEWARP,
  EASY_ANAMORPHIC_TIMEWARP_PRESET_HERO13,
]);

export const classifyTimelapsePreset = (presetId: number | undefined): TimelapseCategory => {
  if (presetId === undefined) return 'timewarp_like';
  if (LAPSE_WITH_PHOTO_PRESETS.has(presetId)) return 'lapse_with_photo';
  if (TRAIL_LIKE_PRESETS.has(presetId)) return 'trail_like';
  return 'timewarp_like';
};

export const isTimelapseLikePreset = (presetId: number | undefined): boolean => {
  if (presetId === undefined) return false;
  return (
    TIMEWARP_LIKE_PRESETS.has(presetId) ||
    LAPSE_WITH_PHOTO_PRESETS.has(presetId) ||
    TRAIL_LIKE_PRESETS.has(presetId)
  );
};

// ── Camera System Settings ───────────────────────────────────────────────────────

const MAX_CAMERA_SYSTEM_SETTINGS: readonly number[] = [
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.SCREEN_SAVER_MAX,
  GoProSettingId.LED,
  GoProSettingId.BEEPS,
  GoProSettingId.GPS,
  GoProSettingId.LANGUAGE,
  GoProSettingId.VOICE_CONTROL,
  GoProSettingId.ORIENTATION,
  GoProSettingId.SCREEN_LOCK,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET_MAX,
  GoProSettingId.VIDEO_COMPRESSION,
  GoProSettingId.QUICK_CAPTURE_DEFAULT,
] as const;

const HERO09_CAMERA_SYSTEM_SETTINGS: readonly number[] = [
  GoProSettingId.MAX_LENS_MOD,
  GoProSettingId.MAX_LENS_MOD_ENABLE,
  GoProSettingId.VIDEO_COMPRESSION,
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.SCREEN_SAVER_REAR,
  GoProSettingId.SCREEN_SAVER_FRONT,
  GoProSettingId.FRONT_LCD_MODE,
  GoProSettingId.LED,
  GoProSettingId.BEEPS,
  GoProSettingId.GPS,
  GoProSettingId.LANGUAGE,
  GoProSettingId.VOICE_LANGUAGE_LEGACY,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET,
] as const;

const HERO10_CAMERA_SYSTEM_SETTINGS: readonly number[] = [
  GoProSettingId.VIDEO_PERFORMANCE_MODE,
  GoProSettingId.MAX_LENS_MOD,
  GoProSettingId.MAX_LENS_MOD_ENABLE,
  GoProSettingId.VIDEO_COMPRESSION,
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.SCREEN_SAVER_REAR,
  GoProSettingId.SCREEN_SAVER_FRONT,
  GoProSettingId.FRONT_LCD_MODE,
  GoProSettingId.LED,
  GoProSettingId.BEEPS,
  GoProSettingId.GPS,
  GoProSettingId.LANGUAGE,
  GoProSettingId.VOICE_LANGUAGE_LEGACY,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET,
] as const;

const HERO11_CAMERA_SYSTEM_SETTINGS: readonly number[] = [
  GoProSettingId.CONTROL_MODE,
  GoProSettingId.SYSTEM_VIDEO_MODE,
  GoProSettingId.MAX_LENS_MOD,
  GoProSettingId.MAX_LENS_MOD_ENABLE,
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.SCREEN_SAVER_REAR,
  GoProSettingId.SCREEN_SAVER_FRONT,
  GoProSettingId.FRONT_LCD_MODE,
  GoProSettingId.LED,
  GoProSettingId.BEEPS,
  GoProSettingId.GPS,
  GoProSettingId.LANGUAGE,
  GoProSettingId.VOICE_LANGUAGE_LEGACY,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET,
] as const;

const HERO12_CAMERA_SYSTEM_SETTINGS: readonly number[] = [
  GoProSettingId.CONTROL_MODE,
  GoProSettingId.MAX_LENS_MOD_HERO13,
  GoProSettingId.MAX_LENS_MOD,
  GoProSettingId.MAX_LENS_MOD_ENABLE,
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.SCREEN_SAVER_REAR,
  GoProSettingId.SCREEN_SAVER_FRONT,
  GoProSettingId.FRONT_LCD_MODE,
  GoProSettingId.LED,
  GoProSettingId.BEEPS,
  GoProSettingId.GPS,
  GoProSettingId.LANGUAGE,
  GoProSettingId.VOICE_LANGUAGE_LEGACY,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET,
] as const;

const HEROMI11_CAMERA_SYSTEM_SETTINGS: readonly number[] = [
  GoProSettingId.CONTROL_MODE,
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.LED,
  GoProSettingId.BEEPS,
  GoProSettingId.GPS,
  GoProSettingId.LANGUAGE,
  GoProSettingId.VOICE_LANGUAGE_LEGACY,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET,
] as const;

const HERO13_CAMERA_SYSTEM_SETTINGS: readonly number[] = [
  GoProSettingId.CONTROL_MODE,
  GoProSettingId.LENS_ATTACHMENT,
  GoProSettingId.MEDIA_MOD,
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.SCREEN_SAVER,
  GoProSettingId.SCREEN_SAVER_FRONT,
  GoProSettingId.FRONT_LCD_MODE,
  GoProSettingId.LED,
  GoProSettingId.BEEP_VOLUME,
  GoProSettingId.ENABLE_BEEP,
  GoProSettingId.GPS,
  GoProSettingId.LANGUAGE,
  GoProSettingId.VOICE_LANGUAGE,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET,
] as const;

const CAMERA_ADVANCED_SETTING_REGISTRY: Record<string, readonly number[]> = {
  max: MAX_CAMERA_SYSTEM_SETTINGS,
  hero13: HERO13_CAMERA_SYSTEM_SETTINGS,
  hero12: HERO12_CAMERA_SYSTEM_SETTINGS,
  hero11: HERO11_CAMERA_SYSTEM_SETTINGS,
  heromi11: HEROMI11_CAMERA_SYSTEM_SETTINGS,
  hero10: HERO10_CAMERA_SYSTEM_SETTINGS,
  hero09: HERO09_CAMERA_SYSTEM_SETTINGS,
};

const getCameraAdvancedSettingIds = (cameraModel: CameraModelKey): readonly number[] => {
  return CAMERA_ADVANCED_SETTING_REGISTRY[cameraModel] ?? HERO09_CAMERA_SYSTEM_SETTINGS;
};

// ── Layout Objects ───────────────────────────────────────────────────────────────

const STANDARD_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [
    GoProSettingId.VIDEO_PROFILE,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.HYPERSMOOTH,
  ],
  prioritizedAdvancedSettingIds: [
    GoProSettingId.HYPERSMOOTH,
    GoProSettingId.TEN_BIT_COLOR_HERO11,
    GoProSettingId.VIDEO_BITRATE_HERO11,
    GoProSettingId.BIT_DEPTH,
    GoProSettingId.HLG_HDR,
    GoProSettingId.VIDEO_BITRATE,
    GoProSettingId.HINDSIGHT,
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.EV_COMP,
    GoProSettingId.WB,
    GoProSettingId.VIDEO_ISO_MIN,
    GoProSettingId.VIDEO_ISO_MAX,
    GoProSettingId.SHARPNESS,
    GoProSettingId.COLOR,
    GoProSettingId.MAX_WIND_REDUCTION,
    GoProSettingId.WIND_REDUCTION,
    GoProSettingId.DENOISE,
    GoProSettingId.RAW_AUDIO,
    GoProSettingId.AUDIO_TUNING,
    GoProSettingId.MEDIA_MOD_MIC,
    GoProSettingId.VIDEO_DURATION,
    GoProSettingId.SCHEDULED_CAPTURE,
    GoProSettingId.CAPTURE_DELAY,
  ],
  defaultVisibleAdvancedSettingIds: [],
};

const MAX_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.HYPERSMOOTH,
    GoProSettingId.HORIZONTAL_LEVELING,
  ],
  prioritizedAdvancedSettingIds: [
    GoProSettingId.HYPERSMOOTH,
    GoProSettingId.HINDSIGHT,
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.EV_COMP,
    GoProSettingId.WB,
    GoProSettingId.VIDEO_ISO_MIN,
    GoProSettingId.VIDEO_ISO_MAX,
    GoProSettingId.SHARPNESS,
    GoProSettingId.COLOR,
    GoProSettingId.MAX_WIND_REDUCTION,
    GoProSettingId.DENOISE,
    GoProSettingId.RAW_AUDIO,
    GoProSettingId.MEDIA_MOD_MIC,
    GoProSettingId.VIDEO_DURATION,
    GoProSettingId.SCHEDULED_CAPTURE,
    GoProSettingId.CAPTURE_DELAY,
  ],
  defaultVisibleAdvancedSettingIds: [],
};

const HERO13_MAX_LENS25_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: MAX_VIDEO_LAYOUT.quickSettingIds,
  prioritizedAdvancedSettingIds: [
    GoProSettingId.HYPERSMOOTH,
    GoProSettingId.BIT_DEPTH,
    GoProSettingId.VIDEO_BITRATE,
    ...MAX_VIDEO_LAYOUT.prioritizedAdvancedSettingIds.filter(
      (id) => id !== GoProSettingId.HYPERSMOOTH,
    ),
  ],
  defaultVisibleAdvancedSettingIds: MAX_VIDEO_LAYOUT.defaultVisibleAdvancedSettingIds,
};

const MAX_VIDEO_HERO09_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.HYPERSMOOTH_MAX,
    GoProSettingId.HORIZONTAL_LEVELING,
  ],
  prioritizedAdvancedSettingIds: [
    GoProSettingId.HYPERSMOOTH_MAX,
    GoProSettingId.VIDEO_BITRATE_HERO11,
    GoProSettingId.HINDSIGHT,
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.EV_COMP,
    GoProSettingId.WB,
    GoProSettingId.VIDEO_ISO_MIN,
    GoProSettingId.VIDEO_ISO_MAX,
    GoProSettingId.SHARPNESS,
    GoProSettingId.COLOR,
    GoProSettingId.MAX_WIND_REDUCTION,
    GoProSettingId.DENOISE,
    GoProSettingId.RAW_AUDIO,
    GoProSettingId.MEDIA_MOD_MIC,
    GoProSettingId.VIDEO_DURATION,
    GoProSettingId.SCHEDULED_CAPTURE,
    GoProSettingId.CAPTURE_DELAY,
  ],
  defaultVisibleAdvancedSettingIds: [],
};

const MAX_VIDEO_HERO11_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.HYPERSMOOTH_MAX,
    GoProSettingId.HORIZONTAL_LEVELING,
  ],
  prioritizedAdvancedSettingIds: [
    GoProSettingId.HYPERSMOOTH_MAX,
    GoProSettingId.TEN_BIT_COLOR_HERO11,
    GoProSettingId.VIDEO_BITRATE_HERO11,
    GoProSettingId.HINDSIGHT,
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.EV_COMP,
    GoProSettingId.WB,
    GoProSettingId.VIDEO_ISO_MIN,
    GoProSettingId.VIDEO_ISO_MAX,
    GoProSettingId.SHARPNESS,
    GoProSettingId.COLOR,
    GoProSettingId.MAX_WIND_REDUCTION,
    GoProSettingId.DENOISE,
    GoProSettingId.RAW_AUDIO,
    GoProSettingId.MEDIA_MOD_MIC,
    GoProSettingId.VIDEO_DURATION,
    GoProSettingId.SCHEDULED_CAPTURE,
    GoProSettingId.CAPTURE_DELAY,
  ],
  defaultVisibleAdvancedSettingIds: [
    GoProSettingId.TEN_BIT_COLOR_HERO11,
    GoProSettingId.VIDEO_BITRATE_HERO11,
  ],
};

const MAX_CAMERA_STANDARD_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.HYPERSMOOTH,
    GoProSettingId.HORIZONTAL_LEVELING,
  ],
  prioritizedAdvancedSettingIds: [
    GoProSettingId.VIDEO_CLIPS,
    GoProSettingId.VIDEO_BITRATE_HERO11,
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.EV_COMP,
    GoProSettingId.WB,
    GoProSettingId.VIDEO_ISO_MIN,
    GoProSettingId.VIDEO_ISO_MAX,
    GoProSettingId.SHARPNESS,
    GoProSettingId.COLOR,
    GoProSettingId.MAX_AUDIO_MODE,
    GoProSettingId.RAW_AUDIO,
    GoProSettingId.MAX_WIND_REDUCTION,
    ...MAX_CAMERA_SYSTEM_SETTINGS,
  ],
  defaultVisibleAdvancedSettingIds: [],
};

const MAX_CAMERA_360_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [GoProSettingId.RESOLUTION, GoProSettingId.FPS],
  prioritizedAdvancedSettingIds: [
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.EV_COMP,
    GoProSettingId.WB,
    GoProSettingId.VIDEO_ISO_MIN,
    GoProSettingId.VIDEO_ISO_MAX,
    GoProSettingId.SHARPNESS,
    GoProSettingId.COLOR,
    GoProSettingId.MAX_AUDIO_MODE,
    GoProSettingId.MAX_WIND_REDUCTION,
    ...MAX_CAMERA_SYSTEM_SETTINGS,
  ],
  defaultVisibleAdvancedSettingIds: [],
};

const MACRO_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: STANDARD_VIDEO_LAYOUT.quickSettingIds,
  prioritizedAdvancedSettingIds: [
    GoProSettingId.FOCUS_PEAKING,
    ...STANDARD_VIDEO_LAYOUT.prioritizedAdvancedSettingIds,
  ],
  defaultVisibleAdvancedSettingIds: [],
};

const HERO13_BURST_SLOMO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [GoProSettingId.HYPERSMOOTH],
  prioritizedAdvancedSettingIds: STANDARD_VIDEO_LAYOUT.prioritizedAdvancedSettingIds.filter(
    (id) =>
      id !== GoProSettingId.HLG_HDR &&
      id !== GoProSettingId.HINDSIGHT &&
      id !== GoProSettingId.RAW_AUDIO,
  ),
  defaultVisibleAdvancedSettingIds: [],
};

const EASY_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [
    GoProSettingId.VIDEO_LENS_HERO13,
    GoProSettingId.EASY_VIDEO_QUALITY,
    GoProSettingId.HYPERSMOOTH,
  ],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
};

const LEGACY_EASY_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [GoProSettingId.FPS, GoProSettingId.VIDEO_LENS, GoProSettingId.HYPERSMOOTH],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
};

const HERO11_EASY_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [GoProSettingId.VIDEO_LENS],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
};

const HERO12_EASY_QUALITY_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [GoProSettingId.VIDEO_LENS],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
};

const HERO11_EASY_PHOTO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [GoProSettingId.PHOTO_LENS, GoProSettingId.CAPTURE_DELAY],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
};

const HERO11_EASY_TIMELAPSE_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [GoProSettingId.VIDEO_LENS],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
};

const EASY_PHOTO_TIMELAPSE_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
};

const FALLBACK_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.PHOTO_LENS,
  ],
  prioritizedAdvancedSettingIds: [
    GoProSettingId.TEN_BIT_COLOR_HERO11,
    GoProSettingId.VIDEO_BITRATE_HERO11,
    GoProSettingId.BIT_DEPTH,
    GoProSettingId.VIDEO_BITRATE,
  ],
  defaultVisibleAdvancedSettingIds: [],
};

// ── Re-exported layout data for functions.ts ─────────────────────────────────────

export const layoutData = {
  // Video layouts
  STANDARD_VIDEO_LAYOUT,
  MAX_VIDEO_LAYOUT,
  HERO13_MAX_LENS25_VIDEO_LAYOUT,
  MAX_VIDEO_HERO09_LAYOUT,
  MAX_VIDEO_HERO11_LAYOUT,
  MACRO_VIDEO_LAYOUT,
  HERO13_BURST_SLOMO_LAYOUT,
  EASY_VIDEO_LAYOUT,
  LEGACY_EASY_VIDEO_LAYOUT,
  HERO11_EASY_VIDEO_LAYOUT,
  HERO12_EASY_QUALITY_VIDEO_LAYOUT,
  // Photo/Timelapse layouts
  HERO11_EASY_PHOTO_LAYOUT,
  HERO11_EASY_TIMELAPSE_LAYOUT,
  EASY_PHOTO_TIMELAPSE_LAYOUT,
  // Max camera layouts
  MAX_CAMERA_STANDARD_VIDEO_LAYOUT,
  MAX_CAMERA_360_VIDEO_LAYOUT,
  // Fallback
  FALLBACK_LAYOUT,
  // Helper
  getCameraAdvancedSettingIds,
} as const;

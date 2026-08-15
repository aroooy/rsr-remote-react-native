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

import { GoProSettingId } from './GoProSettingId';
import {
  DASHBOARD_SUB_SETTING_IDS,
  CAMERA_ADVANCED_SETTING_IDS,
} from './capabilityDependencies';
import { CameraModelKey } from './ResolutionAspectMap';
import { resolveModelNoFromCameraModelKey } from '../cameraModels/shared/modelNumber';
import {
  isHero11MiniModel,
  isHero13Model,
  isMaxModel,
} from '../cameraModels/shared/modelNoHelpers';
import { GOPRO_MODEL_NUMBERS } from './GoProModelNumbers';

export type CapabilityPolicy =
  | 'dynamicOnly'
  | 'staticWhenEmpty'
  | 'staticAlways'
  | 'dynamicWithStaticOrderAndLabelFallback'
  | 'dynamicWithStaticSupersetCheck';

/**
 * Determines the applicable CapabilityPolicy based on settingId and modelKey.
 * For policy details, refer to docs/technical/12_capability_policies.md.
 */
export const getCapabilityPolicy = (
  settingId: number,
  modelKey?: string | null,
  modelNoArg?: number | null,
): CapabilityPolicy => {
  const modelNo =
    modelNoArg ?? resolveModelNoFromCameraModelKey(modelKey as CameraModelKey | null | undefined);
  // -------------------------------------------------------------------------
  // Policy: staticAlways (Model-specific overrides)
  // -------------------------------------------------------------------------
  if (isMaxModel(modelNo)) {
    const maxStaticAlwaysIds = new Set<number>([
      GoProSettingId.VIDEO_SHUTTER,
      GoProSettingId.EV_COMP,
      GoProSettingId.WB,
      GoProSettingId.VIDEO_ISO_MIN,
      GoProSettingId.VIDEO_ISO_MAX,
      GoProSettingId.PHOTO_ISO_MIN,
      GoProSettingId.PHOTO_ISO_MAX,
      GoProSettingId.PHOTO_SHUTTER,
      GoProSettingId.SHARPNESS,
      GoProSettingId.COLOR,
      GoProSettingId.RAW_AUDIO,
      GoProSettingId.MAX_WIND_REDUCTION,
      GoProSettingId.MAX_AUDIO_MODE,
      GoProSettingId.CAPTURE_DELAY,
      GoProSettingId.TIMEWARP_SPEED,
      GoProSettingId.VIDEO_TIMELAPSE_RATE,
      GoProSettingId.PHOTO_TIMELAPSE_RATE,
      GoProSettingId.RESOLUTION,
      GoProSettingId.VIDEO_LENS,
      GoProSettingId.PHOTO_LENS,
      GoProSettingId.HYPERSMOOTH,
      GoProSettingId.MAX_LENS_MODE,
      GoProSettingId.MAX_LENS_DIRECTION,
      GoProSettingId.VIDEO_CLIPS,
    ]);
    if (maxStaticAlwaysIds.has(settingId)) {
      return 'staticAlways';
    }
  }

  // -------------------------------------------------------------------------
  // Policy: staticAlways (Global)
  // -------------------------------------------------------------------------
  const globalStaticAlwaysIds = new Set<number>([
    GoProSettingId.NIGHTLAPSE_PHOTO_SHUTTER,
    GoProSettingId.STAR_TRAIL_SHUTTER,
    GoProSettingId.LIGHT_PAINTING_SHUTTER,
    GoProSettingId.VEHICLE_LIGHTS_SHUTTER,
    GoProSettingId.TIMELAPSE_VIDEO_SHUTTER,
    GoProSettingId.BIT_DEPTH,
    GoProSettingId.TEN_BIT_COLOR_HERO11,
    GoProSettingId.VIDEO_BITRATE,
    GoProSettingId.VIDEO_BITRATE_HERO11,
    GoProSettingId.VIDEO_BITRATE_HERO09,
    GoProSettingId.QUICK_CAPTURE_DEFAULT,
    GoProSettingId.DEFAULT_PRESET_MAX,
    GoProSettingId.SCREEN_SAVER_MAX,
    GoProSettingId.SCREEN_SAVER_REAR,
    GoProSettingId.LED,
    GoProSettingId.ORIENTATION,
    GoProSettingId.VIDEO_COMPRESSION,
    GoProSettingId.ANTI_FLICKER,
    GoProSettingId.HYPERSMOOTH_MAX,
  ]);
  if (globalStaticAlwaysIds.has(settingId)) {
    return 'staticAlways';
  }

  if (
    (modelNo === GOPRO_MODEL_NUMBERS.HERO09_BLACK ||
      modelNo === GOPRO_MODEL_NUMBERS.HERO10_BLACK ||
      modelNo === GOPRO_MODEL_NUMBERS.HERO11_BLACK) &&
    settingId === GoProSettingId.LOOPING_INTERVAL
  ) {
    return 'staticAlways';
  }

  if (
    (modelNo === GOPRO_MODEL_NUMBERS.HERO09_BLACK ||
      modelNo === GOPRO_MODEL_NUMBERS.HERO10_BLACK) &&
    settingId === GoProSettingId.MEDIA_MOD_MIC
  ) {
    return 'staticAlways';
  }

  // -------------------------------------------------------------------------
  // Policy: staticWhenEmpty
  // -------------------------------------------------------------------------
  const globalStaticWhenEmptyIds = new Set<number>([
    GoProSettingId.DASHBOARD_OVERRIDE,
    ...DASHBOARD_SUB_SETTING_IDS,
    ...CAMERA_ADVANCED_SETTING_IDS,
    GoProSettingId.MEDIA_FORMAT,
    GoProSettingId.LAPSE_MODE,
    GoProSettingId.PHOTO_SHUTTER,
    GoProSettingId.NIGHT_PHOTO_SHUTTER,
    GoProSettingId.PHOTO_ISO_MIN,
    GoProSettingId.PHOTO_ISO_MAX,
    GoProSettingId.MULTI_SHOT_ISO_MIN,
    GoProSettingId.MULTI_SHOT_ISO_MAX,
    GoProSettingId.TIMELAPSE_PHOTO_OUTPUT,
    GoProSettingId.TIME_LAPSE_LENS,
    GoProSettingId.EASY_VIDEO_QUALITY,
    GoProSettingId.LANGUAGE,
    GoProSettingId.VOICE_LANGUAGE,
    GoProSettingId.VOICE_LANGUAGE_LEGACY,
    GoProSettingId.HORIZONTAL_LEVELING,
    GoProSettingId.HORIZONTAL_LOCK,
    GoProSettingId.HLG_HDR,
  ]);

  if (globalStaticWhenEmptyIds.has(settingId)) {
    return 'staticWhenEmpty';
  }

  if (settingId === GoProSettingId.AUTO_OFF && !isHero11MiniModel(modelNo)) {
    return 'staticWhenEmpty';
  }

  // -------------------------------------------------------------------------
  // Policy: dynamicWithStaticSupersetCheck
  // -------------------------------------------------------------------------
  if (isHero13Model(modelNo) && settingId === GoProSettingId.VIDEO_DURATION) {
    return 'dynamicWithStaticSupersetCheck';
  }

  // -------------------------------------------------------------------------
  // Policy: dynamicOnly
  // -------------------------------------------------------------------------
  return 'dynamicOnly';
};

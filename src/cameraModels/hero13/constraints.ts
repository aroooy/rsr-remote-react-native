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

import { GoProSettingId } from '../../constants/GoProSettingId';
import { classifyTimelapsePreset } from '../../constants/layout';
import {
  GROUP_VIDEO,
  H13_PROFILE_HDR_NEW,
  H13_PROFILE_HLG_NEW,
  H13_PROFILE_LOG_ALT,
  H13_PROFILE_LOG_ALT_2,
  H13_PROFILE_LOG_NEW,
  PHOTO_OUTPUT_HDR,
  PHOTO_OUTPUT_SUPER_PHOTO,
  PRESET_ACTIVITY,
  PRESET_ANAMORPHIC_NIGHT_PHOTO,
  PRESET_ANAMORPHIC_PHOTO,
  PRESET_MACRO_NIGHT_PHOTO,
  PRESET_MACRO_PHOTO,
  PRESET_MACRO_VIDEO,
  PRESET_NIGHTLAPSE,
  PRESET_NIGHT_PHOTO,
  PRESET_PHOTO,
  PRESET_STANDARD,
} from '../shared/constraintConstants';
import type { SettingConstraintResolver } from '../shared/types';

export const hero13SettingConstraintResolver: SettingConstraintResolver = ({
  settingId,
  settings,
}) => {
  const group = settings[GoProSettingId.MODE_PRESET_GROUP];
  const preset = settings[GoProSettingId.MODE_PRESET];
  const profile = settings[GoProSettingId.VIDEO_PROFILE];
  const presetCategory = classifyTimelapsePreset(preset);

  const isVideoGroup = group === GROUP_VIDEO;
  const isStandardPreset = preset === PRESET_STANDARD;
  const isActivityPreset = preset === PRESET_ACTIVITY;
  const isMacroVideoPreset = preset === PRESET_MACRO_VIDEO;
  const isTrailLikePreset = presetCategory === 'trail_like';
  const isHDRorHLG = profile === H13_PROFILE_HDR_NEW || profile === H13_PROFILE_HLG_NEW;
  const isLOG =
    profile === H13_PROFILE_LOG_NEW ||
    profile === H13_PROFILE_LOG_ALT ||
    profile === H13_PROFILE_LOG_ALT_2;

  const photoOutput = settings[GoProSettingId.PHOTO_OUTPUT];
  const isPhotoISOPreset =
    preset === PRESET_PHOTO ||
    preset === PRESET_NIGHT_PHOTO ||
    preset === PRESET_ANAMORPHIC_PHOTO ||
    preset === PRESET_ANAMORPHIC_NIGHT_PHOTO ||
    preset === PRESET_MACRO_PHOTO ||
    preset === PRESET_MACRO_NIGHT_PHOTO;

  switch (settingId) {
    case GoProSettingId.VIDEO_SHUTTER:
    case GoProSettingId.VIDEO_ISO_MIN:
    case GoProSettingId.VIDEO_ISO_MAX:
      if (isVideoGroup && isHDRorHLG) return 'disabled';
      break;

    case GoProSettingId.PHOTO_ISO_MIN:
    case GoProSettingId.PHOTO_ISO_MAX:
      if (
        isPhotoISOPreset &&
        (photoOutput === PHOTO_OUTPUT_HDR || photoOutput === PHOTO_OUTPUT_SUPER_PHOTO)
      ) {
        return 'na';
      }
      break;

    case GoProSettingId.PHOTO_SHUTTER:
    case GoProSettingId.NIGHT_PHOTO_SHUTTER:
      if (
        isPhotoISOPreset &&
        (photoOutput === PHOTO_OUTPUT_HDR || photoOutput === PHOTO_OUTPUT_SUPER_PHOTO)
      ) {
        return 'na';
      }
      break;

    case GoProSettingId.EV_COMP:
      if (isTrailLikePreset) return 'na';
      if (isVideoGroup && isStandardPreset && isHDRorHLG) return 'disabled';
      if (
        isPhotoISOPreset &&
        (photoOutput === PHOTO_OUTPUT_HDR || photoOutput === PHOTO_OUTPUT_SUPER_PHOTO)
      ) {
        return 'na';
      }
      break;

    case GoProSettingId.COLOR:
      if (isLOG) return 'disabled';
      break;

    case GoProSettingId.TEN_BIT_COLOR:
    case GoProSettingId.TEN_BIT_COLOR_ALT:
    case GoProSettingId.BIT_DEPTH:
      if (isMacroVideoPreset && settings[GoProSettingId.RESOLUTION] === 4) {
        return 'na';
      }
      if (isVideoGroup && (isLOG || (isStandardPreset && isHDRorHLG) || isActivityPreset)) {
        return 'disabled';
      }
      break;

    case GoProSettingId.VIDEO_DURATION:
      if (isVideoGroup && isActivityPreset) return 'disabled';
      break;

    case GoProSettingId.HLG_HDR:
      if (!isVideoGroup) return 'na';
      if (profile === 1 || profile === H13_PROFILE_HDR_NEW) break;
      return 'na';
  }

  return 'ok';
};

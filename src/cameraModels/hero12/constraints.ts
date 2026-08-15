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
  H12_PROFILE_HDR,
  H12_PROFILE_LOG,
  PHOTO_OUTPUT_HDR,
  PHOTO_OUTPUT_SUPER_PHOTO,
  PRESET_NIGHTLAPSE,
  PRESET_NIGHT_PHOTO,
  PRESET_PHOTO,
  PRESET_STANDARD,
} from '../shared/constraintConstants';
import type { SettingConstraintResolver } from '../shared/types';

export const hero12SettingConstraintResolver: SettingConstraintResolver = ({
  settingId,
  settings,
}) => {
  const group = settings[GoProSettingId.MODE_PRESET_GROUP];
  const preset = settings[GoProSettingId.MODE_PRESET];
  const profile = settings[GoProSettingId.VIDEO_PROFILE];
  const nightlapseShutter = settings[GoProSettingId.NIGHTLAPSE_PHOTO_SHUTTER];
  const photoOutput = settings[GoProSettingId.PHOTO_OUTPUT];
  const presetCategory = classifyTimelapsePreset(preset);

  const isVideoGroup = group === GROUP_VIDEO;
  const isStandardPreset = preset === PRESET_STANDARD;
  const isHDR = profile === H12_PROFILE_HDR;
  const isLOG = profile === H12_PROFILE_LOG;
  const isH12PhotoPreset = preset === PRESET_PHOTO || preset === PRESET_NIGHT_PHOTO;
  const isTrailLikePreset = presetCategory === 'trail_like';

  switch (settingId) {
    case GoProSettingId.VIDEO_SHUTTER:
    case GoProSettingId.VIDEO_ISO_MIN:
    case GoProSettingId.VIDEO_ISO_MAX:
      if (isVideoGroup && isHDR) return 'disabled';
      break;

    case GoProSettingId.PHOTO_ISO_MIN:
    case GoProSettingId.PHOTO_ISO_MAX:
      if (
        isH12PhotoPreset &&
        (photoOutput === PHOTO_OUTPUT_HDR || photoOutput === PHOTO_OUTPUT_SUPER_PHOTO)
      ) {
        return 'na';
      }
      break;

    case GoProSettingId.PHOTO_SHUTTER:
    case GoProSettingId.NIGHT_PHOTO_SHUTTER:
      if (
        isH12PhotoPreset &&
        (photoOutput === PHOTO_OUTPUT_HDR || photoOutput === PHOTO_OUTPUT_SUPER_PHOTO)
      ) {
        return 'na';
      }
      break;

    case GoProSettingId.HLG_HDR:
      return 'na';

    case GoProSettingId.EV_COMP:
      if (isTrailLikePreset) return 'na';
      if (isStandardPreset && (isHDR || isLOG)) return 'disabled';
      if (
        isH12PhotoPreset &&
        (photoOutput === PHOTO_OUTPUT_HDR || photoOutput === PHOTO_OUTPUT_SUPER_PHOTO)
      ) {
        return 'na';
      }
      if (
        preset === PRESET_NIGHTLAPSE &&
        nightlapseShutter !== undefined &&
        nightlapseShutter !== 0
      ) {
        return 'na';
      }
      break;

    case GoProSettingId.COLOR:
      if (isStandardPreset && isLOG) return 'disabled';
      if (
        (preset === PRESET_PHOTO || preset === PRESET_NIGHTLAPSE) &&
        (photoOutput === PHOTO_OUTPUT_HDR || photoOutput === PHOTO_OUTPUT_SUPER_PHOTO)
      ) {
        return 'disabled';
      }
      break;
  }

  return 'ok';
};

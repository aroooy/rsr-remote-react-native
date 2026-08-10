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

import {
  GoProSettingId,
  HERO11_EB_VIDEO_PRESETS,
  HERO11_LB_VIDEO_PRESETS,
  classifyTimelapsePreset,
} from '../../constants/GoProSettingIds';
import {
  GROUP_VIDEO,
  H11_RES_4K,
  H11_RES_4K_87,
  H11_RES_5_3K,
  H11_RES_5_3K_87,
  PHOTO_OUTPUT_HDR,
  PHOTO_OUTPUT_SUPER_PHOTO,
  PRESET_NIGHTLAPSE,
  PRESET_NIGHT_PHOTO,
  PRESET_PHOTO,
} from '../shared/constraintConstants';
import { PRESET_MAX_VIDEO } from '../../constants/presetIds';
import type { SettingConstraintResolver } from '../shared/types';

export const hero11SettingConstraintResolver: SettingConstraintResolver = ({
  settingId,
  settings,
}) => {
  const group = settings[GoProSettingId.MODE_PRESET_GROUP];
  const preset = settings[GoProSettingId.MODE_PRESET];
  const resolution = settings[GoProSettingId.RESOLUTION];
  const photoOutput = settings[GoProSettingId.PHOTO_OUTPUT];
  const presetCategory = classifyTimelapsePreset(preset);

  const isVideoGroup = group === GROUP_VIDEO;
  const isH11PhotoPreset = preset === PRESET_PHOTO || preset === PRESET_NIGHT_PHOTO;
  const isHDRorSuperPhoto =
    photoOutput === PHOTO_OUTPUT_HDR || photoOutput === PHOTO_OUTPUT_SUPER_PHOTO;
  const isTrailLikePreset = presetCategory === 'trail_like';

  switch (settingId) {
    case GoProSettingId.COLOR:
      if ((preset === PRESET_PHOTO || preset === PRESET_NIGHTLAPSE) && isHDRorSuperPhoto) {
        return 'disabled';
      }
      break;

    case GoProSettingId.PHOTO_ISO_MIN:
    case GoProSettingId.PHOTO_ISO_MAX:
      if (isH11PhotoPreset && isHDRorSuperPhoto) return 'na';
      break;

    case GoProSettingId.PHOTO_SHUTTER:
    case GoProSettingId.NIGHT_PHOTO_SHUTTER:
      if (isH11PhotoPreset && isHDRorSuperPhoto) return 'na';
      break;

    case GoProSettingId.EV_COMP:
      if (isTrailLikePreset) return 'na';
      if (isH11PhotoPreset && isHDRorSuperPhoto) return 'na';
      if (preset === PRESET_NIGHTLAPSE) return 'na';
      break;

    case GoProSettingId.TEN_BIT_COLOR_HERO11: {
      if (preset === PRESET_MAX_VIDEO) return 'na';
      if (preset !== undefined && HERO11_EB_VIDEO_PRESETS.has(preset)) return 'na';
      if (preset !== undefined && HERO11_LB_VIDEO_PRESETS.has(preset)) return 'na';
      if (!isVideoGroup) return 'na';
      const isResWhereEnabled =
        resolution === H11_RES_5_3K ||
        resolution === H11_RES_4K ||
        resolution === H11_RES_5_3K_87 ||
        resolution === H11_RES_4K_87;
      if (!isResWhereEnabled) return 'na';
      break;
    }
  }

  return 'ok';
};

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

import { GoProSettingId, classifyTimelapsePreset } from '../../constants/GoProSettingIds';
import {
  PHOTO_OUTPUT_HDR,
  PHOTO_OUTPUT_SUPER_PHOTO,
  PRESET_NIGHTLAPSE,
  PRESET_NIGHT_PHOTO,
  PRESET_PHOTO,
} from '../shared/constraintConstants';
import type { SettingConstraintResolver } from '../shared/types';

export const hero09SettingConstraintResolver: SettingConstraintResolver = ({
  settingId,
  settings,
}) => {
  const preset = settings[GoProSettingId.MODE_PRESET];
  const photoOutput = settings[GoProSettingId.PHOTO_OUTPUT];
  const presetCategory = classifyTimelapsePreset(preset);

  const isPhotoPreset = preset === PRESET_PHOTO || preset === PRESET_NIGHT_PHOTO;
  const isHDRorSuperPhoto =
    photoOutput === PHOTO_OUTPUT_HDR || photoOutput === PHOTO_OUTPUT_SUPER_PHOTO;
  const isTrailLikePreset = presetCategory === 'trail_like';

  switch (settingId) {
    case GoProSettingId.PHOTO_SHUTTER:
    case GoProSettingId.NIGHT_PHOTO_SHUTTER:
      if (isPhotoPreset && isHDRorSuperPhoto) return 'na';
      break;

    case GoProSettingId.PHOTO_ISO_MIN:
    case GoProSettingId.PHOTO_ISO_MAX:
      if (isPhotoPreset && isHDRorSuperPhoto) return 'na';
      break;

    case GoProSettingId.EV_COMP:
      if (isTrailLikePreset) return 'na';
      if (isPhotoPreset && isHDRorSuperPhoto) return 'na';
      break;

    case GoProSettingId.COLOR:
      if ((preset === PRESET_PHOTO || preset === PRESET_NIGHTLAPSE) && isHDRorSuperPhoto) {
        return 'disabled';
      }
      break;
  }

  return 'ok';
};

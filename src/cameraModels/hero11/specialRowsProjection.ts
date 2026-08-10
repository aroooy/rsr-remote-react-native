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

import { GoProPresetGroup } from '../../constants/GoProPresetGroup';
import { SPECIAL_ROW_KEYS } from '../../constants/specialRowsConstants';
import {
  PRESET_HERO11_EB_ACTIVITY_VIDEO,
  PRESET_HERO11_EB_CINEMATIC_VIDEO,
  PRESET_HERO11_EB_SLO_MO_VIDEO,
  PRESET_HERO11_EB_STANDARD_VIDEO,
  PRESET_HERO11_LB_ACTIVITY_VIDEO,
  PRESET_HERO11_LB_CINEMATIC_VIDEO,
  PRESET_HERO11_LB_SLO_MO_VIDEO,
  PRESET_HERO11_LB_STANDARD_VIDEO,
  PRESET_LEGACY_EASY_NIGHT_PHOTO,
  PRESET_LEGACY_EASY_PHOTO,
  PRESET_LEGACY_EASY_LIGHT_PAINTING,
  PRESET_LEGACY_EASY_STAR_TRAILS,
  PRESET_LEGACY_EASY_TIMEWARP,
  PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
} from '../../constants/presetIds';
import type { ResolveSpecialRowsProjectionParams, SpecialRowsProjection } from '../shared/types';

const HERO11_EASY_VIDEO_PRESETS = new Set<number>([
  PRESET_HERO11_EB_STANDARD_VIDEO,
  PRESET_HERO11_EB_ACTIVITY_VIDEO,
  PRESET_HERO11_EB_CINEMATIC_VIDEO,
  PRESET_HERO11_EB_SLO_MO_VIDEO,
  PRESET_HERO11_LB_STANDARD_VIDEO,
  PRESET_HERO11_LB_ACTIVITY_VIDEO,
  PRESET_HERO11_LB_CINEMATIC_VIDEO,
  PRESET_HERO11_LB_SLO_MO_VIDEO,
]);

const HERO11_EASY_PHOTO_PRESETS = new Set<number>([
  PRESET_LEGACY_EASY_PHOTO,
  PRESET_LEGACY_EASY_NIGHT_PHOTO,
]);

const HERO11_EASY_TIMELAPSE_PRESETS = new Set<number>([
  PRESET_LEGACY_EASY_TIMEWARP,
  PRESET_LEGACY_EASY_STAR_TRAILS,
  PRESET_LEGACY_EASY_LIGHT_PAINTING,
  PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
]);

export const getHero11SpecialRowsProjection = ({
  currentGroupId,
  currentPresetId,
}: ResolveSpecialRowsProjectionParams): SpecialRowsProjection => {
  if (currentPresetId === undefined) {
    return {
      visibleRowKeys: [],
    };
  }

  if (currentGroupId === GoProPresetGroup.VIDEO && HERO11_EASY_VIDEO_PRESETS.has(currentPresetId)) {
    return {
      visibleRowKeys: [SPECIAL_ROW_KEYS.HERO11_EASY_VIDEO_SPEED],
    };
  }

  if (currentGroupId === GoProPresetGroup.PHOTO && HERO11_EASY_PHOTO_PRESETS.has(currentPresetId)) {
    return {
      visibleRowKeys: [SPECIAL_ROW_KEYS.HERO11_EASY_PHOTO_NIGHT],
    };
  }

  if (
    currentGroupId === GoProPresetGroup.TIMELAPSE &&
    HERO11_EASY_TIMELAPSE_PRESETS.has(currentPresetId)
  ) {
    return {
      visibleRowKeys: [SPECIAL_ROW_KEYS.HERO11_EASY_TIMELAPSE_SPEED_RAMP],
    };
  }

  return {
    visibleRowKeys: [],
  };
};

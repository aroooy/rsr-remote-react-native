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

import { GoProPresetGroup, GoProSettingId } from '../../constants/GoProSettingIds';
import { PRESET_MAX_TIMEWARP, PRESET_MAX_TIMEWARP_2 } from '../../constants/presetIds';
import { getResolutionAspect } from '../../constants/ResolutionAspectMap';
import { isAntiFlicker50Hz } from '../shared/selectableValueHelpers';
import type { SelectableValuesResolver } from '../shared/types';

export const hero12SelectableValuesResolver: SelectableValuesResolver = ({
  settingId,
  selectableValues,
  settings,
  currentGroupId,
  currentPresetId,
  hero12EasyLensValues,
  isHero12MaxVideo2Preset,
  isHero12Or13MaxVideoPreset,
  pendingSettings,
  cameraModel,
}) => {
  let nextValues = [...selectableValues];

  const isHero12EasyQualityPreset =
    currentGroupId === GoProPresetGroup.VIDEO && hero12EasyLensValues !== undefined;
  const isHero12MaxTimewarpPreset =
    currentGroupId === GoProPresetGroup.TIMELAPSE &&
    (currentPresetId === PRESET_MAX_TIMEWARP || currentPresetId === PRESET_MAX_TIMEWARP_2);

  if (nextValues.length === 0 && settingId === GoProSettingId.FPS) {
    const is50Hz = isAntiFlicker50Hz(settings[GoProSettingId.ANTI_FLICKER]);
    nextValues = is50Hz ? [6, 9, 10] : [5, 8, 10];
  }

  if (
    nextValues.length === 0 &&
    settingId === GoProSettingId.MAX_WIND_REDUCTION &&
    isHero12MaxTimewarpPreset
  ) {
    nextValues = [2, 4, 0];
  }

  if (
    nextValues.length === 0 &&
    settingId === GoProSettingId.HYPERSMOOTH &&
    isHero12Or13MaxVideoPreset
  ) {
    if (isHero12MaxVideo2Preset) {
      const currentAspect = getResolutionAspect(cameraModel, settings[GoProSettingId.RESOLUTION]);
      nextValues = currentAspect === '16:9' ? [4, 1, 0] : [1, 0];
    } else {
      nextValues = [1, 0];
    }
  }

  if (settingId === GoProSettingId.VIDEO_LENS && isHero12EasyQualityPreset) {
    const allowedLensValues = hero12EasyLensValues ?? [];
    nextValues =
      nextValues.length === 0
        ? [...allowedLensValues]
        : nextValues.filter((value) => allowedLensValues.includes(value));
    if (nextValues.length === 0) {
      nextValues = [...allowedLensValues];
    }
  }

  if (isHero12Or13MaxVideoPreset && settingId === GoProSettingId.HORIZONTAL_LEVELING) {
    const hypersmoothValue =
      pendingSettings[GoProSettingId.HYPERSMOOTH] ?? settings[GoProSettingId.HYPERSMOOTH];
    nextValues = hypersmoothValue !== undefined && hypersmoothValue !== 0 ? nextValues : [];
  }

  return nextValues;
};

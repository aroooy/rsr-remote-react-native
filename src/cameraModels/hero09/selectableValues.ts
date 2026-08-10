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

import { GoProSettingId } from '../../constants/GoProSettingIds';
import { getResolutionLabel } from '../../constants/ResolutionAspectMap';
import { PRESET_MAX_VIDEO, PRESET_NIGHT_PHOTO, PRESET_PHOTO } from '../../constants/presetIds';
import type { SelectableValuesResolver } from '../shared/types';

export const hero09SelectableValuesResolver: SelectableValuesResolver = ({
  settingId,
  selectableValues,
  settings,
  pendingSettings,
  isLoopingPresetActive,
  currentPresetId,
}) => {
  let nextValues = [...selectableValues];

  if (settingId === GoProSettingId.VIDEO_LENS && isLoopingPresetActive) {
    const resolutionValue =
      pendingSettings[GoProSettingId.RESOLUTION] ?? settings[GoProSettingId.RESOLUTION];
    if (resolutionValue !== undefined && getResolutionLabel('hero09', resolutionValue) === '4K') {
      nextValues = nextValues.filter((value) => value === 0 || value === 3);
    }
  }

  if (
    settingId === GoProSettingId.PHOTO_LENS &&
    (currentPresetId === PRESET_PHOTO || currentPresetId === PRESET_NIGHT_PHOTO)
  ) {
    const photoOutput = settings[GoProSettingId.PHOTO_OUTPUT];
    if (photoOutput === 1) {
      nextValues = [101];
    } else {
      nextValues = nextValues.filter((value) => value === 101 || value === 102 || value === 19);
    }
  }

  if (
    settingId === GoProSettingId.TIME_LAPSE_LENS &&
    settings[GoProSettingId.TIMELAPSE_PHOTO_OUTPUT] === 1
  ) {
    nextValues = [101];
  }

  if (settingId === GoProSettingId.HORIZONTAL_LEVELING && currentPresetId === PRESET_MAX_VIDEO) {
    const maxHypersmoothValue =
      pendingSettings[GoProSettingId.HYPERSMOOTH_MAX] ?? settings[GoProSettingId.HYPERSMOOTH_MAX];
    nextValues = maxHypersmoothValue !== undefined && maxHypersmoothValue !== 0 ? nextValues : [];
  }

  return nextValues;
};

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
  EASY_VIDEO_PRESETS,
  HERO11_EASY_PHOTO_PRESETS,
  HERO11_EASY_TIMELAPSE_PRESETS,
  classifyTimelapsePreset,
} from '../../constants/layout';
import { GoProPresetGroup } from '../../constants/GoProPresetGroup';
import { GoProSettingId } from '../../constants/GoProSettingId';
import { PRESET_MAX_VIDEO } from '../../constants/presetIds';
import { isAntiFlicker50Hz } from '../shared/selectableValueHelpers';
import type { SelectableValuesResolver } from '../shared/types';

export const hero11SelectableValuesResolver: SelectableValuesResolver = ({
  settingId,
  selectableValues,
  settings,
  pendingSettings,
  currentGroupId,
  currentPresetId,
}) => {
  let nextValues = [...selectableValues];

  const isLegacyEasyVideoPreset =
    currentGroupId === GoProPresetGroup.VIDEO &&
    currentPresetId !== undefined &&
    EASY_VIDEO_PRESETS.has(currentPresetId);
  const isHero11EasyPhotoPreset =
    currentGroupId === GoProPresetGroup.PHOTO &&
    currentPresetId !== undefined &&
    HERO11_EASY_PHOTO_PRESETS.has(currentPresetId);
  const isHero11EasyTimelapsePreset =
    currentGroupId === GoProPresetGroup.TIMELAPSE &&
    currentPresetId !== undefined &&
    HERO11_EASY_TIMELAPSE_PRESETS.has(currentPresetId);

  if (nextValues.length === 0 && settingId === GoProSettingId.FPS && isLegacyEasyVideoPreset) {
    const is50Hz = isAntiFlicker50Hz(settings[GoProSettingId.ANTI_FLICKER]);
    nextValues = is50Hz ? [6, 9, 10] : [5, 8, 10];
  }

  if (
    nextValues.length === 0 &&
    settingId === GoProSettingId.PHOTO_LENS &&
    isHero11EasyPhotoPreset
  ) {
    nextValues = [101, 102];
  }

  if (settingId === GoProSettingId.VIDEO_LENS && isHero11EasyTimelapsePreset) {
    nextValues =
      nextValues.length === 0 ? [0, 4] : nextValues.filter((value) => value === 0 || value === 4);
  }

  if (
    settingId === GoProSettingId.VIDEO_LENS &&
    currentPresetId !== undefined &&
    classifyTimelapsePreset(currentPresetId) === 'trail_like'
  ) {
    nextValues = nextValues.length === 0 ? [0] : nextValues.filter((value) => value === 0);
  }

  if (settingId === GoProSettingId.HORIZONTAL_LEVELING && currentPresetId === PRESET_MAX_VIDEO) {
    const maxHypersmoothValue =
      pendingSettings[GoProSettingId.HYPERSMOOTH_MAX] ?? settings[GoProSettingId.HYPERSMOOTH_MAX];
    nextValues = maxHypersmoothValue !== undefined && maxHypersmoothValue !== 0 ? nextValues : [];
  }

  return nextValues;
};

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
import { GoProPresetGroup } from '../../constants/GoProPresetGroup';
import { EASY_VIDEO_PRESETS, classifyTimelapsePreset } from '../../constants/layout';
import { PRESET_MAX_VIDEO } from '../../constants/presetIds';
import { isAntiFlicker50Hz } from '../shared/selectableValueHelpers';
import type { SelectableValuesResolver } from '../shared/types';

export const heromi11SelectableValuesResolver: SelectableValuesResolver = ({
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

  if (nextValues.length === 0 && settingId === GoProSettingId.FPS && isLegacyEasyVideoPreset) {
    const is50Hz = isAntiFlicker50Hz(settings[GoProSettingId.ANTI_FLICKER]);
    nextValues = is50Hz ? [6, 9, 10] : [5, 8, 10];
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

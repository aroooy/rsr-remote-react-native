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
import { PRESET_MAX_VIDEO } from '../../constants/presetIds';
import type { SelectableValuesResolver } from '../shared/types';

const HERO10_RESOLUTION_ORDER = [100, 1, 4, 9, 25, 18, 6];

export const hero10SelectableValuesResolver: SelectableValuesResolver = ({
  settingId,
  selectableValues,
  settings,
  pendingSettings,
  currentPresetId,
}) => {
  let nextValues = [...selectableValues];

  if (settingId === GoProSettingId.RESOLUTION) {
    nextValues.sort((a, b) => {
      const indexA = HERO10_RESOLUTION_ORDER.indexOf(a);
      const indexB = HERO10_RESOLUTION_ORDER.indexOf(b);
      const valA = indexA === -1 ? 999 : indexA;
      const valB = indexB === -1 ? 999 : indexB;
      return valA - valB;
    });
  }

  if (settingId === GoProSettingId.HYPERSMOOTH_MAX) {
    nextValues = nextValues.map((value) => (value === 1 ? 100 : value));
  }

  if (settingId === GoProSettingId.HORIZONTAL_LEVELING && currentPresetId === PRESET_MAX_VIDEO) {
    const maxHypersmoothValue =
      pendingSettings[GoProSettingId.HYPERSMOOTH_MAX] ?? settings[GoProSettingId.HYPERSMOOTH_MAX];
    nextValues = maxHypersmoothValue !== undefined && maxHypersmoothValue !== 0 ? nextValues : [];
  }

  return nextValues;
};

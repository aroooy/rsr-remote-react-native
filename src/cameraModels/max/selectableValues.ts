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
import {
  MAX_360_PRESET_IDS,
  PRESET_MAX_TIMELAPSE,
  PRESET_MAX_TIMEWARP,
  PRESET_TIMELAPSE,
} from '../../constants/presetIds';
import { isAntiFlicker50Hz } from '../shared/selectableValueHelpers';
import type { SelectableValuesResolver } from '../shared/types';

export const maxSelectableValuesResolver: SelectableValuesResolver = ({
  settingId,
  selectableValues,
  settings,
  currentPresetId,
}) => {
  let nextValues = [...selectableValues];

  if (nextValues.length === 0 && settingId === GoProSettingId.FPS) {
    const is50Hz = isAntiFlicker50Hz(settings[GoProSettingId.ANTI_FLICKER]);
    nextValues = is50Hz ? [6, 9, 10] : [5, 8, 10];
  }

  const is360 = MAX_360_PRESET_IDS.has(currentPresetId ?? -1);

  if (settingId === GoProSettingId.RESOLUTION) {
    if (currentPresetId === PRESET_MAX_TIMEWARP || currentPresetId === PRESET_MAX_TIMELAPSE) {
      nextValues = nextValues.filter((value) => value === 21);
    } else {
      nextValues = nextValues.filter((value) =>
        is360 ? value === 21 || value === 22 : value === 7 || value === 9,
      );
    }
  } else if (settingId === GoProSettingId.VIDEO_LENS) {
    if (currentPresetId === PRESET_MAX_TIMELAPSE) {
      nextValues = [];
    } else {
      nextValues = nextValues.filter((value) =>
        is360 ? value === 5 : value === 7 || value === 0 || value === 4 || value === 6,
      );
    }
  } else if (settingId === GoProSettingId.HYPERSMOOTH) {
    nextValues = is360 ? [] : nextValues;
  } else if (settingId === GoProSettingId.HORIZONTAL_LEVELING) {
    nextValues = is360 ? [] : nextValues;
  } else if (settingId === GoProSettingId.FPS) {
    if (currentPresetId === PRESET_MAX_TIMELAPSE) {
      nextValues = [];
    } else {
      const isHeroTimelapse = currentPresetId === PRESET_TIMELAPSE;
      const isVideoFormat =
        settings[GoProSettingId.MEDIA_FORMAT] !== 20 &&
        settings[GoProSettingId.MEDIA_FORMAT] !== 21;
      const isSingleLens = settings[GoProSettingId.MAX_LENS_MODE] === 0;
      if (isHeroTimelapse && isVideoFormat && isSingleLens) {
        nextValues = [];
      }
    }
  } else if (settingId === GoProSettingId.PHOTO_LENS) {
    nextValues = is360 ? [] : nextValues;
  } else if (settingId === GoProSettingId.TIMELAPSE_PHOTO_OUTPUT) {
    if (currentPresetId === PRESET_TIMELAPSE || currentPresetId === PRESET_MAX_TIMELAPSE) {
      nextValues = [];
    }
  } else if (settingId === GoProSettingId.MAX_AUDIO_MODE) {
    nextValues = is360 ? [5, 0] : [0, 1, 2, 3];
  }

  return nextValues;
};

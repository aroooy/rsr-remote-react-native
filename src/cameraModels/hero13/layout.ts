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
import {
  HERO13_EASY_ANAMORPHIC_NIGHT_PHOTO_PRESET,
  HERO13_EASY_ANAMORPHIC_SUPER_PHOTO_PRESET,
  HERO13_EASY_ANAMORPHIC_TIMEWARP_PRESET,
  HERO13_EASY_BURST_PHOTO_PRESET,
  HERO13_EASY_MACRO_NIGHT_PHOTO_PRESET,
  HERO13_EASY_MACRO_PHOTO_PRESET,
  HERO13_EASY_MACRO_TIMELAPSE_PRESET,
  HERO13_EASY_MAX_PHOTO_PRESET,
  HERO13_EASY_MAX_TIMEWARP_PRESET,
  HERO13_EASY_PHOTO_PRESET_IDS,
  HERO13_EASY_SUPER_PHOTO_PRESET,
  HERO13_EASY_TIMELAPSE_PRESET_IDS,
  HERO13_EASY_TIMEWARP_PRESET,
  HERO13_EASY_TRAIL_PRESET_IDS,
} from '../../constants/hero13PresetIds';
import type { ModelDisplayLayoutResolver, ResolveModelDisplayLayoutParams } from '../shared/types';

const LENS_ATTACHMENT_SETTING_ID = 217;
const HERO13_ND_ATTACHMENT_VALUES: ReadonlySet<number> = new Set([6, 7, 8, 9]);

// Avoid importing GoProSettingIds here to keep display-layout resolution free of cycles.
const HERO13_EASY_BURST_PHOTO_LAYOUT = {
  quickSettingIds: [231, 105],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
} as const;

const HERO13_EASY_PHOTO_LENS_TIMER_INTERVAL_LAYOUT = {
  quickSettingIds: [122, 105, 171],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
} as const;

const HERO13_EASY_PHOTO_LENS_TIMER_LAYOUT = {
  quickSettingIds: [122, 105],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
} as const;

const HERO13_EASY_MAX_PHOTO_LAYOUT = {
  quickSettingIds: [166, 122, 105],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
} as const;

// Hero13 easy timelapse presets use VIDEO_LENS_HERO13 (229) for the lens toggle.
const HERO13_EASY_TIMELAPSE_LAYOUT = {
  quickSettingIds: [229],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
} as const;

const HERO13_EASY_TRAIL_LAYOUT = {
  quickSettingIds: [229, 179],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
} as const;

const HERO13_EASY_TIMEWARP_LAYOUT = {
  quickSettingIds: [229, 201],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
} as const;

const HERO13_EASY_MAX_TIMEWARP_LAYOUT = {
  quickSettingIds: [229, 165],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
} as const;

const HERO13_EASY_MACRO_TIMELAPSE_LAYOUT = {
  quickSettingIds: [2, 3, 229, 201],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
} as const;

export const hero13DisplayLayoutResolver: ModelDisplayLayoutResolver = ({
  settings,
  currentGroupId,
  currentPresetId,
  cameraModel,
  composeDisplayLayout,
  getCameraAdvancedSettingIds,
  layouts,
}: ResolveModelDisplayLayoutParams) => {
  if (
    currentGroupId === GoProPresetGroup.PHOTO &&
    currentPresetId !== undefined &&
    HERO13_EASY_PHOTO_PRESET_IDS.has(currentPresetId)
  ) {
    const lensAttachment = settings[LENS_ATTACHMENT_SETTING_ID];
    const shouldUseLensIntervalLayout =
      currentPresetId === HERO13_EASY_MACRO_PHOTO_PRESET ||
      currentPresetId === HERO13_EASY_MACRO_NIGHT_PHOTO_PRESET ||
      currentPresetId === HERO13_EASY_ANAMORPHIC_SUPER_PHOTO_PRESET ||
      (currentPresetId === HERO13_EASY_SUPER_PHOTO_PRESET &&
        lensAttachment !== undefined &&
        HERO13_ND_ATTACHMENT_VALUES.has(lensAttachment));
    const shouldUseLensTimerLayout = currentPresetId === HERO13_EASY_ANAMORPHIC_NIGHT_PHOTO_PRESET;

    if (shouldUseLensIntervalLayout) {
      return composeDisplayLayout(
        HERO13_EASY_PHOTO_LENS_TIMER_INTERVAL_LAYOUT,
        getCameraAdvancedSettingIds(cameraModel),
      );
    }

    if (shouldUseLensTimerLayout) {
      return composeDisplayLayout(
        HERO13_EASY_PHOTO_LENS_TIMER_LAYOUT,
        getCameraAdvancedSettingIds(cameraModel),
      );
    }

    if (currentPresetId === HERO13_EASY_MAX_PHOTO_PRESET) {
      return composeDisplayLayout(
        HERO13_EASY_MAX_PHOTO_LAYOUT,
        getCameraAdvancedSettingIds(cameraModel),
      );
    }

    if (currentPresetId === HERO13_EASY_BURST_PHOTO_PRESET) {
      return composeDisplayLayout(
        HERO13_EASY_BURST_PHOTO_LAYOUT,
        getCameraAdvancedSettingIds(cameraModel),
      );
    }

    return composeDisplayLayout(layouts.hero11EasyPhoto, getCameraAdvancedSettingIds(cameraModel));
  }

  if (
    currentGroupId === GoProPresetGroup.TIMELAPSE &&
    currentPresetId !== undefined &&
    HERO13_EASY_TIMELAPSE_PRESET_IDS.has(currentPresetId)
  ) {
    if (currentPresetId === HERO13_EASY_MACRO_TIMELAPSE_PRESET) {
      return composeDisplayLayout(
        HERO13_EASY_MACRO_TIMELAPSE_LAYOUT,
        getCameraAdvancedSettingIds(cameraModel),
      );
    }

    if (currentPresetId === HERO13_EASY_TIMEWARP_PRESET) {
      return composeDisplayLayout(
        HERO13_EASY_TIMEWARP_LAYOUT,
        getCameraAdvancedSettingIds(cameraModel),
      );
    }

    if (currentPresetId === HERO13_EASY_MAX_TIMEWARP_PRESET) {
      return composeDisplayLayout(
        HERO13_EASY_MAX_TIMEWARP_LAYOUT,
        getCameraAdvancedSettingIds(cameraModel),
      );
    }

    if (currentPresetId === HERO13_EASY_ANAMORPHIC_TIMEWARP_PRESET) {
      return composeDisplayLayout(
        HERO13_EASY_TIMEWARP_LAYOUT,
        getCameraAdvancedSettingIds(cameraModel),
      );
    }

    if (HERO13_EASY_TRAIL_PRESET_IDS.has(currentPresetId)) {
      return composeDisplayLayout(
        HERO13_EASY_TRAIL_LAYOUT,
        getCameraAdvancedSettingIds(cameraModel),
      );
    }

    return composeDisplayLayout(
      HERO13_EASY_TIMELAPSE_LAYOUT,
      getCameraAdvancedSettingIds(cameraModel),
    );
  }

  return undefined;
};

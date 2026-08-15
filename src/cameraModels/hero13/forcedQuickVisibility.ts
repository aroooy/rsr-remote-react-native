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
import type { ForceQuickVisibilityResolver } from '../shared/types';

const LENS_ATTACHMENT_SETTING_ID = 217;
const HERO13_ND_ATTACHMENT_VALUES: ReadonlySet<number> = new Set([6, 7, 8, 9]);

export const hero13ForcedQuickVisibilityResolver: ForceQuickVisibilityResolver = ({
  settingId,
  settings,
  currentGroupId,
  currentPresetId,
  isHero12Or13MaxVideoPreset,
}) => {
  const lensAttachment = settings[LENS_ATTACHMENT_SETTING_ID];
  const shouldUseLensIntervalLayout =
    currentPresetId === HERO13_EASY_MACRO_PHOTO_PRESET ||
    currentPresetId === HERO13_EASY_MACRO_NIGHT_PHOTO_PRESET ||
    currentPresetId === HERO13_EASY_ANAMORPHIC_SUPER_PHOTO_PRESET ||
    (currentPresetId === HERO13_EASY_SUPER_PHOTO_PRESET &&
      lensAttachment !== undefined &&
      HERO13_ND_ATTACHMENT_VALUES.has(lensAttachment));
  const shouldUseLensTimerLayout = currentPresetId === HERO13_EASY_ANAMORPHIC_NIGHT_PHOTO_PRESET;

  if (
    currentGroupId === GoProPresetGroup.PHOTO &&
    currentPresetId !== undefined &&
    HERO13_EASY_PHOTO_PRESET_IDS.has(currentPresetId) &&
    ((currentPresetId === HERO13_EASY_BURST_PHOTO_PRESET &&
      (settingId === GoProSettingId.MULTI_SHOT_LENS ||
        settingId === GoProSettingId.CAPTURE_DELAY)) ||
      (currentPresetId === HERO13_EASY_MAX_PHOTO_PRESET &&
        (settingId === GoProSettingId.HORIZONTAL_LOCK ||
          settingId === GoProSettingId.PHOTO_LENS ||
          settingId === GoProSettingId.CAPTURE_DELAY)) ||
      (shouldUseLensIntervalLayout &&
        (settingId === GoProSettingId.PHOTO_LENS ||
          settingId === GoProSettingId.CAPTURE_DELAY ||
          settingId === GoProSettingId.PHOTO_INTERVAL)) ||
      (shouldUseLensTimerLayout &&
        (settingId === GoProSettingId.PHOTO_LENS || settingId === GoProSettingId.CAPTURE_DELAY)) ||
      (!shouldUseLensIntervalLayout &&
        !shouldUseLensTimerLayout &&
        currentPresetId !== HERO13_EASY_BURST_PHOTO_PRESET &&
        currentPresetId !== HERO13_EASY_MAX_PHOTO_PRESET &&
        (settingId === GoProSettingId.PHOTO_LENS || settingId === GoProSettingId.CAPTURE_DELAY)))
  ) {
    return true;
  }

  if (
    currentGroupId === GoProPresetGroup.TIMELAPSE &&
    currentPresetId !== undefined &&
    HERO13_EASY_TIMELAPSE_PRESET_IDS.has(currentPresetId) &&
    ((currentPresetId === HERO13_EASY_MAX_TIMEWARP_PRESET &&
      settingId === GoProSettingId.HORIZONTAL_LEVELING) ||
      (currentPresetId === HERO13_EASY_MAX_TIMEWARP_PRESET &&
        settingId === GoProSettingId.VIDEO_LENS_HERO13) ||
      ((currentPresetId === HERO13_EASY_MACRO_TIMELAPSE_PRESET ||
        currentPresetId === HERO13_EASY_TIMEWARP_PRESET ||
        currentPresetId === HERO13_EASY_ANAMORPHIC_TIMEWARP_PRESET ||
        HERO13_EASY_TRAIL_PRESET_IDS.has(currentPresetId)) &&
        settingId === GoProSettingId.VIDEO_LENS_HERO13) ||
      ((currentPresetId === HERO13_EASY_MACRO_TIMELAPSE_PRESET ||
        currentPresetId === HERO13_EASY_TIMEWARP_PRESET ||
        currentPresetId === HERO13_EASY_ANAMORPHIC_TIMEWARP_PRESET) &&
        settingId === GoProSettingId.EASY_VIDEO_QUALITY))
  ) {
    return true;
  }

  if (isHero12Or13MaxVideoPreset && settingId === GoProSettingId.HYPERSMOOTH) {
    return true;
  }

  return undefined;
};

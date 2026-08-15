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

import { GoProPresetGroup, GoProPresetGroupSelectId } from './GoProPresetGroup';

// GoProSettingId is defined in GoProSettingId.ts to avoid circular dependencies
import { GoProSettingId } from './GoProSettingId';
export { GoProSettingId };

// Imported from capabilityDependencies for local use and re-exported (see capabilityDependencies/refreshTriggers.ts)
import {
  CAPABILITY_REFRESH_DEPENDENCIES,
  CAPABILITY_REFRESH_TRIGGER_IDS,
  RESTORE_PRIORITY_ORDER,
  PRESET_REFRESH_TRIGGER_IDS,
  CAMERA_ADVANCED_SETTING_IDS,
  PRESET_RESTORE_SYSTEM_SETTING_IDS,
  DASHBOARD_SUB_SETTING_IDS,
} from './capabilityDependencies/refreshTriggers';
export {
  CAPABILITY_REFRESH_DEPENDENCIES,
  CAPABILITY_REFRESH_TRIGGER_IDS,
  RESTORE_PRIORITY_ORDER,
  PRESET_REFRESH_TRIGGER_IDS,
  CAMERA_ADVANCED_SETTING_IDS,
  PRESET_RESTORE_SYSTEM_SETTING_IDS,
  DASHBOARD_SUB_SETTING_IDS,
};

// Re-export GoProPresetGroup symbols for backward compatibility
export { GoProPresetGroup, GoProPresetGroupSelectId };

export {
  MODE_AND_PROFILE_SETTING_IDS,
  PRIMARY_SETTING_IDS,
  PRIMARY_SETTING_DISPLAY_ORDER,
  findActivePreset,
  LayoutBuilder,
  composeDisplayLayout,
  GoProVideoPreset,
  fallbackPresetsByModel,
  EASY_VIDEO_PRESETS,
  HERO11_EB_VIDEO_PRESETS,
  HERO11_LB_VIDEO_PRESETS,
  HERO11_NO_87_VIDEO_PRESETS,
  HERO13_EASY_NORMAL_PRESET_GROUPS,
  HERO13_EASY_NORMAL_PRESET_IDS,
  HERO13_EASY_MAXLENS2_PRESET_GROUPS,
  HERO13_EASY_MAXLENS2_PRESET_IDS,
  HERO13_EASY_ANAMORPHIC_PRESET_GROUPS,
  HERO13_EASY_ANAMORPHIC_PRESET_IDS,
  HERO13_EASY_MACRO_PRESET_GROUPS,
  HERO13_EASY_MACRO_PRESET_IDS,
  HERO12_EASY_NORMAL_PRESET_GROUPS,
  HERO12_EASY_NORMAL_PRESET_IDS,
  HERO12_EASY_MAXLENS2_PRESET_GROUPS,
  HERO12_EASY_MAXLENS2_PRESET_IDS,
  HERO12_NO_ASPECT_EASY_VIDEO_PRESETS,
  FOUR_BYTE_SETTING_IDS,
  MACRO_VIDEO_PRESET_HERO13,
  EASY_MACRO_PHOTO_PRESET_HERO13,
  EASY_MACRO_NIGHT_PHOTO_PRESET_HERO13,
  EASY_MACRO_TIMELAPSE_PRESET_HERO13,
  EASY_MACRO_NIGHTLAPSE_PRESET_HERO13,
  BURST_LIKE_PHOTO_PRESETS,
  HERO11_EASY_PHOTO_PRESETS,
  HERO11_EASY_TIMELAPSE_PRESETS,
  LAPSE_WITH_PHOTO_PRESETS,
  classifyTimelapsePreset,
  isTimelapseLikePreset,
  getDisplayLayout,
  isDefaultVisibleAdvancedSetting,
  getDisplaySettingPlan,
  getCapabilityDependencyRefreshIds,
} from './layout';

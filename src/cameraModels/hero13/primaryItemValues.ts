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

import { GoProSettingId, MACRO_VIDEO_PRESET_HERO13 } from '../../constants/GoProSettingIds';
import {
  HERO13_EASY_ANAMORPHIC_TIMEWARP_PRESET,
  HERO13_EASY_MACRO_TIMELAPSE_PRESET,
  HERO13_EASY_TRAIL_PRESET_IDS,
  HERO13_MACRO_NIGHTLAPSE_PRESET,
  HERO13_MACRO_TIMELAPSE_PRESET,
} from '../../constants/hero13PresetIds';
import { getResolutionMap } from '../../constants/ResolutionAspectMap';
import type { PrimaryItemValuesResolver } from '../shared/types';

const MACRO_VIDEO_VALID_PROFILES = new Set([0, 100, 2, 3, 102]);
const HERO13_VIDEO_PROFILE_ORDER = [0, 101, 1, 2, 3, 100, 102, 200];
const HERO13_MACRO_TIMELAPSE_VIDEO_FORMATS = new Set([13]);
const HERO13_MACRO_NIGHTLAPSE_VIDEO_FORMATS = new Set([26]);

export const hero13PrimaryItemValuesResolver: PrimaryItemValuesResolver = ({
  settingId,
  allowedValues,
  settings,
  cameraModel,
  currentPresetId,
}) => {
  let nextValues = [...allowedValues];

  if (settingId === GoProSettingId.RESOLUTION && currentPresetId === MACRO_VIDEO_PRESET_HERO13) {
    const resolutionMap = getResolutionMap(cameraModel);
    nextValues = nextValues.filter((value) => {
      const aspect = resolutionMap[value]?.aspect;
      return aspect === '16:9' || aspect === '4:3';
    });
  }

  if (settingId === GoProSettingId.VIDEO_PROFILE && currentPresetId === MACRO_VIDEO_PRESET_HERO13) {
    nextValues = nextValues.filter((value) => MACRO_VIDEO_VALID_PROFILES.has(value));
  }

  if (settingId === GoProSettingId.VIDEO_PROFILE && currentPresetId !== MACRO_VIDEO_PRESET_HERO13) {
    const hlgHdr = settings[GoProSettingId.HLG_HDR];
    if (hlgHdr !== undefined) {
      if (hlgHdr === 0) {
        let values = nextValues.filter((value) => value !== 101);
        if (!values.includes(1)) {
          values = [...values, 1];
        }
        nextValues = values.sort((left, right) => {
          const leftIndex = HERO13_VIDEO_PROFILE_ORDER.indexOf(left);
          const rightIndex = HERO13_VIDEO_PROFILE_ORDER.indexOf(right);
          return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
        });
      } else {
        let values = nextValues.filter((value) => value !== 1);
        if (!values.includes(101)) {
          values = [...values, 101];
        }
        nextValues = values.sort((left, right) => {
          const leftIndex = HERO13_VIDEO_PROFILE_ORDER.indexOf(left);
          const rightIndex = HERO13_VIDEO_PROFILE_ORDER.indexOf(right);
          return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
        });
      }
    }
  }

  if (
    settingId === GoProSettingId.MEDIA_FORMAT &&
    currentPresetId === HERO13_MACRO_TIMELAPSE_PRESET
  ) {
    nextValues = nextValues.filter((value) => HERO13_MACRO_TIMELAPSE_VIDEO_FORMATS.has(value));
  }

  if (
    settingId === GoProSettingId.MEDIA_FORMAT &&
    currentPresetId === HERO13_MACRO_NIGHTLAPSE_PRESET
  ) {
    nextValues = nextValues.filter((value) => HERO13_MACRO_NIGHTLAPSE_VIDEO_FORMATS.has(value));
  }

  if (
    settingId === GoProSettingId.EASY_VIDEO_QUALITY &&
    currentPresetId === HERO13_EASY_MACRO_TIMELAPSE_PRESET
  ) {
    nextValues = nextValues.filter((value) => value === 0 || value === 1);
  }

  if (
    settingId === GoProSettingId.EASY_VIDEO_QUALITY &&
    currentPresetId === HERO13_EASY_ANAMORPHIC_TIMEWARP_PRESET
  ) {
    nextValues = nextValues.filter((value) => value === 0 || value === 1);
  }

  if (
    settingId === GoProSettingId.EASY_VIDEO_QUALITY &&
    currentPresetId !== undefined &&
    HERO13_EASY_TRAIL_PRESET_IDS.has(currentPresetId)
  ) {
    nextValues = nextValues.filter((value) => value === 0 || value === 1);
  }

  return nextValues;
};

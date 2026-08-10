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
  GoProSettingId,
  GoProVideoPreset,
  HERO13_EASY_MAXLENS2_PRESET_IDS,
  MACRO_VIDEO_PRESET_HERO13,
} from '../../constants/GoProSettingIds';
import {
  HERO13_EASY_ANAMORPHIC_TIMEWARP_PRESET,
  HERO13_EASY_MAX_VIDEO_PRESET,
  HERO13_MACRO_LAPSE_PRESET_IDS,
  HERO13_MAX_TIMEWARP_2_PRESET,
  HERO13_MAX_TRAIL_2_PRESET_IDS,
} from '../../constants/hero13PresetIds';
import type { AspectRatio } from '../../constants/ResolutionAspectMap';
import { DEFAULT_FRAMING_OPTIONS } from '../shared/framingHelpers';
import type { FramingSelectorResolver } from '../shared/types';

type Hero13FramingAspect = AspectRatio | '1:1';

const HERO13_MAX_LENS_VIDEO_ASPECTS = [
  { label: '16:9', aspect: '16:9', ratio: [16, 9] as [number, number] },
  { label: '9:16', aspect: '9:16', ratio: [9, 16] as [number, number] },
  { label: '4:3', aspect: '4:3', ratio: [4, 3] as [number, number] },
  { label: '1:1', aspect: '1:1', ratio: [1, 1] as [number, number] },
] as const satisfies readonly {
  label: string;
  aspect: Hero13FramingAspect;
  ratio: [number, number];
}[];

const HERO13_ASPECT_TO_VALUE: Record<Hero13FramingAspect, number> = {
  '4:3': 0,
  '16:9': 1,
  '8:7': 3,
  '9:16': 4,
  '1:1': 6,
};

export const hero13FramingSelectorResolver: FramingSelectorResolver = ({
  settings,
  currentPresetId,
  isVideoGroup,
  isTimelapseVideo,
  isTimelapseVideoLike,
  isTrailLike,
  isTimewarpLike,
}) => {
  const framingSettingId = isTimelapseVideoLike
    ? GoProSettingId.MULTI_SHOT_FRAMING
    : GoProSettingId.VIDEO_FRAMING;
  const currentValue = settings[framingSettingId];
  const lensAttachment = settings[GoProSettingId.LENS_ATTACHMENT];
  const profileValue = settings[GoProSettingId.VIDEO_PROFILE];
  const isLogOrHdr =
    profileValue !== undefined && new Set<number>([1, 2, 3, 101, 102]).has(profileValue);
  const isEasyVideoPreset =
    isVideoGroup && currentPresetId !== undefined && EASY_VIDEO_PRESETS.has(currentPresetId);
  const isMacroVideoPreset = isVideoGroup && currentPresetId === MACRO_VIDEO_PRESET_HERO13;
  const isHero13MacroLapsePreset =
    isTimelapseVideoLike &&
    currentPresetId !== undefined &&
    HERO13_MACRO_LAPSE_PRESET_IDS.has(currentPresetId);
  const isHero13MaxLensVideoPreset =
    isVideoGroup &&
    currentPresetId !== undefined &&
    (currentPresetId === GoProVideoPreset.MAX_VIDEO_2_0 ||
      HERO13_EASY_MAXLENS2_PRESET_IDS.has(currentPresetId)) &&
    (lensAttachment === 2 || lensAttachment === 3);
  const isHero13MaxLensTimewarpPreset =
    isTimelapseVideoLike &&
    isTimewarpLike &&
    currentPresetId !== undefined &&
    (currentPresetId === HERO13_MAX_TIMEWARP_2_PRESET ||
      HERO13_EASY_MAXLENS2_PRESET_IDS.has(currentPresetId)) &&
    (lensAttachment === 2 || lensAttachment === 3);
  const isHero13MaxLensTrailPreset =
    isTimelapseVideoLike &&
    isTrailLike &&
    currentPresetId !== undefined &&
    HERO13_MAX_TRAIL_2_PRESET_IDS.has(currentPresetId) &&
    (lensAttachment === 2 || lensAttachment === 3);
  const isHero13EasyAnamorphicTimewarpPreset =
    isTimelapseVideoLike && currentPresetId === HERO13_EASY_ANAMORPHIC_TIMEWARP_PRESET;
  const isHero13EasyMaxVideoPreset =
    isVideoGroup && currentPresetId === HERO13_EASY_MAX_VIDEO_PRESET;
  const aspectOptions = isHero13MaxLensVideoPreset
    ? HERO13_MAX_LENS_VIDEO_ASPECTS
    : DEFAULT_FRAMING_OPTIONS;

  return aspectOptions.map(({ label, aspect, ratio }) => {
    const targetValue = HERO13_ASPECT_TO_VALUE[aspect];
    const isActive = currentValue === targetValue;
    const restrictedMacroVideo = isMacroVideoPreset && (aspect === '8:7' || aspect === '9:16');
    const restrictedMacroLapse =
      isHero13MacroLapsePreset && (aspect === '8:7' || aspect === '9:16');
    const restricted9x16And4x3 =
      !isMacroVideoPreset &&
      !isHero13MacroLapsePreset &&
      (isLogOrHdr || isTimelapseVideo) &&
      (aspect === '9:16' || aspect === '4:3');
    const restricted4x3Only =
      ((isTimewarpLike && !isHero13MaxLensTimewarpPreset) ||
        (isEasyVideoPreset && !isHero13MaxLensVideoPreset)) &&
      aspect === '4:3';
    const restrictedHero13TrailTo16987 = isTrailLike && (aspect === '9:16' || aspect === '4:3');
    const restrictedEasyMaxVideo43 = isHero13EasyMaxVideoPreset && aspect === '4:3';
    const restrictedEasyAnamorphicTimewarp =
      isHero13EasyAnamorphicTimewarpPreset && aspect !== '16:9';
    const restrictedHero13MaxLensTimewarp87 = isHero13MaxLensTimewarpPreset && aspect === '8:7';
    const restrictedHero13MaxLensTrail87 = isHero13MaxLensTrailPreset && aspect === '8:7';

    return {
      key: String(targetValue),
      label,
      ratio,
      isActive,
      isAvailable:
        !restrictedMacroVideo &&
        !restrictedMacroLapse &&
        !restricted9x16And4x3 &&
        !restricted4x3Only &&
        !restrictedHero13TrailTo16987 &&
        !restrictedEasyMaxVideo43 &&
        !restrictedEasyAnamorphicTimewarp &&
        !restrictedHero13MaxLensTimewarp87 &&
        !restrictedHero13MaxLensTrail87,
      settingId: framingSettingId,
      targetValue,
    };
  });
};

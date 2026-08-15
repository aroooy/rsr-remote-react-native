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
import { PRESET_MAX_TIMEWARP } from '../../constants/presetIds';
import { getHero12FallbackResolution, isHero12NewScheme } from './resolution';
import {
  findResolutionForAspect,
  getResolutionAspect,
  getResolutionMap,
  type AspectRatio,
} from '../../constants/ResolutionAspectMap';
import { DEFAULT_FRAMING_OPTIONS } from '../shared/framingHelpers';
import type { FramingSelectorResolver } from '../shared/types';

export const hero12FramingSelectorResolver: FramingSelectorResolver = ({
  capabilities,
  settings,
  cameraModel,
  currentPresetId,
  isTimelapseVideo,
  isTrailLike,
  isTimewarpLike,
  isHero12MaxVideo2Preset,
  isHero12MaxTimewarp2Preset,
  isHero12Trail2Preset,
}) => {
  const resolutionCaps = capabilities[GoProSettingId.RESOLUTION] ?? [];
  const currentRes = settings[GoProSettingId.RESOLUTION];
  const currentAspect = getResolutionAspect(cameraModel, currentRes);
  const maxLensAttached = settings[GoProSettingId.MAX_LENS_MOD_HERO13];
  const profileValue = settings[GoProSettingId.VIDEO_PROFILE];
  const isLogOrHdr =
    profileValue !== undefined && new Set<number>([1, 2, 3, 101, 102]).has(profileValue);

  if (isLogOrHdr && maxLensAttached !== undefined && maxLensAttached >= 1) {
    return null;
  }

  const allowedByMaxLens = new Set<AspectRatio>();
  if (maxLensAttached === 1) {
    allowedByMaxLens.add('16:9');
    allowedByMaxLens.add('4:3');
  } else if (maxLensAttached === 2) {
    allowedByMaxLens.add('16:9');
    if (isHero12MaxVideo2Preset) {
      allowedByMaxLens.add('9:16');
      allowedByMaxLens.add('4:3');
    } else if (isHero12MaxTimewarp2Preset || isHero12Trail2Preset) {
      allowedByMaxLens.add('4:3');
    } else {
      allowedByMaxLens.add('9:16');
      allowedByMaxLens.add('8:7');
    }
  } else {
    DEFAULT_FRAMING_OPTIONS.forEach((option) => allowedByMaxLens.add(option.aspect));
  }

  if (currentAspect) {
    allowedByMaxLens.add(currentAspect);
  }

  const isHero12MaxLens1TimewarpPreset =
    maxLensAttached === 1 && currentPresetId === PRESET_MAX_TIMEWARP;
  const isHero12MaxLens2TimewarpPreset = maxLensAttached === 2 && isHero12MaxTimewarp2Preset;

  return DEFAULT_FRAMING_OPTIONS.map(({ label, aspect, ratio }) => {
    const isActive = currentAspect === aspect;
    const restrictedByProfile = isLogOrHdr && (aspect === '4:3' || aspect === '9:16');
    const restrictedByHero12MaxVideo2 = isHero12MaxVideo2Preset && aspect === '8:7';
    const restrictedByHero12MaxTimewarp2 =
      isHero12MaxLens2TimewarpPreset && (aspect === '8:7' || aspect === '9:16');
    const restrictedByHero12Trail2 =
      isHero12Trail2Preset && (aspect === '8:7' || aspect === '9:16');
    const restrictedByTimelapse =
      ((isTrailLike || isTimelapseVideo) &&
        !isHero12Trail2Preset &&
        (aspect === '4:3' || aspect === '9:16')) ||
      (isTimewarpLike &&
        aspect === '4:3' &&
        !isHero12MaxLens1TimewarpPreset &&
        !isHero12MaxLens2TimewarpPreset);

    let targetValue: number | null;
    if (isLogOrHdr && aspect === '8:7') {
      const resolutionMap = getResolutionMap(cameraModel);
      targetValue =
        resolutionCaps.find((value) => {
          const entry = resolutionMap[value];
          return entry !== undefined && entry.aspect === '8:7' && entry.family === '4K';
        }) ?? null;
      if (targetValue === null) {
        targetValue = isHero12NewScheme(currentRes ?? 0) ? 28 : 108;
      }
    } else {
      targetValue = findResolutionForAspect(cameraModel, currentRes, aspect, resolutionCaps);
      if (targetValue === null) {
        targetValue = getHero12FallbackResolution(currentRes, aspect, maxLensAttached);
      }
    }

    return {
      key: aspect,
      label,
      ratio,
      isActive,
      isAvailable:
        !restrictedByProfile &&
        !restrictedByHero12MaxVideo2 &&
        !restrictedByHero12MaxTimewarp2 &&
        !restrictedByHero12Trail2 &&
        !restrictedByTimelapse &&
        allowedByMaxLens.has(aspect),
      settingId: GoProSettingId.RESOLUTION,
      targetValue,
    };
  });
};

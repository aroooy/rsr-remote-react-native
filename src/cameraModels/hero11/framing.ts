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
  GoProSettingId,
  HERO11_LB_VIDEO_PRESETS,
  HERO11_NO_87_VIDEO_PRESETS,
} from '../../constants/GoProSettingIds';
import {
  findResolutionForAspect,
  getHero11FallbackResolution,
  getResolutionAspect,
  type AspectRatio,
} from '../../constants/ResolutionAspectMap';
import { DEFAULT_FRAMING_OPTIONS } from '../shared/framingHelpers';
import type { FramingSelectorResolver } from '../shared/types';
import { resolveModelNoFromCameraModelKey } from '../shared/modelNumber';
import { isHero11FamilyModel, isHero11Model } from '../shared/modelNoHelpers';
import { PRESET_MAX_VIDEO } from '../../constants/presetIds';

export const hero11FramingSelectorResolver: FramingSelectorResolver = ({
  capabilities,
  settings,
  cameraModel,
  currentPresetId,
  isTimelapseVideo,
  isTrailLike,
  isTimewarpLike,
}) => {
  const resolutionCaps = capabilities[GoProSettingId.RESOLUTION] ?? [];
  const currentRes = settings[GoProSettingId.RESOLUTION];
  const currentAspect = getResolutionAspect(cameraModel, currentRes);
  const maxLensModEnabled = settings[GoProSettingId.MAX_LENS_MOD_ENABLE];
  const modelNo = resolveModelNoFromCameraModelKey(cameraModel);
  const isMaxVideoPreset = currentPresetId === PRESET_MAX_VIDEO;
  const isHero11No87Preset =
    isHero11Model(modelNo) &&
    currentPresetId !== undefined &&
    HERO11_NO_87_VIDEO_PRESETS.has(currentPresetId);
  const restrictedAspects: ReadonlySet<AspectRatio> =
    isHero11Model(modelNo) &&
    currentPresetId !== undefined &&
    HERO11_LB_VIDEO_PRESETS.has(currentPresetId)
      ? new Set<AspectRatio>(['4:3', '8:7'])
      : isHero11No87Preset
        ? new Set<AspectRatio>(['8:7'])
        : new Set<AspectRatio>();
  const allowedAspects: ReadonlySet<AspectRatio> = isMaxVideoPreset
    ? new Set<AspectRatio>(['16:9', '4:3', '8:7'])
    : maxLensModEnabled === 1
      ? new Set<AspectRatio>(['16:9', '4:3'])
      : new Set<AspectRatio>(['16:9', '4:3', '8:7']);

  return DEFAULT_FRAMING_OPTIONS.flatMap(({ label, aspect, ratio }) => {
    if (!allowedAspects.has(aspect)) {
      return [];
    }

    const isActive = currentAspect === aspect;
    const restrictedByTimelapse =
      ((isTrailLike || isTimewarpLike || isTimelapseVideo || isMaxVideoPreset) &&
        aspect === '8:7') ||
      restrictedAspects.has(aspect);
    const targetValue =
      findResolutionForAspect(cameraModel, currentRes, aspect, resolutionCaps) ??
      getHero11FallbackResolution(currentRes, aspect, maxLensModEnabled);
    const isAvailable = !restrictedByTimelapse && (isActive || targetValue !== null);

    return [
      {
        key: aspect,
        label,
        ratio,
        isActive,
        isAvailable,
        settingId: GoProSettingId.RESOLUTION,
        targetValue,
      },
    ];
  });
};

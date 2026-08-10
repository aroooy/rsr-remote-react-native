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
  GoProPresetGroup,
  GoProSettingId,
  HERO11_EASY_TIMELAPSE_PRESETS,
  HERO12_NO_ASPECT_EASY_VIDEO_PRESETS,
  LAPSE_WITH_PHOTO_PRESETS,
  classifyTimelapsePreset,
} from '../../constants/GoProSettingIds';
import { hero11FramingSelectorResolver } from '../../cameraModels/hero11/framing';
import { hero12FramingSelectorResolver } from '../../cameraModels/hero12/framing';
import { hero13FramingSelectorResolver } from '../../cameraModels/hero13/framing';
import { dispatchFramingSelectorResolver } from '../../cameraModels/shared/framing';
import type {
  FramingSelectorResolver,
  FramingSelectorResolverParams,
  ModelResolverMap,
  ResolveFramingSelectorParams,
} from '../../cameraModels/shared/types';
import { resolveModelNoFromCameraModelKey } from '../../cameraModels/shared/modelNumber';
import { isHero11Model, isHero12Model } from '../../cameraModels/shared/modelNoHelpers';
import { GOPRO_MODEL_NUMBERS } from '../../constants/GoProModelNumbers';

const FRAMING_SELECTOR_RESOLVERS: ModelResolverMap<FramingSelectorResolver> = {
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: hero11FramingSelectorResolver,
  [GOPRO_MODEL_NUMBERS.HERO12_BLACK]: hero12FramingSelectorResolver,
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: hero13FramingSelectorResolver,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: hero11FramingSelectorResolver,
};

const resolveLegacyFramingSelector: FramingSelectorResolver = () => null;

export const resolveFramingSelector = ({
  settings,
  capabilities,
  cameraModel,
  currentGroupId,
  currentPresetId,
  isTimelapseContextActive,
  isHero13BurstSloMoActive,
  isHero12MaxVideo2Preset,
  isHero12MaxTimewarp2Preset,
  isHero12Trail2Preset,
}: ResolveFramingSelectorParams) => {
  const derivedModelNo = resolveModelNoFromCameraModelKey(cameraModel);
  const isVideoGroup = currentGroupId === GoProPresetGroup.VIDEO;
  const isPhotoGroup = currentGroupId === GoProPresetGroup.PHOTO;
  const isTimelapseGroup = isTimelapseContextActive;
  const mediaFormat = settings[GoProSettingId.MEDIA_FORMAT];
  const isLapseWithPhoto =
    isTimelapseGroup &&
    currentPresetId !== undefined &&
    LAPSE_WITH_PHOTO_PRESETS.has(currentPresetId);
  const isTimelapseVideo =
    isLapseWithPhoto && (mediaFormat === 13 || mediaFormat === 26 || mediaFormat === undefined);
  const isTimelapsePhoto = isLapseWithPhoto && (mediaFormat === 20 || mediaFormat === 21);
  const isTimelapseVideoLike = isTimelapseGroup && !isTimelapsePhoto;
  const timelapseCategory = isTimelapseGroup ? classifyTimelapsePreset(currentPresetId) : null;
  const isTrailLike = timelapseCategory === 'trail_like';
  const isTimewarpLike = timelapseCategory === 'timewarp_like';

  if (isHero13BurstSloMoActive) {
    return null;
  }

  if (
    isHero12Model(derivedModelNo) &&
    isVideoGroup &&
    currentPresetId !== undefined &&
    HERO12_NO_ASPECT_EASY_VIDEO_PRESETS.has(currentPresetId)
  ) {
    return null;
  }

  if (
    isHero11Model(derivedModelNo) &&
    isVideoGroup &&
    currentPresetId !== undefined &&
    EASY_VIDEO_PRESETS.has(currentPresetId)
  ) {
    return null;
  }

  if (
    isHero11Model(derivedModelNo) &&
    isTimelapseGroup &&
    currentPresetId !== undefined &&
    HERO11_EASY_TIMELAPSE_PRESETS.has(currentPresetId)
  ) {
    return null;
  }

  if (isPhotoGroup || isTimelapsePhoto || (!isVideoGroup && !isTimelapseVideoLike)) {
    return null;
  }

  const resolverParams: FramingSelectorResolverParams = {
    settings,
    capabilities,
    cameraModel,
    currentGroupId,
    currentPresetId,
    isTimelapseContextActive,
    isHero13BurstSloMoActive,
    isHero12MaxVideo2Preset,
    isHero12MaxTimewarp2Preset,
    isHero12Trail2Preset,
    isVideoGroup,
    isTimelapseVideo,
    isTimelapseVideoLike,
    isTrailLike,
    isTimewarpLike,
  };

  return dispatchFramingSelectorResolver(
    resolverParams,
    FRAMING_SELECTOR_RESOLVERS,
    resolveLegacyFramingSelector,
  );
};

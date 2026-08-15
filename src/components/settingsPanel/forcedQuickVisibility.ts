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
import { BURST_LIKE_PHOTO_PRESETS } from '../../constants/layout';
import { hero09ForcedQuickVisibilityResolver } from '../../cameraModels/hero09/forcedQuickVisibility';
import { hero10ForcedQuickVisibilityResolver } from '../../cameraModels/hero10/forcedQuickVisibility';
import { hero11ForcedQuickVisibilityResolver } from '../../cameraModels/hero11/forcedQuickVisibility';
import { hero12ForcedQuickVisibilityResolver } from '../../cameraModels/hero12/forcedQuickVisibility';
import { hero13ForcedQuickVisibilityResolver } from '../../cameraModels/hero13/forcedQuickVisibility';
import { heromi11ForcedQuickVisibilityResolver } from '../../cameraModels/heromi11/forcedQuickVisibility';
import { maxForcedQuickVisibilityResolver } from '../../cameraModels/max/forcedQuickVisibility';
import { dispatchForceQuickVisibilityResolver } from '../../cameraModels/shared/forcedQuickVisibility';
import type {
  ForceQuickVisibilityParams,
  ForceQuickVisibilityResolver,
  ModelResolverMap,
} from '../../cameraModels/shared/types';
import { resolveModelNoFromCameraModelKey } from '../../cameraModels/shared/modelNumber';
import { isMaxModel } from '../../cameraModels/shared/modelNoHelpers';
import { GOPRO_MODEL_NUMBERS } from '../../constants/GoProModelNumbers';

const FORCED_QUICK_VISIBILITY_RESOLVERS: ModelResolverMap<ForceQuickVisibilityResolver> = {
  [GOPRO_MODEL_NUMBERS.HERO09_BLACK]: hero09ForcedQuickVisibilityResolver,
  [GOPRO_MODEL_NUMBERS.HERO10_BLACK]: hero10ForcedQuickVisibilityResolver,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: hero11ForcedQuickVisibilityResolver,
  [GOPRO_MODEL_NUMBERS.HERO12_BLACK]: hero12ForcedQuickVisibilityResolver,
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: hero13ForcedQuickVisibilityResolver,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: heromi11ForcedQuickVisibilityResolver,
  [GOPRO_MODEL_NUMBERS.MAX]: maxForcedQuickVisibilityResolver,
};

const resolveLegacyForcedQuickVisibility: ForceQuickVisibilityResolver = ({
  settingId,
  cameraModel,
  currentGroupId,
  currentPresetId,
  isEasyVideoActive,
  isTimelapsePhotoActive,
  forceVisibleStaticFallbackIds,
}) => {
  const modelNo = resolveModelNoFromCameraModelKey(cameraModel);
  if (
    settingId === GoProSettingId.TIMELAPSE_PHOTO_OUTPUT &&
    isTimelapsePhotoActive &&
    !isMaxModel(modelNo)
  ) {
    return true;
  }

  if (
    settingId === GoProSettingId.TIMELAPSE_PHOTO_OUTPUT &&
    currentGroupId === GoProPresetGroup.PHOTO &&
    currentPresetId !== undefined &&
    BURST_LIKE_PHOTO_PRESETS.has(currentPresetId)
  ) {
    return true;
  }

  if (settingId === GoProSettingId.EASY_VIDEO_QUALITY && isEasyVideoActive) {
    return true;
  }

  if (forceVisibleStaticFallbackIds.has(settingId)) {
    return true;
  }

  return false;
};

export const isForcedQuickSettingVisible = (params: ForceQuickVisibilityParams): boolean => {
  return (
    dispatchForceQuickVisibilityResolver(
      params,
      FORCED_QUICK_VISIBILITY_RESOLVERS,
      resolveLegacyForcedQuickVisibility,
    ) ?? false
  );
};

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

import { GOPRO_MODEL_NUMBERS } from './GoProModelNumbers';
import { hero09TimelapseLayoutStateResolver } from '../cameraModels/hero09/timelapseLayout';
import { hero10TimelapseLayoutStateResolver } from '../cameraModels/hero10/timelapseLayout';
import { hero11TimelapseLayoutStateResolver } from '../cameraModels/hero11/timelapseLayout';
import { hero13TimelapseLayoutStateResolver } from '../cameraModels/hero13/timelapseLayout';
import { heroMini11TimelapseLayoutStateResolver } from '../cameraModels/heromi11/timelapseLayout';
import { maxTimelapseLayoutStateResolver } from '../cameraModels/max/timelapseLayout';
import { dispatchTimelapseLayoutStateResolver } from '../cameraModels/shared/timelapseLayout';
import type {
  ModelResolverMap,
  ResolveTimelapseLayoutParams,
  TimelapseLayoutState,
  TimelapseLayoutStateResolver,
} from '../cameraModels/shared/types';

const TIMELAPSE_LAYOUT_STATE_RESOLVERS: ModelResolverMap<TimelapseLayoutStateResolver> = {
  [GOPRO_MODEL_NUMBERS.HERO09_BLACK]: hero09TimelapseLayoutStateResolver,
  [GOPRO_MODEL_NUMBERS.HERO10_BLACK]: hero10TimelapseLayoutStateResolver,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: hero11TimelapseLayoutStateResolver,
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: hero13TimelapseLayoutStateResolver,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: heroMini11TimelapseLayoutStateResolver,
  [GOPRO_MODEL_NUMBERS.MAX]: maxTimelapseLayoutStateResolver,
};

const resolveFallbackTimelapseLayoutState = ({
  activePreset,
  category,
  isPhotoFormat,
  isVideoFormat,
  ids,
  horizontalLevelingTimelapsePresets,
}: ResolveTimelapseLayoutParams): TimelapseLayoutState => {
  return {
    videoModeLensId: ids.videoLens,
    quickPhotoIds: [ids.timelapsePhotoOutput, ids.timeLapseLens],
    quickTimewarpIds: [ids.resolution, ids.fps, ids.videoLens],
    lapsePhotoOutputIds:
      category === 'lapse_with_photo' && isPhotoFormat ? [ids.timelapsePhotoOutput] : [],
    includeSpeedRamp: !(
      activePreset !== undefined && horizontalLevelingTimelapsePresets.has(activePreset)
    ),
    horizontalLevelingIds:
      category === 'timewarp_like' &&
      activePreset !== undefined &&
      horizontalLevelingTimelapsePresets.has(activePreset)
        ? [ids.horizontalLeveling]
        : [],
    lapseBitRateIds:
      category === 'lapse_with_photo' && isVideoFormat
        ? [ids.videoBitrate, ids.videoBitrateHero11]
        : [],
    windReductionSettingId: ids.maxWindReduction,
    omitDuration: false,
  };
};

export const resolveTimelapseLayoutState = (
  params: ResolveTimelapseLayoutParams,
): TimelapseLayoutState => {
  const baseState = resolveFallbackTimelapseLayoutState(params);
  const overrideState = dispatchTimelapseLayoutStateResolver(
    params,
    TIMELAPSE_LAYOUT_STATE_RESOLVERS,
  );
  return overrideState ? { ...baseState, ...overrideState } : baseState;
};

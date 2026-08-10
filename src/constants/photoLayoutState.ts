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
import { hero09PhotoLayoutStateResolver } from '../cameraModels/hero09/photoLayout';
import { hero13PhotoLayoutStateResolver } from '../cameraModels/hero13/photoLayout';
import { maxPhotoLayoutStateResolver } from '../cameraModels/max/photoLayout';
import { dispatchPhotoLayoutStateResolver } from '../cameraModels/shared/photoLayout';
import type {
  ModelResolverMap,
  PhotoLayoutState,
  PhotoLayoutStateResolver,
  ResolvePhotoLayoutParams,
} from '../cameraModels/shared/types';

const PHOTO_LAYOUT_STATE_RESOLVERS: ModelResolverMap<PhotoLayoutStateResolver> = {
  [GOPRO_MODEL_NUMBERS.HERO09_BLACK]: hero09PhotoLayoutStateResolver,
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: hero13PhotoLayoutStateResolver,
  [GOPRO_MODEL_NUMBERS.MAX]: maxPhotoLayoutStateResolver,
};

const resolveFallbackPhotoLayoutState = ({
  activePreset,
  isBurstLike,
  isNightPhoto,
  isLiveBurst,
  ids,
  horizontalLockPhotoPresets,
}: ResolvePhotoLayoutParams): PhotoLayoutState => {
  const lensSettingId = isBurstLike
    ? ids.multiShotLens
    : isLiveBurst
      ? ids.videoLens
      : ids.photoLens;

  let ssIsoIds: readonly number[];
  if (isNightPhoto) {
    ssIsoIds = [ids.nightPhotoShutter, ids.photoIsoMin, ids.photoIsoMax];
  } else if (isBurstLike) {
    ssIsoIds = [ids.multiShotIsoMin, ids.multiShotIsoMax];
  } else if (isLiveBurst) {
    ssIsoIds = [ids.videoShutter, ids.videoIsoMin, ids.videoIsoMax];
  } else {
    ssIsoIds = [ids.photoShutter, ids.photoIsoMin, ids.photoIsoMax];
  }

  return {
    lensSettingId,
    hasLens: true,
    hasHorizontalLock: activePreset !== undefined && horizontalLockPhotoPresets.has(activePreset),
    ssIsoIds,
    hasEvComp: !isBurstLike,
    liveBurstAdvancedIds: isLiveBurst ? [ids.maxWindReduction, ids.rawAudio] : [],
  };
};

export const resolvePhotoLayoutState = (params: ResolvePhotoLayoutParams): PhotoLayoutState => {
  const baseState = resolveFallbackPhotoLayoutState(params);
  const overrideState = dispatchPhotoLayoutStateResolver(params, PHOTO_LAYOUT_STATE_RESOLVERS);
  return overrideState ? { ...baseState, ...overrideState } : baseState;
};

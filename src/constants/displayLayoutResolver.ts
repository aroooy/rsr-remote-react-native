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
import { hero11DisplayLayoutResolver } from '../cameraModels/hero11/layout';
import { hero12DisplayLayoutResolver } from '../cameraModels/hero12/layout';
import { hero13DisplayLayoutResolver } from '../cameraModels/hero13/layout';
import { heroMini11DisplayLayoutResolver } from '../cameraModels/heromi11/layout';
import { maxDisplayLayoutResolver } from '../cameraModels/max/layout';
import { dispatchModelDisplayLayoutResolver } from '../cameraModels/shared/layout';
import type {
  ModelDisplayLayoutResolver,
  ModelResolverMap,
  ResolveModelDisplayLayoutParams,
} from '../cameraModels/shared/types';

const MODEL_DISPLAY_LAYOUT_RESOLVERS: ModelResolverMap<ModelDisplayLayoutResolver> = {
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: hero11DisplayLayoutResolver,
  [GOPRO_MODEL_NUMBERS.HERO12_BLACK]: hero12DisplayLayoutResolver,
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: hero13DisplayLayoutResolver,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: heroMini11DisplayLayoutResolver,
  [GOPRO_MODEL_NUMBERS.MAX]: maxDisplayLayoutResolver,
};

export const resolveModelDisplayLayout = (params: ResolveModelDisplayLayoutParams) => {
  const resolvedLayout = dispatchModelDisplayLayoutResolver(params, MODEL_DISPLAY_LAYOUT_RESOLVERS);
  if (resolvedLayout) {
    return resolvedLayout;
  }

  if (
    params.currentGroupId === params.presetGroups.photo &&
    params.currentPresetId !== undefined &&
    params.easyPhotoPresetIds.has(params.currentPresetId)
  ) {
    return params.layouts.easyPhotoTimelapse;
  }

  if (
    params.currentGroupId === params.presetGroups.timelapse &&
    params.currentPresetId !== undefined &&
    params.easyTimelapsePresetIds.has(params.currentPresetId)
  ) {
    return params.layouts.easyPhotoTimelapse;
  }

  return undefined;
};

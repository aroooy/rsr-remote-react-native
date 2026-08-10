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
import { hero09VideoLayoutResolver } from '../cameraModels/hero09/videoLayout';
import { hero10VideoLayoutResolver } from '../cameraModels/hero10/videoLayout';
import { hero11VideoLayoutResolver } from '../cameraModels/hero11/videoLayout';
import { hero13VideoLayoutResolver } from '../cameraModels/hero13/videoLayout';
import { heroMini11VideoLayoutResolver } from '../cameraModels/heromi11/videoLayout';
import { dispatchVideoLayoutResolver } from '../cameraModels/shared/videoLayout';
import type {
  ModelResolverMap,
  ResolveVideoLayoutParams,
  VideoLayoutResolver,
} from '../cameraModels/shared/types';

const VIDEO_LAYOUT_RESOLVERS: ModelResolverMap<VideoLayoutResolver> = {
  [GOPRO_MODEL_NUMBERS.HERO09_BLACK]: hero09VideoLayoutResolver,
  [GOPRO_MODEL_NUMBERS.HERO10_BLACK]: hero10VideoLayoutResolver,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: hero11VideoLayoutResolver,
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: hero13VideoLayoutResolver,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: heroMini11VideoLayoutResolver,
};

export const resolveVideoLayout = (params: ResolveVideoLayoutParams) => {
  return dispatchVideoLayoutResolver(params, VIDEO_LAYOUT_RESOLVERS);
};

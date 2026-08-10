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

import { GOPRO_MODEL_NUMBERS } from '../../constants/GoProModelNumbers';
import { getHero11SpecialRowsProjection } from '../hero11/specialRowsProjection';
import { getHero12SpecialRowsProjection } from '../hero12/specialRowsProjection';
import { getHero13SpecialRowsProjection } from '../hero13/specialRowsProjection';
import { resolveModelNoFromCameraModelKey } from './modelNumber';
import type {
  ModelResolverMap,
  ResolveSpecialRowsProjectionParams,
  SpecialRowsProjection,
  SpecialRowsProjectionResolver,
} from './types';

const SPECIAL_ROWS_PROJECTION_RESOLVERS: ModelResolverMap<SpecialRowsProjectionResolver> = {
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: getHero11SpecialRowsProjection,
  [GOPRO_MODEL_NUMBERS.HERO12_BLACK]: getHero12SpecialRowsProjection,
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: getHero13SpecialRowsProjection,
};

const resolveLegacySpecialRowsProjection: SpecialRowsProjectionResolver = () => ({
  visibleRowKeys: [],
});

export const dispatchSpecialRowsProjectionResolver = (
  params: ResolveSpecialRowsProjectionParams,
  resolvers: ModelResolverMap<SpecialRowsProjectionResolver>,
  fallbackResolver: SpecialRowsProjectionResolver,
): SpecialRowsProjection => {
  const modelNo = resolveModelNoFromCameraModelKey(params.cameraModel);
  const resolver = modelNo !== null ? resolvers[modelNo] : undefined;
  return resolver ? resolver(params) : fallbackResolver(params);
};

export const resolveSpecialRowsProjection = (
  params: ResolveSpecialRowsProjectionParams,
): SpecialRowsProjection => {
  return dispatchSpecialRowsProjectionResolver(
    params,
    SPECIAL_ROWS_PROJECTION_RESOLVERS,
    resolveLegacySpecialRowsProjection,
  );
};

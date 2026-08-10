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
import { hero11SpecialRowsResolver } from '../hero11/specialRows';
import { hero12SpecialRowsResolver } from '../hero12/specialRows';
import { hero13SpecialRowsResolver } from '../hero13/specialRows';
import type {
  ModelResolverMap,
  ResolveSpecialRowsParams,
  SpecialRow,
  SpecialRowsResolver,
} from './types';
import { resolveModelNoFromCameraModelKey } from './modelNumber';

const SPECIAL_ROWS_RESOLVERS: ModelResolverMap<SpecialRowsResolver> = {
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: hero11SpecialRowsResolver,
  [GOPRO_MODEL_NUMBERS.HERO12_BLACK]: hero12SpecialRowsResolver,
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: hero13SpecialRowsResolver,
};

const resolveLegacySpecialRows: SpecialRowsResolver = () => [];

export const dispatchSpecialRowsResolver = (
  params: ResolveSpecialRowsParams,
  resolvers: ModelResolverMap<SpecialRowsResolver>,
  fallbackResolver: SpecialRowsResolver,
): SpecialRow[] => {
  const modelNo = resolveModelNoFromCameraModelKey(params.cameraModel);
  const resolver = modelNo !== null ? resolvers[modelNo] : undefined;
  return resolver ? resolver(params) : fallbackResolver(params);
};

export const resolveSpecialRows = (params: ResolveSpecialRowsParams): SpecialRow[] => {
  return dispatchSpecialRowsResolver(params, SPECIAL_ROWS_RESOLVERS, resolveLegacySpecialRows);
};

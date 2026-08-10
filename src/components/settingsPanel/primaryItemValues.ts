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
import { hero11PrimaryItemValuesResolver } from '../../cameraModels/hero11/primaryItemValues';
import { hero13PrimaryItemValuesResolver } from '../../cameraModels/hero13/primaryItemValues';
import { heromi11PrimaryItemValuesResolver } from '../../cameraModels/heromi11/primaryItemValues';
import { dispatchPrimaryItemValuesResolver } from '../../cameraModels/shared/primaryItemValues';
import type {
  FilterPrimaryItemValuesParams,
  ModelResolverMap,
  PrimaryItemValuesResolver,
} from '../../cameraModels/shared/types';

const PRIMARY_ITEM_VALUES_RESOLVERS: ModelResolverMap<PrimaryItemValuesResolver> = {
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: hero11PrimaryItemValuesResolver,
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: hero13PrimaryItemValuesResolver,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: heromi11PrimaryItemValuesResolver,
};

const resolveLegacyPrimaryItemValues: PrimaryItemValuesResolver = ({ allowedValues }) => {
  return [...allowedValues];
};

export const filterPrimaryItemValues = (params: FilterPrimaryItemValuesParams) => {
  return dispatchPrimaryItemValuesResolver(
    params,
    PRIMARY_ITEM_VALUES_RESOLVERS,
    resolveLegacyPrimaryItemValues,
  );
};

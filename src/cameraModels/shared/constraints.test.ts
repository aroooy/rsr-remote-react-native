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

import { describe, it, expect } from 'vitest';
import { dispatchSettingConstraintResolver } from './constraints';
import type { SettingConstraintParams, SettingConstraintResolver, ModelResolverMap } from './types';
import { GOPRO_MODEL_NUMBERS } from '../../constants/GoProModelNumbers';

const alwaysDisabled: SettingConstraintResolver = () => 'disabled';
const alwaysNa: SettingConstraintResolver = () => 'na';
const alwaysOk: SettingConstraintResolver = () => 'ok';

describe('dispatchSettingConstraintResolver', () => {
  const resolvers: ModelResolverMap<SettingConstraintResolver> = {
    [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: alwaysDisabled,
    [GOPRO_MODEL_NUMBERS.MAX]: alwaysNa,
  };

  it('calls the resolver for a known model', () => {
    const params: SettingConstraintParams = {
      settingId: 1,
      settings: {},
      cameraModel: 'hero13',
    };
    expect(dispatchSettingConstraintResolver(params, resolvers, alwaysOk)).toBe('disabled');

    const maxParams: SettingConstraintParams = {
      settingId: 1,
      settings: {},
      cameraModel: 'max',
    };
    expect(dispatchSettingConstraintResolver(maxParams, resolvers, alwaysOk)).toBe('na');
  });

  it('calls the fallback for unknown model', () => {
    const params: SettingConstraintParams = {
      settingId: 1,
      settings: {},
      cameraModel: 'hero10',
    };
    expect(dispatchSettingConstraintResolver(params, resolvers, alwaysOk)).toBe('ok');
  });

  it('calls the fallback when cameraModel is null', () => {
    const params: SettingConstraintParams = {
      settingId: 1,
      settings: {},
      cameraModel: null,
    };
    expect(dispatchSettingConstraintResolver(params, resolvers, alwaysOk)).toBe('ok');
  });
});

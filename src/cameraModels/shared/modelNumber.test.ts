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
import { resolveModelNoFromCameraModelKey, resolveCameraModelKeyFromModelNo } from './modelNumber';
import { GOPRO_MODEL_NUMBERS } from '../../constants/GoProModelNumbers';

describe('resolveModelNoFromCameraModelKey', () => {
  it('converts known model keys to model numbers', () => {
    expect(resolveModelNoFromCameraModelKey('hero13')).toBe(GOPRO_MODEL_NUMBERS.HERO13_BLACK);
    expect(resolveModelNoFromCameraModelKey('hero12')).toBe(GOPRO_MODEL_NUMBERS.HERO12_BLACK);
    expect(resolveModelNoFromCameraModelKey('hero11')).toBe(GOPRO_MODEL_NUMBERS.HERO11_BLACK);
    expect(resolveModelNoFromCameraModelKey('heromi11')).toBe(
      GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI,
    );
    expect(resolveModelNoFromCameraModelKey('hero10')).toBe(GOPRO_MODEL_NUMBERS.HERO10_BLACK);
    expect(resolveModelNoFromCameraModelKey('hero09')).toBe(GOPRO_MODEL_NUMBERS.HERO09_BLACK);
    expect(resolveModelNoFromCameraModelKey('max')).toBe(GOPRO_MODEL_NUMBERS.MAX);
  });

  it('returns null for unknown or null keys', () => {
    expect(resolveModelNoFromCameraModelKey('unknown')).toBeNull();
    expect(resolveModelNoFromCameraModelKey(null)).toBeNull();
    expect(resolveModelNoFromCameraModelKey(undefined)).toBeNull();
  });
});

describe('resolveCameraModelKeyFromModelNo', () => {
  it('converts known model numbers to model keys', () => {
    expect(resolveCameraModelKeyFromModelNo(GOPRO_MODEL_NUMBERS.HERO13_BLACK)).toBe('hero13');
    expect(resolveCameraModelKeyFromModelNo(GOPRO_MODEL_NUMBERS.HERO12_BLACK)).toBe('hero12');
    expect(resolveCameraModelKeyFromModelNo(GOPRO_MODEL_NUMBERS.HERO11_BLACK)).toBe('hero11');
    expect(resolveCameraModelKeyFromModelNo(GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI)).toBe(
      'heromi11',
    );
    expect(resolveCameraModelKeyFromModelNo(GOPRO_MODEL_NUMBERS.HERO10_BLACK)).toBe('hero10');
    expect(resolveCameraModelKeyFromModelNo(GOPRO_MODEL_NUMBERS.HERO09_BLACK)).toBe('hero09');
    expect(resolveCameraModelKeyFromModelNo(GOPRO_MODEL_NUMBERS.MAX)).toBe('max');
  });

  it('returns "unknown" for unrecognized model numbers', () => {
    expect(resolveCameraModelKeyFromModelNo(9999)).toBe('unknown');
    expect(resolveCameraModelKeyFromModelNo(null)).toBe('unknown');
    expect(resolveCameraModelKeyFromModelNo(undefined)).toBe('unknown');
  });

  it('is inverse of resolveModelNoFromCameraModelKey', () => {
    const keys = ['hero13', 'hero12', 'hero11', 'heromi11', 'hero10', 'hero09', 'max'] as const;
    for (const key of keys) {
      const modelNo = resolveModelNoFromCameraModelKey(key);
      if (modelNo !== null) {
        expect(resolveCameraModelKeyFromModelNo(modelNo)).toBe(key);
      }
    }
  });
});

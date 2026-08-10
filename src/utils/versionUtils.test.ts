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
import { compareVersions } from './versionUtils';

describe('compareVersions', () => {
  it('compares firmware versions with H-prefix', () => {
    expect(compareVersions('H24.01.02.10.70', '>=', 'H24.01.01.12.00')).toBe(true);
    expect(compareVersions('H24.01.02.10.70', '>', 'H24.01.01.12.00')).toBe(true);
    expect(compareVersions('H24.01.01.12.00', '<', 'H24.01.02.10.70')).toBe(true);
    expect(compareVersions('H24.01.02.10.70', '<=', 'H24.01.01.12.00')).toBe(false);
  });

  it('compares dotted versions without prefix', () => {
    expect(compareVersions('01.20.00', '>=', '1.10.0')).toBe(true);
    expect(compareVersions('1.2.3', '>', '1.2.2')).toBe(true);
    expect(compareVersions('1.2.2', '<', '1.2.3')).toBe(true);
  });

  it('returns true for equal versions with = operator', () => {
    expect(compareVersions('1.2.3', '=', '1.2.3')).toBe(true);
    expect(compareVersions('H24.01.02', '=', 'H24.01.02')).toBe(true);
  });

  it('returns false for equal versions with > or < operators', () => {
    expect(compareVersions('1.2.3', '>', '1.2.3')).toBe(false);
    expect(compareVersions('1.2.3', '<', '1.2.3')).toBe(false);
  });

  it('returns true for equal versions with >= and <= operators', () => {
    expect(compareVersions('1.2.3', '>=', '1.2.3')).toBe(true);
    expect(compareVersions('1.2.3', '<=', '1.2.3')).toBe(true);
  });

  it('handles different segment lengths', () => {
    expect(compareVersions('1.2', '=', '1.2.0')).toBe(true);
    expect(compareVersions('1.2.0.0', '>=', '1.2')).toBe(true);
  });

  it('strips non-numeric prefixes from segments', () => {
    expect(compareVersions('H24.01.02', '>', 'H23.99.99')).toBe(true);
  });
});

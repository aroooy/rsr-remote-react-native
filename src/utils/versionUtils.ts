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

export type VersionOperator = '=' | '>' | '<' | '>=' | '<=';

/**
 * Utility to compare GoPro firmware versions and standard dotted versions.
 * Used for checking Firmware Overlays, etc.
 * (e.g. compareVersions("H24.01.02.10.70", ">=", "H24.01.01.12.00") -> true)
 * (e.g. compareVersions("01.20.00", ">=", "1.10.0") -> true)
 */
export const compareVersions = (v1: string, operator: VersionOperator, v2: string): boolean => {
  const normalize = (v: string) =>
    v.split('.').map((segment) => {
      const matchedNumber = segment.match(/\d+/);
      return matchedNumber ? parseInt(matchedNumber[0], 10) : 0;
    });
  const p1 = normalize(v1);
  const p2 = normalize(v2);
  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return operator === '>' || operator === '>=';
    if (n1 < n2) return operator === '<' || operator === '<=';
  }
  return operator === '=' || operator === '>=' || operator === '<=';
};

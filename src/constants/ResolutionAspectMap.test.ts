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
import {
  getResolutionLabel,
  getResolutionAspect,
  findResolutionForAspect,
  isHero12NewScheme,
  getHero12FallbackResolution,
  getHero11FallbackResolution,
} from './ResolutionAspectMap';

describe('getResolutionLabel', () => {
  it('returns label for known resolution values', () => {
    expect(getResolutionLabel('hero13', 100)).toBe('5.3K');
    expect(getResolutionLabel('hero13', 1)).toBe('4K');
    expect(getResolutionLabel('hero13', 4)).toBe('2.7K');
    expect(getResolutionLabel('hero13', 9)).toBe('1080');
  });

  it('returns null for unknown values', () => {
    expect(getResolutionLabel('hero13', 9999)).toBeNull();
    expect(getResolutionLabel('unknown', 100)).toBeNull();
  });

  it('differs across models for the same value', () => {
    // Value 24 = 5.3K on Hero09, but undefined on Hero13
    expect(getResolutionLabel('hero09', 24)).toBe('5.3K');
    expect(getResolutionLabel('hero13', 24)).toBeNull();
  });
});

describe('getResolutionAspect', () => {
  it('returns aspect ratio for known values', () => {
    expect(getResolutionAspect('hero13', 100)).toBe('16:9');
    expect(getResolutionAspect('hero13', 107)).toBe('8:7');
    expect(getResolutionAspect('hero13', 109)).toBe('9:16');
    expect(getResolutionAspect('hero13', 111)).toBe('4:3');
  });

  it('returns null for unknown values or undefined input', () => {
    expect(getResolutionAspect('hero13', 9999)).toBeNull();
    expect(getResolutionAspect('hero13', undefined)).toBeNull();
  });
});

describe('findResolutionForAspect', () => {
  it('finds resolution in same family first', () => {
    // Current is 100 (5.3K 16:9), target 8:7 → should find 107 (5.3K 8:7)
    const result = findResolutionForAspect('hero13', 100, '8:7', [100, 107, 108, 1]);
    expect(result).toBe(107);
  });

  it('falls back to different family when same family unavailable', () => {
    // Current is 100 (5.3K 16:9), target 8:7, but 5.3K 8:7 not in caps
    const result = findResolutionForAspect('hero13', 100, '8:7', [100, 108, 1]);
    expect(result).toBe(108); // 4K 8:7
  });

  it('returns null when no matching aspect exists', () => {
    const result = findResolutionForAspect('hero13', 100, '4:3', [100, 1, 4]);
    expect(result).toBeNull();
  });
});

describe('isHero12NewScheme', () => {
  it('returns true for new scheme values', () => {
    expect(isHero12NewScheme(101)).toBe(true);
    expect(isHero12NewScheme(102)).toBe(true);
    expect(isHero12NewScheme(29)).toBe(true);
  });

  it('returns false for legacy values', () => {
    expect(isHero12NewScheme(100)).toBe(false);
    expect(isHero12NewScheme(1)).toBe(false);
    expect(isHero12NewScheme(4)).toBe(false);
  });
});

describe('getHero12FallbackResolution', () => {
  it('returns new scheme default when current value is new scheme', () => {
    expect(getHero12FallbackResolution(101, '16:9')).toBe(101); // 5.3K
    expect(getHero12FallbackResolution(102, '4:3')).toBe(105); // 2.7K 4:3
  });

  it('returns legacy default when current value is legacy', () => {
    expect(getHero12FallbackResolution(100, '16:9')).toBe(100); // 5.3K
    expect(getHero12FallbackResolution(1, '4:3')).toBe(111); // 2.7K 4:3
  });

  it('respects Max Lens Mod overrides', () => {
    // Max Lens Mod 1.0 → 2.7K max
    expect(getHero12FallbackResolution(100, '16:9', 1)).toBe(4);
    expect(getHero12FallbackResolution(100, '4:3', 1)).toBe(111);

    // Max Lens Mod 2.0 → 4K max
    expect(getHero12FallbackResolution(100, '16:9', 2)).toBe(1);
    expect(getHero12FallbackResolution(100, '4:3', 2)).toBe(18);
  });
});

describe('getHero11FallbackResolution', () => {
  it('returns null for 9:16 (not supported on Hero11)', () => {
    expect(getHero11FallbackResolution(100, '9:16')).toBeNull();
  });

  it('finds resolution in same family', () => {
    // Current is 100 (5.3K 16:9), target 4:3 → should find 27 (5.3K 4:3)
    expect(getHero11FallbackResolution(100, '4:3')).toBe(27);
    expect(getHero11FallbackResolution(100, '8:7')).toBe(26);
  });

  it('falls back to default when current is unknown', () => {
    expect(getHero11FallbackResolution(undefined, '16:9')).toBe(100);
    expect(getHero11FallbackResolution(undefined, '4:3')).toBe(27);
    expect(getHero11FallbackResolution(undefined, '8:7')).toBe(26);
  });
});

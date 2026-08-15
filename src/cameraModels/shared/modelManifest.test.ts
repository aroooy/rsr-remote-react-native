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
  MODEL_MANIFEST,
  knownModelKeys,
  getModelManifest,
  getModelManifestByModelNo,
  isSameOrNewerGeneration,
  isNewerGeneration,
  isGenerationRange,
  isModelFamily,
  isMaxModel,
  isHeroFamilyModel,
  GOPRO_MODEL_NUMBERS,
} from './modelManifest';

describe('MODEL_MANIFEST', () => {
  it('contains entries for all known models', () => {
    expect(Object.keys(MODEL_MANIFEST)).toHaveLength(7);
    expect(MODEL_MANIFEST.hero09.modelNo).toBe(55);
    expect(MODEL_MANIFEST.hero13.modelNo).toBe(65);
    expect(MODEL_MANIFEST.max.modelNo).toBe(51);
  });

  it('knownModelKeys excludes "unknown"', () => {
    expect(knownModelKeys).not.toContain('unknown');
    expect(knownModelKeys).toContain('hero13');
    expect(knownModelKeys).toContain('max');
  });
});

describe('GOPRO_MODEL_NUMBERS (derived from manifest)', () => {
  it('matches expected legacy names', () => {
    expect(GOPRO_MODEL_NUMBERS.HERO13_BLACK).toBe(65);
    expect(GOPRO_MODEL_NUMBERS.HERO12_BLACK).toBe(62);
    expect(GOPRO_MODEL_NUMBERS.HERO11_BLACK).toBe(58);
    expect(GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI).toBe(60);
    expect(GOPRO_MODEL_NUMBERS.HERO10_BLACK).toBe(57);
    expect(GOPRO_MODEL_NUMBERS.HERO09_BLACK).toBe(55);
    expect(GOPRO_MODEL_NUMBERS.MAX).toBe(51);
  });
});

describe('getModelManifest', () => {
  it('returns entry for known keys', () => {
    const entry = getModelManifest('hero13');
    expect(entry).toEqual({ modelNo: 65, generation: 5, family: 'hero' });
  });

  it('returns undefined for unknown', () => {
    expect(getModelManifest('unknown')).toBeUndefined();
    expect(getModelManifest(null)).toBeUndefined();
  });
});

describe('getModelManifestByModelNo', () => {
  it('returns entry with key for known modelNo', () => {
    const entry = getModelManifestByModelNo(65);
    expect(entry).toEqual({ key: 'hero13', modelNo: 65, generation: 5, family: 'hero' });
  });

  it('returns undefined for unknown modelNo', () => {
    expect(getModelManifestByModelNo(9999)).toBeUndefined();
    expect(getModelManifestByModelNo(null)).toBeUndefined();
  });
});

describe('isSameOrNewerGeneration', () => {
  it('returns true for same generation', () => {
    expect(isSameOrNewerGeneration(65, 'hero13')).toBe(true);
  });

  it('returns true for newer generation', () => {
    expect(isSameOrNewerGeneration(65, 'hero12')).toBe(true);
    expect(isSameOrNewerGeneration(65, 'hero11')).toBe(true);
  });

  it('returns false for older generation', () => {
    expect(isSameOrNewerGeneration(55, 'hero13')).toBe(false);
  });

  it('treats MAX (generation 0) as older than all HERO models', () => {
    expect(isSameOrNewerGeneration(51, 'hero09')).toBe(false);
  });

  it('returns false for unknown modelNo', () => {
    expect(isSameOrNewerGeneration(9999, 'hero11')).toBe(false);
    expect(isSameOrNewerGeneration(null, 'hero11')).toBe(false);
  });
});

describe('isNewerGeneration', () => {
  it('returns false for same generation', () => {
    expect(isNewerGeneration(65, 'hero13')).toBe(false);
  });

  it('returns true for newer generation', () => {
    expect(isNewerGeneration(65, 'hero12')).toBe(true);
  });

  it('returns false for older generation', () => {
    expect(isNewerGeneration(55, 'hero13')).toBe(false);
  });
});

describe('isGenerationRange', () => {
  it('returns true for models within range', () => {
    expect(isGenerationRange(62, 'hero12', 'hero13')).toBe(true);
    expect(isGenerationRange(65, 'hero12', 'hero13')).toBe(true);
  });

  it('returns false for models outside range', () => {
    expect(isGenerationRange(55, 'hero12', 'hero13')).toBe(false);
  });

  it('works with reversed range bounds', () => {
    expect(isGenerationRange(62, 'hero13', 'hero12')).toBe(true);
  });
});

describe('isModelFamily', () => {
  it('identifies HERO models', () => {
    expect(isModelFamily(65, 'hero')).toBe(true);
    expect(isModelFamily(58, 'hero')).toBe(true);
  });

  it('identifies HERO Mini models', () => {
    expect(isModelFamily(60, 'hero-mini')).toBe(true);
    expect(isModelFamily(60, 'hero')).toBe(false);
  });

  it('identifies MAX models', () => {
    expect(isModelFamily(51, 'max')).toBe(true);
    expect(isModelFamily(51, 'hero')).toBe(false);
  });

  it('supports multiple families', () => {
    expect(isModelFamily(58, 'hero', 'hero-mini')).toBe(true);
    expect(isModelFamily(60, 'hero', 'hero-mini')).toBe(true);
    expect(isModelFamily(51, 'hero', 'hero-mini')).toBe(false);
  });
});

describe('isMaxModel', () => {
  it('returns true only for MAX', () => {
    expect(isMaxModel(51)).toBe(true);
    expect(isMaxModel(65)).toBe(false);
    expect(isMaxModel(null)).toBe(false);
  });
});

describe('isHeroFamilyModel', () => {
  it('returns true for HERO and HERO Mini', () => {
    expect(isHeroFamilyModel(65)).toBe(true);
    expect(isHeroFamilyModel(58)).toBe(true);
    expect(isHeroFamilyModel(60)).toBe(true);
    expect(isHeroFamilyModel(51)).toBe(false);
  });
});

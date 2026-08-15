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

/**
 * Model helper predicates — driven by MODEL_MANIFEST so that adding a new
 * model only requires updating the manifest, not every helper function.
 *
 * Backward-compat: all previously-exported function names are preserved with
 * identical signatures so callers do not need to change.
 */

import {
  getModelManifestByModelNo,
  isGenerationRange,
  isMaxModel,
  isModelFamily,
  isSameOrNewerGeneration,
  type CameraModelKey,
} from './modelManifest';

// ---------------------------------------------------------------------------
// Exact-match helpers
// ---------------------------------------------------------------------------

export const isGoProModelNumber = (
  modelNo: number | null | undefined,
  expected: number,
): boolean => {
  return modelNo === expected;
};

export const isHero13Model = (modelNo: number | null | undefined): boolean => {
  return isSameModelNo(modelNo, 'hero13');
};

export const isHero12Model = (modelNo: number | null | undefined): boolean => {
  return isSameModelNo(modelNo, 'hero12');
};

export const isHero11Model = (modelNo: number | null | undefined): boolean => {
  return isSameModelNo(modelNo, 'hero11');
};

export const isHero11MiniModel = (modelNo: number | null | undefined): boolean => {
  return isSameModelNo(modelNo, 'heromi11');
};

export const isHero10Model = (modelNo: number | null | undefined): boolean => {
  return isSameModelNo(modelNo, 'hero10');
};

export const isHero09Model = (modelNo: number | null | undefined): boolean => {
  return isSameModelNo(modelNo, 'hero09');
};

export const isMaxModelHelper = (modelNo: number | null | undefined): boolean => {
  return isMaxModel(modelNo);
};

function isSameModelNo(modelNo: number | null | undefined, key: CameraModelKey): boolean {
  const m = getModelManifestByModelNo(modelNo);
  return m?.key === key;
}

// ---------------------------------------------------------------------------
// Range / family helpers — driven by MODEL_MANIFEST generations
// ---------------------------------------------------------------------------

/** HERO12 or HERO13 (generation 4–5). Automatically picks up new models in this range. */
export const isHero12Or13Model = (modelNo: number | null | undefined): boolean => {
  return isGenerationRange(modelNo, 'hero12', 'hero13');
};

/** HERO11 family: HERO11 + HERO11 Mini. */
export const isHero11FamilyModel = (modelNo: number | null | undefined): boolean => {
  return isModelFamily(modelNo, 'hero', 'hero-mini') && isGenerationRange(modelNo, 'hero11', 'heromi11');
};

/** HERO11 family + MAX. */
export const isHero11FamilyOrMaxModel = (modelNo: number | null | undefined): boolean => {
  return isHero11FamilyModel(modelNo) || isMaxModel(modelNo);
};

/** HERO11 or newer (generation >= 3, excludes MAX which is generation 0). */
export const isHero11OrNewerModel = (modelNo: number | null | undefined): boolean => {
  return isSameOrNewerGeneration(modelNo, 'hero11');
};

/** MAX model check (alias for isMaxModel from modelManifest). */
export { isMaxModel } from './modelManifest';

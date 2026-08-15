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

import type { CameraModelKey as CameraModelKeyFromManifest } from '../cameraModels/shared/modelManifest';
import { HERO13_RESOLUTION_MAP } from '../cameraModels/hero13/resolution';
import { HERO12_RESOLUTION_MAP, getHero12FallbackResolution, isHero12NewScheme } from '../cameraModels/hero12/resolution';
import { HERO11_RESOLUTION_MAP, getHero11FallbackResolution } from '../cameraModels/hero11/resolution';
import { HERO10_RESOLUTION_MAP } from '../cameraModels/hero10/resolution';
import { HERO09_RESOLUTION_MAP } from '../cameraModels/hero09/resolution';
import { MAX_RESOLUTION_MAP } from '../cameraModels/max/resolution';

import type { AspectRatio, ResolutionEntry, ResolutionFamily } from '../cameraModels/shared/types';
export type { AspectRatio, ResolutionEntry, ResolutionFamily };

/** Re-exported helper functions from model domain directories for backward compatibility */
export { getHero11FallbackResolution, getHero12FallbackResolution, isHero12NewScheme };

export type CameraModelKey = CameraModelKeyFromManifest;

/**
 * Resolution map registry — aggregated from per-model resolution modules
 * under `src/cameraModels/<model>/resolution.ts`.
 */
const RESOLUTION_MAP_REGISTRY: Record<string, Record<number, ResolutionEntry>> = {
  hero13: HERO13_RESOLUTION_MAP,
  hero12: HERO12_RESOLUTION_MAP,
  hero11: HERO11_RESOLUTION_MAP,
  heromi11: HERO11_RESOLUTION_MAP, // HERO11 Mini has the same resolution set as HERO11
  hero10: HERO10_RESOLUTION_MAP,
  hero09: HERO09_RESOLUTION_MAP,
  max: MAX_RESOLUTION_MAP,
  unknown: {},
};

export const getResolutionMap = (model: CameraModelKey): Record<number, ResolutionEntry> => {
  return RESOLUTION_MAP_REGISTRY[model] ?? {};
};

/** Model-specific RESOLUTION label (independent of existing metadata) */
export const getResolutionLabel = (model: CameraModelKey, value: number): string | null => {
  return getResolutionMap(model)[value]?.label ?? null;
};

/** Current aspect ratio of the specified RESOLUTION value (model-specific) */
export const getResolutionAspect = (
  model: CameraModelKey,
  value: number | undefined,
): AspectRatio | null => {
  if (value === undefined) return null;
  return getResolutionMap(model)[value]?.aspect ?? null;
};

/**
 * For models without a framing API like HERO12: returns the RESOLUTION value to send based on current RESOLUTION and target aspect ratio.
 * Returns null if not found.
 */
export const findResolutionForAspect = (
  model: CameraModelKey,
  currentResValue: number | undefined,
  targetAspect: AspectRatio,
  availableCaps: readonly number[],
): number | null => {
  const map = getResolutionMap(model);
  const currentEntry = currentResValue !== undefined ? map[currentResValue] : undefined;

  // 1. Same family priority
  if (currentEntry) {
    for (const v of availableCaps) {
      const e = map[v];
      if (e && e.family === currentEntry.family && e.aspect === targetAspect) return v;
    }
  }

  // 2. First matching value regardless of family
  const FAMILY_PRIORITY: ResolutionFamily[] = [
    '5.3K',
    '5K',
    '4K',
    '2.7K',
    '1080',
    '1440',
    '720',
    'other',
  ];
  for (const family of FAMILY_PRIORITY) {
    for (const v of availableCaps) {
      const e = map[v];
      if (e && e.family === family && e.aspect === targetAspect) return v;
    }
  }

  return null;
};

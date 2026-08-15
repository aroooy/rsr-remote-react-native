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

import type { AspectRatio, ResolutionEntry } from '../shared/types';

/** HERO12 (merged new + legacy schemes) */
export const HERO12_RESOLUTION_MAP: Record<number, ResolutionEntry> = {
  // -- new scheme (Early firmware) --
  // 16:9
  101: { label: '5.3K', aspect: '16:9', family: '5.3K' },
  102: { label: '4K', aspect: '16:9', family: '4K' },
  104: { label: '2.7K', aspect: '16:9', family: '2.7K' },
  106: { label: '1080', aspect: '16:9', family: '1080' },
  // 8:7
  26: { label: '5.3K 8:7', aspect: '8:7', family: '5.3K' },
  28: { label: '4K 8:7', aspect: '8:7', family: '4K' },
  103: { label: '4K 8:7', aspect: '8:7', family: '4K' }, // When Max Lens is attached
  // 9:16
  29: { label: '4K 9:16', aspect: '9:16', family: '4K' },
  30: { label: '1080 9:16', aspect: '9:16', family: '1080' },
  // 4:3
  105: { label: '2.7K 4:3', aspect: '4:3', family: '2.7K' },

  // -- legacy scheme (Late firmware) --
  // 16:9
  100: { label: '5.3K', aspect: '16:9', family: '5.3K' },
  1: { label: '4K', aspect: '16:9', family: '4K' },
  4: { label: '2.7K', aspect: '16:9', family: '2.7K' },
  9: { label: '1080', aspect: '16:9', family: '1080' },
  // 8:7
  107: { label: '5.3K 8:7', aspect: '8:7', family: '5.3K' },
  108: { label: '4K 8:7', aspect: '8:7', family: '4K' },
  // 9:16
  109: { label: '4K 9:16', aspect: '9:16', family: '4K' },
  110: { label: '1080 9:16', aspect: '9:16', family: '1080' },
  // 4:3
  111: { label: '2.7K 4:3', aspect: '4:3', family: '2.7K' },
  18: { label: 'Max4K 4:3', aspect: '4:3', family: '4K' }, // Max Lens Mod 2.0
};

/**
 * Returns whether the RESOLUTION value of HERO12 is new-scheme (early firmware H23_01_01_10_00).
 * Used for scheme-dependent value decisions such as 8:7 fallback resolution selection in HDR/LOG modes.
 */
export const isHero12NewScheme = (resolutionValue: number): boolean => {
  const NEW_SCHEME_VALUES = new Set([101, 102, 103, 104, 105, 106, 26, 28, 29, 30]);
  return NEW_SCHEME_VALUES.has(resolutionValue);
};

const HERO12_NEW_DEFAULTS: Record<AspectRatio, number> = {
  '16:9': 101, // 5.3K
  '4:3': 105, // 4:3 is only 2.7K in HERO12 new-scheme
  '8:7': 26, // 5.3K 8:7
  '9:16': 29, // 4K 9:16
};

const HERO12_LEGACY_DEFAULTS: Record<AspectRatio, number> = {
  '16:9': 100, // 5.3K
  '4:3': 111, // 2.7K 4:3
  '8:7': 107, // 5.3K 8:7
  '9:16': 109, // 4K 9:16
};

/**
 * Returns the fallback RESOLUTION value for the specified aspect ratio by estimating from the current RESOLUTION value on HERO12.
 * Sent to the camera even if not included in capability (expecting automatic preset switching on the camera side).
 */
export const getHero12FallbackResolution = (
  currentResValue: number | undefined,
  targetAspect: AspectRatio,
  maxLensModState: number = 0,
): number => {
  const useNew = currentResValue !== undefined && isHero12NewScheme(currentResValue);

  if (maxLensModState === 1) {
    // Max Lens Mod 1.0
    if (targetAspect === '16:9') return 4; // 2.7K 16:9
    if (targetAspect === '4:3') return 111; // 2.7K 4:3
  } else if (maxLensModState === 2) {
    // Max Lens Mod 2.0
    if (targetAspect === '16:9') return 1; // 4K 16:9
    if (targetAspect === '4:3') return 18; // Max4K 4:3
    if (targetAspect === '9:16') return 109; // 4K 9:16
  }

  return useNew ? HERO12_NEW_DEFAULTS[targetAspect] : HERO12_LEGACY_DEFAULTS[targetAspect];
};

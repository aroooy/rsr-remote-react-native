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

/** HERO11 / HERO11 Mini resolution map (legacy scheme + 8:7 support) */
export const HERO11_RESOLUTION_MAP: Record<number, ResolutionEntry> = {
  // 16:9
  100: { label: '5.3K', aspect: '16:9', family: '5.3K' },
  1: { label: '4K', aspect: '16:9', family: '4K' },
  4: { label: '2.7K', aspect: '16:9', family: '2.7K' },
  9: { label: '1080', aspect: '16:9', family: '1080' },
  // 4:3
  27: { label: '5.3K 4:3', aspect: '4:3', family: '5.3K' },
  18: { label: '4K 4:3', aspect: '4:3', family: '4K' },
  6: { label: '2.7K 4:3', aspect: '4:3', family: '2.7K' },
  // 8:7
  26: { label: '5.3K 8:7', aspect: '8:7', family: '5.3K' },
  28: { label: '4K 8:7', aspect: '8:7', family: '4K' },
};

const HERO11_DEFAULTS: Partial<Record<AspectRatio, number>> = {
  '16:9': 100,
  '4:3': 27,
  '8:7': 26,
};

/**
 * Fallback when RESOLUTION capability is missing on HERO11 / HERO11 Mini.
 * First looks for another aspect ratio in the current family from the static map, and falls back to a representative value if not found.
 */
export const getHero11FallbackResolution = (
  currentResValue: number | undefined,
  targetAspect: AspectRatio,
  maxLensModEnabled: number = 0,
): number | null => {
  if (targetAspect === '9:16') return null; // HERO11 family does not support 9:16
  if (maxLensModEnabled === 1 && targetAspect === '8:7') return null;

  const currentEntry =
    currentResValue !== undefined ? HERO11_RESOLUTION_MAP[currentResValue] : undefined;
  if (currentEntry) {
    for (const [rawValue, entry] of Object.entries(HERO11_RESOLUTION_MAP)) {
      if (entry.family === currentEntry.family && entry.aspect === targetAspect) {
        return Number(rawValue);
      }
    }
  }

  return HERO11_DEFAULTS[targetAspect] ?? null;
};

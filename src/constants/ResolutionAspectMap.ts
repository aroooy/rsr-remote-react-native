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
 * Model-specific RESOLUTION (setting ID 2) value map.
 *
 * Historical background:
 * - HERO11 and older / HERO13: "legacy" scheme (100=5.3K, 1=4K, 4=2.7K, 9=1080, 107/108=8:7, 109/110=9:16, 111=4:3)
 * - HERO12 early firmware (H23_01_01_10_00): "new" scheme (101=5.3K, 102=4K, 104=2.7K, 106=1080)
 * - HERO12 late firmware (H23_01_02_00_70): changed back to legacy scheme
 *
 * Even with the same value number, the meaning differs by model (e.g., 18 = HERO13 "Max4K 8:7" / HERO11 "4K 4:3",
 * 102 = HERO12-new "4K" / equivalents to "4K 8:7" on other models).
 * Therefore, labels and aspect ratios must be resolved using a **model-specific dictionary**.
 *
 * The two schemes of HERO12 are merged into a single dictionary since their value ranges do not overlap
 * (allowing it to resolve correctly whether the camera returns new or legacy values).
 */

export type AspectRatio = '16:9' | '4:3' | '8:7' | '9:16';

export type ResolutionFamily = '5.3K' | '5K' | '4K' | '2.7K' | '1080' | '1440' | '720' | 'other';

export interface ResolutionEntry {
  label: string;
  aspect: AspectRatio;
  family: ResolutionFamily;
}

/** HERO13 (legacy scheme + HERO13-specific values) */
const HERO13_RESOLUTION_MAP: Record<number, ResolutionEntry> = {
  // 16:9
  100: { label: '5.3K', aspect: '16:9', family: '5.3K' },
  1: { label: '4K', aspect: '16:9', family: '4K' },
  4: { label: '2.7K', aspect: '16:9', family: '2.7K' },
  9: { label: '1080', aspect: '16:9', family: '1080' },
  // 8:7
  107: { label: '5.3K 8:7', aspect: '8:7', family: '5.3K' },
  108: { label: '4K 8:7', aspect: '8:7', family: '4K' },
  18: { label: 'Max4K 8:7', aspect: '8:7', family: '4K' },
  // 9:16
  109: { label: '4K 9:16', aspect: '9:16', family: '4K' },
  110: { label: '1080 9:16', aspect: '9:16', family: '1080' },
  // 4:3
  111: { label: '2.7K 4:3', aspect: '4:3', family: '2.7K' },
  112: { label: '4K 4:3', aspect: '4:3', family: '4K' },
  113: { label: '5.3K 4:3', aspect: '4:3', family: '5.3K' },
  // HERO13 extension (21:9 / 1:1 are temporarily treated as 16:9 - dedicated aspect is not introduced yet)
  35: { label: '5.3K 21:9', aspect: '16:9', family: '5.3K' },
  36: { label: '4K 21:9', aspect: '16:9', family: '4K' },
  37: { label: '4K 1:1', aspect: '16:9', family: '4K' },
  // Others
  12: { label: '720', aspect: '16:9', family: '720' },
  7: { label: '1440', aspect: '4:3', family: '1440' },
  38: { label: '900', aspect: '16:9', family: 'other' },
};

/** HERO12 (merged new + legacy schemes) */
const HERO12_RESOLUTION_MAP: Record<number, ResolutionEntry> = {
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

// ---------------------------------------------------------------------------
// HERO11 / HERO11 Mini resolution map (legacy scheme + 8:7 support)
// Legacy app: Database/Hero11/ValueNameSettings.cs
//   5.3K=100, 4K=1, 2.7K=4, 1080=9, 5.3K 4:3=27, 4K 4:3=18, 2.7K 4:3=6, 5.3K 8:7=26, 4K 8:7=28
// HERO11 Mini has the same resolution set (verified in ValueNameSettings.cs)
// ---------------------------------------------------------------------------
const HERO11_RESOLUTION_MAP: Record<number, ResolutionEntry> = {
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

// ---------------------------------------------------------------------------
// HERO10 resolution map
// Legacy app: Database/Hero10/ValueNameSettings.cs
//   5.3K=100, 5K 4:3=25, 4K=1, 4K 4:3=18, 2.7K=4, 2.7K 4:3=6, 1080=9
// Note: No 8:7 (8:7 resolution does not exist on HERO10)
// ---------------------------------------------------------------------------
const HERO10_RESOLUTION_MAP: Record<number, ResolutionEntry> = {
  // 16:9
  100: { label: '5.3K', aspect: '16:9', family: '5.3K' },
  1: { label: '4K', aspect: '16:9', family: '4K' },
  4: { label: '2.7K', aspect: '16:9', family: '2.7K' },
  9: { label: '1080', aspect: '16:9', family: '1080' },
  // 4:3
  25: { label: '5K 4:3', aspect: '4:3', family: '5K' },
  18: { label: '4K 4:3', aspect: '4:3', family: '4K' },
  6: { label: '2.7K 4:3', aspect: '4:3', family: '2.7K' },
};

// ---------------------------------------------------------------------------
// HERO09 resolution map
// Legacy app: Database/Hero09/ValueNameSettings.cs
//   5.3K=24, 5K 4:3=25, 4K=1, 4K 4:3=18, 2.7K=4, 2.7K 4:3=6, 1440 4:3=7, 1080=9
// Note: 5.3K has value 24 on HERO09 (different from 100 on HERO10 and newer)
// ---------------------------------------------------------------------------
const HERO09_RESOLUTION_MAP: Record<number, ResolutionEntry> = {
  // 16:9
  24: { label: '5.3K', aspect: '16:9', family: '5.3K' },
  1: { label: '4K', aspect: '16:9', family: '4K' },
  4: { label: '2.7K', aspect: '16:9', family: '2.7K' },
  9: { label: '1080', aspect: '16:9', family: '1080' },
  // 4:3
  25: { label: '5K 4:3', aspect: '4:3', family: '5K' },
  18: { label: '4K 4:3', aspect: '4:3', family: '4K' },
  6: { label: '2.7K 4:3', aspect: '4:3', family: '2.7K' },
  7: { label: '1440 4:3', aspect: '4:3', family: '1440' },
};

// ---------------------------------------------------------------------------
// GoPro MAX resolution map
// Legacy app: Database/Max/ValueNameSettings.cs
//   5.6K=21, 3K=22, 1440=7, 1080=9
// ---------------------------------------------------------------------------
const MAX_RESOLUTION_MAP: Record<number, ResolutionEntry> = {
  21: { label: '5.6K', aspect: '16:9', family: 'other' },
  22: { label: '3K', aspect: '16:9', family: 'other' },
  7: { label: '1440', aspect: '4:3', family: '1440' },
  9: { label: '1080', aspect: '16:9', family: '1080' },
};

export type CameraModelKey =
  'hero13' | 'hero12' | 'hero11' | 'heromi11' | 'hero10' | 'hero09' | 'max' | 'unknown';

export const getResolutionMap = (model: CameraModelKey): Record<number, ResolutionEntry> => {
  if (model === 'hero13') return HERO13_RESOLUTION_MAP;
  if (model === 'hero12') return HERO12_RESOLUTION_MAP;
  if (model === 'hero11') return HERO11_RESOLUTION_MAP;
  if (model === 'heromi11') return HERO11_RESOLUTION_MAP; // HERO11 Mini has the same resolution set as HERO11
  if (model === 'hero10') return HERO10_RESOLUTION_MAP;
  if (model === 'hero09') return HERO09_RESOLUTION_MAP;
  if (model === 'max') return MAX_RESOLUTION_MAP;
  return {};
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
 *
 * Search order:
 *  1. Value that has target aspect within the same family (exists in capabilities)
 *  2. Value supported by the camera with target aspect regardless of family (from highest resolution priority)
 */
export const findResolutionForAspect = (
  model: CameraModelKey,
  currentResValue: number | undefined,
  targetAspect: AspectRatio,
  availableCaps: readonly number[],
): number | null => {
  const map = getResolutionMap(model);
  const capSet = new Set(availableCaps);
  const currentEntry = currentResValue !== undefined ? map[currentResValue] : undefined;

  // 1. Same family priority
  if (currentEntry) {
    for (const v of availableCaps) {
      const e = map[v];
      if (e && e.family === currentEntry.family && e.aspect === targetAspect) return v;
    }
  }

  // 2. First matching value regardless of family
  // Family priority: 5.3K > 4K > 2.7K > 1080 (from largest resolution)
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

/**
 * Returns whether the RESOLUTION value of HERO12 is new-scheme (early firmware H23_01_01_10_00).
 * Used for scheme-dependent value decisions such as 8:7 fallback resolution selection in HDR/LOG modes.
 */
export const isHero12NewScheme = (resolutionValue: number): boolean => {
  const NEW_SCHEME_VALUES = new Set([101, 102, 103, 104, 105, 106, 26, 28, 29, 30]);
  return NEW_SCHEME_VALUES.has(resolutionValue);
};

/**
 * "Default" resolution value for HERO12 aspect ratio buttons.
 * Fallback when the resolution corresponding to the current preset capability does not exist.
 * The scheme (new / legacy) differs by camera firmware, so it is determined based on the current value.
 * Quality priority: 4:3 / 8:7 / 9:16 adopts 4K / 2.7K / 5.3K etc. prioritizing maximum resolution.
 */
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

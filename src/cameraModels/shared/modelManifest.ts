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
 * Model Manifest — Single source of truth for all GoPro camera models.
 *
 * Adding a new model: add one entry here, then create the corresponding
 * resolver files under `src/cameraModels/<model>/`. The manifest drives
 * modelNo <-> CameraModelKey conversion, generation-based helpers, and
 * family-based helpers automatically — no more scattered switch-statements.
 *
 * - `modelNo`: GoPro internal model number (from Hardware Info 0x3C response)
 * - `generation`: Monotonically increasing number for ordering; used by
 *   `isSameOrNewerGeneration` etc. MAX gets 0 because it is on a separate line.
 * - `family`: Logical grouping ('hero' | 'hero-mini' | 'max')
 */

// ---------------------------------------------------------------------------
// Manifest — add new models here
// ---------------------------------------------------------------------------

export const MODEL_MANIFEST = {
  hero09: { modelNo: 55, generation: 1, family: 'hero' as const },
  hero10: { modelNo: 57, generation: 2, family: 'hero' as const },
  hero11: { modelNo: 58, generation: 3, family: 'hero' as const },
  heromi11: { modelNo: 60, generation: 3, family: 'hero-mini' as const },
  hero12: { modelNo: 62, generation: 4, family: 'hero' as const },
  hero13: { modelNo: 65, generation: 5, family: 'hero' as const },
  max: { modelNo: 51, generation: 0, family: 'max' as const },
} as const satisfies Record<string, { modelNo: number; generation: number; family: string }>;

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

/** Camera model keys derived from the manifest, plus 'unknown' for unconnected state. */
export type CameraModelKey = keyof typeof MODEL_MANIFEST | 'unknown';

/** GoPro internal model numbers derived from the manifest. */
export type GoProModelNumber = (typeof MODEL_MANIFEST)[keyof typeof MODEL_MANIFEST]['modelNo'];

// ---------------------------------------------------------------------------
// Lookup maps (built at module init from the manifest)
// ---------------------------------------------------------------------------

/** modelNo -> CameraModelKey */
const modelNoToKey: ReadonlyMap<number, CameraModelKey> = (() => {
  const map = new Map<number, CameraModelKey>();
  for (const [key, entry] of Object.entries(MODEL_MANIFEST)) {
    map.set(entry.modelNo, key as CameraModelKey);
  }
  return map;
})();

/** CameraModelKey -> modelNo */
const keyToModelNo: ReadonlyMap<CameraModelKey, number> = (() => {
  const map = new Map<CameraModelKey, number>();
  for (const [key, entry] of Object.entries(MODEL_MANIFEST)) {
    map.set(key as CameraModelKey, entry.modelNo);
  }
  return map;
})();

/** All known CameraModelKeys (excluding 'unknown'). */
export const knownModelKeys: ReadonlyArray<CameraModelKey> = Object.keys(MODEL_MANIFEST) as CameraModelKey[];

// ---------------------------------------------------------------------------
// Public API — replaces switch-case conversions
// ---------------------------------------------------------------------------

/**
 * Resolve CameraModelKey from a GoPro modelNo.
 * Returns 'unknown' when the modelNo is not recognized.
 */
export function resolveCameraModelKeyFromModelNo(
  modelNo: number | null | undefined,
): CameraModelKey {
  if (modelNo == null) return 'unknown';
  return modelNoToKey.get(modelNo) ?? 'unknown';
}

/**
 * Resolve GoPro modelNo from a CameraModelKey.
 * Returns null when the key is unknown.
 */
export function resolveModelNoFromCameraModelKey(
  key: CameraModelKey | null | undefined,
): number | null {
  if (!key) return null;
  return keyToModelNo.get(key) ?? null;
}

/**
 * Get the manifest entry for a CameraModelKey.
 * Returns undefined for 'unknown' or unrecognized keys.
 */
export function getModelManifest(
  key: CameraModelKey | null | undefined,
): { modelNo: number; generation: number; family: string } | undefined {
  if (!key || key === 'unknown') return undefined;
  return MODEL_MANIFEST[key as keyof typeof MODEL_MANIFEST];
}

/**
 * Get the manifest entry for a modelNo.
 */
export function getModelManifestByModelNo(
  modelNo: number | null | undefined,
): { key: CameraModelKey; modelNo: number; generation: number; family: string } | undefined {
  if (modelNo == null) return undefined;
  const key = modelNoToKey.get(modelNo);
  if (!key) return undefined;
  const entry = MODEL_MANIFEST[key as keyof typeof MODEL_MANIFEST];
  return { key, ...entry };
}

// ---------------------------------------------------------------------------
// Generation-based helpers — replace hand-written isHeroXOrNewerModel functions
// ---------------------------------------------------------------------------

/**
 * Returns true when `modelNo` belongs to the same generation or a newer one
 * than the model identified by `targetKey`.
 *
 * MAX (generation 0) is always considered older than any HERO model.
 */
export function isSameOrNewerGeneration(
  modelNo: number | null | undefined,
  targetKey: CameraModelKey,
): boolean {
  const target = getModelManifest(targetKey);
  if (!target) return false;
  const actual = getModelManifestByModelNo(modelNo);
  if (!actual) return false;
  return actual.generation >= target.generation;
}

/**
 * Returns true when `modelNo` belongs to a generation strictly newer than
 * the model identified by `targetKey`.
 */
export function isNewerGeneration(
  modelNo: number | null | undefined,
  targetKey: CameraModelKey,
): boolean {
  const target = getModelManifest(targetKey);
  if (!target) return false;
  const actual = getModelManifestByModelNo(modelNo);
  if (!actual) return false;
  return actual.generation > target.generation;
}

/**
 * Check whether `modelNo` falls within a generation range (inclusive).
 */
export function isGenerationRange(
  modelNo: number | null | undefined,
  fromKey: CameraModelKey,
  toKey: CameraModelKey,
): boolean {
  const from = getModelManifest(fromKey);
  const to = getModelManifest(toKey);
  if (!from || !to) return false;
  const actual = getModelManifestByModelNo(modelNo);
  if (!actual) return false;
  const min = Math.min(from.generation, to.generation);
  const max = Math.max(from.generation, to.generation);
  return actual.generation >= min && actual.generation <= max;
}

// ---------------------------------------------------------------------------
// Family-based helpers — replace hand-written isHeroXFamilyModel functions
// ---------------------------------------------------------------------------

/**
 * Returns true when `modelNo` belongs to one of the specified families.
 * e.g. isModelFamily(modelNo, 'hero', 'hero-mini') covers all HERO models.
 */
export function isModelFamily(
  modelNo: number | null | undefined,
  ...families: string[]
): boolean {
  const actual = getModelManifestByModelNo(modelNo);
  if (!actual) return false;
  return families.includes(actual.family);
}

/**
 * Returns true when `modelNo` belongs to the 'max' family.
 */
export function isMaxModel(modelNo: number | null | undefined): boolean {
  return isModelFamily(modelNo, 'max');
}

/**
 * Returns true when `modelNo` belongs to any HERO family (hero or hero-mini).
 */
export function isHeroFamilyModel(modelNo: number | null | undefined): boolean {
  return isModelFamily(modelNo, 'hero', 'hero-mini');
}

// ---------------------------------------------------------------------------
// Backward-compat: GOPRO_MODEL_NUMBERS constant (kept for import compatibility)
// ---------------------------------------------------------------------------

/**
 * GOPRO_MODEL_NUMBERS — derived from MODEL_MANIFEST so there is only one
 * source of truth. Kept here so existing imports of this constant continue
 * to work without any file-level changes.
 */
export const GOPRO_MODEL_NUMBERS = (() => {
  const nums: Record<string, number> = {};
  for (const [key, entry] of Object.entries(MODEL_MANIFEST)) {
    // UPPERCASE key, e.g. 'hero13' -> 'HERO13_BLACK' (legacy naming)
    const legacyName = keyToLegacyName(key);
    nums[legacyName] = entry.modelNo;
  }
  return nums as { [K in keyof typeof MODEL_MANIFEST as Uppercase<string>]: number };
})();

function keyToLegacyName(key: string): string {
  const map: Record<string, string> = {
    hero09: 'HERO09_BLACK',
    hero10: 'HERO10_BLACK',
    hero11: 'HERO11_BLACK',
    heromi11: 'HERO11_BLACK_MINI',
    hero12: 'HERO12_BLACK',
    hero13: 'HERO13_BLACK',
    max: 'MAX',
  };
  return map[key] ?? key.toUpperCase();
}

/** Type alias for backward compatibility. */
export type GoProModelNumberLegacy = (typeof GOPRO_MODEL_NUMBERS)[keyof typeof GOPRO_MODEL_NUMBERS];

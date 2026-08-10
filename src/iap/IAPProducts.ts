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
 * In-App Purchase product definitions and model-to-product mapping.
 *
 * Product IDs are carried over from the legacy Xamarin app so that
 * existing purchases can be restored without re-purchasing.
 */

export const IAP_PRODUCT_IDS = [
  'gopro_hero09_protune',
  'gopro_hero10_protune',
  'gopro_hero11_protune',
  'gopro_hero11_mini_protune',
  'gopro_hero12_protune',
  'gopro_hero13_protune',
  'gopro_max_protune',
] as const;

export type IAPProductId = (typeof IAP_PRODUCT_IDS)[number];

/**
 * Maps HardwareInfo.modelName (from BLE 0x3C response) to the
 * corresponding product ID.
 *
 * modelName examples: "HERO13 Black", "HERO12 Black", "HERO11 Black Mini", "MAX", "GoPro MAX"
 * Matches prefix-based rules for HERO series, and handles substring matching for MAX to accommodate prefixes like "GoPro MAX".
 */
const MODEL_PRODUCT_MAP: [RegExp, IAPProductId][] = [
  [/^HERO\s*13/i, 'gopro_hero13_protune'],
  [/^HERO\s*12/i, 'gopro_hero12_protune'],
  [/^HERO\s*11.*MINI/i, 'gopro_hero11_mini_protune'],
  [/^HERO\s*11/i, 'gopro_hero11_protune'],
  [/^HERO\s*10/i, 'gopro_hero10_protune'],
  [/^HERO\s*9/i, 'gopro_hero09_protune'],
  [/MAX/i, 'gopro_max_protune'],
];

/**
 * Resolve the Product ID for a connected camera.
 * Returns `null` if the model is unrecognised.
 */
export const getProductIdForModel = (modelName: string | null | undefined): IAPProductId | null => {
  if (!modelName) return null;
  for (const [re, productId] of MODEL_PRODUCT_MAP) {
    if (re.test(modelName)) return productId;
  }
  return null;
};

/**
 * Human-readable display name for a product (used in purchase UI).
 */
export const getProductDisplayName = (productId: IAPProductId): string => {
  const map: Record<IAPProductId, string> = {
    gopro_hero09_protune: 'GoPro Hero 9 ProTune',
    gopro_hero10_protune: 'GoPro Hero 10 ProTune',
    gopro_hero11_protune: 'GoPro Hero 11 ProTune',
    gopro_hero11_mini_protune: 'GoPro Hero 11 Mini ProTune',
    gopro_hero12_protune: 'GoPro Hero 12 ProTune',
    gopro_hero13_protune: 'GoPro Hero 13 ProTune',
    gopro_max_protune: 'GoPro Max ProTune',
  };
  return map[productId];
};

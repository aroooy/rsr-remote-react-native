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

import { GoProSettingId } from './GoProSettingIds';
import { resolveModelNoFromCameraModelKey } from '../cameraModels/shared/modelNumber';
import { isHero11OrNewerModel, isMaxModel } from '../cameraModels/shared/modelNoHelpers';
import type { CameraModelKey } from './ResolutionAspectMap';

/**
 * Layer to resolve BLE ID reuse (collision).
 * Since GoPro sometimes reuses the same BLE ID for different features depending on the generation,
 * we map them to a semantic ID (unique setting item) before searching metadata.
 */
export const resolveSemanticSettingId = (
  rawSettingId: number,
  modelKey?: string | null,
  modelNoArg?: number | null,
): number => {
  const modelNo =
    modelNoArg ?? resolveModelNoFromCameraModelKey(modelKey as CameraModelKey | null | undefined);

  if (isMaxModel(modelNo)) {
    // 143: Lens Direction on MAX
    if (rawSettingId === 143) return GoProSettingId.MAX_LENS_DIRECTION;
    // 161 (DEFAULT_PRESET): Actual MAX device sends both 127 and 161, but the correct destination is 127
    if (rawSettingId === GoProSettingId.DEFAULT_PRESET) return GoProSettingId.DEFAULT_PRESET_MAX;
  }

  if (isHero11OrNewerModel(modelNo)) {
    // 143: 10-Bit Color on HERO11 and newer
    if (rawSettingId === 143) return GoProSettingId.TEN_BIT_COLOR;
  }

  return rawSettingId;
};

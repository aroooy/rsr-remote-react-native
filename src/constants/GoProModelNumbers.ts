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
 * GoPro modelNo definitions — single source of truth is `modelManifest.ts`.
 * This file re-exports for backward compatibility.
 *
 * Reference:
 * - ProTuneRemote_Latest/ProTuneRemote/Constans/GoProModelNo.cs
 * - Open GoPro API `CameraInfo.model_number`
 */

export {
  GOPRO_MODEL_NUMBERS,
} from '../cameraModels/shared/modelManifest';

export type { GoProModelNumberLegacy as GoProModelNumber } from '../cameraModels/shared/modelManifest';

// Keep the label map here (model-specific display names, not derivable from manifest)
import { GOPRO_MODEL_NUMBERS } from '../cameraModels/shared/modelManifest';

export const GOPRO_MODEL_NUMBER_LABELS = {
  [GOPRO_MODEL_NUMBERS.MAX]: 'GoPro Max',
  [GOPRO_MODEL_NUMBERS.HERO09_BLACK]: 'HERO09 Black',
  [GOPRO_MODEL_NUMBERS.HERO10_BLACK]: 'HERO10 Black',
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: 'HERO11 Black',
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: 'HERO11 Black Mini',
  [GOPRO_MODEL_NUMBERS.HERO12_BLACK]: 'HERO12 Black',
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: 'HERO13 Black',
} as const satisfies Readonly<Record<number, string>>;

export const getGoProModelNumberLabel = (modelNo: number | null | undefined): string | null => {
  if (modelNo === null || modelNo === undefined) return null;
  return GOPRO_MODEL_NUMBER_LABELS[modelNo as number] ?? null;
};

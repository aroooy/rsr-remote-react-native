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

import type { CameraModelKey } from './ResolutionAspectMap';
import { GOPRO_MODEL_NUMBERS } from './GoProModelNumbers';
import { resolveModelNoFromCameraModelKey } from '../cameraModels/shared/modelNumber';

export type HardwareFeatures = {
  hasFrontLcd: boolean;
  hasMaxLensMod: boolean;
  supports10Bit: boolean;
  supportsLogVideo: boolean;
  is360Camera: boolean;
};

const DEFAULT_FEATURES: HardwareFeatures = {
  hasFrontLcd: true,
  hasMaxLensMod: true,
  supports10Bit: false,
  supportsLogVideo: false,
  is360Camera: false,
};

export const HARDWARE_FEATURES: Record<number, HardwareFeatures> = {
  [GOPRO_MODEL_NUMBERS.HERO09_BLACK]: {
    ...DEFAULT_FEATURES,
    hasMaxLensMod: true,
    supports10Bit: false,
  },
  [GOPRO_MODEL_NUMBERS.HERO10_BLACK]: {
    ...DEFAULT_FEATURES,
    hasMaxLensMod: true,
    supports10Bit: false,
  },
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: {
    ...DEFAULT_FEATURES,
    hasMaxLensMod: true,
    supports10Bit: true,
  },
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: {
    ...DEFAULT_FEATURES,
    hasFrontLcd: false,
    hasMaxLensMod: true,
    supports10Bit: true,
  },
  [GOPRO_MODEL_NUMBERS.HERO12_BLACK]: {
    ...DEFAULT_FEATURES,
    hasMaxLensMod: true,
    supports10Bit: true,
    supportsLogVideo: true,
  },
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: {
    ...DEFAULT_FEATURES,
    hasMaxLensMod: true,
    supports10Bit: true,
    supportsLogVideo: true,
  },
  [GOPRO_MODEL_NUMBERS.MAX]: { ...DEFAULT_FEATURES, hasMaxLensMod: false, is360Camera: true },
};

export const getHardwareFeaturesByModelNo = (
  modelNo: number | null | undefined,
): HardwareFeatures => {
  if (modelNo == null) return DEFAULT_FEATURES;
  return HARDWARE_FEATURES[modelNo] || DEFAULT_FEATURES;
};

export const getHardwareFeatures = (modelKey: string | null | undefined): HardwareFeatures => {
  if (!modelKey) return DEFAULT_FEATURES;
  const modelNo = resolveModelNoFromCameraModelKey(modelKey as CameraModelKey);
  return getHardwareFeaturesByModelNo(modelNo);
};

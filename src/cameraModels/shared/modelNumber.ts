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

import type { CameraModelKey } from '../../constants/ResolutionAspectMap';
import { GOPRO_MODEL_NUMBERS } from '../../constants/GoProModelNumbers';

export const resolveCameraModelKeyFromModelNo = (
  modelNo: number | null | undefined,
): CameraModelKey => {
  switch (modelNo) {
    case GOPRO_MODEL_NUMBERS.HERO13_BLACK:
      return 'hero13';
    case GOPRO_MODEL_NUMBERS.HERO12_BLACK:
      return 'hero12';
    case GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI:
      return 'heromi11';
    case GOPRO_MODEL_NUMBERS.HERO11_BLACK:
      return 'hero11';
    case GOPRO_MODEL_NUMBERS.HERO10_BLACK:
      return 'hero10';
    case GOPRO_MODEL_NUMBERS.HERO09_BLACK:
      return 'hero09';
    case GOPRO_MODEL_NUMBERS.MAX:
      return 'max';
    default:
      return 'unknown';
  }
};

export const resolveModelNoFromCameraModelKey = (
  key: CameraModelKey | null | undefined,
): number | null => {
  switch (key) {
    case 'hero13':
      return GOPRO_MODEL_NUMBERS.HERO13_BLACK;
    case 'hero12':
      return GOPRO_MODEL_NUMBERS.HERO12_BLACK;
    case 'heromi11':
      return GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI;
    case 'hero11':
      return GOPRO_MODEL_NUMBERS.HERO11_BLACK;
    case 'hero10':
      return GOPRO_MODEL_NUMBERS.HERO10_BLACK;
    case 'hero09':
      return GOPRO_MODEL_NUMBERS.HERO09_BLACK;
    case 'max':
      return GOPRO_MODEL_NUMBERS.MAX;
    default:
      return null;
  }
};

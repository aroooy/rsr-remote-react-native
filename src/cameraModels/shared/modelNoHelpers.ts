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

import { GOPRO_MODEL_NUMBERS, GoProModelNumber } from '../../constants/GoProModelNumbers';

export const isGoProModelNumber = (
  modelNo: number | null | undefined,
  expected: GoProModelNumber,
): boolean => {
  return modelNo === expected;
};

export const isHero13Model = (modelNo: number | null | undefined): boolean => {
  return modelNo === GOPRO_MODEL_NUMBERS.HERO13_BLACK;
};

export const isHero12Model = (modelNo: number | null | undefined): boolean => {
  return modelNo === GOPRO_MODEL_NUMBERS.HERO12_BLACK;
};

export const isHero12Or13Model = (modelNo: number | null | undefined): boolean => {
  return (
    modelNo === GOPRO_MODEL_NUMBERS.HERO12_BLACK || modelNo === GOPRO_MODEL_NUMBERS.HERO13_BLACK
  );
};

export const isHero11Model = (modelNo: number | null | undefined): boolean => {
  return modelNo === GOPRO_MODEL_NUMBERS.HERO11_BLACK;
};

export const isHero11MiniModel = (modelNo: number | null | undefined): boolean => {
  return modelNo === GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI;
};

export const isHero11FamilyModel = (modelNo: number | null | undefined): boolean => {
  return (
    modelNo === GOPRO_MODEL_NUMBERS.HERO11_BLACK ||
    modelNo === GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI
  );
};

export const isHero11FamilyOrMaxModel = (modelNo: number | null | undefined): boolean => {
  return isHero11FamilyModel(modelNo) || modelNo === GOPRO_MODEL_NUMBERS.MAX;
};

export const isHero11OrNewerModel = (modelNo: number | null | undefined): boolean => {
  return isHero11FamilyModel(modelNo) || isHero12Or13Model(modelNo);
};

export const isMaxModel = (modelNo: number | null | undefined): boolean => {
  return modelNo === GOPRO_MODEL_NUMBERS.MAX;
};

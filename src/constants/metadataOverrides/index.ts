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

import { GOPRO_MODEL_NUMBERS } from '../GoProModelNumbers';
import { hero09MetadataOverrides } from './hero09';
import { hero10MetadataOverrides } from './hero10';
import { hero11MetadataOverrides } from './hero11';
import { hero12MetadataOverrides } from './hero12';
import { hero13MetadataOverrides } from './hero13';
import { heromi11MetadataOverrides } from './heromi11';
import { maxMetadataOverrides } from './max';
import type {
  ModelBoolValueOverrides,
  ModelPresetNameOverrides,
  ModelStaticFallbacks,
  ModelValueOrderOverrides,
  ModelValueOverrides,
} from './types';

const transposeModelSettingMap = <T>(
  source: Partial<Record<number, { [settingId: number]: T } | undefined>>,
): { [settingId: number]: { [modelKey: number]: T } } => {
  const result: { [settingId: number]: { [modelKey: number]: T } } = {};

  for (const [modelKey, overrides] of Object.entries(source)) {
    if (!overrides) continue;

    for (const [settingId, value] of Object.entries(overrides)) {
      const numericSettingId = Number(settingId);
      if (!result[numericSettingId]) {
        result[numericSettingId] = {};
      }
      result[numericSettingId][Number(modelKey)] = value;
    }
  }

  return result;
};

export const MODEL_VALUE_OVERRIDES: ModelValueOverrides = {
  [GOPRO_MODEL_NUMBERS.HERO09_BLACK]: hero09MetadataOverrides.valueOverrides,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: hero11MetadataOverrides.valueOverrides,
  [GOPRO_MODEL_NUMBERS.HERO12_BLACK]: hero12MetadataOverrides.valueOverrides,
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: hero13MetadataOverrides.valueOverrides,
  [GOPRO_MODEL_NUMBERS.MAX]: maxMetadataOverrides.valueOverrides,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: heromi11MetadataOverrides.valueOverrides,
};

export const GOPRO_BOOL_VALUES_MODEL_OVERRIDE: ModelBoolValueOverrides = {
  [GOPRO_MODEL_NUMBERS.HERO10_BLACK]: hero10MetadataOverrides.boolValueOverrides,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: hero11MetadataOverrides.boolValueOverrides,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: heromi11MetadataOverrides.boolValueOverrides,
};

const MODEL_STATIC_FALLBACKS: ModelStaticFallbacks = {
  [GOPRO_MODEL_NUMBERS.HERO09_BLACK]: hero09MetadataOverrides.staticFallbacks,
  [GOPRO_MODEL_NUMBERS.HERO10_BLACK]: hero10MetadataOverrides.staticFallbacks,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: hero11MetadataOverrides.staticFallbacks,
  [GOPRO_MODEL_NUMBERS.MAX]: maxMetadataOverrides.staticFallbacks,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: heromi11MetadataOverrides.staticFallbacks,
};

export const GOPRO_SETTING_STATIC_FALLBACKS_MODEL_OVERRIDE =
  transposeModelSettingMap(MODEL_STATIC_FALLBACKS);

const MODEL_VALUE_ORDER_OVERRIDES: ModelValueOrderOverrides = {
  [GOPRO_MODEL_NUMBERS.HERO09_BLACK]: hero09MetadataOverrides.valueOrderOverrides,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: hero11MetadataOverrides.valueOrderOverrides,
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: hero13MetadataOverrides.valueOrderOverrides,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: heromi11MetadataOverrides.valueOrderOverrides,
};

export const GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE = transposeModelSettingMap(
  MODEL_VALUE_ORDER_OVERRIDES,
);

export const PRESET_NAME_OVERRIDES: ModelPresetNameOverrides = {
  [GOPRO_MODEL_NUMBERS.HERO09_BLACK]: hero09MetadataOverrides.presetNameOverrides,
  [GOPRO_MODEL_NUMBERS.HERO10_BLACK]: hero10MetadataOverrides.presetNameOverrides,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: hero11MetadataOverrides.presetNameOverrides,
  [GOPRO_MODEL_NUMBERS.HERO12_BLACK]: hero12MetadataOverrides.presetNameOverrides,
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: hero13MetadataOverrides.presetNameOverrides,
  [GOPRO_MODEL_NUMBERS.MAX]: maxMetadataOverrides.presetNameOverrides,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: heromi11MetadataOverrides.presetNameOverrides,
};

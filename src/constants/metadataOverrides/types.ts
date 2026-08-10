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

export type SettingValueOverrideMap = { [settingId: number]: { [value: number]: string } };

export type BoolValueOverrideMap = {
  [settingId: number]: { onValue?: number; offValue?: number };
};

export type StaticFallbackOverrideMap = { [settingId: number]: number[] };

export type ValueOrderOverrideMap = { [settingId: number]: number[] };

export type PresetOverrideTable = Readonly<Record<number, string>>;

export type ModelMetadataOverrides = {
  valueOverrides?: SettingValueOverrideMap;
  boolValueOverrides?: BoolValueOverrideMap;
  staticFallbacks?: StaticFallbackOverrideMap;
  valueOrderOverrides?: ValueOrderOverrideMap;
  presetNameOverrides?: PresetOverrideTable;
};

export type ModelValueOverrides = Partial<Record<number, SettingValueOverrideMap>>;

export type ModelBoolValueOverrides = Partial<Record<number, BoolValueOverrideMap>>;

export type ModelStaticFallbacks = Partial<Record<number, StaticFallbackOverrideMap>>;

export type ModelValueOrderOverrides = Partial<Record<number, ValueOrderOverrideMap>>;

export type ModelPresetNameOverrides = Partial<Record<number, PresetOverrideTable>>;

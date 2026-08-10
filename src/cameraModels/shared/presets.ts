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

import type { GoProPreset } from '../../ble/PresetProtobuf';
import type { GoProPresetGroupData } from '../../ble/PresetProtobuf';

export const createPlaceholderPreset = (id: number): GoProPreset => ({
  id,
  titleId: 0,
  titleNumber: 0,
  basePresetId: id,
  userDefined: false,
  isModified: false,
  isFixed: false,
  isVisible: true,
  customName: null,
  iconId: 0,
  settings: [],
});

export const getReceivedGroupPresets = (
  presets: GoProPresetGroupData[],
  currentGroupId: number | undefined,
): GoProPreset[] => {
  const group = presets.find((entry) => entry.groupId === currentGroupId);
  return group?.presets ?? [];
};

export const applyPresetSupplement = (
  received: GoProPreset[],
  currentGroupId: number | undefined,
  supplementTable: Readonly<Record<number, readonly number[]>> | null,
): GoProPreset[] => {
  if (!supplementTable || currentGroupId === undefined) return received;

  const knownIds = supplementTable[currentGroupId];
  if (!knownIds) return received;

  const receivedMap = new Map(received.map((preset) => [preset.id, preset]));
  return knownIds.map((id) => receivedMap.get(id) ?? createPlaceholderPreset(id));
};

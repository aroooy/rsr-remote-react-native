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

import type { GoProPreset, GoProPresetGroupData } from '../../ble/PresetProtobuf';
import type { SpecialRowsProjection } from '../../cameraModels/shared/types';

export type SettingsMap = Record<number, number>;

export const findActivePreset = (
  presets: readonly GoProPresetGroupData[] | undefined,
  currentGroupId: number | undefined,
  currentPresetId: number | undefined,
): GoProPreset | undefined => {
  if (!presets || currentPresetId === undefined) return undefined;

  for (const group of presets) {
    if (currentGroupId !== undefined && group.groupId !== currentGroupId) continue;
    const preset = group.presets.find((item) => item.id === currentPresetId);
    if (preset) return preset;
  }

  for (const group of presets) {
    const preset = group.presets.find((item) => item.id === currentPresetId);
    if (preset) return preset;
  }

  return undefined;
};

export type GoProDisplayLayout = {
  quickSettingIds: readonly number[];
  prioritizedAdvancedSettingIds: readonly number[];
  defaultVisibleAdvancedSettingIds: readonly number[];
};

export type GoProLayoutExternalControls = {
  showsMediaFormatPrimary: boolean;
  showsFramingSelector: boolean;
  showsResolutionSelector: boolean;
};

export type GoProSpecialRowsProjection = SpecialRowsProjection;

export type GoProCapabilityCacheKeyProjection = {
  dependencySettingIds: readonly number[];
  mediaFormatSettingId: number | null;
  framingSettingId: number | null;
  lensSettingId: number | null;
  hyperSmoothSettingId: number | null;
};

export type GoProDisplaySettingPlan = {
  displayLayout: GoProDisplayLayout;
  uiSettingIds: readonly number[];
  layoutExternalControls: GoProLayoutExternalControls;
  specialRowsProjection: GoProSpecialRowsProjection;
  cacheKeyProjection: GoProCapabilityCacheKeyProjection;
  defaultCapabilityPrefetchIds: readonly number[];
  fullRefreshBaseIds: readonly number[];
  displayRelevantSettingIds: readonly number[];
  dependencyRelevantSettingIds: readonly number[];
};

export class LayoutBuilder {
  private quickSettingIds: number[];
  private prioritizedAdvancedSettingIds: number[];
  private defaultVisibleAdvancedSettingIds: number[];

  constructor(base?: GoProDisplayLayout) {
    this.quickSettingIds = base ? [...base.quickSettingIds] : [];
    this.prioritizedAdvancedSettingIds = base ? [...base.prioritizedAdvancedSettingIds] : [];
    this.defaultVisibleAdvancedSettingIds = base ? [...base.defaultVisibleAdvancedSettingIds] : [];
  }

  insertAfter(
    arrayName: 'quickSettingIds' | 'prioritizedAdvancedSettingIds',
    targetId: number,
    newId: number,
  ) {
    const arr = this[arrayName];
    const idx = arr.indexOf(targetId);
    if (idx !== -1) {
      arr.splice(idx + 1, 0, newId);
    } else {
      arr.push(newId);
    }
    return this;
  }

  replace(
    arrayName: 'quickSettingIds' | 'prioritizedAdvancedSettingIds',
    targetId: number,
    newId: number,
  ) {
    const arr = this[arrayName];
    const idx = arr.indexOf(targetId);
    if (idx !== -1) arr[idx] = newId;
    return this;
  }

  remove(arrayName: 'quickSettingIds' | 'prioritizedAdvancedSettingIds', targetId: number) {
    const arr = this[arrayName];
    const idx = arr.indexOf(targetId);
    if (idx !== -1) arr.splice(idx, 1);
    return this;
  }

  build(): GoProDisplayLayout {
    return {
      quickSettingIds: this.quickSettingIds,
      prioritizedAdvancedSettingIds: this.prioritizedAdvancedSettingIds,
      defaultVisibleAdvancedSettingIds: this.defaultVisibleAdvancedSettingIds,
    };
  }
}

export const composeDisplayLayout = (
  presetLayout: GoProDisplayLayout,
  cameraAdvancedSettingIds: readonly number[],
): GoProDisplayLayout => ({
  quickSettingIds: presetLayout.quickSettingIds,
  prioritizedAdvancedSettingIds: Array.from(
    new Set([...presetLayout.prioritizedAdvancedSettingIds, ...cameraAdvancedSettingIds]),
  ),
  defaultVisibleAdvancedSettingIds: presetLayout.defaultVisibleAdvancedSettingIds,
});

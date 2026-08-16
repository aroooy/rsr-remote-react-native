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

import type { StateCreator } from 'zustand';
import type { GoProState } from '../storeTypes';
import { createDefaultCameraState } from '../storeTypes';
import type { GoProPresetGroupData } from '../../ble/PresetProtobuf';
import {
  normalizeBaseDisplayPresetId,
  resolveBaseDisplayPresetId,
} from '../../cameraModels/shared/displayPreset';

export interface PresetSlice {
  setPresets: (groups: GoProPresetGroupData[], deviceId?: string) => void;
}

export const createPresetSlice: StateCreator<
  GoProState,
  [],
  [],
  PresetSlice
> = (set) => ({
  setPresets: (groups, deviceId) =>
    set((state) => {
      const id = deviceId ?? state.connectedDeviceId;
      if (!id) return state;
      const cameraState = state.cameraStates[id] || createDefaultCameraState();

      type Meta = {
        customName: string | null;
        iconId: number;
        basePresetId?: number;
        settings: GoProPresetGroupData['presets'][number]['settings'];
      };
      const metaCache = new Map<string, Meta>();
      for (const group of cameraState.presets) {
        for (const preset of group.presets) {
          metaCache.set(`${group.groupId}:${preset.id}`, {
            customName: preset.customName,
            iconId: preset.iconId,
            basePresetId: preset.basePresetId,
            settings: preset.settings,
          });
        }
      }
      const merged = groups.map((group) => ({
        ...group,
        presets: group.presets.map((preset) => {
          const prev = metaCache.get(`${group.groupId}:${preset.id}`);
          const normalizedBasePresetId = normalizeBaseDisplayPresetId(
            preset.basePresetId ?? prev?.basePresetId,
          );
          const mergedPreset = {
            ...preset,
            customName: preset.customName || prev?.customName || null,
            iconId: preset.iconId !== 0 ? preset.iconId : (prev?.iconId ?? 0),
            basePresetId: normalizedBasePresetId,
            settings: preset.settings.length > 0 ? preset.settings : (prev?.settings ?? []),
          };
          return {
            ...mergedPreset,
            basePresetId:
              normalizeBaseDisplayPresetId(mergedPreset.basePresetId) ??
              resolveBaseDisplayPresetId(mergedPreset, mergedPreset.id, group.groupId),
          };
        }),
      }));

      return {
        cameraStates: {
          ...state.cameraStates,
          [id]: { ...cameraState, presets: merged },
        },
      };
    }),
});

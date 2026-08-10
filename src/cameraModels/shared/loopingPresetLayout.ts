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
import type { DisplayLayoutShape, ResolveVideoLayoutParams } from './types';
import { PRESET_VIRTUAL_LOOPING } from '../../constants/presetIds';

export const isLoopingPreset = (
  activePreset: GoProPreset | undefined,
  loopingIntervalSettingId: number,
  currentPresetId?: number,
): boolean => {
  return (
    currentPresetId === PRESET_VIRTUAL_LOOPING ||
    (activePreset?.settings.some((setting) => setting.id === loopingIntervalSettingId) ?? false)
  );
};

const createLoopingPresetLayout = (ids: ResolveVideoLayoutParams['ids']): DisplayLayoutShape => ({
  quickSettingIds: [ids.fps, ids.videoLens, ids.hyperSmooth],
  prioritizedAdvancedSettingIds: [ids.loopingInterval, ids.scheduledCapture, ids.captureDelay],
  defaultVisibleAdvancedSettingIds: [ids.loopingInterval, ids.scheduledCapture, ids.captureDelay],
});

export const resolveLoopingPresetLayout = ({
  activePreset,
  cameraModel,
  currentPresetId,
  composeDisplayLayout,
  getCameraAdvancedSettingIds,
  ids,
}: Pick<
  ResolveVideoLayoutParams,
  | 'activePreset'
  | 'cameraModel'
  | 'currentPresetId'
  | 'composeDisplayLayout'
  | 'getCameraAdvancedSettingIds'
  | 'ids'
>): DisplayLayoutShape | undefined => {
  const loopingPresetActive = isLoopingPreset(activePreset, ids.loopingInterval, currentPresetId);

  if (!loopingPresetActive) return undefined;

  return composeDisplayLayout(
    createLoopingPresetLayout(ids),
    getCameraAdvancedSettingIds(cameraModel),
  );
};

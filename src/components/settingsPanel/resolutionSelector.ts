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

import {
  EASY_VIDEO_PRESETS,
  GoProPresetGroup,
  GoProSettingId,
} from '../../constants/GoProSettingIds';
import { filterPrimaryItemValues } from './primaryItemValues';
import type { CameraModelKey } from '../../constants/ResolutionAspectMap';
import type { CapabilitiesSnapshot, SettingsSnapshot } from '../../cameraModels/shared/types';
import { resolveModelNoFromCameraModelKey } from '../../cameraModels/shared/modelNumber';
import { isHero11Model } from '../../cameraModels/shared/modelNoHelpers';

type ResolveResolutionSelectorParams = {
  resolutionValues: readonly number[];
  settings: SettingsSnapshot;
  pendingSettings: SettingsSnapshot;
  capabilities: CapabilitiesSnapshot;
  cameraModel: CameraModelKey;
  currentGroupId: number | undefined;
  currentPresetId: number | undefined;
  quickSettingIds: readonly number[];
  isHero13BurstSloMoActive: boolean;
  hasHero12EasyPresetConfig: boolean;
};

type ResolutionSelectorState = {
  currentValue: number | undefined;
  resolutionValues: number[];
};

export const resolveResolutionSelector = ({
  resolutionValues,
  settings,
  pendingSettings,
  capabilities,
  cameraModel,
  currentGroupId,
  currentPresetId,
  quickSettingIds,
  isHero13BurstSloMoActive,
  hasHero12EasyPresetConfig,
}: ResolveResolutionSelectorParams): ResolutionSelectorState | null => {
  const derivedModelNo = resolveModelNoFromCameraModelKey(cameraModel);

  if (quickSettingIds.includes(GoProSettingId.RESOLUTION)) return null;
  if (currentGroupId !== GoProPresetGroup.VIDEO) return null;
  if (isHero13BurstSloMoActive) return null;
  if (
    isHero11Model(derivedModelNo) &&
    currentPresetId !== undefined &&
    EASY_VIDEO_PRESETS.has(currentPresetId)
  )
    return null;
  if (hasHero12EasyPresetConfig) return null;

  const currentValue =
    pendingSettings[GoProSettingId.RESOLUTION] ?? settings[GoProSettingId.RESOLUTION];
  const nextValues = filterPrimaryItemValues({
    settingId: GoProSettingId.RESOLUTION,
    allowedValues: resolutionValues,
    settings,
    pendingSettings,
    cameraModel,
    currentPresetId,
    currentValue,
  });

  if (nextValues.length === 0) return null;

  return {
    currentValue,
    resolutionValues: nextValues,
  };
};

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

import { GoProSettingId } from '../../constants/GoProSettingId';
import {
  EASY_VIDEO_PRESETS,
  HERO11_EASY_PHOTO_PRESETS,
  HERO11_EASY_TIMELAPSE_PRESETS,
} from '../../constants/layout';
import { dispatchSelectableValuesResolver } from '../../cameraModels/shared/selectableValues';
import { hero09SelectableValuesResolver } from '../../cameraModels/hero09/selectableValues';
import { hero10SelectableValuesResolver } from '../../cameraModels/hero10/selectableValues';
import { hero11SelectableValuesResolver } from '../../cameraModels/hero11/selectableValues';
import { hero12SelectableValuesResolver } from '../../cameraModels/hero12/selectableValues';
import { maxSelectableValuesResolver } from '../../cameraModels/max/selectableValues';
import { heromi11SelectableValuesResolver } from '../../cameraModels/heromi11/selectableValues';
import { isAntiFlicker50Hz } from '../../cameraModels/shared/selectableValueHelpers';
import type {
  FilterSelectableValuesParams,
  ModelResolverMap,
  SelectableValuesResolver,
} from '../../cameraModels/shared/types';
import { resolveModelNoFromCameraModelKey } from '../../cameraModels/shared/modelNumber';
import { isHero11Model } from '../../cameraModels/shared/modelNoHelpers';
import { GOPRO_MODEL_NUMBERS } from '../../constants/GoProModelNumbers';

const SELECTABLE_VALUES_RESOLVERS: ModelResolverMap<SelectableValuesResolver> = {
  [GOPRO_MODEL_NUMBERS.HERO09_BLACK]: hero09SelectableValuesResolver,
  [GOPRO_MODEL_NUMBERS.HERO10_BLACK]: hero10SelectableValuesResolver,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: hero11SelectableValuesResolver,
  [GOPRO_MODEL_NUMBERS.HERO12_BLACK]: hero12SelectableValuesResolver,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: heromi11SelectableValuesResolver,
  [GOPRO_MODEL_NUMBERS.MAX]: maxSelectableValuesResolver,
};

const resolveLegacySelectableValues: SelectableValuesResolver = ({
  settingId,
  selectableValues,
  settings,
  pendingSettings,
  cameraModel,
  currentGroupId,
  currentPresetId,
}: FilterSelectableValuesParams): number[] => {
  let nextValues = [...selectableValues];

  const modelNo = resolveModelNoFromCameraModelKey(cameraModel);

  const isLegacyEasyVideoPreset =
    currentGroupId === 1000 &&
    currentPresetId !== undefined &&
    EASY_VIDEO_PRESETS.has(currentPresetId);
  const isHero11EasyPhotoPreset =
    isHero11Model(modelNo) &&
    currentGroupId === 1001 &&
    currentPresetId !== undefined &&
    HERO11_EASY_PHOTO_PRESETS.has(currentPresetId);
  const isHero11EasyTimelapsePreset =
    isHero11Model(modelNo) &&
    currentGroupId === 1002 &&
    currentPresetId !== undefined &&
    HERO11_EASY_TIMELAPSE_PRESETS.has(currentPresetId);

  if (nextValues.length === 0 && settingId === GoProSettingId.FPS && isLegacyEasyVideoPreset) {
    const is50Hz = isAntiFlicker50Hz(settings[GoProSettingId.ANTI_FLICKER]);
    nextValues = is50Hz ? [6, 9, 10] : [5, 8, 10];
  }

  if (
    nextValues.length === 0 &&
    settingId === GoProSettingId.PHOTO_LENS &&
    isHero11EasyPhotoPreset
  ) {
    nextValues = [101, 102];
  }

  if (settingId === GoProSettingId.VIDEO_LENS && isHero11EasyTimelapsePreset) {
    nextValues =
      nextValues.length === 0 ? [0, 4] : nextValues.filter((value) => value === 0 || value === 4);
  }

  return nextValues;
};

export const filterSelectableValues = (params: FilterSelectableValuesParams): number[] => {
  return dispatchSelectableValuesResolver(
    params,
    SELECTABLE_VALUES_RESOLVERS,
    resolveLegacySelectableValues,
  );
};

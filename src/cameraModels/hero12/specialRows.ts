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

import { getResolutionAspect, isHero12NewScheme } from '../../constants/ResolutionAspectMap';
import { GoProSettingId } from '../../constants/GoProSettingIds';
import { SPECIAL_ROW_KEYS } from '../../constants/specialRowsConstants';
import type {
  Hero12EasyFramingValue,
  Hero12EasyPresetConfig,
  ResolveSpecialRowsParams,
  SpecialRow,
  SpecialRowsResolver,
} from '../shared/types';
import { getHero12SpecialRowsProjection } from './specialRowsProjection';
import { getHero12EasyPresetConfig } from './specialRowsConfig';

export { getHero12EasyPresetConfig } from './specialRowsConfig';

const getHero12EasyQualityFramingValue = (
  hero12EasyPresetConfig: Hero12EasyPresetConfig,
  settings: ResolveSpecialRowsParams['settings'],
  pendingSettings: ResolveSpecialRowsParams['pendingSettings'],
): Hero12EasyFramingValue => {
  const fallbackFramingValue = hero12EasyPresetConfig.framingOptions[0]?.value ?? 0;
  const isAvailableFramingValue = (value: number): value is Hero12EasyFramingValue => {
    return hero12EasyPresetConfig.framingOptions.some((option) => option.value === value);
  };

  const currentFraming =
    pendingSettings[GoProSettingId.FRAMING] ?? settings[GoProSettingId.FRAMING];
  if (currentFraming !== undefined && isAvailableFramingValue(currentFraming)) {
    return currentFraming;
  }

  const currentResolution =
    pendingSettings[GoProSettingId.RESOLUTION] ?? settings[GoProSettingId.RESOLUTION];
  const currentAspect = getResolutionAspect('hero12', currentResolution);
  const derivedFraming =
    currentAspect === '9:16' ? 1 : currentAspect === '8:7' || currentAspect === '4:3' ? 2 : 0;
  return isAvailableFramingValue(derivedFraming) ? derivedFraming : fallbackFramingValue;
};

const isAntiFlicker50Hz = (value: number | undefined) => value === 1 || value === 3;

export const hero12SpecialRowsResolver: SpecialRowsResolver = ({
  settings,
  pendingSettings,
  currentGroupId,
  currentPresetId,
}: ResolveSpecialRowsParams): SpecialRow[] => {
  const visibleRowKeys = new Set(
    getHero12SpecialRowsProjection({
      settings,
      cameraModel: 'hero12',
      currentGroupId,
      currentPresetId,
    }).visibleRowKeys,
  );
  if (!visibleRowKeys.has(SPECIAL_ROW_KEYS.HERO12_EASY_QUALITY_FRAMING)) {
    return [];
  }

  const hero12EasyPresetConfig = getHero12EasyPresetConfig(currentPresetId);
  if (!hero12EasyPresetConfig) {
    return [];
  }

  const rows: SpecialRow[] = [];
  const currentResolution =
    pendingSettings[GoProSettingId.RESOLUTION] ?? settings[GoProSettingId.RESOLUTION];
  const currentFps = pendingSettings[GoProSettingId.FPS] ?? settings[GoProSettingId.FPS];
  const currentFraming = getHero12EasyQualityFramingValue(
    hero12EasyPresetConfig,
    settings,
    pendingSettings,
  );
  const useNewScheme = currentResolution !== undefined && isHero12NewScheme(currentResolution);
  const is50Hz = isAntiFlicker50Hz(settings[GoProSettingId.ANTI_FLICKER]);

  rows.push({
    key: SPECIAL_ROW_KEYS.HERO12_EASY_QUALITY_FRAMING,
    label: 'Framing',
    placement: 'beforePrimary',
    options: hero12EasyPresetConfig.framingOptions.map((option) => ({
      key: option.key,
      label: option.label,
      isSelected: currentFraming === option.value,
      actions: [{ type: 'setSetting', settingId: GoProSettingId.FRAMING, value: option.value }],
    })),
  });

  const speedOptions = (hero12EasyPresetConfig.speedOptions[currentFraming] ?? []).map(
    (option) => ({
      key: option.key,
      label: is50Hz ? option.label50 : option.label60,
      resolution: useNewScheme ? option.resolutionNew : option.resolutionLegacy,
      fps: is50Hz ? option.fps50 : option.fps60,
    }),
  );
  if (speedOptions.length > 0) {
    rows.push({
      key: SPECIAL_ROW_KEYS.HERO12_EASY_QUALITY_SPEED,
      label: 'SLO-MO SPEED',
      placement: 'afterPrimary',
      options: speedOptions.map((option) => ({
        key: option.key,
        label: option.label,
        isSelected: currentResolution === option.resolution && currentFps === option.fps,
        actions: [
          { type: 'setSetting', settingId: GoProSettingId.RESOLUTION, value: option.resolution },
          { type: 'setSetting', settingId: GoProSettingId.FPS, value: option.fps },
        ],
      })),
    });
  }

  return rows;
};

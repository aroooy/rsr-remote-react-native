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
  getSettingName,
  getSettingValueNameForModelWithContext,
} from '../../constants/GoProMetadata';
import { SPECIAL_ROW_KEYS } from '../../constants/specialRowsConstants';
import {
  PRESET_LEGACY_EASY_NIGHT_PHOTO,
  PRESET_LEGACY_EASY_PHOTO,
} from '../../constants/presetIds';
import type { ResolveSpecialRowsParams, SpecialRow, SpecialRowsResolver } from '../shared/types';
import { getHero11SpecialRowsProjection } from './specialRowsProjection';

const NIGHT_OFF_PRESET_ID = PRESET_LEGACY_EASY_PHOTO;
const NIGHT_ON_PRESET_ID = PRESET_LEGACY_EASY_NIGHT_PHOTO;

const isAntiFlicker50Hz = (value: number | undefined) => value === 1 || value === 3;

export const hero11SpecialRowsResolver: SpecialRowsResolver = ({
  settings,
  pendingSettings,
  cameraModel,
  currentGroupId,
  currentPresetId,
  firmwareVersion,
}: ResolveSpecialRowsParams): SpecialRow[] => {
  const rows: SpecialRow[] = [];
  const mediaFormat = settings[GoProSettingId.MEDIA_FORMAT];
  const visibleRowKeys = new Set(
    getHero11SpecialRowsProjection({
      settings,
      cameraModel,
      currentGroupId,
      currentPresetId,
    }).visibleRowKeys,
  );

  if (visibleRowKeys.has(SPECIAL_ROW_KEYS.HERO11_EASY_VIDEO_SPEED)) {
    const is50Hz = isAntiFlicker50Hz(settings[GoProSettingId.ANTI_FLICKER]);
    const currentResolution =
      pendingSettings[GoProSettingId.RESOLUTION] ?? settings[GoProSettingId.RESOLUTION];
    const currentFps = pendingSettings[GoProSettingId.FPS] ?? settings[GoProSettingId.FPS];
    const speedOptions = [
      { key: '8x', label: '8x UltraSloMo', resolution: 4, fps: is50Hz ? 13 : 0 },
      { key: '4x', label: '4x Super SloMo', resolution: 4, fps: is50Hz ? 2 : 1 },
      { key: '2x', label: '2x SloMo', resolution: 1, fps: is50Hz ? 6 : 5 },
      { key: '1x', label: '1x Speed / Low Light', resolution: 100, fps: is50Hz ? 9 : 8 },
    ];
    rows.push({
      key: 'hero11-easy-video-speed',
      label: 'Speed',
      placement: 'beforePrimary',
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

  if (
    visibleRowKeys.has(SPECIAL_ROW_KEYS.HERO11_EASY_PHOTO_NIGHT) &&
    currentPresetId !== undefined
  ) {
    const currentNightPresetId =
      currentPresetId === NIGHT_ON_PRESET_ID ? NIGHT_ON_PRESET_ID : NIGHT_OFF_PRESET_ID;
    const nightOptions = [
      { key: 'off', label: 'Off', presetId: NIGHT_OFF_PRESET_ID },
      { key: 'on', label: 'On', presetId: NIGHT_ON_PRESET_ID },
    ];
    rows.push({
      key: 'hero11-easy-photo-night',
      label: 'Night Mode',
      placement: 'beforePrimary',
      options: nightOptions.map((option) => ({
        key: option.key,
        label: option.label,
        isSelected: currentNightPresetId === option.presetId,
        actions:
          option.presetId === currentPresetId
            ? []
            : [{ type: 'loadPreset', presetId: option.presetId }],
      })),
    });
  }

  if (visibleRowKeys.has(SPECIAL_ROW_KEYS.HERO11_EASY_TIMELAPSE_SPEED_RAMP)) {
    const currentSpeedRamp =
      pendingSettings[GoProSettingId.SPEED_RAMP] ?? settings[GoProSettingId.SPEED_RAMP];
    const speedRampOptions = [
      { key: 'real-speed', value: 100 },
      { key: 'half-speed', value: 101 },
    ];
    rows.push({
      key: 'hero11-easy-timelapse-speed-ramp',
      label: getSettingName(GoProSettingId.SPEED_RAMP, cameraModel, currentPresetId, mediaFormat),
      placement: 'afterPrimary',
      options: speedRampOptions.map((option) => ({
        key: option.key,
        label: getSettingValueNameForModelWithContext(
          GoProSettingId.SPEED_RAMP,
          option.value,
          cameraModel,
          { settings },
          firmwareVersion,
        ),
        isSelected: currentSpeedRamp === option.value,
        actions: [
          { type: 'setSetting', settingId: GoProSettingId.SPEED_RAMP, value: option.value },
        ],
      })),
    });
  }

  return rows;
};

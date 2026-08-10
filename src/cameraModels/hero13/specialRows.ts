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
  GoProPresetGroup,
  GoProSettingId,
  GoProVideoPreset,
} from '../../constants/GoProSettingIds';
import { SPECIAL_ROW_KEYS } from '../../constants/specialRowsConstants';
import type { ResolveSpecialRowsParams, SpecialRow, SpecialRowsResolver } from '../shared/types';
import { getHero13SpecialRowsProjection } from './specialRowsProjection';

type Hero13BurstSloMoOption = {
  key: string;
  label: string;
  resolution: number;
  fps: number;
  duration: number;
  lens: number;
};

const HERO13_BURST_SLOMO_OPTIONS: readonly Hero13BurstSloMoOption[] = [
  {
    key: '5.3k-120-wide',
    label: '16:9 | 5.3K | 120 | Wide',
    resolution: 100,
    fps: 1,
    duration: 10,
    lens: 0,
  },
  {
    key: '900-360-linear',
    label: '16:9 | 900p | 360 | Linear',
    resolution: 38,
    fps: 16,
    duration: 1,
    lens: 4,
  },
  {
    key: '720-400-narrow',
    label: '16:9 | 720p | 400 | Narrow',
    resolution: 12,
    fps: 15,
    duration: 1,
    lens: 2,
  },
];

export const hero13SpecialRowsResolver: SpecialRowsResolver = ({
  settings,
  pendingSettings,
  currentGroupId,
  currentPresetId,
}: ResolveSpecialRowsParams): SpecialRow[] => {
  const isHero13BurstSloMoActive = getHero13SpecialRowsProjection({
    settings,
    cameraModel: 'hero13',
    currentGroupId,
    currentPresetId,
  }).visibleRowKeys.includes(SPECIAL_ROW_KEYS.HERO13_BURST_SLOMO_MODE);
  if (!isHero13BurstSloMoActive) {
    return [];
  }

  const currentResolution =
    pendingSettings[GoProSettingId.RESOLUTION] ?? settings[GoProSettingId.RESOLUTION];
  const currentFps = pendingSettings[GoProSettingId.FPS] ?? settings[GoProSettingId.FPS];
  const currentDuration =
    pendingSettings[GoProSettingId.VIDEO_DURATION] ?? settings[GoProSettingId.VIDEO_DURATION];
  const currentLens =
    pendingSettings[GoProSettingId.VIDEO_LENS_HERO13] ??
    pendingSettings[GoProSettingId.VIDEO_LENS] ??
    settings[GoProSettingId.VIDEO_LENS_HERO13] ??
    settings[GoProSettingId.VIDEO_LENS];

  return [
    {
      key: SPECIAL_ROW_KEYS.HERO13_BURST_SLOMO_MODE,
      label: 'Burst Slo-Mo',
      placement: 'beforePrimary',
      options: HERO13_BURST_SLOMO_OPTIONS.map((option) => ({
        key: option.key,
        label: option.label,
        isSelected:
          currentResolution === option.resolution &&
          currentFps === option.fps &&
          currentDuration === option.duration &&
          currentLens === option.lens,
        actions: [
          { type: 'setSetting', settingId: GoProSettingId.RESOLUTION, value: option.resolution },
          { type: 'setSetting', settingId: GoProSettingId.FPS, value: option.fps },
          { type: 'setSetting', settingId: GoProSettingId.VIDEO_DURATION, value: option.duration },
          { type: 'setSetting', settingId: GoProSettingId.VIDEO_LENS_HERO13, value: option.lens },
        ],
      })),
    },
  ];
};

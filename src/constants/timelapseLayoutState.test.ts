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

import { describe, it, expect } from 'vitest';
import { resolveTimelapseLayoutState } from './timelapseLayoutState';
import { GoProSettingId } from './GoProSettingIds';
import { PRESET_TIMELAPSE, PRESET_TIMEWARP } from './presetIds';
import type { ResolveTimelapseLayoutParams } from '../cameraModels/shared/types';

const makeParams = (
  overrides: Partial<ResolveTimelapseLayoutParams> = {},
): ResolveTimelapseLayoutParams => ({
  cameraModel: 'hero13',
  activePreset: PRESET_TIMELAPSE,
  category: 'lapse_with_photo',
  isPhotoFormat: false,
  isVideoFormat: true,
  isNightlapse: false,
  lensAttachment: undefined,
  ids: {
    videoLens: GoProSettingId.VIDEO_LENS,
    videoLensHero13: GoProSettingId.VIDEO_LENS_HERO13,
    timeLapseLens: GoProSettingId.TIME_LAPSE_LENS,
    resolution: GoProSettingId.RESOLUTION,
    fps: GoProSettingId.FPS,
    timelapsePhotoOutput: GoProSettingId.TIMELAPSE_PHOTO_OUTPUT,
    horizontalLeveling: GoProSettingId.HORIZONTAL_LEVELING,
    videoBitrate: GoProSettingId.VIDEO_BITRATE,
    videoBitrateHero11: GoProSettingId.VIDEO_BITRATE_HERO11,
    videoBitrateHero09: GoProSettingId.VIDEO_BITRATE_HERO09,
    windReduction: GoProSettingId.WIND_REDUCTION,
    maxWindReduction: GoProSettingId.MAX_WIND_REDUCTION,
  },
  horizontalLevelingTimelapsePresets: new Set<number>(),
  hero13MaxTrail2Presets: new Set<number>(),
  hero13MaxLensAttachmentValues: [2, 3],
  ...overrides,
});

describe('resolveTimelapseLayoutState', () => {
  it('Hero13 lapse_with_photo video format uses VIDEO_LENS_HERO13', () => {
    const state = resolveTimelapseLayoutState(
      makeParams({
        cameraModel: 'hero13',
      }),
    );
    // Hero13 override uses VIDEO_LENS_HERO13 (229) instead of VIDEO_LENS (121)
    expect(state.videoModeLensId).toBe(GoProSettingId.VIDEO_LENS_HERO13);
  });

  it('lapse_with_photo video format has bit rate ids', () => {
    const state = resolveTimelapseLayoutState(
      makeParams({
        category: 'lapse_with_photo',
        isVideoFormat: true,
      }),
    );
    expect(state.lapseBitRateIds.length).toBeGreaterThan(0);
  });

  it('lapse_with_photo photo format has no bit rate ids from fallback', () => {
    const state = resolveTimelapseLayoutState(
      makeParams({
        cameraModel: 'hero10', // no override
        category: 'lapse_with_photo',
        isPhotoFormat: true,
        isVideoFormat: false,
      }),
    );
    expect(state.lapseBitRateIds).toEqual([]);
  });

  it('lapse_with_photo photo format has photo output ids', () => {
    const state = resolveTimelapseLayoutState(
      makeParams({
        category: 'lapse_with_photo',
        isPhotoFormat: true,
      }),
    );
    expect(state.lapsePhotoOutputIds).toContain(GoProSettingId.TIMELAPSE_PHOTO_OUTPUT);
  });

  it('trail_like has no photo output ids', () => {
    const state = resolveTimelapseLayoutState(
      makeParams({
        category: 'trail_like',
      }),
    );
    expect(state.lapsePhotoOutputIds).toEqual([]);
  });

  it('timewarp_like has no photo output ids', () => {
    const state = resolveTimelapseLayoutState(
      makeParams({
        category: 'timewarp_like',
        activePreset: PRESET_TIMEWARP,
      }),
    );
    expect(state.lapsePhotoOutputIds).toEqual([]);
  });

  it('includeSpeedRamp is true by default', () => {
    const state = resolveTimelapseLayoutState(makeParams());
    expect(state.includeSpeedRamp).toBe(true);
  });

  it('includeSpeedRamp is false when preset is in horizontalLevelingTimelapsePresets', () => {
    const levelingPresets = new Set<number>([99999]);
    const state = resolveTimelapseLayoutState(
      makeParams({
        activePreset: 99999,
        horizontalLevelingTimelapsePresets: levelingPresets,
      }),
    );
    expect(state.includeSpeedRamp).toBe(false);
  });

  it('horizontalLevelingIds is empty by default', () => {
    const state = resolveTimelapseLayoutState(makeParams());
    expect(state.horizontalLevelingIds).toEqual([]);
  });

  it('horizontalLevelingIds is set for timewarp_like with leveling preset', () => {
    const levelingPresets = new Set<number>([99999]);
    const state = resolveTimelapseLayoutState(
      makeParams({
        category: 'timewarp_like',
        activePreset: 99999,
        horizontalLevelingTimelapsePresets: levelingPresets,
      }),
    );
    expect(state.horizontalLevelingIds).toContain(GoProSettingId.HORIZONTAL_LEVELING);
  });

  it('Hero13 windReductionSettingId uses WIND_REDUCTION (override)', () => {
    const state = resolveTimelapseLayoutState(
      makeParams({
        cameraModel: 'hero13',
      }),
    );
    expect(state.windReductionSettingId).toBe(GoProSettingId.WIND_REDUCTION);
  });

  it('omitDuration is false by default', () => {
    const state = resolveTimelapseLayoutState(makeParams());
    expect(state.omitDuration).toBe(false);
  });
});

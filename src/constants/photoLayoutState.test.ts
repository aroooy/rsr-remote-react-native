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
import { resolvePhotoLayoutState } from './photoLayoutState';
import { GoProSettingId } from './GoProSettingId';
import { PRESET_PHOTO, PRESET_NIGHT_PHOTO, PRESET_BURST, PRESET_LIVE_BURST } from './presetIds';
import type { ResolvePhotoLayoutParams } from '../cameraModels/shared/types';

const makeParams = (
  overrides: Partial<ResolvePhotoLayoutParams> = {},
): ResolvePhotoLayoutParams => ({
  cameraModel: 'hero13',
  activePreset: PRESET_PHOTO,
  isBurstLike: false,
  isNightPhoto: false,
  isLiveBurst: false,
  ids: {
    timeLapseLens: GoProSettingId.TIME_LAPSE_LENS,
    multiShotLens: GoProSettingId.MULTI_SHOT_LENS,
    videoLens: GoProSettingId.VIDEO_LENS,
    photoLens: GoProSettingId.PHOTO_LENS,
    photoShutter: GoProSettingId.PHOTO_SHUTTER,
    nightPhotoShutter: GoProSettingId.NIGHT_PHOTO_SHUTTER,
    photoIsoMin: GoProSettingId.PHOTO_ISO_MIN,
    photoIsoMax: GoProSettingId.PHOTO_ISO_MAX,
    multiShotIsoMin: GoProSettingId.MULTI_SHOT_ISO_MIN,
    multiShotIsoMax: GoProSettingId.MULTI_SHOT_ISO_MAX,
    videoShutter: GoProSettingId.VIDEO_SHUTTER,
    videoIsoMin: GoProSettingId.VIDEO_ISO_MIN,
    videoIsoMax: GoProSettingId.VIDEO_ISO_MAX,
    maxWindReduction: GoProSettingId.MAX_WIND_REDUCTION,
    windReduction: GoProSettingId.WIND_REDUCTION,
    rawAudio: GoProSettingId.RAW_AUDIO,
  },
  presetIds: {
    standardPhoto: PRESET_PHOTO,
    liveBurst: PRESET_LIVE_BURST,
    max360Photo: 65537,
  },
  horizontalLockPhotoPresets: new Set<number>(),
  ...overrides,
});

describe('resolvePhotoLayoutState', () => {
  it('standard photo has photo lens and SS/ISO', () => {
    const state = resolvePhotoLayoutState(makeParams());
    expect(state.lensSettingId).toBe(GoProSettingId.PHOTO_LENS);
    expect(state.hasLens).toBe(true);
    expect(state.ssIsoIds).toContain(GoProSettingId.PHOTO_SHUTTER);
    expect(state.ssIsoIds).toContain(GoProSettingId.PHOTO_ISO_MIN);
    expect(state.ssIsoIds).toContain(GoProSettingId.PHOTO_ISO_MAX);
    expect(state.hasEvComp).toBe(true);
  });

  it('night photo has night shutter', () => {
    const state = resolvePhotoLayoutState(
      makeParams({
        activePreset: PRESET_NIGHT_PHOTO,
        isNightPhoto: true,
      }),
    );
    expect(state.ssIsoIds).toContain(GoProSettingId.NIGHT_PHOTO_SHUTTER);
    expect(state.ssIsoIds).toContain(GoProSettingId.PHOTO_ISO_MIN);
    expect(state.ssIsoIds).toContain(GoProSettingId.PHOTO_ISO_MAX);
  });

  it('burst-like preset has multi-shot ISO (no shutter)', () => {
    const state = resolvePhotoLayoutState(
      makeParams({
        activePreset: PRESET_BURST,
        isBurstLike: true,
      }),
    );
    expect(state.lensSettingId).toBe(GoProSettingId.MULTI_SHOT_LENS);
    expect(state.ssIsoIds).toContain(GoProSettingId.MULTI_SHOT_ISO_MIN);
    expect(state.ssIsoIds).toContain(GoProSettingId.MULTI_SHOT_ISO_MAX);
    expect(state.hasEvComp).toBe(false);
  });

  it('live burst has video shutter and ISO', () => {
    const state = resolvePhotoLayoutState(
      makeParams({
        activePreset: PRESET_LIVE_BURST,
        isLiveBurst: true,
      }),
    );
    expect(state.lensSettingId).toBe(GoProSettingId.VIDEO_LENS);
    expect(state.ssIsoIds).toContain(GoProSettingId.VIDEO_SHUTTER);
    expect(state.ssIsoIds).toContain(GoProSettingId.VIDEO_ISO_MIN);
    expect(state.ssIsoIds).toContain(GoProSettingId.VIDEO_ISO_MAX);
    // Hero13 override uses WIND_REDUCTION instead of MAX_WIND_REDUCTION
    expect(state.liveBurstAdvancedIds.length).toBeGreaterThan(0);
    expect(state.liveBurstAdvancedIds).toContain(GoProSettingId.RAW_AUDIO);
  });

  it('hasHorizontalLock is true when preset is in lock set', () => {
    const lockPresets = new Set<number>([65540]);
    const state = resolvePhotoLayoutState(
      makeParams({
        activePreset: 65540,
        horizontalLockPhotoPresets: lockPresets,
      }),
    );
    expect(state.hasHorizontalLock).toBe(true);
  });

  it('hasHorizontalLock is false when preset not in lock set', () => {
    const state = resolvePhotoLayoutState(
      makeParams({
        activePreset: PRESET_PHOTO,
        horizontalLockPhotoPresets: new Set<number>([99999]),
      }),
    );
    expect(state.hasHorizontalLock).toBe(false);
  });
});

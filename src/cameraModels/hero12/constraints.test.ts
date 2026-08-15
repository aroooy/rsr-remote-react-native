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
import { hero12SettingConstraintResolver } from './constraints';
import { GoProSettingId } from '../../constants/GoProSettingId';
import {
  GROUP_VIDEO,
  H12_PROFILE_HDR,
  H12_PROFILE_LOG,
  PRESET_STANDARD,
  PRESET_PHOTO,
  PRESET_NIGHTLAPSE,
  PRESET_NIGHT_PHOTO,
  PHOTO_OUTPUT_HDR,
  PHOTO_OUTPUT_SUPER_PHOTO,
} from '../shared/constraintConstants';
import { PRESET_LEGACY_EASY_STAR_TRAILS } from '../../constants/presetIds';

describe('hero12SettingConstraintResolver', () => {
  it('VIDEO_SHUTTER is disabled in HDR profile', () => {
    expect(
      hero12SettingConstraintResolver({
        settingId: GoProSettingId.VIDEO_SHUTTER,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.VIDEO_PROFILE]: H12_PROFILE_HDR,
        },
        cameraModel: 'hero12',
      }),
    ).toBe('disabled');
  });

  it('VIDEO_SHUTTER is ok in non-HDR video profile', () => {
    expect(
      hero12SettingConstraintResolver({
        settingId: GoProSettingId.VIDEO_SHUTTER,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.VIDEO_PROFILE]: 2, // LOG, not HDR
        },
        cameraModel: 'hero12',
      }),
    ).toBe('ok');
  });

  it('HLG_HDR is always na on Hero12 (not available)', () => {
    expect(
      hero12SettingConstraintResolver({
        settingId: GoProSettingId.HLG_HDR,
        settings: {},
        cameraModel: 'hero12',
      }),
    ).toBe('na');
  });

  it('EV_COMP is disabled in Standard + LOG profile', () => {
    expect(
      hero12SettingConstraintResolver({
        settingId: GoProSettingId.EV_COMP,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.MODE_PRESET]: PRESET_STANDARD,
          [GoProSettingId.VIDEO_PROFILE]: H12_PROFILE_LOG,
        },
        cameraModel: 'hero12',
      }),
    ).toBe('disabled');
  });

  it('EV_COMP is na for trail_like presets', () => {
    expect(
      hero12SettingConstraintResolver({
        settingId: GoProSettingId.EV_COMP,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_LEGACY_EASY_STAR_TRAILS,
        },
        cameraModel: 'hero12',
      }),
    ).toBe('na');
  });

  it('EV_COMP is na for Nightlapse with non-zero shutter', () => {
    expect(
      hero12SettingConstraintResolver({
        settingId: GoProSettingId.EV_COMP,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_NIGHTLAPSE,
          [GoProSettingId.NIGHTLAPSE_PHOTO_SHUTTER]: 5,
        },
        cameraModel: 'hero12',
      }),
    ).toBe('na');
  });

  it('COLOR is disabled in Standard + LOG', () => {
    expect(
      hero12SettingConstraintResolver({
        settingId: GoProSettingId.COLOR,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.MODE_PRESET]: PRESET_STANDARD,
          [GoProSettingId.VIDEO_PROFILE]: H12_PROFILE_LOG,
        },
        cameraModel: 'hero12',
      }),
    ).toBe('disabled');
  });

  it('COLOR is disabled in Photo + HDR output', () => {
    expect(
      hero12SettingConstraintResolver({
        settingId: GoProSettingId.COLOR,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_PHOTO,
          [GoProSettingId.PHOTO_OUTPUT]: PHOTO_OUTPUT_HDR,
        },
        cameraModel: 'hero12',
      }),
    ).toBe('disabled');
  });

  it('PHOTO_ISO_MIN is na in HDR photo output', () => {
    expect(
      hero12SettingConstraintResolver({
        settingId: GoProSettingId.PHOTO_ISO_MIN,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_PHOTO,
          [GoProSettingId.PHOTO_OUTPUT]: PHOTO_OUTPUT_SUPER_PHOTO,
        },
        cameraModel: 'hero12',
      }),
    ).toBe('na');
  });

  it('returns ok for unknown setting ids', () => {
    expect(
      hero12SettingConstraintResolver({
        settingId: 99999,
        settings: {},
        cameraModel: 'hero12',
      }),
    ).toBe('ok');
  });
});

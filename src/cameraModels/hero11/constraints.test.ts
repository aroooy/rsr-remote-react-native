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
import { hero11SettingConstraintResolver } from './constraints';
import { GoProSettingId } from '../../constants/GoProSettingId';
import {
  HERO11_EB_VIDEO_PRESETS,
  HERO11_LB_VIDEO_PRESETS,
} from '../../constants/layout';
import {
  GROUP_VIDEO,
  H11_RES_4K,
  H11_RES_5_3K,
  PHOTO_OUTPUT_HDR,
  PHOTO_OUTPUT_SUPER_PHOTO,
  PRESET_PHOTO,
  PRESET_NIGHTLAPSE,
  PRESET_NIGHT_PHOTO,
} from '../shared/constraintConstants';
import { PRESET_MAX_VIDEO, PRESET_LEGACY_EASY_STAR_TRAILS } from '../../constants/presetIds';

describe('hero11SettingConstraintResolver', () => {
  it('COLOR is disabled in Photo + HDR output', () => {
    expect(
      hero11SettingConstraintResolver({
        settingId: GoProSettingId.COLOR,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_PHOTO,
          [GoProSettingId.PHOTO_OUTPUT]: PHOTO_OUTPUT_HDR,
        },
        cameraModel: 'hero11',
      }),
    ).toBe('disabled');
  });

  it('PHOTO_ISO is na in HDR photo output', () => {
    expect(
      hero11SettingConstraintResolver({
        settingId: GoProSettingId.PHOTO_ISO_MIN,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_PHOTO,
          [GoProSettingId.PHOTO_OUTPUT]: PHOTO_OUTPUT_SUPER_PHOTO,
        },
        cameraModel: 'hero11',
      }),
    ).toBe('na');
    expect(
      hero11SettingConstraintResolver({
        settingId: GoProSettingId.PHOTO_ISO_MAX,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_NIGHT_PHOTO,
          [GoProSettingId.PHOTO_OUTPUT]: PHOTO_OUTPUT_HDR,
        },
        cameraModel: 'hero11',
      }),
    ).toBe('na');
  });

  it('EV_COMP is na for trail_like presets', () => {
    // Using PRESET_LEGACY_EASY_STAR_TRAILS which is in TRAIL_LIKE_PRESETS
    expect(
      hero11SettingConstraintResolver({
        settingId: GoProSettingId.EV_COMP,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_LEGACY_EASY_STAR_TRAILS,
        },
        cameraModel: 'hero11',
      }),
    ).toBe('na');
  });

  it('EV_COMP is na for Nightlapse', () => {
    expect(
      hero11SettingConstraintResolver({
        settingId: GoProSettingId.EV_COMP,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_NIGHTLAPSE,
        },
        cameraModel: 'hero11',
      }),
    ).toBe('na');
  });

  it('TEN_BIT_COLOR_HERO11 is na for non-video group', () => {
    expect(
      hero11SettingConstraintResolver({
        settingId: GoProSettingId.TEN_BIT_COLOR_HERO11,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: 1, // Photo
        },
        cameraModel: 'hero11',
      }),
    ).toBe('na');
  });

  it('TEN_BIT_COLOR_HERO11 is na for MaxVideo preset', () => {
    expect(
      hero11SettingConstraintResolver({
        settingId: GoProSettingId.TEN_BIT_COLOR_HERO11,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.MODE_PRESET]: PRESET_MAX_VIDEO,
        },
        cameraModel: 'hero11',
      }),
    ).toBe('na');
  });

  it('TEN_BIT_COLOR_HERO11 is na for EB video presets', () => {
    const ebPreset = Array.from(HERO11_EB_VIDEO_PRESETS)[0];
    expect(
      hero11SettingConstraintResolver({
        settingId: GoProSettingId.TEN_BIT_COLOR_HERO11,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.MODE_PRESET]: ebPreset,
        },
        cameraModel: 'hero11',
      }),
    ).toBe('na');
  });

  it('TEN_BIT_COLOR_HERO11 is na for LB video presets', () => {
    const lbPreset = Array.from(HERO11_LB_VIDEO_PRESETS)[0];
    expect(
      hero11SettingConstraintResolver({
        settingId: GoProSettingId.TEN_BIT_COLOR_HERO11,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.MODE_PRESET]: lbPreset,
        },
        cameraModel: 'hero11',
      }),
    ).toBe('na');
  });

  it('TEN_BIT_COLOR_HERO11 is na for low resolution', () => {
    expect(
      hero11SettingConstraintResolver({
        settingId: GoProSettingId.TEN_BIT_COLOR_HERO11,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.RESOLUTION]: 9, // 1080
        },
        cameraModel: 'hero11',
      }),
    ).toBe('na');
  });

  it('TEN_BIT_COLOR_HERO11 is ok for 5.3K resolution in video group', () => {
    expect(
      hero11SettingConstraintResolver({
        settingId: GoProSettingId.TEN_BIT_COLOR_HERO11,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.RESOLUTION]: H11_RES_5_3K,
        },
        cameraModel: 'hero11',
      }),
    ).toBe('ok');
  });

  it('returns ok for unknown setting ids', () => {
    expect(
      hero11SettingConstraintResolver({
        settingId: 99999,
        settings: {},
        cameraModel: 'hero11',
      }),
    ).toBe('ok');
  });
});

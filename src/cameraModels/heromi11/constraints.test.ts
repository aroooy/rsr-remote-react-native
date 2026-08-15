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
import { heromi11SettingConstraintResolver } from './constraints';
import { GoProSettingId } from '../../constants/GoProSettingId';
import {
  GROUP_VIDEO,
  H11_RES_4K,
  H11_RES_5_3K,
  PHOTO_OUTPUT_HDR,
  PRESET_NIGHTLAPSE,
} from '../shared/constraintConstants';
import {
  PRESET_MAX_VIDEO,
  PRESET_LEGACY_EASY_STAR_TRAILS,
  PRESET_TIMELAPSE,
} from '../../constants/presetIds';

describe('heromi11SettingConstraintResolver', () => {
  it('TEN_BIT_COLOR_HERO11 is na for MaxVideo preset', () => {
    expect(
      heromi11SettingConstraintResolver({
        settingId: GoProSettingId.TEN_BIT_COLOR_HERO11,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_MAX_VIDEO,
        },
        cameraModel: 'heromi11',
      }),
    ).toBe('na');
  });

  it('TEN_BIT_COLOR_HERO11 is na for lapse_with_photo presets', () => {
    expect(
      heromi11SettingConstraintResolver({
        settingId: GoProSettingId.TEN_BIT_COLOR_HERO11,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_TIMELAPSE,
        },
        cameraModel: 'heromi11',
      }),
    ).toBe('na');
  });

  it('TEN_BIT_COLOR_HERO11 is na for trail_like presets', () => {
    expect(
      heromi11SettingConstraintResolver({
        settingId: GoProSettingId.TEN_BIT_COLOR_HERO11,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_LEGACY_EASY_STAR_TRAILS,
        },
        cameraModel: 'heromi11',
      }),
    ).toBe('na');
  });

  it('TEN_BIT_COLOR_HERO11 is na for non-video group', () => {
    expect(
      heromi11SettingConstraintResolver({
        settingId: GoProSettingId.TEN_BIT_COLOR_HERO11,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: 1, // Photo
        },
        cameraModel: 'heromi11',
      }),
    ).toBe('na');
  });

  it('TEN_BIT_COLOR_HERO11 is ok for 5.3K in video group', () => {
    expect(
      heromi11SettingConstraintResolver({
        settingId: GoProSettingId.TEN_BIT_COLOR_HERO11,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.RESOLUTION]: H11_RES_5_3K,
        },
        cameraModel: 'heromi11',
      }),
    ).toBe('ok');
  });

  it('TEN_BIT_COLOR_HERO11 is ok for 4K in video group', () => {
    expect(
      heromi11SettingConstraintResolver({
        settingId: GoProSettingId.TEN_BIT_COLOR_HERO11,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.RESOLUTION]: H11_RES_4K,
        },
        cameraModel: 'heromi11',
      }),
    ).toBe('ok');
  });

  it('EV_COMP is na for trail_like presets', () => {
    expect(
      heromi11SettingConstraintResolver({
        settingId: GoProSettingId.EV_COMP,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_LEGACY_EASY_STAR_TRAILS,
        },
        cameraModel: 'heromi11',
      }),
    ).toBe('na');
  });

  it('EV_COMP is na for Nightlapse', () => {
    expect(
      heromi11SettingConstraintResolver({
        settingId: GoProSettingId.EV_COMP,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_NIGHTLAPSE,
        },
        cameraModel: 'heromi11',
      }),
    ).toBe('na');
  });

  it('COLOR is disabled in Nightlapse + HDR output', () => {
    expect(
      heromi11SettingConstraintResolver({
        settingId: GoProSettingId.COLOR,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_NIGHTLAPSE,
          [GoProSettingId.PHOTO_OUTPUT]: PHOTO_OUTPUT_HDR,
        },
        cameraModel: 'heromi11',
      }),
    ).toBe('disabled');
  });

  it('returns ok for unknown setting ids', () => {
    expect(
      heromi11SettingConstraintResolver({
        settingId: 99999,
        settings: {},
        cameraModel: 'heromi11',
      }),
    ).toBe('ok');
  });
});

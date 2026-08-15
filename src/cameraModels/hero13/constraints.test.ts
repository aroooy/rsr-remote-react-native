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
import { hero13SettingConstraintResolver } from './constraints';
import { GoProSettingId } from '../../constants/GoProSettingId';
import {
  GROUP_VIDEO,
  PRESET_STANDARD,
  PRESET_ACTIVITY,
  PRESET_PHOTO,
  PRESET_MACRO_VIDEO,
  H13_PROFILE_HDR_NEW,
  H13_PROFILE_HLG_NEW,
  H13_PROFILE_LOG_NEW,
  PHOTO_OUTPUT_HDR,
  PHOTO_OUTPUT_SUPER_PHOTO,
} from '../shared/constraintConstants';

const makeParams = (settings: Record<number, number>) => ({
  settingId: 0,
  settings,
  cameraModel: 'hero13' as const,
});

describe('hero13SettingConstraintResolver', () => {
  it('VIDEO_SHUTTER is disabled in HDR profile', () => {
    const result = hero13SettingConstraintResolver(
      makeParams({
        [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
        [GoProSettingId.MODE_PRESET]: PRESET_STANDARD,
        [GoProSettingId.VIDEO_PROFILE]: H13_PROFILE_HDR_NEW,
      }),
    );
    // We need to test the resolver directly with the right settingId
    expect(
      hero13SettingConstraintResolver({
        settingId: GoProSettingId.VIDEO_SHUTTER,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.MODE_PRESET]: PRESET_STANDARD,
          [GoProSettingId.VIDEO_PROFILE]: H13_PROFILE_HDR_NEW,
        },
        cameraModel: 'hero13',
      }),
    ).toBe('disabled');
  });

  it('VIDEO_SHUTTER is ok in standard profile', () => {
    expect(
      hero13SettingConstraintResolver({
        settingId: GoProSettingId.VIDEO_SHUTTER,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.MODE_PRESET]: PRESET_STANDARD,
          [GoProSettingId.VIDEO_PROFILE]: 1, // Standard
        },
        cameraModel: 'hero13',
      }),
    ).toBe('ok');
  });

  it('PHOTO_ISO_MIN is na in HDR photo output', () => {
    expect(
      hero13SettingConstraintResolver({
        settingId: GoProSettingId.PHOTO_ISO_MIN,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_PHOTO,
          [GoProSettingId.PHOTO_OUTPUT]: PHOTO_OUTPUT_HDR,
        },
        cameraModel: 'hero13',
      }),
    ).toBe('na');
  });

  it('PHOTO_ISO_MIN is ok in standard photo output', () => {
    expect(
      hero13SettingConstraintResolver({
        settingId: GoProSettingId.PHOTO_ISO_MIN,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_PHOTO,
          [GoProSettingId.PHOTO_OUTPUT]: 1, // Standard
        },
        cameraModel: 'hero13',
      }),
    ).toBe('ok');
  });

  it('COLOR is disabled in GP-Log profile', () => {
    expect(
      hero13SettingConstraintResolver({
        settingId: GoProSettingId.COLOR,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.VIDEO_PROFILE]: H13_PROFILE_LOG_NEW,
        },
        cameraModel: 'hero13',
      }),
    ).toBe('disabled');
  });

  it('VIDEO_DURATION is disabled in Activity preset', () => {
    expect(
      hero13SettingConstraintResolver({
        settingId: GoProSettingId.VIDEO_DURATION,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.MODE_PRESET]: PRESET_ACTIVITY,
        },
        cameraModel: 'hero13',
      }),
    ).toBe('disabled');
  });

  it('TEN_BIT_COLOR is na for Macro Video resolution 4', () => {
    expect(
      hero13SettingConstraintResolver({
        settingId: GoProSettingId.TEN_BIT_COLOR,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_MACRO_VIDEO,
          [GoProSettingId.RESOLUTION]: 4,
        },
        cameraModel: 'hero13',
      }),
    ).toBe('na');
  });

  it('EV_COMP is disabled in HDR + Standard preset', () => {
    expect(
      hero13SettingConstraintResolver({
        settingId: GoProSettingId.EV_COMP,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: GROUP_VIDEO,
          [GoProSettingId.MODE_PRESET]: PRESET_STANDARD,
          [GoProSettingId.VIDEO_PROFILE]: H13_PROFILE_HLG_NEW,
        },
        cameraModel: 'hero13',
      }),
    ).toBe('disabled');
  });

  it('HLG_HDR is na in non-video group', () => {
    expect(
      hero13SettingConstraintResolver({
        settingId: GoProSettingId.HLG_HDR,
        settings: {
          [GoProSettingId.MODE_PRESET_GROUP]: 1, // Photo group
          [GoProSettingId.VIDEO_PROFILE]: 1,
        },
        cameraModel: 'hero13',
      }),
    ).toBe('na');
  });

  it('returns ok for unknown setting ids', () => {
    expect(
      hero13SettingConstraintResolver({
        settingId: 99999,
        settings: {},
        cameraModel: 'hero13',
      }),
    ).toBe('ok');
  });
});

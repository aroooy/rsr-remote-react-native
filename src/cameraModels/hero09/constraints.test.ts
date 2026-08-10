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
import { hero09SettingConstraintResolver } from './constraints';
import { GoProSettingId } from '../../constants/GoProSettingIds';
import {
  PHOTO_OUTPUT_HDR,
  PHOTO_OUTPUT_SUPER_PHOTO,
  PRESET_PHOTO,
  PRESET_NIGHT_PHOTO,
  PRESET_NIGHTLAPSE,
} from '../shared/constraintConstants';

describe('hero09SettingConstraintResolver', () => {
  it('PHOTO_SHUTTER is na in HDR photo output', () => {
    expect(
      hero09SettingConstraintResolver({
        settingId: GoProSettingId.PHOTO_SHUTTER,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_PHOTO,
          [GoProSettingId.PHOTO_OUTPUT]: PHOTO_OUTPUT_HDR,
        },
        cameraModel: 'hero09',
      }),
    ).toBe('na');
  });

  it('PHOTO_ISO is na in HDR photo output', () => {
    expect(
      hero09SettingConstraintResolver({
        settingId: GoProSettingId.PHOTO_ISO_MIN,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_NIGHT_PHOTO,
          [GoProSettingId.PHOTO_OUTPUT]: PHOTO_OUTPUT_SUPER_PHOTO,
        },
        cameraModel: 'hero09',
      }),
    ).toBe('na');
  });

  it('EV_COMP is na in HDR photo output', () => {
    expect(
      hero09SettingConstraintResolver({
        settingId: GoProSettingId.EV_COMP,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_PHOTO,
          [GoProSettingId.PHOTO_OUTPUT]: PHOTO_OUTPUT_HDR,
        },
        cameraModel: 'hero09',
      }),
    ).toBe('na');
  });

  it('COLOR is disabled in Photo + HDR output', () => {
    expect(
      hero09SettingConstraintResolver({
        settingId: GoProSettingId.COLOR,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_PHOTO,
          [GoProSettingId.PHOTO_OUTPUT]: PHOTO_OUTPUT_HDR,
        },
        cameraModel: 'hero09',
      }),
    ).toBe('disabled');
  });

  it('COLOR is disabled in Nightlapse + SuperPhoto output', () => {
    expect(
      hero09SettingConstraintResolver({
        settingId: GoProSettingId.COLOR,
        settings: {
          [GoProSettingId.MODE_PRESET]: PRESET_NIGHTLAPSE,
          [GoProSettingId.PHOTO_OUTPUT]: PHOTO_OUTPUT_SUPER_PHOTO,
        },
        cameraModel: 'hero09',
      }),
    ).toBe('disabled');
  });

  it('returns ok for unknown setting ids', () => {
    expect(
      hero09SettingConstraintResolver({
        settingId: 99999,
        settings: {},
        cameraModel: 'hero09',
      }),
    ).toBe('ok');
  });
});

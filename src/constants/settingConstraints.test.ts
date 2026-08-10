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
import { isSettingModelSupported } from './settingConstraints';
import { GoProSettingId } from './GoProSettingIds';

describe('isSettingModelSupported', () => {
  it('returns true when camera model is null (not connected)', () => {
    expect(isSettingModelSupported(GoProSettingId.RESOLUTION, null)).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.HLG_HDR, null)).toBe(true);
  });

  it('returns true for universal settings on any model', () => {
    // RESOLUTION is supported on all models
    expect(isSettingModelSupported(GoProSettingId.RESOLUTION, 'hero13')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.RESOLUTION, 'hero09')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.RESOLUTION, 'max')).toBe(true);
  });

  it('HLG_HDR is only supported on Hero13', () => {
    expect(isSettingModelSupported(GoProSettingId.HLG_HDR, 'hero13')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.HLG_HDR, 'hero12')).toBe(false);
    expect(isSettingModelSupported(GoProSettingId.HLG_HDR, 'hero11')).toBe(false);
    expect(isSettingModelSupported(GoProSettingId.HLG_HDR, 'max')).toBe(false);
  });

  it('DENOISE is only supported on Hero13', () => {
    expect(isSettingModelSupported(GoProSettingId.DENOISE, 'hero13')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.DENOISE, 'hero12')).toBe(false);
  });

  it('VIDEO_PROFILE is only supported on Hero12/13', () => {
    expect(isSettingModelSupported(GoProSettingId.VIDEO_PROFILE, 'hero13')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.VIDEO_PROFILE, 'hero12')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.VIDEO_PROFILE, 'hero11')).toBe(false);
    expect(isSettingModelSupported(GoProSettingId.VIDEO_PROFILE, 'hero10')).toBe(false);
  });

  it('CONTROL_MODE is not supported on Hero09/10', () => {
    expect(isSettingModelSupported(GoProSettingId.CONTROL_MODE, 'hero13')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.CONTROL_MODE, 'hero11')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.CONTROL_MODE, 'hero10')).toBe(false);
    expect(isSettingModelSupported(GoProSettingId.CONTROL_MODE, 'hero09')).toBe(false);
  });

  it('ENABLE_BEEP is Hero13 only', () => {
    expect(isSettingModelSupported(GoProSettingId.ENABLE_BEEP, 'hero13')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.ENABLE_BEEP, 'hero12')).toBe(false);
    expect(isSettingModelSupported(GoProSettingId.ENABLE_BEEP, 'hero09')).toBe(false);
  });

  it('BEEPS is not supported on Hero13 (uses BEEP_VOLUME instead)', () => {
    expect(isSettingModelSupported(GoProSettingId.BEEPS, 'hero13')).toBe(false);
    expect(isSettingModelSupported(GoProSettingId.BEEPS, 'hero12')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.BEEPS, 'hero09')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.BEEPS, 'max')).toBe(true);
  });

  it('BEEP_VOLUME is Hero13 only', () => {
    expect(isSettingModelSupported(GoProSettingId.BEEP_VOLUME, 'hero13')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.BEEP_VOLUME, 'hero12')).toBe(false);
  });

  it('QUICK_CAPTURE is unsupported on HeroMini11 (denylist)', () => {
    expect(isSettingModelSupported(GoProSettingId.QUICK_CAPTURE, 'heromi11')).toBe(false);
    expect(isSettingModelSupported(GoProSettingId.QUICK_CAPTURE, 'hero11')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.QUICK_CAPTURE, 'hero13')).toBe(true);
  });

  it('DEFAULT_PRESET is unsupported on HeroMini11 and Max (denylist)', () => {
    expect(isSettingModelSupported(GoProSettingId.DEFAULT_PRESET, 'heromi11')).toBe(false);
    expect(isSettingModelSupported(GoProSettingId.DEFAULT_PRESET, 'max')).toBe(false);
    expect(isSettingModelSupported(GoProSettingId.DEFAULT_PRESET, 'hero13')).toBe(true);
  });

  it('SCREEN_SAVER variants are model-specific', () => {
    expect(isSettingModelSupported(GoProSettingId.SCREEN_SAVER, 'hero13')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.SCREEN_SAVER, 'hero12')).toBe(false);

    expect(isSettingModelSupported(GoProSettingId.SCREEN_SAVER_REAR, 'hero13')).toBe(false);
    expect(isSettingModelSupported(GoProSettingId.SCREEN_SAVER_REAR, 'hero12')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.SCREEN_SAVER_REAR, 'hero09')).toBe(true);

    expect(isSettingModelSupported(GoProSettingId.SCREEN_SAVER_MAX, 'max')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.SCREEN_SAVER_MAX, 'hero13')).toBe(false);
  });

  it('WIND_REDUCTION vs MAX_WIND_REDUCTION are model-specific', () => {
    expect(isSettingModelSupported(GoProSettingId.WIND_REDUCTION, 'hero13')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.WIND_REDUCTION, 'hero12')).toBe(false);

    expect(isSettingModelSupported(GoProSettingId.MAX_WIND_REDUCTION, 'hero13')).toBe(false);
    expect(isSettingModelSupported(GoProSettingId.MAX_WIND_REDUCTION, 'hero12')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.MAX_WIND_REDUCTION, 'max')).toBe(true);
  });

  it('LENS_ATTACHMENT is Hero13 only', () => {
    expect(isSettingModelSupported(GoProSettingId.LENS_ATTACHMENT, 'hero13')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.LENS_ATTACHMENT, 'hero12')).toBe(false);
  });

  it('FOCUS_PEAKING is Hero13 only', () => {
    expect(isSettingModelSupported(GoProSettingId.FOCUS_PEAKING, 'hero13')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.FOCUS_PEAKING, 'hero12')).toBe(false);
  });

  it('MAX_LENS_MOD_HERO13 is Hero12 only', () => {
    expect(isSettingModelSupported(GoProSettingId.MAX_LENS_MOD_HERO13, 'hero12')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.MAX_LENS_MOD_HERO13, 'hero13')).toBe(false);
    expect(isSettingModelSupported(GoProSettingId.MAX_LENS_MOD_HERO13, 'hero11')).toBe(false);
  });

  it('VIDEO_PERFORMANCE_MODE is Hero10 only', () => {
    expect(isSettingModelSupported(GoProSettingId.VIDEO_PERFORMANCE_MODE, 'hero10')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.VIDEO_PERFORMANCE_MODE, 'hero13')).toBe(false);
  });

  it('VIDEO_COMPRESSION is Max/Hero09/Hero10 only', () => {
    expect(isSettingModelSupported(GoProSettingId.VIDEO_COMPRESSION, 'max')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.VIDEO_COMPRESSION, 'hero09')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.VIDEO_COMPRESSION, 'hero10')).toBe(true);
    expect(isSettingModelSupported(GoProSettingId.VIDEO_COMPRESSION, 'hero13')).toBe(false);
  });
});

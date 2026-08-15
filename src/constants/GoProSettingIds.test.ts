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
import { classifyTimelapsePreset, isTimelapseLikePreset } from './layout';
import {
  PRESET_TIMELAPSE,
  PRESET_NIGHTLAPSE,
  PRESET_STAR_TRAILS,
  PRESET_LIGHT_PAINTING,
  PRESET_VEHICLE_LIGHTS,
  PRESET_TIMEWARP,
  PRESET_MAX_TIMEWARP,
  PRESET_LEGACY_EASY_TIMEWARP,
  PRESET_LEGACY_EASY_STAR_TRAILS,
  PRESET_MACRO_TIMELAPSE,
  PRESET_MACRO_NIGHTLAPSE,
} from './presetIds';

describe('classifyTimelapsePreset', () => {
  it('classifies lapse_with_photo presets', () => {
    expect(classifyTimelapsePreset(PRESET_TIMELAPSE)).toBe('lapse_with_photo');
    expect(classifyTimelapsePreset(PRESET_NIGHTLAPSE)).toBe('lapse_with_photo');
    expect(classifyTimelapsePreset(PRESET_MACRO_TIMELAPSE)).toBe('lapse_with_photo');
    expect(classifyTimelapsePreset(PRESET_MACRO_NIGHTLAPSE)).toBe('lapse_with_photo');
  });

  it('classifies trail_like presets', () => {
    expect(classifyTimelapsePreset(PRESET_STAR_TRAILS)).toBe('trail_like');
    expect(classifyTimelapsePreset(PRESET_LIGHT_PAINTING)).toBe('trail_like');
    expect(classifyTimelapsePreset(PRESET_VEHICLE_LIGHTS)).toBe('trail_like');
    expect(classifyTimelapsePreset(PRESET_LEGACY_EASY_STAR_TRAILS)).toBe('trail_like');
  });

  it('classifies timewarp_like presets', () => {
    expect(classifyTimelapsePreset(PRESET_TIMEWARP)).toBe('timewarp_like');
    expect(classifyTimelapsePreset(PRESET_MAX_TIMEWARP)).toBe('timewarp_like');
    expect(classifyTimelapsePreset(PRESET_LEGACY_EASY_TIMEWARP)).toBe('timewarp_like');
  });

  it('defaults to timewarp_like for unknown presets', () => {
    expect(classifyTimelapsePreset(999999)).toBe('timewarp_like');
    expect(classifyTimelapsePreset(undefined)).toBe('timewarp_like');
  });
});

describe('isTimelapseLikePreset', () => {
  it('returns true for all timelapse-like presets', () => {
    expect(isTimelapseLikePreset(PRESET_TIMELAPSE)).toBe(true);
    expect(isTimelapseLikePreset(PRESET_NIGHTLAPSE)).toBe(true);
    expect(isTimelapseLikePreset(PRESET_STAR_TRAILS)).toBe(true);
    expect(isTimelapseLikePreset(PRESET_TIMEWARP)).toBe(true);
    expect(isTimelapseLikePreset(PRESET_MACRO_TIMELAPSE)).toBe(true);
  });

  it('returns false for non-timelapse presets', () => {
    expect(isTimelapseLikePreset(65536)).toBe(false); // Standard Video
    expect(isTimelapseLikePreset(999999)).toBe(false);
    expect(isTimelapseLikePreset(undefined)).toBe(false);
  });
});

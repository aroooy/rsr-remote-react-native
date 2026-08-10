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
import { resolveOutgoingBleSettingId, INCOMING_SETTING_SYNC_RULES } from './settingIdAliases';
import { GoProSettingId } from './GoProSettingIds';
import { GOPRO_MODEL_NUMBERS } from './GoProModelNumbers';

const { HERO11_BLACK, HERO11_BLACK_MINI, HERO12_BLACK, HERO13_BLACK, MAX, HERO09_BLACK } =
  GOPRO_MODEL_NUMBERS;

describe('resolveOutgoingBleSettingId', () => {
  it('maps virtual shutter IDs to BLE 31 on every model', () => {
    for (const modelNo of [HERO11_BLACK, HERO12_BLACK, MAX, HERO09_BLACK, null]) {
      expect(resolveOutgoingBleSettingId(GoProSettingId.STAR_TRAIL_SHUTTER, modelNo)).toBe(31);
      expect(resolveOutgoingBleSettingId(GoProSettingId.LIGHT_PAINTING_SHUTTER, modelNo)).toBe(31);
      expect(resolveOutgoingBleSettingId(GoProSettingId.VEHICLE_LIGHTS_SHUTTER, modelNo)).toBe(31);
    }
  });

  it('maps timelapse video shutter to the video shutter wire ID', () => {
    expect(resolveOutgoingBleSettingId(GoProSettingId.TIMELAPSE_VIDEO_SHUTTER, HERO13_BLACK)).toBe(
      GoProSettingId.VIDEO_SHUTTER,
    );
  });

  it('renumbers HERO11 Black specific IDs', () => {
    expect(resolveOutgoingBleSettingId(GoProSettingId.STAR_TRAILS_LENGTH, HERO11_BLACK)).toBe(
      GoProSettingId.STAR_TRAILS_LENGTH_HERO11,
    );
    expect(resolveOutgoingBleSettingId(GoProSettingId.HORIZONTAL_LEVELING, HERO11_BLACK)).toBe(
      GoProSettingId.HORIZONTAL_LEVELING_HERO11,
    );
    expect(resolveOutgoingBleSettingId(GoProSettingId.HORIZONTAL_LOCK, HERO11_BLACK)).toBe(
      GoProSettingId.HORIZONTAL_LOCK_HERO11,
    );
  });

  it('on HERO11 Mini only the horizontal lock is renumbered', () => {
    expect(resolveOutgoingBleSettingId(GoProSettingId.HORIZONTAL_LOCK, HERO11_BLACK_MINI)).toBe(
      GoProSettingId.HORIZONTAL_LOCK_HERO11,
    );
    expect(resolveOutgoingBleSettingId(GoProSettingId.HORIZONTAL_LEVELING, HERO11_BLACK_MINI)).toBe(
      GoProSettingId.HORIZONTAL_LEVELING,
    );
    expect(resolveOutgoingBleSettingId(GoProSettingId.STAR_TRAILS_LENGTH, HERO11_BLACK_MINI)).toBe(
      GoProSettingId.STAR_TRAILS_LENGTH,
    );
  });

  it('renumbers MAX specific IDs', () => {
    expect(resolveOutgoingBleSettingId(GoProSettingId.HORIZONTAL_LEVELING, MAX)).toBe(
      GoProSettingId.HORIZONTAL_LEVELING_HERO11,
    );
    expect(resolveOutgoingBleSettingId(GoProSettingId.HORIZONTAL_LOCK, MAX)).toBe(
      GoProSettingId.HORIZONTAL_LOCK_HERO11,
    );
    expect(resolveOutgoingBleSettingId(GoProSettingId.HYPERSMOOTH, MAX)).toBe(
      GoProSettingId.HYPERSMOOTH_MAX,
    );
    expect(resolveOutgoingBleSettingId(GoProSettingId.WIND_REDUCTION, MAX)).toBe(
      GoProSettingId.MAX_WIND_REDUCTION,
    );
  });

  it('leaves IDs unchanged on HERO12/13 and unknown models', () => {
    for (const modelNo of [HERO12_BLACK, HERO13_BLACK, HERO09_BLACK, null, undefined]) {
      expect(resolveOutgoingBleSettingId(GoProSettingId.HORIZONTAL_LEVELING, modelNo)).toBe(
        GoProSettingId.HORIZONTAL_LEVELING,
      );
      expect(resolveOutgoingBleSettingId(GoProSettingId.HYPERSMOOTH, modelNo)).toBe(
        GoProSettingId.HYPERSMOOTH,
      );
      expect(resolveOutgoingBleSettingId(GoProSettingId.RESOLUTION, modelNo)).toBe(
        GoProSettingId.RESOLUTION,
      );
    }
  });
});

describe('INCOMING_SETTING_SYNC_RULES', () => {
  it('covers exactly the wire IDs the cameras renumber', () => {
    const wireIds = INCOMING_SETTING_SYNC_RULES.map((r) => r.wireId).sort((a, b) => a - b);
    expect(wireIds).toEqual(
      [
        GoProSettingId.STAR_TRAILS_LENGTH_HERO11,
        GoProSettingId.HYPERSMOOTH_MAX,
        GoProSettingId.MAX_WIND_REDUCTION,
        GoProSettingId.HORIZONTAL_LEVELING_HERO11,
        GoProSettingId.HORIZONTAL_LOCK_HERO11,
      ].sort((a, b) => a - b),
    );
  });

  it('each rule round-trips with the outgoing resolver for an applicable model', () => {
    const sampleModelFor = (rule: (typeof INCOMING_SETTING_SYNC_RULES)[number]): number => {
      for (const m of [HERO11_BLACK, HERO11_BLACK_MINI, MAX]) {
        if (rule.appliesTo(m)) return m;
      }
      throw new Error('rule applies to no known model');
    };
    for (const rule of INCOMING_SETTING_SYNC_RULES) {
      const modelNo = sampleModelFor(rule);
      // Writing the canonical ID on that model must target the rule's wire ID
      expect(resolveOutgoingBleSettingId(rule.canonicalId, modelNo)).toBe(rule.wireId);
    }
  });

  it('rules do not apply to models that keep canonical IDs', () => {
    for (const rule of INCOMING_SETTING_SYNC_RULES) {
      expect(rule.appliesTo(HERO13_BLACK)).toBe(false);
      expect(rule.appliesTo(HERO09_BLACK)).toBe(false);
      expect(rule.appliesTo(null)).toBe(false);
    }
  });
});

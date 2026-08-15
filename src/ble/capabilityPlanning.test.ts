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
import { filterCapabilityIdsForCurrentContext } from './capabilityPlanning';
import { createDefaultCameraState, type CameraSpecificState } from '../store/GoProStore';
import { GoProSettingId } from '../constants/GoProSettingId';
import { GoProPresetGroup } from '../constants/GoProPresetGroup';

const stateWith = (overrides: Partial<CameraSpecificState>): CameraSpecificState => ({
  ...createDefaultCameraState(),
  hardwareInfo: {
    modelNo: 65,
    modelName: 'HERO13 Black',
    boardType: 4,
    firmwareVersion: 'H24.01',
    serialNumber: 'C123',
    ssid: 'GP123',
    macAddress: 'AA:BB',
  },
  ...overrides,
});

describe('filterCapabilityIdsForCurrentContext', () => {
  it('drops non-finite ids', () => {
    const cs = stateWith({});
    expect(filterCapabilityIdsForCurrentContext([NaN, Infinity], cs)).toEqual([]);
  });

  it('always drops MODE_PRESET and MODE_PRESET_GROUP', () => {
    const cs = stateWith({});
    const out = filterCapabilityIdsForCurrentContext(
      [GoProSettingId.MODE_PRESET, GoProSettingId.MODE_PRESET_GROUP, GoProSettingId.RESOLUTION],
      cs,
    );
    expect(out).not.toContain(GoProSettingId.MODE_PRESET);
    expect(out).not.toContain(GoProSettingId.MODE_PRESET_GROUP);
    expect(out).toContain(GoProSettingId.RESOLUTION);
  });

  it('keeps VIDEO_FRAMING in the video group and when group is unknown', () => {
    const videoState = stateWith({
      settings: { [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.VIDEO },
    });
    expect(
      filterCapabilityIdsForCurrentContext([GoProSettingId.VIDEO_FRAMING], videoState),
    ).toContain(GoProSettingId.VIDEO_FRAMING);

    const unknownGroup = stateWith({ settings: {} });
    expect(
      filterCapabilityIdsForCurrentContext([GoProSettingId.VIDEO_FRAMING], unknownGroup),
    ).toContain(GoProSettingId.VIDEO_FRAMING);
  });

  it('drops VIDEO_FRAMING outside the video group', () => {
    const photoState = stateWith({
      settings: { [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.PHOTO },
    });
    expect(
      filterCapabilityIdsForCurrentContext([GoProSettingId.VIDEO_FRAMING], photoState),
    ).not.toContain(GoProSettingId.VIDEO_FRAMING);
  });

  it('keeps MULTI_SHOT_FRAMING only in the timelapse group', () => {
    const timelapse = stateWith({
      settings: { [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.TIMELAPSE },
    });
    expect(
      filterCapabilityIdsForCurrentContext([GoProSettingId.MULTI_SHOT_FRAMING], timelapse),
    ).toContain(GoProSettingId.MULTI_SHOT_FRAMING);

    const video = stateWith({
      settings: { [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.VIDEO },
    });
    expect(
      filterCapabilityIdsForCurrentContext([GoProSettingId.MULTI_SHOT_FRAMING], video),
    ).not.toContain(GoProSettingId.MULTI_SHOT_FRAMING);
  });

  it('prefers pendingSettings group over settings group for framing context', () => {
    const cs = stateWith({
      settings: { [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.PHOTO },
      pendingSettings: { [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.VIDEO },
    });
    // pending says VIDEO, so VIDEO_FRAMING should be kept
    expect(filterCapabilityIdsForCurrentContext([GoProSettingId.VIDEO_FRAMING], cs)).toContain(
      GoProSettingId.VIDEO_FRAMING,
    );
  });
});

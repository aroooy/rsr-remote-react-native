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
import {
  getCapabilityCacheKey,
  getDefaultCapabilityPrefetchIds,
  filterCapabilityIdsForCurrentContext,
} from './capabilityManager';
import { createDefaultCameraState } from '../store/GoProStore';
import { GoProSettingId } from '../constants/GoProSettingId';

describe('capabilityManager', () => {
  it('computes capability cache key when hardware info is available', () => {
    const mockState = createDefaultCameraState();
    mockState.hardwareInfo = {
      modelName: 'HERO13 Black',
      modelNo: 64,
      firmwareVersion: 'H24.01.02',
      boardType: 13,
      serialNumber: 'C3441324567890',
      ssid: 'GoPro 1234',
      macAddress: 'AA:BB:CC:DD:EE:FF',
    };
    mockState.settings[GoProSettingId.MODE_PRESET] = 65536;
    mockState.settings[GoProSettingId.MODE_PRESET_GROUP] = 1000;

    const key = getCapabilityCacheKey(mockState, false);
    expect(key).toBeDefined();
  });

  it('filters candidate capability IDs for current context', () => {
    const mockState = createDefaultCameraState();
    mockState.hardwareInfo = {
      modelName: 'HERO13 Black',
      modelNo: 64,
      firmwareVersion: 'H24.01.02',
      boardType: 13,
      serialNumber: 'C3441324567890',
      ssid: 'GoPro 1234',
      macAddress: 'AA:BB:CC:DD:EE:FF',
    };

    const ids = filterCapabilityIdsForCurrentContext(
      [GoProSettingId.RESOLUTION, GoProSettingId.MODE_PRESET],
      mockState,
    );
    expect(ids).not.toContain(GoProSettingId.MODE_PRESET);
  });

  it('returns default prefetch IDs for active preset', () => {
    const mockState = createDefaultCameraState();
    const ids = getDefaultCapabilityPrefetchIds(mockState);
    expect(Array.isArray(ids)).toBe(true);
  });
});

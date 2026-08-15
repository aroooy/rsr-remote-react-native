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
import { buildCapabilityCacheKey } from './capabilityCacheKey';
import { createDefaultCameraState, type CameraSpecificState } from '../store/GoProStore';
import { GoProSettingId } from '../constants/GoProSettingIds';
import type { HardwareInfo } from '../types/KnownDevice';

const hwInfo: HardwareInfo = {
  modelNo: 65,
  modelName: 'HERO13 Black',
  boardType: 4,
  firmwareVersion: 'H24.01',
  serialNumber: 'C123',
  ssid: 'GP123',
  macAddress: 'AA:BB',
};

/** Camera state that is ready (booted, not busy) with a known preset. */
const readyState = (overrides: Partial<CameraSpecificState> = {}): CameraSpecificState => ({
  ...createDefaultCameraState(),
  hardwareInfo: hwInfo,
  isReady: true,
  systemBusy: false,
  settings: { [GoProSettingId.MODE_PRESET]: 0, ...(overrides.settings ?? {}) },
  ...overrides,
});

describe('buildCapabilityCacheKey', () => {
  it('returns null when hardware info is missing', () => {
    const cs = { ...createDefaultCameraState(), isReady: true };
    expect(buildCapabilityCacheKey(cs, false)).toBeNull();
  });

  it('returns null when MODE_PRESET is unknown (initial load incomplete)', () => {
    const cs = { ...createDefaultCameraState(), hardwareInfo: hwInfo, isReady: true };
    expect(buildCapabilityCacheKey(cs, false)).toBeNull();
  });

  it('returns null while the camera is short-term busy', () => {
    const cs = readyState({ systemBusy: true });
    expect(buildCapabilityCacheKey(cs, false)).toBeNull();
  });

  it('returns null while not ready', () => {
    const cs = readyState({ isReady: false });
    expect(buildCapabilityCacheKey(cs, false)).toBeNull();
  });

  it('returns null while booting', () => {
    expect(buildCapabilityCacheKey(readyState(), true)).toBeNull();
  });

  it('builds a key embedding model, firmware and preset for a ready state', () => {
    const key = buildCapabilityCacheKey(readyState(), false);
    expect(key).not.toBeNull();
    expect(key).toContain('HERO13 Black');
    expect(key).toContain('H24.01');
    expect(key).toContain('_P0_'); // preset 0
  });

  it('prefers pendingSettings over settings for the preset value', () => {
    const cs = readyState({
      settings: { [GoProSettingId.MODE_PRESET]: 0 },
      pendingSettings: { [GoProSettingId.MODE_PRESET]: 3 },
    });
    expect(buildCapabilityCacheKey(cs, false)).toContain('_P3_');
  });

  it('produces different keys for different resolutions', () => {
    const a = buildCapabilityCacheKey(
      readyState({ settings: { [GoProSettingId.MODE_PRESET]: 0, [GoProSettingId.RESOLUTION]: 1 } }),
      false,
    );
    const b = buildCapabilityCacheKey(
      readyState({ settings: { [GoProSettingId.MODE_PRESET]: 0, [GoProSettingId.RESOLUTION]: 9 } }),
      false,
    );
    expect(a).not.toBeNull();
    expect(a).not.toBe(b);
  });

  it('is stable for the same inputs', () => {
    expect(buildCapabilityCacheKey(readyState(), false)).toBe(
      buildCapabilityCacheKey(readyState(), false),
    );
  });
});

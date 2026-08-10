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
import { GoProPresetGroup, GoProPresetGroupSelectId } from './GoProPresetGroup';

describe('GoProPresetGroup', () => {
  it('has correct group IDs', () => {
    expect(GoProPresetGroup.VIDEO).toBe(1000);
    expect(GoProPresetGroup.PHOTO).toBe(1001);
    expect(GoProPresetGroup.TIMELAPSE).toBe(1002);
  });
});

describe('GoProPresetGroupSelectId', () => {
  it('has correct BLE select IDs', () => {
    expect(GoProPresetGroupSelectId.VIDEO).toBe(232);
    expect(GoProPresetGroupSelectId.PHOTO).toBe(233);
    expect(GoProPresetGroupSelectId.TIMELAPSE).toBe(234);
  });

  it('values are distinct from GoProPresetGroup', () => {
    // Select IDs should not collide with group IDs
    const groupIds = new Set<number>(Object.values(GoProPresetGroup));
    const selectIds = Object.values(GoProPresetGroupSelectId);
    for (const sid of selectIds) {
      expect(groupIds.has(sid as number)).toBe(false);
    }
  });
});

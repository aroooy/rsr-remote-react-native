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

import { describe, expect, it } from 'vitest';
import {
  shouldBypassShootingLock,
  shouldBypassShortTermBusy,
  evaluateShootingLockRejection,
  evaluateDynamicLockRejection,
  shouldWaitForReady,
} from './commandQueueRules';

describe('commandQueueRules', () => {
  describe('shouldBypassShootingLock', () => {
    it('should bypass shooting lock for emergency, systemSetting, shutter, and control', () => {
      expect(shouldBypassShootingLock('emergency')).toBe(true);
      expect(shouldBypassShootingLock('systemSetting')).toBe(true);
      expect(shouldBypassShootingLock('shutter')).toBe(true);
      expect(shouldBypassShootingLock('control')).toBe(true);
    });

    it('should NOT bypass shooting lock for setting and preset', () => {
      expect(shouldBypassShootingLock('setting')).toBe(false);
      expect(shouldBypassShootingLock('preset')).toBe(false);
    });
  });

  describe('shouldBypassShortTermBusy', () => {
    it('should bypass short term busy for emergency, shutter, and systemSetting', () => {
      expect(shouldBypassShortTermBusy('emergency')).toBe(true);
      expect(shouldBypassShortTermBusy('shutter')).toBe(true);
      expect(shouldBypassShortTermBusy('systemSetting')).toBe(true);
    });

    it('should NOT bypass short term busy for setting, control, and preset', () => {
      expect(shouldBypassShortTermBusy('setting')).toBe(false);
      expect(shouldBypassShortTermBusy('control')).toBe(false);
      expect(shouldBypassShortTermBusy('preset')).toBe(false);
    });
  });

  describe('evaluateShootingLockRejection', () => {
    it('returns encoding rejection when shooting is locked for non-exempt categories', () => {
      expect(evaluateShootingLockRejection('setting', true)).toBe('encoding');
      expect(evaluateShootingLockRejection('preset', true)).toBe('encoding');
    });

    it('returns null when shooting is locked for exempt categories', () => {
      expect(evaluateShootingLockRejection('emergency', true)).toBeNull();
      expect(evaluateShootingLockRejection('shutter', true)).toBeNull();
      expect(evaluateShootingLockRejection('systemSetting', true)).toBeNull();
      expect(evaluateShootingLockRejection('control', true)).toBeNull();
    });

    it('returns null when shooting is not locked', () => {
      expect(evaluateShootingLockRejection('setting', false)).toBeNull();
    });
  });

  describe('evaluateDynamicLockRejection', () => {
    it('returns dynamic rejection when setting ID is in dynamicShootingLockedIds and shooting is locked', () => {
      const lockedIds = new Set([2, 3]);
      expect(evaluateDynamicLockRejection(2, true, lockedIds)).toBe('dynamic');
    });

    it('returns null when setting ID is not locked or shooting is not locked', () => {
      const lockedIds = new Set([2, 3]);
      expect(evaluateDynamicLockRejection(5, true, lockedIds)).toBeNull();
      expect(evaluateDynamicLockRejection(2, false, lockedIds)).toBeNull();
      expect(evaluateDynamicLockRejection(undefined, true, lockedIds)).toBeNull();
    });
  });

  describe('shouldWaitForReady', () => {
    it('returns true if camera is short-term busy and category does not bypass', () => {
      expect(shouldWaitForReady('setting', true)).toBe(true);
      expect(shouldWaitForReady('control', true)).toBe(true);
    });

    it('returns false if camera is short-term busy but category bypasses', () => {
      expect(shouldWaitForReady('emergency', true)).toBe(false);
      expect(shouldWaitForReady('shutter', true)).toBe(false);
      expect(shouldWaitForReady('systemSetting', true)).toBe(false);
    });

    it('returns false when camera is not short-term busy', () => {
      expect(shouldWaitForReady('setting', false)).toBe(false);
    });
  });
});

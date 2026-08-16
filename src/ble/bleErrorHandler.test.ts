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

import { describe, it, expect, vi } from 'vitest';
import { classifyBleError, handleBleError } from './bleErrorHandler';

describe('bleErrorHandler', () => {
  describe('classifyBleError', () => {
    it('returns UNKNOWN for null/undefined/empty error', () => {
      expect(classifyBleError(null)).toBe('UNKNOWN');
      expect(classifyBleError(undefined)).toBe('UNKNOWN');
    });

    it('classifies CANCELED errors based on text or context', () => {
      expect(classifyBleError(new Error('Operation was cancelled'))).toBe('CANCELED');
      expect(classifyBleError('Device connection cancelled')).toBe('CANCELED');

      const cancelledSet = new Set(['dev-123']);
      expect(
        classifyBleError(new Error('random error'), {
          deviceId: 'dev-123',
          cancelledDeviceIds: cancelledSet,
        }),
      ).toBe('CANCELED');
    });

    it('classifies MANAGER_DESTROYED error', () => {
      expect(classifyBleError(new Error('Ble manager was destroyed'))).toBe('MANAGER_DESTROYED');
    });

    it('classifies TIMEOUT error', () => {
      expect(classifyBleError(new Error('Command timed out after 5000ms'))).toBe('TIMEOUT');
      expect(classifyBleError('Device did not respond')).toBe('TIMEOUT');
    });

    it('classifies DISCONNECTED error', () => {
      expect(classifyBleError(new Error('Device disconnected'))).toBe('DISCONNECTED');
      expect(classifyBleError('Device was disconnected unexpectedly')).toBe('DISCONNECTED');
    });

    it('classifies GATT_ERROR', () => {
      expect(classifyBleError(new Error('GATT status 133'))).toBe('GATT_ERROR');
      expect(classifyBleError(new Error('write characteristic failed'))).toBe('GATT_ERROR');
    });
  });

  describe('handleBleError', () => {
    it('handles MANAGER_DESTROYED error and invokes recreateManager', () => {
      const recreateFn = vi.fn();
      const result = handleBleError(new Error('Ble manager was destroyed'), {
        actionName: 'connect',
        recreateManager: recreateFn,
      });

      expect(result.kind).toBe('MANAGER_DESTROYED');
      expect(result.isHandled).toBe(true);
      expect(recreateFn).toHaveBeenCalledOnce();
    });

    it('handles GATT_ERROR and triggers alert if provided', () => {
      const alertFn = vi.fn();
      const result = handleBleError(new Error('GATT status 133'), {
        actionName: 'write',
        showAlert: alertFn,
        alertTitle: 'Error',
      });

      expect(result.kind).toBe('GATT_ERROR');
      expect(alertFn).toHaveBeenCalledWith('Error', 'GATT status 133');
    });
  });
});

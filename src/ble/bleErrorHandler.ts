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

import { debugError, debugWarn } from '../utils/debugLogging';

export type BleErrorKind =
  | 'CANCELED'
  | 'MANAGER_DESTROYED'
  | 'TIMEOUT'
  | 'DISCONNECTED'
  | 'GATT_ERROR'
  | 'UNKNOWN';

export interface BleErrorContext {
  deviceId?: string;
  cancelledDeviceIds?: ReadonlySet<string>;
}

export interface BleErrorHandlingContext extends BleErrorContext {
  actionName?: string;
  showAlert?: (title: string, message: string) => void;
  alertTitle?: string;
  recreateManager?: () => void;
}

export interface BleErrorResult {
  kind: BleErrorKind;
  isHandled: boolean;
  message: string;
}

/**
 * Classifies an arbitrary unknown error into a structured BleErrorKind.
 * Pure function with zero side effects.
 */
export function classifyBleError(
  error: unknown,
  context?: BleErrorContext,
): BleErrorKind {
  if (!error) return 'UNKNOWN';

  const err = error as { message?: string; name?: string } | null | undefined;
  const message = String(err?.message || error || '').toLowerCase();

  // Check explicitly cancelled device IDs or error text
  if (
    context?.deviceId &&
    context.cancelledDeviceIds?.has(context.deviceId)
  ) {
    return 'CANCELED';
  }

  if (
    message.includes('operation was cancelled') ||
    message.includes('cancelled') ||
    message.includes('canceled')
  ) {
    return 'CANCELED';
  }

  if (message.includes('ble manager was destroyed')) {
    return 'MANAGER_DESTROYED';
  }

  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('did not respond')
  ) {
    return 'TIMEOUT';
  }

  if (
    message.includes('device disconnected') ||
    message.includes('disconnected') ||
    message.includes('not connected') ||
    message.includes('was disconnected')
  ) {
    return 'DISCONNECTED';
  }

  if (
    message.includes('gatt') ||
    message.includes('characteristic') ||
    message.includes('service') ||
    message.includes('write failed')
  ) {
    return 'GATT_ERROR';
  }

  return 'UNKNOWN';
}

/**
 * Central handler for processing BLE errors consistently across the application.
 */
export function handleBleError(
  error: unknown,
  context: BleErrorHandlingContext = {},
): BleErrorResult {
  const kind = classifyBleError(error, context);
  const rawMessage = (error as Error)?.message || String(error);
  const actionName = context.actionName || 'BLE operation';

  switch (kind) {
    case 'CANCELED':
      debugWarn('ble', `[BLE] ${actionName} cancelled`);
      break;

    case 'MANAGER_DESTROYED':
      debugWarn('ble', `[BLE] BleManager was destroyed during ${actionName}`);
      if (context.recreateManager) {
        context.recreateManager();
      }
      break;

    case 'TIMEOUT':
      debugWarn('ble', `[BLE] ${actionName} timed out: ${rawMessage}`);
      if (context.showAlert && context.alertTitle) {
        context.showAlert(context.alertTitle, rawMessage);
      }
      break;

    case 'DISCONNECTED':
      debugWarn('ble', `[BLE] Device disconnected during ${actionName}: ${rawMessage}`);
      break;

    case 'GATT_ERROR':
    case 'UNKNOWN':
    default:
      debugError('ble', `[BLE] ${actionName} failed:`, error);
      if (context.showAlert && context.alertTitle) {
        context.showAlert(context.alertTitle, rawMessage);
      }
      break;
  }

  return {
    kind,
    isHandled: true,
    message: rawMessage,
  };
}

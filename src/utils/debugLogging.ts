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

import { useGoProStore } from '../store/GoProStore';

export type DebugLogCategory =
  'ble' | 'bleCache' | 'blePreset' | 'bleAsync' | 'bleQueue' | 'wifi' | 'iap';

const isCategoryEnabled = (category: DebugLogCategory): boolean => {
  const state = useGoProStore.getState();

  switch (category) {
    case 'ble':
      return state.debugLogBle;
    case 'bleCache':
      return state.debugLogBleCache;
    case 'blePreset':
      return state.debugLogBlePreset;
    case 'bleAsync':
      return state.debugLogBleAsync;
    case 'bleQueue':
      return state.debugLogBleQueue;
    case 'wifi':
      return state.debugLogWifi;
    case 'iap':
      return state.debugLogIap;
    default:
      return true;
  }
};

export const debugLog = (category: DebugLogCategory, ...args: unknown[]): void => {
  if (!isCategoryEnabled(category)) return;
  console.log(...args);
};

export const debugDebug = (category: DebugLogCategory, ...args: unknown[]): void => {
  if (!isCategoryEnabled(category)) return;
  console.debug(...args);
};

export const debugWarn = (category: DebugLogCategory | 'system', ...args: unknown[]): void => {
  if (category !== 'system' && !isCategoryEnabled(category)) return;
  console.warn(...args);
};

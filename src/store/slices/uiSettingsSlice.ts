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

import type { StateCreator } from 'zustand';
import type { GoProState } from '../storeTypes';
import type { AppTheme } from '../../constants/Theme';
import type { AppLocale } from '../../i18n';

const DEBUG_LOG_DEFAULT = typeof __DEV__ !== 'undefined' && __DEV__;

export interface UiSettingsSlice {
  columnCount: number;
  theme: AppTheme;
  appLanguage: AppLocale;
  bypassCapabilityCache: boolean;
  debugLogBle: boolean;
  debugLogBleCache: boolean;
  debugLogBlePreset: boolean;
  debugLogBleAsync: boolean;
  debugLogBleQueue: boolean;
  debugLogWifi: boolean;
  debugLogIap: boolean;
  purchasedProducts: string[];

  setColumnCount: (count: number) => void;
  setTheme: (theme: AppTheme) => void;
  setAppLanguage: (lang: AppLocale) => void;
  setBypassCapabilityCache: (bypass: boolean) => void;
  setDebugLogBle: (enabled: boolean) => void;
  setDebugLogBleCache: (enabled: boolean) => void;
  setDebugLogBlePreset: (enabled: boolean) => void;
  setDebugLogBleAsync: (enabled: boolean) => void;
  setDebugLogBleQueue: (enabled: boolean) => void;
  setDebugLogWifi: (enabled: boolean) => void;
  setDebugLogIap: (enabled: boolean) => void;
  setPurchasedProducts: (products: string[]) => void;
  addPurchasedProduct: (productId: string) => void;
}

export const createUiSettingsSlice: StateCreator<
  GoProState,
  [],
  [],
  UiSettingsSlice
> = (set) => ({
  columnCount: 1,
  theme: 'dark',
  appLanguage: 'auto',
  bypassCapabilityCache: false,
  debugLogBle: DEBUG_LOG_DEFAULT,
  debugLogBleCache: DEBUG_LOG_DEFAULT,
  debugLogBlePreset: DEBUG_LOG_DEFAULT,
  debugLogBleAsync: DEBUG_LOG_DEFAULT,
  debugLogBleQueue: DEBUG_LOG_DEFAULT,
  debugLogWifi: DEBUG_LOG_DEFAULT,
  debugLogIap: DEBUG_LOG_DEFAULT,
  purchasedProducts: [],

  setColumnCount: (count) => set({ columnCount: count }),
  setTheme: (theme) => set({ theme }),
  setAppLanguage: (lang) => set({ appLanguage: lang }),
  setBypassCapabilityCache: (bypass) => set({ bypassCapabilityCache: bypass }),
  setDebugLogBle: (enabled) => set({ debugLogBle: enabled }),
  setDebugLogBleCache: (enabled) => set({ debugLogBleCache: enabled }),
  setDebugLogBlePreset: (enabled) => set({ debugLogBlePreset: enabled }),
  setDebugLogBleAsync: (enabled) => set({ debugLogBleAsync: enabled }),
  setDebugLogBleQueue: (enabled) => set({ debugLogBleQueue: enabled }),
  setDebugLogWifi: (enabled) => set({ debugLogWifi: enabled }),
  setDebugLogIap: (enabled) => set({ debugLogIap: enabled }),
  setPurchasedProducts: (products) => set({ purchasedProducts: products }),
  addPurchasedProduct: (productId) =>
    set((state) => ({
      purchasedProducts: state.purchasedProducts.includes(productId)
        ? state.purchasedProducts
        : [...state.purchasedProducts, productId],
    })),
});

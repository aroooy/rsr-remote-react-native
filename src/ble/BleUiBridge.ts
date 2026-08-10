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

/**
 * UI bridge for the BLE layer.
 *
 * GoProBLEManager occasionally needs to surface a message or ask the user to
 * confirm a destructive action (e.g. powering off while recording). Rather
 * than importing react-native's Alert directly — which couples the BLE logic
 * to the UI and makes it untestable — the manager talks to this interface.
 *
 * Production code uses `defaultBleUiBridge` (backed by Alert); tests can inject
 * a stub via `goProBle.setUiBridge(...)`.
 */
import { Alert } from 'react-native';

export interface BleConfirmOptions {
  title: string;
  message?: string;
  confirmText: string;
  cancelText: string;
  /** Render the confirm button as a destructive (red) action. */
  destructive?: boolean;
}

export interface BleUiBridge {
  /** Show an informational / error message with a single dismiss button. */
  alert(title: string, message?: string): void;
  /** Ask the user to confirm; resolves true when confirmed, false when cancelled. */
  confirm(options: BleConfirmOptions): Promise<boolean>;
}

/**
 * Default bridge backed by react-native's Alert. The button layout mirrors the
 * previous inline Alert.alert calls exactly (cancel first, confirm second).
 */
export const defaultBleUiBridge: BleUiBridge = {
  alert: (title, message) => {
    Alert.alert(title, message);
  },
  confirm: ({ title, message, confirmText, cancelText, destructive }) =>
    new Promise<boolean>((resolve) => {
      Alert.alert(title, message, [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ]);
    }),
};

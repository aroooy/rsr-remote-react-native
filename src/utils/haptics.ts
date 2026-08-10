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

import * as Haptics from 'expo-haptics';

/**
 * Thin, fire-and-forget wrappers around expo-haptics.
 *
 * Haptics are a non-critical enhancement: every call is guarded so a device
 * without a taptic engine (or a platform where the call rejects) never throws
 * or surfaces an unhandled rejection. Callers can invoke these synchronously.
 */
function safe(run: () => Promise<unknown>): void {
  try {
    void Promise.resolve(run()).catch(() => {});
  } catch {
    // ignore — haptics must never break a user action
  }
}

export const haptics = {
  /** Light tick for selections / minor toggles. */
  selection: () => safe(() => Haptics.selectionAsync()),
  /** Tactile thump for primary actions (shutter / record toggle). */
  impact: (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) =>
    safe(() => Haptics.impactAsync(style)),
  /** Success notification (e.g. camera connected). */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Warning notification (e.g. power off). */
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /** Error notification (e.g. connection failed). */
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};

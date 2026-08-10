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
 * SYSTEM_SETTINGS — A set of setting IDs that can be changed even during recording (Encoding/Hindsight Active).
 *
 * Selection criteria: Only auxiliary UI/UX settings that do not affect recording continuity or recording quality.
 * Although there are model differences, unsupported settings simply will not appear on the screen, so keeping them in the set causes no issues.
 *
 * Reference: docs/technical/09_camera-state-control.md §3
 */
export const SYSTEM_SETTINGS: ReadonlySet<number> = new Set<number>([
  59, // Auto Power Down
  86, // Voice Control On/Off (BLE ID 0x56) Common to all models
  87, // Beep Volume (BLE ID 0x57) Hero9-12/Mini11/Max
  88, // LCD Brightness
  103, // Screen Lock On/Off (BLE ID 0x67) Common to all models
  112, // Orientation / Landscape Lock (BLE ID 0x70) Common to all models
  221, // Enable Beep On/Off (BLE ID 0xDD) HERO13-specific
  91, // LED
  216, // Beep Volume (Hero13+, BLE ID 0xD8)
  219, // Setup Screen Saver (Hero13+)
  84, // Setup Language (BLE ID 0x54)
  223, // Voice Control Language (BLE ID 0xDF)
  237, // Auto Power On USB (LIT HERO)
]);

export const isSystemSetting = (id: number): boolean => SYSTEM_SETTINGS.has(id);

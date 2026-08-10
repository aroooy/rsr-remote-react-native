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

export type SliderConfig = {
  min: number;
  max: number;
  step: number;
  formatValue: (v: number) => string;
};

export type SettingMetadata = {
  name: string;
  values: { [key: number]: string };
  sliderConfig?: SliderConfig;
  isBool?: boolean;
  /**
   * The value representing ON when isBool=true. Defaults to 1 if omitted.
   * Example: SCREEN_LOCK (103) has ON=3 / OFF=0, so boolOnValue: 3 is specified.
   */
  boolOnValue?: number;
  /**
   * The value representing OFF when isBool=true. Defaults to 0 if omitted.
   * Example: SCREEN_LOCK (103) has OFF=0, so boolOffValue: 0 is specified.
   */
  boolOffValue?: number;
  /** Rendered in renderOtherItem as a side-by-side two-button toggle (ON/OFF) */
  isToggleButton?: boolean;
};

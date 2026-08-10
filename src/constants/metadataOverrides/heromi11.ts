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

import { GoProSettingId } from '../GoProSettingIds';
import type { ModelMetadataOverrides } from './types';

export const heromi11MetadataOverrides: ModelMetadataOverrides = {
  valueOverrides: {
    [GoProSettingId.HORIZONTAL_LEVELING]: { 2: 'On' },
    [GoProSettingId.HORIZONTAL_LOCK]: { 2: 'On' },
    [GoProSettingId.LED]: { 0: 'Off', 2: 'On' },
  },
  boolValueOverrides: {
    [GoProSettingId.HORIZONTAL_LEVELING]: { onValue: 2 },
    [GoProSettingId.HORIZONTAL_LOCK]: { onValue: 2 },
  },
  staticFallbacks: {
    [GoProSettingId.HORIZONTAL_LOCK]: [2, 0],
    [GoProSettingId.TIME_LAPSE_LENS]: [101],
    [GoProSettingId.LED]: [2, 0],
    [GoProSettingId.HORIZONTAL_LEVELING]: [2, 0],
  },
  valueOrderOverrides: {
    [GoProSettingId.AUTO_OFF]: [11, 12, 1, 4, 6, 7, 0],
    [GoProSettingId.RESOLUTION]: [100, 1, 4, 9, 27, 18, 6, 26, 28],
  },
  presetNameOverrides: {
    196608: 'Max Video',
    327680: 'Max TimeWarp',
    655360: 'Extended Battery',
    655361: 'Longest Battery',
    655362: 'Highest Quality',
  },
};

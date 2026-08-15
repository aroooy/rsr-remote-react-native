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

import { GoProSettingId } from '../GoProSettingId';
import type { ModelMetadataOverrides } from './types';

export const hero11MetadataOverrides: ModelMetadataOverrides = {
  valueOverrides: {
    [GoProSettingId.HORIZONTAL_LEVELING]: { 2: 'On' },
    [GoProSettingId.HORIZONTAL_LOCK]: { 2: 'On' },
  },
  boolValueOverrides: {
    [GoProSettingId.SCREEN_LOCK]: { onValue: 100 },
    [GoProSettingId.HORIZONTAL_LEVELING]: { onValue: 2 },
    [GoProSettingId.HORIZONTAL_LOCK]: { onValue: 2 },
  },
  staticFallbacks: {
    [GoProSettingId.HORIZONTAL_LOCK]: [2, 0],
    [GoProSettingId.TIME_LAPSE_LENS]: [101],
    [GoProSettingId.ORIENTATION]: [100, 255],
    [GoProSettingId.HORIZONTAL_LEVELING]: [2, 0],
    [GoProSettingId.LOOPING_INTERVAL]: [1, 2, 3, 4],
  },
  valueOrderOverrides: {
    [GoProSettingId.RESOLUTION]: [100, 1, 4, 9, 27, 18, 6, 26, 28],
  },
  presetNameOverrides: {
    3: 'Full Frame',
    655360: 'Video',
    720896: 'Video[EB]',
    917504: 'Video[LB]',
    196608: 'Max Video',
    262144: 'Max Photo',
    327680: 'Max TimeWarp',
    524288: 'Standard[EB]',
    524289: 'Activity[EB]',
    524290: 'Cinematic[EB]',
    524291: 'Slo-Mo[EB]',
    589824: 'Standard[LB]',
    589825: 'Activity[LB]',
    589826: 'Cinematic[LB]',
    589827: 'Slo-Mo[LB]',
  },
};

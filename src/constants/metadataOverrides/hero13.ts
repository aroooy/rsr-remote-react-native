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

export const hero13MetadataOverrides: ModelMetadataOverrides = {
  valueOverrides: {
    [GoProSettingId.COLOR]: { 3: 'GP-Log' },
    [GoProSettingId.VIDEO_SHUTTER]: { 57: 'Auto Cinematic' },
    [GoProSettingId.PHOTO_SHUTTER]: { 6: 'Auto Cinematic' },
  },
  valueOrderOverrides: {
    [GoProSettingId.VIDEO_DURATION]: [9, 8, 7, 6, 5, 4, 3, 2, 1, 100],
  },
  presetNameOverrides: {
    1: 'Burst Slo-Mo',
    655360: 'Easy Standard Video',
    655361: 'Easy HDR Video',
    786432: 'SuperPhoto',
    983040: 'Max Video',
    1048576: 'Max Photo',
    1114112: 'Max TimeWarp',
    1114113: 'Max Star Trails',
    1114114: 'Max Light Painting',
    1114115: 'Max Vehicle Lights',
    1441792: 'Easy Max Video',
    1507328: 'Easy Max Photo',
    1572864: 'Easy Max TimeWarp',
    1572865: 'Easy Max Star Trails',
    1572866: 'Easy Max Light Painting',
    1572867: 'Easy Max Vehicle Lights',
    2621440: 'Easy Macro SuperPhoto',
    2949120: 'Anamorphic SuperPhoto',
    3145728: 'Easy Anamorphic SuperPhoto',
  },
};

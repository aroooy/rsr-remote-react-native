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

export const maxMetadataOverrides: ModelMetadataOverrides = {
  valueOverrides: {
    [GoProSettingId.VIDEO_BITRATE]: { 0: 'Low' },
    [GoProSettingId.LED]: { 0: 'All Off', 1: 'Front Off Only', 2: 'All On' },
    [GoProSettingId.ANTI_FLICKER]: { 0: '60Hz', 1: '50Hz' },
    [GoProSettingId.VIDEO_TIMELAPSE_RATE]: { 4: '10 Sec', 5: '30 Sec', 6: '60 Sec' },
    [GoProSettingId.ORIENTATION]: { 0: 'All', 5: 'Landscape' },
    [GoProSettingId.MAX_LENS_DIRECTION]: { 0: 'Front', 1: 'Rear' },
    [GoProSettingId.PHOTO_LENS]: { 19: 'Wide', 20: 'Max SuperView' },
    [GoProSettingId.VIDEO_LENS]: { 5: '360°' },
  },
  staticFallbacks: {
    [GoProSettingId.PHOTO_LENS]: [20, 19],
    [GoProSettingId.RESOLUTION]: [21, 22, 7, 9],
    [GoProSettingId.VIDEO_LENS]: [5, 7, 0, 4, 6],
    [GoProSettingId.HYPERSMOOTH]: [1, 0],
    [GoProSettingId.MAX_LENS_MODE]: [0, 1],
    [GoProSettingId.MAX_LENS_DIRECTION]: [0, 1],
    [GoProSettingId.VIDEO_CLIPS]: [0, 1, 2],
    [GoProSettingId.LED]: [2, 0, 1],
    [GoProSettingId.ORIENTATION]: [0, 5],
    [GoProSettingId.VIDEO_COMPRESSION]: [1, 0],
    [GoProSettingId.ANTI_FLICKER]: [0, 1],
    [GoProSettingId.VIDEO_SHUTTER]: [
      22, 21, 20, 46, 18, 17, 15, 45, 13, 12, 10, 44, 8, 7, 6, 52, 5, 4, 3, 0,
    ],
    [GoProSettingId.COLOR]: [0, 1],
    [GoProSettingId.MAX_WIND_REDUCTION]: [2, 1, 0],
    [GoProSettingId.VIDEO_ISO_MIN]: [0, 3, 1, 4, 2, 7, 8],
    [GoProSettingId.VIDEO_ISO_MAX]: [0, 3, 1, 4, 2, 7, 8],
    [GoProSettingId.VIDEO_TIMELAPSE_RATE]: [6, 5, 4, 3, 2, 1, 0],
    [GoProSettingId.PHOTO_TIMELAPSE_RATE]: [60, 30, 10, 5, 2, 1, 0],
  },
  presetNameOverrides: {
    65537: 'PowerPano',
  },
};

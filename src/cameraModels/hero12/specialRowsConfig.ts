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

import {
  PRESET_EASY_BASIC_QUALITY,
  PRESET_EASY_HIGHEST_QUALITY,
  PRESET_EASY_STANDARD_QUALITY,
} from '../../constants/presetIds';
import type { Hero12EasyPresetConfig } from '../shared/types';

const HERO12_EASY_PRESET_CONFIGS: Record<number, Hero12EasyPresetConfig> = {
  [PRESET_EASY_HIGHEST_QUALITY]: {
    lensValues: [9, 3, 0, 4, 10],
    framingOptions: [
      { key: 'widescreen', label: 'Widescreen', value: 0 },
      { key: 'vertical', label: 'Vertical', value: 1 },
      { key: 'full-frame', label: 'Full Frame', value: 2 },
    ],
    speedOptions: {
      0: [
        {
          key: '8x',
          label50: '8X (2.7K | 200FPS)',
          label60: '8X (2.7K | 240FPS)',
          resolutionNew: 104,
          resolutionLegacy: 4,
          fps50: 13,
          fps60: 0,
        },
        {
          key: '4x',
          label50: '4X (4K | 100FPS)',
          label60: '4X (4K | 120FPS)',
          resolutionNew: 102,
          resolutionLegacy: 1,
          fps50: 2,
          fps60: 1,
        },
        {
          key: '2x',
          label50: '2X (5.3K | 50FPS)',
          label60: '2X (5.3K | 60FPS)',
          resolutionNew: 101,
          resolutionLegacy: 100,
          fps50: 6,
          fps60: 5,
        },
        {
          key: '1x',
          label50: '1X (5.3K | 25FPS)',
          label60: '1X (5.3K | 30FPS)',
          resolutionNew: 101,
          resolutionLegacy: 100,
          fps50: 9,
          fps60: 8,
        },
      ],
      1: [
        {
          key: '2x',
          label50: '2X (4K 9:16 | 50FPS)',
          label60: '2X (4K 9:16 | 60FPS)',
          resolutionNew: 29,
          resolutionLegacy: 109,
          fps50: 6,
          fps60: 5,
        },
        {
          key: '1x',
          label50: '1X (4K 9:16 | 25FPS)',
          label60: '1X (4K 9:16 | 30FPS)',
          resolutionNew: 29,
          resolutionLegacy: 109,
          fps50: 9,
          fps60: 8,
        },
      ],
      2: [
        {
          key: '2x',
          label50: '2X (4K 8:7 | 50FPS)',
          label60: '2X (4K 8:7 | 60FPS)',
          resolutionNew: 28,
          resolutionLegacy: 108,
          fps50: 6,
          fps60: 5,
        },
        {
          key: '1x',
          label50: '1X (5.3K 8:7 | 25FPS)',
          label60: '1X (5.3K 8:7 | 30FPS)',
          resolutionNew: 26,
          resolutionLegacy: 107,
          fps50: 9,
          fps60: 8,
        },
      ],
    },
  },
  [PRESET_EASY_STANDARD_QUALITY]: {
    lensValues: [9, 3, 0, 4, 10],
    framingOptions: [
      { key: 'widescreen', label: 'Widescreen', value: 0 },
      { key: 'vertical', label: 'Vertical', value: 1 },
      { key: 'full-frame', label: 'Full Frame', value: 2 },
    ],
    speedOptions: {
      0: [
        {
          key: '8x',
          label50: '8X (2.7K | 200FPS)',
          label60: '8X (2.7K | 240FPS)',
          resolutionNew: 104,
          resolutionLegacy: 4,
          fps50: 13,
          fps60: 0,
        },
        {
          key: '4x',
          label50: '4X (4K | 100FPS)',
          label60: '4X (4K | 120FPS)',
          resolutionNew: 102,
          resolutionLegacy: 1,
          fps50: 2,
          fps60: 1,
        },
        {
          key: '2x',
          label50: '2X (4K | 50FPS)',
          label60: '2X (4K | 60FPS)',
          resolutionNew: 102,
          resolutionLegacy: 1,
          fps50: 6,
          fps60: 5,
        },
        {
          key: '1x',
          label50: '1X (4K | 25FPS)',
          label60: '1X (4K | 30FPS)',
          resolutionNew: 102,
          resolutionLegacy: 1,
          fps50: 9,
          fps60: 8,
        },
      ],
      1: [
        {
          key: '2x',
          label50: '2X (4K 9:16 | 50FPS)',
          label60: '2X (4K 9:16 | 60FPS)',
          resolutionNew: 29,
          resolutionLegacy: 109,
          fps50: 6,
          fps60: 5,
        },
        {
          key: '1x',
          label50: '1X (4K 9:16 | 25FPS)',
          label60: '1X (4K 9:16 | 30FPS)',
          resolutionNew: 29,
          resolutionLegacy: 109,
          fps50: 9,
          fps60: 8,
        },
      ],
      2: [
        {
          key: '2x',
          label50: '2X (4K 8:7 | 50FPS)',
          label60: '2X (4K 8:7 | 60FPS)',
          resolutionNew: 28,
          resolutionLegacy: 108,
          fps50: 6,
          fps60: 5,
        },
        {
          key: '1x',
          label50: '1X (4K 8:7 | 25FPS)',
          label60: '1X (4K 8:7 | 30FPS)',
          resolutionNew: 28,
          resolutionLegacy: 108,
          fps50: 9,
          fps60: 8,
        },
      ],
    },
  },
  [PRESET_EASY_BASIC_QUALITY]: {
    lensValues: [3, 0, 4, 10],
    framingOptions: [
      { key: 'widescreen', label: 'Widescreen', value: 0 },
      { key: 'vertical', label: 'Vertical', value: 1 },
    ],
    speedOptions: {
      0: [
        {
          key: '8x',
          label50: '8X (1080p | 200FPS)',
          label60: '8X (1080p | 240FPS)',
          resolutionNew: 106,
          resolutionLegacy: 9,
          fps50: 13,
          fps60: 0,
        },
        {
          key: '4x',
          label50: '4X (1080p | 100FPS)',
          label60: '4X (1080p | 120FPS)',
          resolutionNew: 106,
          resolutionLegacy: 9,
          fps50: 2,
          fps60: 1,
        },
        {
          key: '2x',
          label50: '2X (1080p | 50FPS)',
          label60: '2X (1080p | 60FPS)',
          resolutionNew: 106,
          resolutionLegacy: 9,
          fps50: 6,
          fps60: 5,
        },
        {
          key: '1x',
          label50: '1X (1080p | 25FPS)',
          label60: '1X (1080p | 30FPS)',
          resolutionNew: 106,
          resolutionLegacy: 9,
          fps50: 9,
          fps60: 8,
        },
      ],
      1: [
        {
          key: '2x',
          label50: '2X (1080p 9:16 | 50FPS)',
          label60: '2X (1080p 9:16 | 60FPS)',
          resolutionNew: 30,
          resolutionLegacy: 110,
          fps50: 6,
          fps60: 5,
        },
        {
          key: '1x',
          label50: '1X (1080p 9:16 | 25FPS)',
          label60: '1X (1080p 9:16 | 30FPS)',
          resolutionNew: 30,
          resolutionLegacy: 110,
          fps50: 9,
          fps60: 8,
        },
      ],
    },
  },
};

export const getHero12EasyPresetConfig = (
  currentGroupIdOrPresetId: number | undefined,
  currentPresetId?: number | undefined,
): Hero12EasyPresetConfig | undefined => {
  const resolvedPresetId =
    currentPresetId === undefined ? currentGroupIdOrPresetId : currentPresetId;

  if (resolvedPresetId === undefined) {
    return undefined;
  }

  return HERO12_EASY_PRESET_CONFIGS[resolvedPresetId];
};

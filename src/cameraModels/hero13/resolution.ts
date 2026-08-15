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

import type { ResolutionEntry } from '../shared/types';

/** HERO13 (legacy scheme + HERO13-specific values) */
export const HERO13_RESOLUTION_MAP: Record<number, ResolutionEntry> = {
  // 16:9
  100: { label: '5.3K', aspect: '16:9', family: '5.3K' },
  1: { label: '4K', aspect: '16:9', family: '4K' },
  4: { label: '2.7K', aspect: '16:9', family: '2.7K' },
  9: { label: '1080', aspect: '16:9', family: '1080' },
  // 8:7
  107: { label: '5.3K 8:7', aspect: '8:7', family: '5.3K' },
  108: { label: '4K 8:7', aspect: '8:7', family: '4K' },
  18: { label: 'Max4K 8:7', aspect: '8:7', family: '4K' },
  // 9:16
  109: { label: '4K 9:16', aspect: '9:16', family: '4K' },
  110: { label: '1080 9:16', aspect: '9:16', family: '1080' },
  // 4:3
  111: { label: '2.7K 4:3', aspect: '4:3', family: '2.7K' },
  112: { label: '4K 4:3', aspect: '4:3', family: '4K' },
  113: { label: '5.3K 4:3', aspect: '4:3', family: '5.3K' },
  // HERO13 extension (21:9 / 1:1 are temporarily treated as 16:9 - dedicated aspect is not introduced yet)
  35: { label: '5.3K 21:9', aspect: '16:9', family: '5.3K' },
  36: { label: '4K 21:9', aspect: '16:9', family: '4K' },
  37: { label: '4K 1:1', aspect: '16:9', family: '4K' },
  // Others
  12: { label: '720', aspect: '16:9', family: '720' },
  7: { label: '1440', aspect: '4:3', family: '1440' },
  38: { label: '900', aspect: '16:9', family: 'other' },
};

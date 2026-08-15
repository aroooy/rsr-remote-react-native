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

/** HERO10 resolution map */
export const HERO10_RESOLUTION_MAP: Record<number, ResolutionEntry> = {
  // 16:9
  100: { label: '5.3K', aspect: '16:9', family: '5.3K' },
  1: { label: '4K', aspect: '16:9', family: '4K' },
  4: { label: '2.7K', aspect: '16:9', family: '2.7K' },
  9: { label: '1080', aspect: '16:9', family: '1080' },
  // 4:3
  25: { label: '5K 4:3', aspect: '4:3', family: '5K' },
  18: { label: '4K 4:3', aspect: '4:3', family: '4K' },
  6: { label: '2.7K 4:3', aspect: '4:3', family: '2.7K' },
};

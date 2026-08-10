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

import React from 'react';
import { View } from 'react-native';

/**
 * AspectRatioIcon — pure-View vector representation of a video framing
 * aspect ratio (e.g. 16:9, 9:16, 4:3, 8:7, 1:1).
 *
 * Designed to mimic the small framing thumbnails the GoPro body shows next
 * to its aspect-ratio chips. No SVG dependency: the icon is just an outer
 * square viewport plus an inner rectangle whose side ratio matches `ratio`.
 *
 * Sizing rule: the inner rectangle's longer side is fixed to (size - 2) so
 * different ratios stay visually balanced inside the same viewport.
 */
export interface AspectRatioIconProps {
  /** [width, height] of the ratio. e.g. [16, 9] */
  ratio: [number, number];
  /** Outer viewport size in px. Default 18. */
  size?: number;
  /** Stroke / fill color. */
  color: string;
  /** When true, fills the inner rectangle instead of just outlining it. */
  filled?: boolean;
}

export const AspectRatioIcon: React.FC<AspectRatioIconProps> = ({
  ratio,
  size = 18,
  color,
  filled = false,
}) => {
  const [w, h] = ratio;
  const longer = size - 2;
  const innerW = w >= h ? longer : Math.round((w / h) * longer);
  const innerH = h >= w ? longer : Math.round((h / w) * longer);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: innerW,
          height: innerH,
          borderWidth: 1.5,
          borderColor: color,
          borderRadius: 2,
          backgroundColor: filled ? color : 'transparent',
        }}
      />
    </View>
  );
};

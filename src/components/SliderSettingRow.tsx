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

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { SliderConfig } from '../constants/GoProMetadata';
import { ThemeColors } from '../constants/Theme';

const SLIDER_THUMB_SIZE = 22;

export interface SliderRowProps {
  id: number;
  sliderConfig: SliderConfig;
  currentValue: number | undefined;
  pendingValue: number | undefined;
  availableValues: number[];
  settingName: string;
  onCommit: (value: number) => void;
  colors: ThemeColors;
}

export const SliderSettingRow: React.FC<SliderRowProps> = ({
  sliderConfig,
  currentValue,
  pendingValue,
  availableValues,
  settingName,
  onCommit,
  colors,
}) => {
  const { min, max, step, formatValue } = sliderConfig;
  const effectiveValue = pendingValue ?? currentValue ?? min;
  const [displayValue, setDisplayValue] = useState(effectiveValue);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) setDisplayValue(effectiveValue);
  }, [effectiveValue, isActive]);

  const trackRef = useRef<View>(null);
  const trackWidthRef = useRef(0);
  const trackOffsetXRef = useRef(0);

  const snapToValueRef = useRef<(raw: number) => number>(() => min);
  snapToValueRef.current = (raw: number): number => {
    const clamped = Math.max(min, Math.min(max, raw));
    if (availableValues.length > 0) {
      return availableValues.reduce((a, b) =>
        Math.abs(b - clamped) < Math.abs(a - clamped) ? b : a,
      );
    }
    return Math.round(clamped / step) * step;
  };

  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const computeValueRef = useRef<(pageX: number) => number>(() => min);
  computeValueRef.current = (pageX: number): number => {
    const w = trackWidthRef.current;
    if (w === 0) return effectiveValue;
    const localX = pageX - trackOffsetXRef.current;
    const ratio = Math.max(0, Math.min(1, localX / w));
    return snapToValueRef.current(min + ratio * (max - min));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_e, gs) => {
        setIsActive(true);
        setDisplayValue(computeValueRef.current(gs.x0));
      },
      onPanResponderMove: (_e, gs) => {
        setDisplayValue(computeValueRef.current(gs.moveX));
      },
      onPanResponderRelease: (_e, gs) => {
        const v = computeValueRef.current(gs.moveX);
        setDisplayValue(v);
        setIsActive(false);
        onCommitRef.current(v);
      },
      onPanResponderTerminate: () => {
        setIsActive(false);
      },
    }),
  ).current;

  const ratio = max > min ? (displayValue - min) / (max - min) : 0;
  const fillPercent = `${Math.max(0, Math.min(100, ratio * 100))}%` as `${number}%`;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.labelRow}>
        <Text style={[styles.labelName, { color: colors.textSecondary }]}>{settingName}</Text>
        <Text style={[styles.labelValue, { color: colors.accent }]}>
          {formatValue(displayValue)}
        </Text>
      </View>
      <View
        ref={trackRef}
        style={styles.track}
        onLayout={() => {
          trackRef.current?.measure((_fx, _fy, width, _height, pageX) => {
            trackWidthRef.current = width;
            trackOffsetXRef.current = pageX;
          });
        }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.rail, { backgroundColor: colors.sliderRail }]} />
        <View style={[styles.fill, { width: fillPercent, backgroundColor: colors.accent }]} />
        <View
          style={[
            styles.thumb,
            {
              left: fillPercent,
              backgroundColor: colors.accent,
              transform: [
                { translateX: -(SLIDER_THUMB_SIZE / 2) },
                ...(isActive ? [{ scale: 1.2 }] : []),
              ],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelName: {
    fontSize: 16,
    fontWeight: '500',
  },
  labelValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 52,
    textAlign: 'right',
  },
  track: {
    height: 44,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  rail: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: SLIDER_THUMB_SIZE,
    height: SLIDER_THUMB_SIZE,
    borderRadius: SLIDER_THUMB_SIZE / 2,
    top: '50%',
    marginTop: -(SLIDER_THUMB_SIZE / 2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});

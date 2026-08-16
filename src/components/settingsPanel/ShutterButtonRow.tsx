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
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { GoProSettingId } from '../../constants/GoProSettingId';
import { isMaxModel } from '../../cameraModels/shared/modelNoHelpers';
import { haptics } from '../../utils/haptics';
import type { ThemeColors } from '../../constants/Theme';

export interface ShutterButtonRowProps {
  colors: ThemeColors;
  styles: Record<string, any>;
  captureDelayActive: boolean;
  captureCountdown: number | null;
  isEncoding: boolean;
  shutterPulse: Animated.Value;
  hindsightActive: boolean;
  currentModelNo: number | null;
  settings: Record<number, number>;
  t: (key: string, options?: Record<string, any>) => string;
  onToggleShutter: () => void;
  onChangeValue: (settingId: number, value: number) => void;
}

export const ShutterButtonRow: React.FC<ShutterButtonRowProps> = ({
  colors,
  styles,
  captureDelayActive,
  captureCountdown,
  isEncoding,
  shutterPulse,
  hindsightActive,
  currentModelNo,
  settings,
  t,
  onToggleShutter,
  onChangeValue,
}) => {
  return (
    <>
      <View style={styles.shutterFade} pointerEvents="none">
        {[0, 0.12, 0.25, 0.4, 0.55, 0.7, 0.85].map((op, i) => (
          <View
            key={i}
            style={{ height: 2, backgroundColor: colors.surfaceSecondary, opacity: op }}
          />
        ))}
      </View>

      <View style={[styles.shutterContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={styles.shutterSideContainer} />

        <View style={styles.shutterCenterContainer}>
          <TouchableOpacity
            style={[
              styles.shutterButton,
              { borderColor: captureDelayActive ? colors.warning : colors.shutterRing },
            ]}
            onPress={() => {
              haptics.impact();
              onToggleShutter();
            }}
            accessibilityLabel={isEncoding ? t('control.stop') : t('control.shutter')}
            accessibilityRole="button"
          >
            {captureCountdown !== null ? (
              <Text style={styles.shutterCountdownText}>{captureCountdown}</Text>
            ) : (
              <Animated.View
                style={[
                  isEncoding ? styles.shutterInnerRecording : styles.shutterInnerIdle,
                  {
                    backgroundColor: isEncoding
                      ? colors.shutterInnerRecording
                      : colors.shutterInnerIdle,
                  },
                  isEncoding && { opacity: shutterPulse },
                ]}
              />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.shutterSideContainer}>
          {hindsightActive && !isMaxModel(currentModelNo) && (
            <View style={styles.hindsightContainer}>
              <View
                style={[
                  styles.hindsightBadge,
                  {
                    backgroundColor: colors.accentLight,
                    borderColor: colors.accent,
                  },
                ]}
              >
                <Text style={[styles.hindsightBadgeText, { color: colors.accent }]}>
                  {settings[GoProSettingId.HINDSIGHT] === 2
                    ? '+15s'
                    : settings[GoProSettingId.HINDSIGHT] === 3
                      ? '+30s'
                      : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.stopHindsightButton, { backgroundColor: colors.accent }]}
                onPress={() => onChangeValue(GoProSettingId.HINDSIGHT, 4)}
                accessibilityLabel={t('control.stopHindsight')}
                accessibilityRole="button"
              >
                <Text style={styles.stopHindsightText}>{t('control.stopHindsight')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </>
  );
};

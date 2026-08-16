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

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, Text, View, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useGoProStore, useCameraState } from '../store/GoProStore';
import {
  selectHindsightActive,
  selectIsUserHoldingCamera,
  selectIsShortTermBusy,
} from '../store/GoProSelectors';
import { getThemeColors } from '../constants/Theme';

/**
 * CameraStatusBar - Camera status indicator component.
 * Shared between the main Control screen (variant="header") and inside the camera selection cards (variant="card").
 */
export const CameraStatusBar: React.FC<{
  deviceId?: string;
  variant?: 'header' | 'card';
  style?: StyleProp<ViewStyle>;
}> = ({ deviceId, variant = 'header', style }) => {
  const { t } = useTranslation();
  const theme = useGoProStore((s) => s.theme);
  const colors = getThemeColors(theme);

  // deviceId targets a specific camera (card variant); undefined = active camera
  const wifiStatus = useCameraState(deviceId, (cs) => cs.wifiStatus);
  const batteryLevel = useCameraState(deviceId, (cs) => cs.batteryLevel);
  const batteryPresent = useCameraState(deviceId, (cs) => cs.batteryPresent);
  const isCharging = useCameraState(deviceId, (cs) => cs.isCharging);
  const sdRemainingKB = useCameraState(deviceId, (cs) => cs.sdRemainingKB);
  const sdCapacityKB = useCameraState(deviceId, (cs) => cs.sdCapacityKB);
  const sdCardStatus = useCameraState(deviceId, (cs) => cs.sdCardStatus);
  const overheating = useCameraState(deviceId, (cs) => cs.overheating);
  const cold = useCameraState(deviceId, (cs) => cs.cold);
  const sdWriteSpeedError = useCameraState(deviceId, (cs) => cs.sdWriteSpeedError);
  const gpsLockAcquired = useCameraState(deviceId, (cs) => cs.gpsLockAcquired);
  const gpsSettingOn = useCameraState(deviceId, (cs) => cs.settings[83] === 1);
  const isEncoding = useCameraState(deviceId, (cs) => cs.isEncoding);
  const recordingTimeSec = useCameraState(deviceId, (cs) => cs.recordingTimeSec);

  const targetState = useCameraState(deviceId, (cs) => cs);

  const hindsightActive = selectHindsightActive(targetState);
  const isUserHoldingCamera = selectIsUserHoldingCamera(targetState);
  const isShortTermBusy = selectIsShortTermBusy(targetState);
  const pendingSettings = targetState.pendingSettings;
  const isApplyingCustomPreset = targetState.isApplyingCustomPreset;
  const hasPendingSettings = Object.keys(pendingSettings).length > 0;
  const showSyncing = hasPendingSettings || isApplyingCustomPreset;

  const sdRemainPct =
    sdCapacityKB > 0
      ? Math.max(0, Math.min(100, Math.round((sdRemainingKB / sdCapacityKB) * 100)))
      : null;

  const recordingDotColor = isEncoding ? colors.recording : hindsightActive ? colors.warning : null;

  const isCard = variant === 'card';

  const getBatteryIconName = (): keyof typeof Ionicons.glyphMap => {
    if (isCharging) return 'battery-charging';
    if (!batteryPresent) return 'battery-dead';
    if (batteryLevel >= 80) return 'battery-full';
    if (batteryLevel >= 30) return 'battery-half';
    return 'battery-dead';
  };

  // Pulse the recording dot while encoding so "recording" reads at a glance.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isEncoding) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isEncoding, pulse]);

  return (
    <View
      style={[
        isCard ? styles.cardContainer : styles.headerContainer,
        { borderBottomColor: colors.border },
        !isCard && { backgroundColor: colors.surface },
        style,
      ]}
    >
      <View style={styles.cell}>
        <MaterialIcons
          name={wifiStatus === 'connected' ? 'wifi' : 'wifi-off'}
          size={isCard ? 16 : 20}
          color={wifiStatus === 'connected' ? colors.accent : colors.textMuted}
        />
      </View>
      <View style={styles.cell}>
        <MaterialIcons
          name={
            !gpsSettingOn
              ? 'location-disabled'
              : gpsLockAcquired
                ? 'location-on'
                : 'location-searching'
          }
          size={isCard ? 16 : 20}
          color={
            !gpsSettingOn ? colors.textMuted : gpsLockAcquired ? colors.success : colors.warning
          }
        />
      </View>
      <View style={styles.cell}>
        <Ionicons
          name={getBatteryIconName()}
          size={isCard ? 16 : 20}
          color={isCharging ? colors.success : batteryLevel < 15 ? colors.danger : colors.textMuted}
        />
        <Text
          style={[isCard ? styles.cardValueText : styles.valueText, { color: colors.textMuted }]}
        >
          {batteryLevel}%
        </Text>
      </View>
      {sdRemainPct !== null && (
        <View style={styles.cell}>
          <MaterialIcons name="sd-card" size={isCard ? 15 : 19} color={colors.textMuted} />
          <Text
            style={[isCard ? styles.cardValueText : styles.valueText, { color: colors.textMuted }]}
          >
            {sdRemainPct}%
          </Text>
        </View>
      )}
      {overheating && (
        <View style={styles.cell}>
          <MaterialIcons name="whatshot" size={isCard ? 16 : 20} color={colors.danger} />
        </View>
      )}
      {cold && (
        <View style={styles.cell}>
          <MaterialIcons name="ac-unit" size={isCard ? 16 : 20} color={colors.cold} />
        </View>
      )}
      {sdWriteSpeedError && (
        <View style={styles.cell}>
          <MaterialIcons name="slow-motion-video" size={isCard ? 16 : 20} color={colors.warning} />
        </View>
      )}
      {sdCardStatus === 1 && (
        <View style={styles.cell}>
          <MaterialIcons name="sd-card-alert" size={isCard ? 16 : 20} color={colors.warning} />
        </View>
      )}
      {sdCardStatus === 2 && (
        <View style={styles.cell}>
          <MaterialIcons name="sd-card-alert" size={isCard ? 16 : 20} color={colors.warning} />
        </View>
      )}
      {sdCardStatus === 3 && (
        <View style={styles.cell}>
          <MaterialIcons name="sd-card-alert" size={isCard ? 16 : 20} color={colors.danger} />
        </View>
      )}
      {batteryLevel < 15 && (
        <View style={styles.cell}>
          <MaterialIcons name="battery-alert" size={isCard ? 16 : 20} color={colors.danger} />
        </View>
      )}
      {/* Indicator showing the user is operating the camera body directly */}
      {isUserHoldingCamera && (
        <View style={styles.cell}>
          <MaterialIcons name="touch-app" size={isCard ? 16 : 20} color={colors.warning} />
          <Text
            style={[
              isCard ? styles.cardValueText : styles.valueText,
              { color: colors.warning, fontSize: isCard ? 10 : 12 },
            ]}
          >
            {t('status.onCamera')}
          </Text>
        </View>
      )}
      {(isShortTermBusy || showSyncing) && !isEncoding && (
        <View style={styles.cell}>
          <ActivityIndicator size="small" color={colors.busy} style={{ marginRight: 4 }} />
          <Text
            style={[
              isCard ? styles.cardValueText : styles.valueText,
              { color: colors.busy, fontSize: isCard ? 10 : 12, fontWeight: 'bold' },
            ]}
          >
            {showSyncing ? t('status.syncing') : t('status.busy')}
          </Text>
        </View>
      )}
      {!isCard && <View style={styles.flexSpacer} />}
      {recordingDotColor && !isCard && (
        <View style={styles.cell}>
          <Animated.View
            style={[
              styles.recordingDot,
              { backgroundColor: recordingDotColor, opacity: isEncoding ? pulse : 1 },
            ]}
          />
          {isEncoding && (
            <Text style={[styles.valueText, styles.recordingTimeText, { color: colors.recording }]}>
              {`${Math.floor(recordingTimeSec / 60)
                .toString()
                .padStart(2, '0')}:${Math.floor(recordingTimeSec % 60)
                .toString()
                .padStart(2, '0')}`}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 36,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 4,
  },
  cardValueText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  recordingTimeText: {
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  flexSpacer: { flex: 1 },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

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
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useGoProStore } from '../store/GoProStore';
import { goProBle } from '../ble/GoProBLEManager';
import { CameraStatusBar } from './CameraStatusBar';
import { SwipeableItem } from './SwipeableItem';
import { haptics } from '../utils/haptics';
import type { ThemeColors } from '../constants/Theme';

/** Row model for the home screen list: a known device merged with live scan results. */
export type DeviceListItem = {
  id: string;
  name: string;
  bleName: string;
  /** Raw scan result snapshot (unused by the row itself; kept for callers). */
  device: unknown;
  known: boolean;
  isDiscoveredNow: boolean;
  lastConnectedAt: string | null;
  modelName: string | null;
  firmwareVersion: string | null;
};

interface DeviceItemProps {
  item: DeviceListItem;
  isPending: boolean;
  disableRow: boolean;
  colors: ThemeColors;
  navigation: NavigationProp<ParamListBase>;
  connectDevice: (item: DeviceListItem, navigation: NavigationProp<ParamListBase>) => Promise<void>;
  cancelConnectDevice: (itemId: string) => Promise<void>;
  handleDeleteDevice: (item: DeviceListItem) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

/** One camera row. Memoized so list re-renders only touch affected rows. */
export const DeviceItem = React.memo<DeviceItemProps>(
  ({
    item,
    isPending,
    disableRow,
    colors,
    navigation,
    connectDevice,
    cancelConnectDevice,
    handleDeleteDevice,
    onMoveUp,
    onMoveDown,
  }) => {
    const { t } = useTranslation();
    const isConnected = useGoProStore(
      (state) => state.deviceConnectionStatuses[item.id] === 'connected',
    );
    const cameraState = useGoProStore((state) => state.cameraStates[item.id]);

    const isEncoding = cameraState?.isEncoding ?? false;
    const recordingTimeSec = cameraState?.recordingTimeSec ?? 0;

    let statusText = t('home.offline');
    let statusColor = colors.textMuted;
    if (isConnected) {
      statusText = t('home.connected');
      statusColor = colors.success;
    } else if (item.isDiscoveredNow) {
      statusText = t('home.online');
      statusColor = colors.accent;
    } else if (isPending) {
      statusText = t('home.connecting');
      statusColor = colors.accent;
    }

    const handlePowerOff = () => {
      haptics.warning();
      void goProBle.powerOffCameraSafely(item.id);
    };

    const handleShutter = () => {
      haptics.impact();
      void goProBle.toggleShutter(!isEncoding, item.id);
    };

    return (
      <SwipeableItem
        onDelete={() => handleDeleteDevice(item)}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        disabled={disableRow || isPending}
        active={item.known}
        colors={colors}
      >
        <View
          style={[
            styles.deviceCardContainer,
            { backgroundColor: colors.surface },
            disableRow && styles.deviceItemDisabled,
          ]}
        >
          <TouchableOpacity
            style={styles.deviceItemMain}
            onPress={() => void connectDevice(item, navigation)}
            onLongPress={() => (item.known ? handleDeleteDevice(item) : undefined)}
            disabled={disableRow || isPending}
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <View
                style={[
                  styles.cameraIconContainer,
                  {
                    backgroundColor: isConnected
                      ? isEncoding
                        ? 'rgba(239, 68, 68, 0.15)'
                        : colors.accentLight
                      : item.isDiscoveredNow
                        ? colors.border
                        : colors.background,
                  },
                ]}
              >
                <Ionicons
                  name={isEncoding ? 'videocam' : isConnected ? 'videocam' : 'videocam-outline'}
                  size={22}
                  color={
                    isEncoding
                      ? colors.recording
                      : isConnected
                        ? colors.accent
                        : colors.textSecondary
                  }
                />
              </View>
            </View>

            <View style={styles.cardMiddle}>
              <View style={styles.deviceNameRow}>
                <Text style={[styles.deviceName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {isEncoding && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>
                      {`${Math.floor(recordingTimeSec / 60)
                        .toString()
                        .padStart(2, '0')}:${Math.floor(recordingTimeSec % 60)
                        .toString()
                        .padStart(2, '0')}`}
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                {item.modelName && (
                  <View style={[styles.modelBadge, { backgroundColor: colors.border }]}>
                    <Text style={[styles.modelBadgeText, { color: colors.textSecondary }]}>
                      {item.modelName.replace(' Black', '')}
                    </Text>
                  </View>
                )}
                {item.firmwareVersion && (
                  <Text style={[styles.deviceFirmware, { color: colors.textMuted }]}>
                    v{item.firmwareVersion}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.cardRight}>
              {isPending ? (
                <TouchableOpacity
                  style={[styles.statusRow, { backgroundColor: 'rgba(255,59,48,0.12)' }]}
                  onPress={() => void cancelConnectDevice(item.id)}
                  activeOpacity={0.7}
                >
                  <ActivityIndicator size="small" color="#ff3b30" style={{ marginRight: 6 }} />
                  <Text style={[styles.statusText, { color: '#ff3b30' }]}>{t('home.cancel')}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Status & Control Bar */}
          {isConnected && cameraState && (
            <View style={[styles.cardStatusControlRow, { borderTopColor: colors.border }]}>
              <CameraStatusBar
                deviceId={item.id}
                variant="card"
                style={{
                  borderTopWidth: 0,
                  borderBottomWidth: 0,
                  paddingHorizontal: 0,
                  paddingVertical: 0,
                  flex: 1,
                }}
              />
              <View style={styles.cardMiniControls}>
                <TouchableOpacity
                  style={[styles.flatIconBtn, { backgroundColor: 'rgba(220, 53, 69, 0.08)' }]}
                  onPress={handlePowerOff}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t('a11y.powerOff')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="power-settings-new" size={18} color={colors.danger} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.flatIconBtn,
                    isEncoding
                      ? { backgroundColor: colors.recording }
                      : { backgroundColor: colors.accent },
                  ]}
                  onPress={handleShutter}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={isEncoding ? t('control.stop') : t('a11y.record')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name={isEncoding ? 'stop' : 'videocam'} size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </SwipeableItem>
    );
  },
);

const styles = StyleSheet.create({
  deviceCardContainer: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  deviceItemMain: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceItemDisabled: { opacity: 0.55 },

  cardLeft: {
    marginRight: 14,
  },
  cardStatusControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cardMiniControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flatIconBtn: {
    width: 48,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  cameraIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 17,
    fontWeight: '700',
  },
  modelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  modelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deviceFirmware: {
    fontSize: 13,
    fontWeight: '500',
  },

  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

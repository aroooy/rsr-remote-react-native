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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PermissionsAndroid,
  Platform,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { Device } from 'react-native-ble-plx';
import { useGoProStore } from '../store/GoProStore';
import { goProBle } from '../ble/GoProBLEManager';
import { haptics } from '../utils/haptics';
import { isGoProBleName } from '../device/GoProDeviceFilter';
import {
  deleteKnownDevice,
  getKnownDevices,
  updateKnownDeviceSortOrder,
  upsertKnownDeviceConnected,
} from '../device/KnownDeviceRepository';
import type { KnownDevice } from '../types/KnownDevice';
import { getThemeColors } from '../constants/Theme';
import { DeviceItem, DeviceListItem } from '../components/DeviceItem';

type ScannedDevice = { id: string; name: string };
type DeviceSection = { title: string; data: DeviceListItem[] };

interface HomeScreenProps {
  navigation: NavigationProp<ParamListBase>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [knownDevices, setKnownDevices] = useState<KnownDevice[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<ScannedDevice[]>([]);
  const [pendingConnectionId, setPendingConnectionId] = useState<string | null>(null);
  const hasAutoScannedRef = useRef(false);

  // Zustand States
  const connectionStatus = useGoProStore((state) => state.connectionStatus);
  const deviceConnectionStatuses = useGoProStore((state) => state.deviceConnectionStatuses);
  const bluetoothState = useGoProStore((state) => state.bluetoothState);
  const theme = useGoProStore((state) => state.theme);
  const colors = useMemo(() => getThemeColors(theme), [theme]);

  const connectedCount = useMemo(() => {
    return Object.values(deviceConnectionStatuses).filter((status) => status === 'connected')
      .length;
  }, [deviceConnectionStatuses]);

  const anyRecording = useGoProStore((state) => {
    return Object.keys(state.deviceConnectionStatuses).some((id) => {
      return (
        state.deviceConnectionStatuses[id] === 'connected' && state.cameraStates[id]?.isEncoding
      );
    });
  });

  const showMultiControl = connectedCount >= 2;

  // Dynamic Header Options
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.navButtonRow}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => void startScan()}
            disabled={isScanning || !!pendingConnectionId}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.scan')}
            accessibilityState={{ disabled: isScanning || !!pendingConnectionId, busy: isScanning }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="refresh-outline" size={24} color={colors.accent} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('AppSettings')}
            accessibilityRole="button"
            accessibilityLabel={t('navigation.appSettings')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, isScanning, pendingConnectionId, colors.accent, t]);

  const mergedDevices = useMemo<DeviceListItem[]>(() => {
    const discoveredMap = new Map(discoveredDevices.map((d) => [d.id, d]));

    const knownMapped: DeviceListItem[] = knownDevices.map((k) => ({
      id: k.id,
      name: k.displayName || k.name,
      bleName: k.name,
      device: discoveredMap.get(k.id) ?? null,
      known: true,
      isDiscoveredNow: discoveredMap.has(k.id),
      lastConnectedAt: k.lastConnectedAt,
      modelName: k.modelName,
      firmwareVersion: k.firmwareVersion,
    }));

    const knownIds = new Set(knownDevices.map((k) => k.id));
    const discoveredOnly: DeviceListItem[] = discoveredDevices
      .filter((d) => !knownIds.has(d.id))
      .map((d) => ({
        id: d.id,
        name: d.name || 'Unknown',
        bleName: d.name || 'Unknown',
        device: d,
        known: false,
        isDiscoveredNow: true,
        lastConnectedAt: null,
        modelName: null,
        firmwareVersion: null,
      }));

    return [...knownMapped, ...discoveredOnly];
  }, [knownDevices, discoveredDevices]);

  // Section mapping
  const sections = useMemo<DeviceSection[]>(() => {
    const known = mergedDevices.filter((d) => d.known);
    const nearby = mergedDevices.filter((d) => !d.known);

    const list: DeviceSection[] = [];
    if (known.length > 0) {
      list.push({ title: t('home.myCameras'), data: known });
    }
    if (nearby.length > 0) {
      list.push({ title: t('home.nearbyDevices'), data: nearby });
    }
    return list;
  }, [mergedDevices, t]);

  const loadKnownDevices = async () => {
    try {
      const rows = await getKnownDevices();
      setKnownDevices(rows);
    } catch (e) {
      console.warn('Failed to load known devices', e);
    }
  };

  useEffect(() => {
    loadKnownDevices();
  }, []);

  // Auto-scan once on launch — but only after the Bluetooth adapter reports
  // PoweredOn. If BT is off at launch, the scan fires when the user turns it on.
  useEffect(() => {
    if (hasAutoScannedRef.current) return;
    if (connectionStatus === 'connected') return;
    if (bluetoothState !== 'PoweredOn') return;

    hasAutoScannedRef.current = true;
    void startScan({ silentPermissionFailure: true });
  }, [connectionStatus, bluetoothState]);

  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      setPendingConnectionId(null);
    }
  }, [connectionStatus]);

  const requestPermissions = async ({ prompt = true } = {}): Promise<boolean> => {
    if (Platform.OS === 'android') {
      if (Number(Platform.Version) >= 31) {
        if (!prompt) {
          const hasScan = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          );
          const hasConnect = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          );
          return hasScan && hasConnect;
        }
        const res = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          res[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
          res[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted'
        );
      } else {
        if (!prompt) {
          return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        }
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return res === 'granted';
      }
    }
    return true;
  };

  const startScan = async ({ silentPermissionFailure = false } = {}) => {
    // A new scan supersedes the old one inside goProBle, but from the UI side
    // re-triggering while already scanning (pull-to-refresh + header button,
    // or the iOS pull threshold + RefreshControl both firing) is a no-op.
    if (goProBle.isScanActive || pendingConnectionId) return;

    const permission = await requestPermissions({ prompt: !silentPermissionFailure });
    if (!permission) {
      if (!silentPermissionFailure) {
        Alert.alert(t('alert.permissionRequired'), t('alert.permissionRequiredDesc'));
      }
      return;
    }

    setDiscoveredDevices([]);

    const started = await goProBle.startScan({
      timeoutMs: 10000,
      onDevice: (device: Device) => {
        const deviceName = device?.name ?? device?.localName;
        if (deviceName && isGoProBleName(deviceName)) {
          setDiscoveredDevices((prev) => {
            if (!prev.find((d) => d.id === device.id))
              return [...prev, { ...device, name: deviceName }];
            return prev;
          });
        }
      },
      onStop: () => {
        setIsScanning(false);
        loadKnownDevices();
      },
    });

    // false = Bluetooth off/unauthorized; the banner driven by bluetoothState
    // explains the situation, so no extra alert here.
    setIsScanning(started);
  };

  const openBluetoothSettings = () => {
    if (Platform.OS === 'android' && bluetoothState === 'PoweredOff') {
      Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS').catch(() => Linking.openSettings());
    } else {
      Linking.openSettings();
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isScanning || pendingConnectionId) return;
    const { contentOffset, contentInset } = event.nativeEvent;
    const topInset = contentInset?.top ?? 0;
    const pullDistance = -topInset - contentOffset.y;
    if (pullDistance > 65) {
      void startScan();
    }
  };

  const connectDevice = async (item: DeviceListItem, nav: NavigationProp<ParamListBase>) => {
    const autoNavigate = useGoProStore.getState().autoNavigateToControl;
    if (deviceConnectionStatuses[item.id] === 'connected') {
      useGoProStore.getState().setActiveDevice(item.id);
      if (autoNavigate) {
        nav.navigate('Control');
      }
      return;
    }

    if (pendingConnectionId) return;

    goProBle.stopScan(); // onStop resets isScanning and refreshes the known list
    setPendingConnectionId(item.id);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const connected = await goProBle.connectToDevice({
        id: item.id,
        name: item.name,
      });
      if (connected) {
        haptics.success();
        if (autoNavigate) {
          nav.navigate('Control');
        }
        void (async () => {
          const hwInfo = useGoProStore.getState().cameraStates[connected.id]?.hardwareInfo;
          await upsertKnownDeviceConnected({
            id: connected.id,
            name: connected.name || item.name || 'GoPro',
            displayName: hwInfo?.ssid || undefined,
            modelName: hwInfo?.modelName || undefined,
            firmwareVersion: hwInfo?.firmwareVersion || undefined,
            serialNumber: hwInfo?.serialNumber || undefined,
            macAddress: hwInfo?.macAddress || undefined,
          });
          await loadKnownDevices();
        })();
      } else {
        haptics.error();
      }
    } finally {
      setPendingConnectionId(null);
    }
  };

  const cancelConnectDevice = async (itemId: string) => {
    await goProBle.cancelPendingConnection(itemId);
    setPendingConnectionId(null);
  };

  const handleDeleteDevice = (item: DeviceListItem) => {
    if (deviceConnectionStatuses[item.id] === 'connected') {
      Alert.alert(t('alert.cannotDelete'), t('alert.cannotDeleteDesc'));
      return;
    }
    Alert.alert(t('alert.deleteDevice'), t('alert.deleteDeviceDesc', { name: item.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteKnownDevice(item.id);
          await loadKnownDevices();
        },
      },
    ]);
  };

  const handleMoveDevice = async (item: DeviceListItem, direction: 'up' | 'down') => {
    const knownList = mergedDevices.filter((d) => d.known);
    const index = knownList.findIndex((d) => d.id === item.id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= knownList.length) return;

    const newList = [...knownList];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    try {
      await Promise.all(newList.map((device, i) => updateKnownDeviceSortOrder(device.id, i)));
      await loadKnownDevices();
    } catch (e) {
      console.warn('Failed to reorder devices', e);
    }
  };

  const renderSectionHeader = ({ section: { title } }: { section: DeviceSection }) => (
    <View style={[styles.sectionHeaderContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionHeaderTitle, { color: colors.textMuted }]}>
        {title.toUpperCase()}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="bluetooth-outline"
        size={64}
        color={colors.textMuted}
        style={{ marginBottom: 16 }}
      />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        {t('home.noCamerasFound')}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
        {t('home.noCamerasFoundDesc')}
      </Text>
    </View>
  );

  const bluetoothUnavailable = bluetoothState === 'PoweredOff' || bluetoothState === 'Unauthorized';

  return (
    <View style={[styles.homeContainer, { backgroundColor: colors.background }]}>
      {bluetoothUnavailable && (
        <View style={styles.btBanner}>
          <Ionicons
            name="bluetooth-outline"
            size={22}
            color={colors.danger}
            style={{ marginRight: 10 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.btBannerTitle, { color: colors.textPrimary }]}>
              {bluetoothState === 'PoweredOff'
                ? t('home.bluetoothOff')
                : t('home.bluetoothUnauthorized')}
            </Text>
            <Text style={[styles.btBannerDesc, { color: colors.textMuted }]}>
              {bluetoothState === 'PoweredOff'
                ? t('home.bluetoothOffDesc')
                : t('home.bluetoothUnauthorizedDesc')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.btBannerButton}
            onPress={openBluetoothSettings}
            activeOpacity={0.7}
          >
            <Text style={[styles.btBannerButtonText, { color: colors.accent }]}>
              {t('home.openSettings')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isScanning && (
        <View style={[styles.scanningIndicatorBar, { backgroundColor: colors.surfaceSecondary }]}>
          <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />
          <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '500' }}>
            {t('home.scanning')}
          </Text>
        </View>
      )}

      <SectionList<DeviceListItem, DeviceSection>
        style={styles.list}
        contentContainerStyle={[
          sections.length === 0 ? { flexGrow: 1 } : undefined,
          showMultiControl && { paddingBottom: 140 },
        ]}
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isScanning}
            onRefresh={() => void startScan()}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        onScroll={Platform.OS === 'ios' ? handleScroll : undefined}
        scrollEventThrottle={16}
        alwaysBounceVertical={true}
        ListEmptyComponent={renderEmptyState}
        renderSectionHeader={renderSectionHeader}
        renderItem={({ item, index, section }) => {
          const isPending = pendingConnectionId === item.id;
          const disableRow = !!pendingConnectionId && !isPending;

          const isMyCameras = section.title === t('home.myCameras');
          const totalInSection = section.data.length;
          const onMoveUp =
            isMyCameras && index > 0 ? () => void handleMoveDevice(item, 'up') : undefined;
          const onMoveDown =
            isMyCameras && index < totalInSection - 1
              ? () => void handleMoveDevice(item, 'down')
              : undefined;

          return (
            <DeviceItem
              item={item}
              isPending={isPending}
              disableRow={disableRow}
              colors={colors}
              navigation={navigation}
              connectDevice={connectDevice}
              cancelConnectDevice={cancelConnectDevice}
              handleDeleteDevice={handleDeleteDevice}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
            />
          );
        }}
      />

      {showMultiControl && (
        <View
          style={[
            styles.multiControlPanel,
            {
              backgroundColor:
                theme === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              borderTopColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.multiControlTitle, { color: colors.textPrimary }]}>
            {t('home.multiControl', { count: connectedCount })}
          </Text>
          <View style={styles.multiControlButtons}>
            <TouchableOpacity
              style={[styles.multiControlBtn, { backgroundColor: 'rgba(255,59,48,0.1)' }]}
              onPress={() => {
                haptics.warning();
                void goProBle.powerOffAllConnectedCameras();
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('home.powerOffAll')}
            >
              <MaterialIcons name="power-settings-new" size={18} color={colors.danger} />
              <Text style={[styles.multiControlBtnText, { color: colors.danger }]}>
                {t('home.powerOffAll')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.multiControlBtn,
                anyRecording
                  ? { backgroundColor: colors.recording }
                  : { backgroundColor: colors.accent },
              ]}
              onPress={() => {
                haptics.impact();
                void goProBle.toggleShutterAll(!anyRecording);
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={
                anyRecording ? t('home.stopRecordingAll') : t('home.startRecordingAll')
              }
            >
              <Ionicons
                name={anyRecording ? 'stop' : 'radio-button-on-outline'}
                size={18}
                color="#ffffff"
              />
              <Text style={[styles.multiControlBtnText, { color: '#ffffff' }]}>
                {anyRecording ? t('home.stopRecordingAll') : t('home.startRecordingAll')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <StatusBar style={colors.statusBarStyle} />
    </View>
  );
};

const styles = StyleSheet.create({
  homeContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  list: { flex: 1, width: '100%' },

  // Section Headers
  sectionHeaderContainer: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 14,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },

  // Bluetooth unavailable banner
  btBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  btBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  btBannerDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  btBannerButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginLeft: 6,
  },
  btBannerButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Scanning Indicator
  scanningIndicatorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    marginVertical: 4,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  navButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.OS === 'ios' ? 12 : 16,
  },
  navButton: { padding: 4 },

  multiControlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  multiControlTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  multiControlButtons: {
    flexDirection: 'row',
    gap: 14,
  },
  multiControlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  multiControlBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

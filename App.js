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

import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  AppState,
  InteractionManager,
} from 'react-native';
import { useEffect, useMemo, useRef } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  NavigationContainer,
  createNavigationContainerRef,
  DefaultTheme,
  DarkTheme,
  useFocusEffect,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useGoProStore, useActiveCameraState } from './src/store/GoProStore';
import { initSettingVisibilityTable } from './src/device/SettingVisibilityRepository';
import { initCustomPresetTable } from './src/device/CustomPresetRepository';
import { initAppSettingsTable, getAppSetting } from './src/device/AppSettingsRepository';
import { initKnownDeviceTable } from './src/device/KnownDeviceRepository';
import { setAppLocale } from './src/i18n';
import { goProBle } from './src/ble/GoProBLEManager';
import { SettingsPanel } from './src/components/SettingsPanel';
import { CameraStatusBar } from './src/components/CameraStatusBar';
import { Toast } from './src/components/Toast';
import { UserHoldingCameraOverlay } from './src/components/UserHoldingCameraOverlay';
import { HomeScreen } from './src/screens/HomeScreen';
import { CustomPresetsScreen } from './src/screens/CustomPresetsScreen';
import { AppSettingsScreen } from './src/screens/AppSettingsScreen';
import { CameraSettingsScreen } from './src/screens/CameraSettingsScreen';
import { OssLicensesScreen } from './src/screens/OssLicensesScreen';
import { getThemeColors } from './src/constants/Theme';
import { initIAP, loadLocalPurchases, endIAP } from './src/iap/IAPManager';
import { IAP_PRODUCT_IDS } from './src/iap/IAPProducts';
import { haptics } from './src/utils/haptics';
import {
  initNotifications,
  requestNotificationPermission,
} from './src/notifications/notifications';
import { initStatusNotifications } from './src/notifications/statusController';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();
const navHitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

export default function App() {
  const { t } = useTranslation();
  // Zustand States
  const connectionStatus = useGoProStore((state) => state.connectionStatus);
  const theme = useGoProStore((state) => state.theme);
  const colors = useMemo(() => getThemeColors(theme), [theme]);

  const navTheme = useMemo(
    () => ({
      dark: theme === 'dark',
      colors: {
        ...(theme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
        background: colors.background,
        card: colors.headerBackground,
        text: colors.headerText,
        border: colors.border,
        primary: colors.accent,
      },
      fonts: DefaultTheme.fonts,
    }),
    [theme, colors],
  );

  // Initialize databases on app mount
  useEffect(() => {
    initKnownDeviceTable().catch(console.error);
    initSettingVisibilityTable().catch(console.error);
    initCustomPresetTable().catch(console.error);
    initAppSettingsTable()
      .then(async () => {
        const [
          savedColumns,
          savedTheme,
          savedAppLanguage,
          savedBypassCapabilityCache,
          savedDebugLogBle,
          savedDebugLogBleCache,
          savedDebugLogBlePreset,
          savedDebugLogBleAsync,
          savedDebugLogBleQueue,
          savedDebugLogWifi,
          savedDebugLogIap,
          savedAutoNavigateToControl,
        ] = await Promise.all([
          getAppSetting('columnCount'),
          getAppSetting('theme'),
          getAppSetting('appLanguage'),
          getAppSetting('bypassCapabilityCache'),
          getAppSetting('debugLogBle'),
          getAppSetting('debugLogBleCache'),
          getAppSetting('debugLogBlePreset'),
          getAppSetting('debugLogBleAsync'),
          getAppSetting('debugLogBleQueue'),
          getAppSetting('debugLogWifi'),
          getAppSetting('debugLogIap'),
          getAppSetting('autoNavigateToControl'),
        ]);
        if (savedColumns) {
          const n = parseInt(savedColumns, 10);
          if (n >= 1 && n <= 7) useGoProStore.getState().setColumnCount(n);
        }
        if (savedTheme === 'light' || savedTheme === 'dark') {
          useGoProStore.getState().setTheme(savedTheme);
        }
        const validLocales = [
          'auto',
          'ja',
          'en',
          'es',
          'fr',
          'de',
          'it',
          'pt',
          'ko',
          'zh',
          'zh-TW',
        ];
        if (savedAppLanguage && validLocales.includes(savedAppLanguage)) {
          useGoProStore.getState().setAppLanguage(savedAppLanguage);
          setAppLocale(savedAppLanguage);
        }
        if (savedBypassCapabilityCache === 'true' || savedBypassCapabilityCache === 'false') {
          useGoProStore.getState().setBypassCapabilityCache(savedBypassCapabilityCache === 'true');
        }
        if (savedDebugLogBle === 'true' || savedDebugLogBle === 'false') {
          useGoProStore.getState().setDebugLogBle(savedDebugLogBle === 'true');
        }
        if (savedDebugLogBleCache === 'true' || savedDebugLogBleCache === 'false') {
          useGoProStore.getState().setDebugLogBleCache(savedDebugLogBleCache === 'true');
        }
        if (savedDebugLogBlePreset === 'true' || savedDebugLogBlePreset === 'false') {
          useGoProStore.getState().setDebugLogBlePreset(savedDebugLogBlePreset === 'true');
        }
        if (savedDebugLogBleAsync === 'true' || savedDebugLogBleAsync === 'false') {
          useGoProStore.getState().setDebugLogBleAsync(savedDebugLogBleAsync === 'true');
        }
        if (savedDebugLogBleQueue === 'true' || savedDebugLogBleQueue === 'false') {
          useGoProStore.getState().setDebugLogBleQueue(savedDebugLogBleQueue === 'true');
        }
        if (savedDebugLogWifi === 'true' || savedDebugLogWifi === 'false') {
          useGoProStore.getState().setDebugLogWifi(savedDebugLogWifi === 'true');
        }
        if (savedDebugLogIap === 'true' || savedDebugLogIap === 'false') {
          useGoProStore.getState().setDebugLogIap(savedDebugLogIap === 'true');
        }
        if (savedAutoNavigateToControl === 'true' || savedAutoNavigateToControl === 'false') {
          useGoProStore.getState().setAutoNavigateToControl(savedAutoNavigateToControl === 'true');
        }
      })
      .catch(console.error);

    // IAP initialization: load local purchases first, then connect to store
    // DEV mode: treat all billing items as purchased (for debugging on physical devices)
    if (__DEV__) {
      useGoProStore.getState().setPurchasedProducts([...IAP_PRODUCT_IDS]);
    } else {
      loadLocalPurchases()
        .then((products) => {
          if (products.length > 0) {
            useGoProStore.getState().setPurchasedProducts(products);
          }
          return initIAP((productId) => {
            useGoProStore.getState().addPurchasedProduct(productId);
          });
        })
        .catch(console.error);
    }

    return () => {
      goProBle.stopScan();
      goProBle.disconnect();
      endIAP();
    };
  }, []);

  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      if (navigationRef.isReady()) {
        const current = navigationRef.getCurrentRoute()?.name;
        // If screens requiring connection (e.g., Control, CustomPresets) are still active,
        // fully reset the navigation stack back to Home.
        // (A simple navigate('Home') would keep Control in the back stack, allowing users to return to it)
        // AppSettings / OssLicenses don't require a connection, so leave them alone.
        if (
          current &&
          current !== 'Home' &&
          current !== 'AppSettings' &&
          current !== 'OssLicenses'
        ) {
          navigationRef.reset({ index: 0, routes: [{ name: 'Home' }] });
        }
      }
      // Phase 2: Reset the camera model after the navigation transition is complete.
      // If reset in the same frame as beginDisconnect(), the re-render of CameraSettingsScreen
      // and the navigation transition conflict on Fabric, causing an addViewAt crash.
      // Therefore, we defer this using InteractionManager.
      InteractionManager.runAfterInteractions(() => {
        useGoProStore.getState().clearConnectedCameraState();
      });
    }
  }, [connectionStatus]);

  // Verify if the BLE connection is actually alive when the app returns to the foreground.
  // If GoPro is disconnected or powered off while iOS is asleep, onDeviceDisconnected
  // might not trigger, leaving the screen active. We check explicitly here.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && useGoProStore.getState().connectionStatus === 'connected') {
        void goProBle.checkConnectionHealth();
      }
    });
    return () => sub.remove();
  }, []);

  // Set up notification channels and ask for permission once on launch.
  // Used for the unexpected-disconnect warning and the connection foreground service.
  useEffect(() => {
    initNotifications()
      .then(() => requestNotificationPermission())
      .catch(() => {});
    // Drive the status notification (Android live update / iOS recording) from store changes.
    const stopStatus = initStatusNotifications();
    return () => stopStatus();
  }, []);

  const handlePowerOff = () => {
    haptics.warning();
    void goProBle.powerOffCameraSafely();
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: t('navigation.appTitle'),
          }}
        />
        <Stack.Screen
          name="Control"
          component={ControlScreen}
          options={({ navigation }) => ({
            title: t('navigation.home'),
            headerRight: () => (
              <View style={styles.navButtonRow}>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => useGoProStore.getState().setShowPreviewModal(true)}
                  accessibilityRole="button"
                  accessibilityLabel={t('preview.title')}
                  hitSlop={navHitSlop}
                >
                  <MaterialIcons name="live-tv" size={24} color={colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigation.navigate('CustomPresets')}
                  accessibilityRole="button"
                  accessibilityLabel={t('navigation.customPresets')}
                  hitSlop={navHitSlop}
                >
                  <MaterialIcons name="playlist-play" size={26} color={colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => useGoProStore.getState().setShowVisibilityModal(true)}
                  accessibilityRole="button"
                  accessibilityLabel={t('control.visibleAdvancedItems')}
                  hitSlop={navHitSlop}
                >
                  <MaterialIcons name="visibility" size={24} color={colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigation.navigate('CameraSettings')}
                  accessibilityRole="button"
                  accessibilityLabel={t('navigation.cameraSettings')}
                  hitSlop={navHitSlop}
                >
                  <MaterialIcons name="tune" size={24} color={colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={handlePowerOff}
                  accessibilityRole="button"
                  accessibilityLabel={t('a11y.powerOff')}
                  hitSlop={navHitSlop}
                >
                  <MaterialIcons name="power-settings-new" size={24} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ),
          })}
        />
        <Stack.Screen
          name="CustomPresets"
          component={CustomPresetsScreen}
          options={{ title: t('navigation.customPresets') }}
        />
        <Stack.Screen
          name="AppSettings"
          component={AppSettingsScreen}
          options={{ title: t('navigation.appSettings') }}
        />
        <Stack.Screen
          name="CameraSettings"
          component={CameraSettingsScreen}
          options={{ title: t('navigation.cameraSettings') }}
        />
        <Stack.Screen
          name="OssLicenses"
          component={OssLicensesScreen}
          options={{ title: t('navigation.ossLicenses') }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const ControlScreen = () => {
  const theme = useGoProStore((state) => state.theme);
  const colors = useMemo(() => getThemeColors(theme), [theme]);
  const cameraControlStatus = useActiveCameraState((cs) => cs.cameraControlStatus);

  // Claim external control when ControlScreen is focused, release it when blurred.
  // Automatically reclaim when transitioning back from camera operation (114=camera) to idle.
  useFocusEffect(
    React.useCallback(() => {
      goProBle.claimControl().catch(() => {});
      return () => {
        goProBle.releaseControl().catch(() => {});
      };
    }, []),
  );

  const prevStatus = useRef(cameraControlStatus);
  useEffect(() => {
    // camera → idle の遷移で再claim
    if (prevStatus.current === 'camera' && cameraControlStatus === 'idle') {
      goProBle.claimControl().catch(() => {});
    }
    prevStatus.current = cameraControlStatus;
  }, [cameraControlStatus]);

  return (
    <View style={[styles.controlContainer, { backgroundColor: colors.background }]}>
      <CameraStatusBar />
      <SettingsPanel />
      <UserHoldingCameraOverlay />
      <Toast />
      <StatusBar style={colors.statusBarStyle} />
    </View>
  );
};

const styles = StyleSheet.create({
  controlContainer: { flex: 1, paddingHorizontal: 8, paddingTop: 4 },
  navButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.OS === 'ios' ? 12 : 16,
  },
  navButton: { padding: 4 },
});

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

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
  Switch,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { useGoProStore } from '../store/GoProStore';
import { setAppSetting } from '../device/AppSettingsRepository';
import { clearAllPresetMetaCaches } from '../device/PresetMetaCacheRepository';
import { getThemeColors, AppTheme } from '../constants/Theme';
import { restorePurchases } from '../iap/IAPManager';
import { getProductDisplayName, IAPProductId, IAP_PRODUCT_IDS } from '../iap/IAPProducts';
import { goProBle } from '../ble/GoProBLEManager';
import { setAppLocale } from '../i18n';
import type { AppLocale } from '../i18n';
import { Ionicons } from '@expo/vector-icons';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../constants/AppLinks';
import appConfig from '../../app.json';

const getMaxColumns = (width: number): number => {
  if (width >= 1024) return 7;
  if (width >= 600) return 5;
  return 3;
};

/**
 * Language picker options. 'auto' follows the device language; the rest use
 * their i18n label keys (endonyms, so each language reads in its own script).
 */
const LANGUAGE_OPTIONS: { key: AppLocale; labelKey: string }[] = [
  { key: 'auto', labelKey: 'settings.languageAuto' },
  { key: 'en', labelKey: 'settings.languageEn' },
  { key: 'ja', labelKey: 'settings.languageJa' },
  { key: 'es', labelKey: 'settings.languageEs' },
  { key: 'fr', labelKey: 'settings.languageFr' },
  { key: 'de', labelKey: 'settings.languageDe' },
  { key: 'it', labelKey: 'settings.languageIt' },
  { key: 'pt', labelKey: 'settings.languagePt' },
  { key: 'ko', labelKey: 'settings.languageKo' },
  { key: 'zh', labelKey: 'settings.languageZh' },
  { key: 'zh-TW', labelKey: 'settings.languageZhTW' },
];

export const AppSettingsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const columnCount = useGoProStore((state) => state.columnCount);
  const theme = useGoProStore((state) => state.theme);
  const appLanguage = useGoProStore((state) => state.appLanguage);
  const purchasedProducts = useGoProStore((state) => state.purchasedProducts);
  const bypassCapabilityCache = useGoProStore((state) => state.bypassCapabilityCache);
  const debugLogBle = useGoProStore((state) => state.debugLogBle);
  const debugLogBleCache = useGoProStore((state) => state.debugLogBleCache);
  const debugLogBlePreset = useGoProStore((state) => state.debugLogBlePreset);
  const debugLogBleAsync = useGoProStore((state) => state.debugLogBleAsync);
  const debugLogBleQueue = useGoProStore((state) => state.debugLogBleQueue);
  const debugLogWifi = useGoProStore((state) => state.debugLogWifi);
  const debugLogIap = useGoProStore((state) => state.debugLogIap);
  const autoNavigateToControl = useGoProStore((state) => state.autoNavigateToControl);
  const deviceConnectionStatuses = useGoProStore((state) => state.deviceConnectionStatuses);
  const setColumnCount = useGoProStore((state) => state.setColumnCount);
  const setAutoNavigateToControl = useGoProStore((state) => state.setAutoNavigateToControl);
  const setTheme = useGoProStore((state) => state.setTheme);
  const setAppLanguage = useGoProStore((state) => state.setAppLanguage);
  const setBypassCapabilityCache = useGoProStore((state) => state.setBypassCapabilityCache);
  const setDebugLogBle = useGoProStore((state) => state.setDebugLogBle);
  const setDebugLogBleCache = useGoProStore((state) => state.setDebugLogBleCache);
  const setDebugLogBlePreset = useGoProStore((state) => state.setDebugLogBlePreset);
  const setDebugLogBleAsync = useGoProStore((state) => state.setDebugLogBleAsync);
  const setDebugLogBleQueue = useGoProStore((state) => state.setDebugLogBleQueue);
  const setDebugLogWifi = useGoProStore((state) => state.setDebugLogWifi);
  const setDebugLogIap = useGoProStore((state) => state.setDebugLogIap);
  const { width } = useWindowDimensions();
  const maxColumns = getMaxColumns(width);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isClearingCapabilityCache, setIsClearingCapabilityCache] = useState(false);
  const [isClearingPresetMetaCache, setIsClearingPresetMetaCache] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const colors = useMemo(() => getThemeColors(theme), [theme]);

  const hasConnectedDevice = useMemo(() => {
    return Object.values(deviceConnectionStatuses).some((status) => status === 'connected');
  }, [deviceConnectionStatuses]);

  const currentLangLabel = useMemo(() => {
    const option = LANGUAGE_OPTIONS.find((o) => o.key === appLanguage);
    return option ? t(option.labelKey) : appLanguage;
  }, [appLanguage, t]);

  const handleAutoNavigateChange = async (value: boolean) => {
    setAutoNavigateToControl(value);
    await setAppSetting('autoNavigateToControl', String(value));
  };

  const handleColumnChange = async (count: number) => {
    setColumnCount(count);
    await setAppSetting('columnCount', String(count));
  };

  const handleThemeChange = async (newTheme: AppTheme) => {
    setTheme(newTheme);
    await setAppSetting('theme', newTheme);
  };

  const handleLanguageChange = async (newLang: AppLocale) => {
    setAppLanguage(newLang);
    setAppLocale(newLang);
    await setAppSetting('appLanguage', newLang);
  };

  const handleBypassCapabilityCacheChange = async (value: boolean) => {
    setBypassCapabilityCache(value);
    await setAppSetting('bypassCapabilityCache', String(value));
  };

  const handleDebugLogBleChange = async (value: boolean) => {
    setDebugLogBle(value);
    await setAppSetting('debugLogBle', String(value));
  };

  const handleDebugLogBleCacheChange = async (value: boolean) => {
    setDebugLogBleCache(value);
    await setAppSetting('debugLogBleCache', String(value));
  };

  const handleDebugLogBlePresetChange = async (value: boolean) => {
    setDebugLogBlePreset(value);
    await setAppSetting('debugLogBlePreset', String(value));
  };

  const handleDebugLogBleAsyncChange = async (value: boolean) => {
    setDebugLogBleAsync(value);
    await setAppSetting('debugLogBleAsync', String(value));
  };

  const handleDebugLogBleQueueChange = async (value: boolean) => {
    setDebugLogBleQueue(value);
    await setAppSetting('debugLogBleQueue', String(value));
  };

  const handleDebugLogWifiChange = async (value: boolean) => {
    setDebugLogWifi(value);
    await setAppSetting('debugLogWifi', String(value));
  };

  const handleDebugLogIapChange = async (value: boolean) => {
    setDebugLogIap(value);
    await setAppSetting('debugLogIap', String(value));
  };

  const handleClearAllCapabilityCaches = () => {
    Alert.alert(t('alert.clearCapabilityCache'), t('alert.clearCapabilityCacheDesc'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: () => {
          setIsClearingCapabilityCache(true);
          void goProBle
            .clearAllCapabilityCaches()
            .then(() => {
              Alert.alert(t('alert.capabilityCacheCleared'), t('alert.capabilityCacheClearedDesc'));
            })
            .catch((error) => {
              console.warn('[AppSettings] Failed to clear capability cache', error);
              Alert.alert(t('alert.clearFailed'), t('alert.clearFailedDesc'));
            })
            .finally(() => {
              setIsClearingCapabilityCache(false);
            });
        },
      },
    ]);
  };

  const handleClearAllPresetMetaCaches = () => {
    Alert.alert(t('alert.clearPresetCache'), t('alert.clearPresetCacheDesc'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: () => {
          setIsClearingPresetMetaCache(true);
          void clearAllPresetMetaCaches()
            .then(async () => {
              if (goProBle.isConnected) {
                try {
                  await goProBle.fetchPresetStatus();
                } catch (error) {
                  console.warn(
                    '[AppSettings] Failed to refresh live preset status after preset cache clear',
                    error,
                  );
                }
              }
              Alert.alert(
                t('alert.presetCacheCleared'),
                goProBle.isConnected
                  ? t('alert.presetCacheClearedConnected')
                  : t('alert.presetCacheClearedDisconnected'),
              );
            })
            .catch((error) => {
              console.warn('[AppSettings] Failed to clear preset cache', error);
              Alert.alert(t('alert.clearFailed'), t('alert.clearFailedDesc'));
            })
            .finally(() => {
              setIsClearingPresetMetaCache(false);
            });
        },
      },
    ]);
  };

  const openExternalLink = (url: string) => {
    // Failure here means no browser can handle the URL — nothing useful to do
    void Linking.openURL(url).catch(() => {});
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored.length > 0) {
        Alert.alert(t('alert.restored'), t('alert.restoredDesc', { count: restored.length }));
      } else {
        Alert.alert(t('alert.noPurchasesFound'), t('alert.noPurchasesFoundDesc'));
      }
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <ScrollView
      style={[dynStyles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={dynStyles.content}
    >
      {/* Column Count */}
      <View
        style={[dynStyles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[dynStyles.sectionTitle, { color: colors.textPrimary }]}>
          {t('settings.displayColumns')}
        </Text>
        <Text style={[dynStyles.description, { color: colors.textMuted }]}>
          {t('settings.displayColumnsDesc', { max: maxColumns })}
        </Text>
        <View style={dynStyles.optionRow}>
          {Array.from({ length: maxColumns }, (_, i) => i + 1).map((n) => (
            <TouchableOpacity
              key={n}
              style={[
                dynStyles.optionButton,
                { borderColor: colors.toggleBorder, backgroundColor: colors.toggleBg },
                columnCount === n && {
                  backgroundColor: colors.toggleSelectedBg,
                  borderColor: colors.toggleSelectedBg,
                },
              ]}
              onPress={() => handleColumnChange(n)}
            >
              <Text
                style={[
                  dynStyles.optionText,
                  { color: colors.textSecondary },
                  columnCount === n && { color: colors.toggleSelectedText, fontWeight: 'bold' },
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Language */}
      <View
        style={[dynStyles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[dynStyles.sectionTitle, { color: colors.textPrimary }]}>
          {t('settings.language')}
        </Text>
        <TouchableOpacity
          style={[
            dynStyles.dropdownTrigger,
            { borderColor: colors.toggleBorder, backgroundColor: colors.toggleBg },
          ]}
          onPress={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
        >
          <Text style={[dynStyles.dropdownTriggerText, { color: colors.textPrimary }]}>
            {currentLangLabel}
          </Text>
          <Ionicons
            name={isLanguageDropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {isLanguageDropdownOpen && (
          <View
            style={[
              dynStyles.dropdownMenu,
              { borderColor: colors.toggleBorder, backgroundColor: colors.surface },
            ]}
          >
            {LANGUAGE_OPTIONS.map(({ key, labelKey }, index, arr) => (
              <TouchableOpacity
                key={key}
                style={[
                  dynStyles.dropdownItem,
                  {
                    borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  },
                  appLanguage === key && { backgroundColor: colors.toggleSelectedBg },
                ]}
                onPress={() => {
                  handleLanguageChange(key);
                  setIsLanguageDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    dynStyles.dropdownItemText,
                    { color: colors.textSecondary },
                    appLanguage === key && { color: colors.toggleSelectedText, fontWeight: 'bold' },
                  ]}
                >
                  {t(labelKey)}
                </Text>
                {appLanguage === key && (
                  <Ionicons name="checkmark" size={18} color={colors.toggleSelectedText} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Theme */}
      <View
        style={[dynStyles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[dynStyles.sectionTitle, { color: colors.textPrimary }]}>
          {t('settings.theme')}
        </Text>
        <View style={dynStyles.optionRow}>
          {[
            { key: 'light' as const, label: t('settings.light') },
            { key: 'dark' as const, label: t('settings.dark') },
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                dynStyles.themeButton,
                { borderColor: colors.toggleBorder, backgroundColor: colors.toggleBg },
                theme === key && {
                  backgroundColor: colors.toggleSelectedBg,
                  borderColor: colors.toggleSelectedBg,
                },
              ]}
              onPress={() => handleThemeChange(key)}
            >
              <Text
                style={[
                  dynStyles.themeText,
                  { color: colors.textSecondary },
                  theme === key && { color: colors.toggleSelectedText, fontWeight: 'bold' },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Connection Mode */}
      <View
        style={[dynStyles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[dynStyles.sectionTitle, { color: colors.textPrimary }]}>
          {t('settings.connectionMode')}
        </Text>
        <Text style={[dynStyles.description, { color: colors.textMuted }]}>
          {t('settings.connectionModeDesc')}
        </Text>
        <View style={[dynStyles.settingItem, { borderBottomWidth: 0, paddingVertical: 0 }]}>
          <View style={dynStyles.settingTextBlock}>
            <Text style={[dynStyles.settingTitle, { color: colors.textPrimary }]}>
              {t('settings.autoNavigate')}
            </Text>
            <Text style={[dynStyles.settingCaption, { color: colors.textMuted }]}>
              {t('settings.autoNavigateDesc')}
            </Text>
          </View>
          <Switch
            value={autoNavigateToControl}
            onValueChange={handleAutoNavigateChange}
            disabled={hasConnectedDevice}
            trackColor={{ false: colors.toggleBorder, true: colors.toggleSelectedBg }}
            thumbColor={colors.toggleSelectedText}
          />
        </View>
        {hasConnectedDevice && (
          <Text style={{ color: '#ff3b30', fontSize: 12, marginTop: 8 }}>
            {t('settings.cannotChangeWhileConnected')}
          </Text>
        )}
      </View>

      {/* Purchases */}
      <View
        style={[dynStyles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[dynStyles.sectionTitle, { color: colors.textPrimary }]}>
          {t('settings.purchases')}
        </Text>

        {purchasedProducts.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            {purchasedProducts.map((pid) => (
              <View
                key={pid}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}
              >
                <Text style={{ fontSize: 16, marginRight: 8 }}>✅</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  {IAP_PRODUCT_IDS.includes(pid as IAPProductId)
                    ? getProductDisplayName(pid as IAPProductId)
                    : pid}
                </Text>
              </View>
            ))}
          </View>
        )}

        {purchasedProducts.length === 0 && (
          <Text style={[dynStyles.description, { color: colors.textMuted }]}>
            {t('settings.noPurchases')}
          </Text>
        )}

        <TouchableOpacity
          style={[
            dynStyles.themeButton,
            { borderColor: colors.toggleBorder, backgroundColor: colors.toggleBg },
          ]}
          onPress={handleRestore}
          disabled={isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={[dynStyles.themeText, { color: colors.accent }]}>
              {t('settings.restorePurchases')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* About */}
      <View
        style={[dynStyles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[dynStyles.sectionTitle, { color: colors.textPrimary }]}>
          {t('settings.about')}
        </Text>

        <View style={[dynStyles.settingItem, { borderBottomColor: colors.border }]}>
          <Text style={[dynStyles.settingTitle, { color: colors.textPrimary }]}>
            {t('settings.version')}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            {appConfig.expo.version}
          </Text>
        </View>

        <TouchableOpacity
          style={[dynStyles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => openExternalLink(PRIVACY_POLICY_URL)}
          activeOpacity={0.7}
        >
          <Text style={[dynStyles.settingTitle, { color: colors.accent }]}>
            {t('settings.privacyPolicy')}
          </Text>
          <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[dynStyles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => openExternalLink(TERMS_OF_USE_URL)}
          activeOpacity={0.7}
        >
          <Text style={[dynStyles.settingTitle, { color: colors.accent }]}>
            {t('settings.termsOfUse')}
          </Text>
          <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[dynStyles.settingItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('OssLicenses')}
          activeOpacity={0.7}
        >
          <Text style={[dynStyles.settingTitle, { color: colors.accent }]}>
            {t('settings.ossLicenses')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={[dynStyles.settingCaption, { color: colors.textMuted, marginTop: 12 }]}>
          {t('settings.goproTrademark')}
        </Text>
      </View>

      {__DEV__ && (
        <View
          style={[
            dynStyles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[dynStyles.sectionTitle, { color: colors.textPrimary }]}>
            {t('settings.debug')}
          </Text>
          <Text style={[dynStyles.description, { color: colors.textMuted }]}>
            {t('settings.debugDesc')}
          </Text>

          <View style={[dynStyles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={dynStyles.settingTextBlock}>
              <Text style={[dynStyles.settingTitle, { color: colors.textPrimary }]}>
                {t('settings.alwaysFetchCapability')}
              </Text>
              <Text style={[dynStyles.settingCaption, { color: colors.textMuted }]}>
                {t('settings.alwaysFetchCapabilityDesc')}
              </Text>
            </View>
            <Switch
              value={bypassCapabilityCache}
              onValueChange={handleBypassCapabilityCacheChange}
              trackColor={{ false: colors.toggleBorder, true: colors.toggleSelectedBg }}
              thumbColor={colors.toggleSelectedText}
            />
          </View>

          <View style={[dynStyles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={dynStyles.settingTextBlock}>
              <Text style={[dynStyles.settingTitle, { color: colors.textPrimary }]}>
                {t('settings.bleLogs')}
              </Text>
              <Text style={[dynStyles.settingCaption, { color: colors.textMuted }]}>
                {t('settings.bleLogsDesc')}
              </Text>
            </View>
            <Switch
              value={debugLogBle}
              onValueChange={handleDebugLogBleChange}
              trackColor={{ false: colors.toggleBorder, true: colors.toggleSelectedBg }}
              thumbColor={colors.toggleSelectedText}
            />
          </View>

          <View style={[dynStyles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={dynStyles.settingTextBlock}>
              <Text style={[dynStyles.settingTitle, { color: colors.textPrimary }]}>
                {t('settings.bleCacheLogs')}
              </Text>
              <Text style={[dynStyles.settingCaption, { color: colors.textMuted }]}>
                {t('settings.bleCacheLogsDesc')}
              </Text>
            </View>
            <Switch
              value={debugLogBleCache}
              onValueChange={handleDebugLogBleCacheChange}
              trackColor={{ false: colors.toggleBorder, true: colors.toggleSelectedBg }}
              thumbColor={colors.toggleSelectedText}
            />
          </View>

          <View style={[dynStyles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={dynStyles.settingTextBlock}>
              <Text style={[dynStyles.settingTitle, { color: colors.textPrimary }]}>
                {t('settings.blePresetLogs')}
              </Text>
              <Text style={[dynStyles.settingCaption, { color: colors.textMuted }]}>
                {t('settings.blePresetLogsDesc')}
              </Text>
            </View>
            <Switch
              value={debugLogBlePreset}
              onValueChange={handleDebugLogBlePresetChange}
              trackColor={{ false: colors.toggleBorder, true: colors.toggleSelectedBg }}
              thumbColor={colors.toggleSelectedText}
            />
          </View>

          <View style={[dynStyles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={dynStyles.settingTextBlock}>
              <Text style={[dynStyles.settingTitle, { color: colors.textPrimary }]}>
                {t('settings.bleAsyncLogs')}
              </Text>
              <Text style={[dynStyles.settingCaption, { color: colors.textMuted }]}>
                {t('settings.bleAsyncLogsDesc')}
              </Text>
            </View>
            <Switch
              value={debugLogBleAsync}
              onValueChange={handleDebugLogBleAsyncChange}
              trackColor={{ false: colors.toggleBorder, true: colors.toggleSelectedBg }}
              thumbColor={colors.toggleSelectedText}
            />
          </View>

          <View style={[dynStyles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={dynStyles.settingTextBlock}>
              <Text style={[dynStyles.settingTitle, { color: colors.textPrimary }]}>
                {t('settings.bleQueueLogs')}
              </Text>
              <Text style={[dynStyles.settingCaption, { color: colors.textMuted }]}>
                {t('settings.bleQueueLogsDesc')}
              </Text>
            </View>
            <Switch
              value={debugLogBleQueue}
              onValueChange={handleDebugLogBleQueueChange}
              trackColor={{ false: colors.toggleBorder, true: colors.toggleSelectedBg }}
              thumbColor={colors.toggleSelectedText}
            />
          </View>

          <View style={[dynStyles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={dynStyles.settingTextBlock}>
              <Text style={[dynStyles.settingTitle, { color: colors.textPrimary }]}>
                {t('settings.wifiLogs')}
              </Text>
              <Text style={[dynStyles.settingCaption, { color: colors.textMuted }]}>
                {t('settings.wifiLogsDesc')}
              </Text>
            </View>
            <Switch
              value={debugLogWifi}
              onValueChange={handleDebugLogWifiChange}
              trackColor={{ false: colors.toggleBorder, true: colors.toggleSelectedBg }}
              thumbColor={colors.toggleSelectedText}
            />
          </View>

          <View style={[dynStyles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={dynStyles.settingTextBlock}>
              <Text style={[dynStyles.settingTitle, { color: colors.textPrimary }]}>
                {t('settings.iapLogs')}
              </Text>
              <Text style={[dynStyles.settingCaption, { color: colors.textMuted }]}>
                {t('settings.iapLogsDesc')}
              </Text>
            </View>
            <Switch
              value={debugLogIap}
              onValueChange={handleDebugLogIapChange}
              trackColor={{ false: colors.toggleBorder, true: colors.toggleSelectedBg }}
              thumbColor={colors.toggleSelectedText}
            />
          </View>

          <TouchableOpacity
            style={[
              dynStyles.debugButton,
              { borderColor: colors.toggleBorder, backgroundColor: colors.toggleBg },
              isClearingPresetMetaCache && dynStyles.disabledButton,
            ]}
            onPress={handleClearAllPresetMetaCaches}
            disabled={isClearingPresetMetaCache}
          >
            {isClearingPresetMetaCache ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={[dynStyles.themeText, { color: colors.accent }]}>
                {t('settings.clearPresetCaches')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              dynStyles.debugButton,
              { borderColor: colors.toggleBorder, backgroundColor: colors.toggleBg },
              isClearingCapabilityCache && dynStyles.disabledButton,
            ]}
            onPress={handleClearAllCapabilityCaches}
            disabled={isClearingCapabilityCache}
          >
            {isClearingCapabilityCache ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={[dynStyles.themeText, { color: colors.accent }]}>
                {t('settings.clearCapabilityCaches')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const dynStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  optionButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
  },
  themeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  themeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingCaption: {
    fontSize: 12,
    lineHeight: 18,
  },
  debugButton: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  dropdownTriggerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

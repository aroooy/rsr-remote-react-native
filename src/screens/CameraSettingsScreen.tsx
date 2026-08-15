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
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useCurrentModelNo, useGoProStore, useActiveCameraState, useCameraModel } from '../store/GoProStore';
import { isMaxModel } from '../cameraModels/shared/modelNoHelpers';
import { useShallow } from 'zustand/react/shallow';
import { goProBle } from '../ble/GoProBLEManager';
import { GoProSettingId, CAMERA_ADVANCED_SETTING_IDS } from '../constants/GoProSettingIds';
import {
  getSettingName,
  getSettingValueNameForModelWithContext,
  getOrderedSettingValues,
  GOPRO_SETTINGS_METADATA,
  getBoolValues,
} from '../constants/GoProMetadata';
import { getThemeColors } from '../constants/Theme';
import { getSettingConstraint, isSettingModelSupported } from '../constants/settingConstraints';
import { SliderSettingRow } from '../components/SliderSettingRow';
import { CameraStatusBar } from '../components/CameraStatusBar';
import { useTranslation } from 'react-i18next';

/**
 * Setting IDs that are always displayed because they can be operated using static values even if capabilities/settings are not received yet.
 * Even for models where the camera does not report the value, the options can be retrieved from metadata.
 */
const STATIC_ALWAYS_VISIBLE_IDS = new Set<number>([
  GoProSettingId.DEFAULT_PRESET, // Operable via static preset list
  GoProSettingId.DEFAULT_PRESET_MAX, // MAX-specific (BLE ID 0x7F=127): Always displayed because the camera does not return capability
  GoProSettingId.BEEPS, // Hero09-12/HERO11 Mini: Always displayed even if the camera does not send settings
  GoProSettingId.QUICK_CAPTURE_DEFAULT, // MAX-specific: Always displayed because the camera does not return capability
  GoProSettingId.SCREEN_SAVER_MAX, // MAX-specific (BLE ID 0x33=51): Always displayed because the camera does not return capability
  GoProSettingId.SCREEN_SAVER_REAR, // Hero09-12 (BLE ID 0x9F=159): Always displayed because the camera does not return capability
  GoProSettingId.VOICE_CONTROL, // Always displayed even on models where the camera does not return capability
  GoProSettingId.VOICE_LANGUAGE, // For HERO13 (BLE ID 0xDF=223): Displayed even without capability
  GoProSettingId.VOICE_LANGUAGE_LEGACY, // For HERO09/10/11/12/HERO11 Mini/MAX (BLE ID 0x55=85): Displayed even without capability
  GoProSettingId.ANTI_FLICKER, // MAX: Always displayed even if the camera does not return capability/settings
]);

/** Items to deactivate during recording because changes do not take effect until recording restarts */
const RECORDING_BLOCKED_IDS: readonly number[] = [
  GoProSettingId.CONTROL_MODE,
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.MAX_LENS_MOD,
  GoProSettingId.MAX_LENS_MOD_HERO13,
];

/** Camera Settings items to deactivate when Dashboard Override is ON */
const DASHBOARD_OVERRIDE_BLOCKED_IDS: readonly number[] = [
  GoProSettingId.LED,
  GoProSettingId.SCREEN_SAVER,
  GoProSettingId.SCREEN_SAVER_FRONT,
  GoProSettingId.VOICE_CONTROL,
  GoProSettingId.BEEPS,
  GoProSettingId.BEEP_VOLUME,
  GoProSettingId.ENABLE_BEEP,
  GoProSettingId.ORIENTATION,
  GoProSettingId.SCREEN_LOCK,
  GoProSettingId.FRONT_LCD_MODE,
  GoProSettingId.VOICE_LANGUAGE,
  GoProSettingId.VOICE_LANGUAGE_LEGACY,
];

const CAMERA_SETTINGS_GROUPS: { titleKey: string; ids: readonly number[] }[] = [
  {
    titleKey: 'cameraSettings.general',
    ids: [
      GoProSettingId.CONTROL_MODE,
      // Video System: Core settings affecting preset configuration. Placed directly under CONTROL_MODE.
      GoProSettingId.SYSTEM_VIDEO_MODE, // Hero11: HQ/Standard/Basic
      GoProSettingId.VIDEO_PERFORMANCE_MODE, // Hero10: Max/ExtBat/Tripod
      GoProSettingId.VIDEO_COMPRESSION, // Max/Hero09/10: H.264+HEVC / HEVC
      GoProSettingId.AUTO_OFF,
      GoProSettingId.QUICK_CAPTURE,
      GoProSettingId.QUICK_CAPTURE_DEFAULT, // MAX-specific: Quick Capture default mode
      GoProSettingId.DEFAULT_PRESET,
      GoProSettingId.DEFAULT_PRESET_MAX, // MAX-specific: Default Preset (BLE ID 0x7F=127)
      GoProSettingId.ANTI_FLICKER,
      GoProSettingId.LED,
    ],
  },
  {
    titleKey: 'cameraSettings.sound',
    ids: [GoProSettingId.BEEPS, GoProSettingId.ENABLE_BEEP, GoProSettingId.BEEP_VOLUME],
  },
  {
    titleKey: 'cameraSettings.voiceControl',
    ids: [
      GoProSettingId.VOICE_CONTROL,
      GoProSettingId.VOICE_LANGUAGE, // For HERO13 (BLE ID 0xDF=223)
      GoProSettingId.VOICE_LANGUAGE_LEGACY, // For HERO11/12/HERO11 Mini (BLE ID 0x55=85)
    ],
  },
  {
    titleKey: 'cameraSettings.displays',
    ids: [
      GoProSettingId.LCD_BRIGHTNESS,
      GoProSettingId.SCREEN_SAVER, // HERO13-specific (BLE ID 0xDB=219)
      GoProSettingId.SCREEN_SAVER_REAR, // Hero09/10/11/12 (BLE ID 0x9F=159)
      GoProSettingId.SCREEN_SAVER_MAX, // MAX-specific (BLE ID 0x33=51)
      GoProSettingId.SCREEN_SAVER_FRONT,
      GoProSettingId.FRONT_LCD_MODE,
      GoProSettingId.SCREEN_LOCK,
      GoProSettingId.ORIENTATION,
    ],
  },
  {
    titleKey: 'cameraSettings.regional',
    ids: [
      GoProSettingId.GPS,
      // WIRELESS_BAND is excluded because its BLE write is rejected
      GoProSettingId.LANGUAGE,
    ],
  },
  {
    titleKey: 'cameraSettings.mods',
    ids: [
      GoProSettingId.MAX_LENS_MOD_HERO13,
      GoProSettingId.MAX_LENS_MOD,
      GoProSettingId.MAX_LENS_MOD_ENABLE, // Hero09-12: Max Lens Mod Enable/Disable
      GoProSettingId.LENS_ATTACHMENT, // HERO13-specific: Lens Attachment Type
      GoProSettingId.MEDIA_MOD, // Hero09-13: Media Mod Type
    ],
  },
];

export const CameraSettingsScreen = () => {
  const { t } = useTranslation();
  const theme = useGoProStore((state) => state.theme);
  const cameraModel = useCameraModel();
  const currentModelNo = useCurrentModelNo();
  const hardwareInfo = useActiveCameraState((cs) => cs.hardwareInfo);
  const isEncoding = useActiveCameraState((cs) => cs.isEncoding);
  const settings = useActiveCameraState(useShallow((cs) => cs.settings));
  const capabilities = useActiveCameraState(useShallow((cs) => cs.capabilities));
  const pendingSettings = useActiveCameraState(useShallow((cs) => cs.pendingSettings));

  const [selectedSettingId, setSelectedSettingId] = useState<number | null>(null);
  const [isSettingTime, setIsSettingTime] = useState(false);

  const colors = useMemo(() => getThemeColors(theme), [theme]);
  const firmwareVersion = hardwareInfo?.firmwareVersion ?? null;

  const handleSetDateTime = async () => {
    setIsSettingTime(true);
    try {
      await goProBle.setDateTime(currentModelNo);
      const now = new Date();
      Alert.alert(
        t('cameraSettings.success'),
        t('cameraSettings.successTimeSet', { time: now.toLocaleString() }),
      );
    } catch {
      Alert.alert(t('cameraSettings.error'), t('cameraSettings.errorTimeSet'));
    } finally {
      setIsSettingTime(false);
    }
  };

  // MAX-specific settings (DEFAULT_PRESET_MAX / QUICK_CAPTURE_DEFAULT) must be queried
  // immediately after connection, otherwise the initial value remains "---".
  // Execute sendQuery once when cameraModel is determined.
  const fetchedModelRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isMaxModel(currentModelNo)) return;
    if (fetchedModelRef.current === cameraModel) return;
    fetchedModelRef.current = cameraModel;
    void (async () => {
      await goProBle.sendQuery([0x02, 0x12, GoProSettingId.DEFAULT_PRESET_MAX]);
      await goProBle.sendQuery([0x02, 0x12, GoProSettingId.QUICK_CAPTURE_DEFAULT]);
    })();
  }, [cameraModel]);

  const availableSettingIds = useMemo(() => {
    return CAMERA_ADVANCED_SETTING_IDS.filter(
      (id) =>
        isSettingModelSupported(id, cameraModel) &&
        (capabilities[id] !== undefined ||
          settings[id] !== undefined ||
          STATIC_ALWAYS_VISIBLE_IDS.has(id)),
    );
  }, [capabilities, settings, cameraModel]);

  /**
   * Disabled evaluation of setting items.
   *  1. Static constraints by settingConstraints ('disabled' | 'na')
   *  2. During recording: block items that do not take effect until recording restarts
   *  3. Block when Dashboard Override is ON
   *  4. Capability check: empty options or fixed single choice
   */
  const isSettingDisabled = (id: number): boolean => {
    const constraint = getSettingConstraint(id, settings, cameraModel);
    if (constraint !== 'ok') return true;

    // During recording: block items that do not take effect until recording restarts
    if (isEncoding && RECORDING_BLOCKED_IDS.includes(id)) return true;

    // When Dashboard Override is ON, block all settings controlled by the camera
    const isDashboardOverrideOn = settings[GoProSettingId.DASHBOARD_OVERRIDE] === 1;
    if (isDashboardOverrideOn && DASHBOARD_OVERRIDE_BLOCKED_IDS.includes(id)) return true;

    const capabilityReceived = capabilities[id] !== undefined;
    if (capabilityReceived) {
      const allowedValues = getOrderedSettingValues(
        id,
        capabilities[id] || [],
        cameraModel,
        firmwareVersion,
      );
      const currentValue = settings[id];
      const isSingleFixedValue = allowedValues.length === 1 && currentValue === allowedValues[0];
      if (allowedValues.length === 0 || isSingleFixedValue) return true;
    }

    return false;
  };

  const handleSettingChange = async (settingId: number, value: number) => {
    await goProBle.setSetting(settingId, value);
    setSelectedSettingId(null);
  };

  const renderSettingItem = (id: number) => {
    const currentValue = settings[id];
    const disabled = isSettingDisabled(id);
    const constraint = getSettingConstraint(id, settings, cameraModel);
    const isNA = constraint === 'na';

    const sliderConfig = GOPRO_SETTINGS_METADATA[id]?.sliderConfig;
    if (sliderConfig) {
      const allowedValues = getOrderedSettingValues(
        id,
        capabilities[id] || [],
        cameraModel,
        firmwareVersion,
      );
      const isPending = pendingSettings[id] !== undefined;
      return (
        <View
          key={id}
          style={disabled ? { opacity: 0.4 } : undefined}
          pointerEvents={disabled ? 'none' : 'auto'}
        >
          <SliderSettingRow
            id={id}
            sliderConfig={sliderConfig}
            currentValue={currentValue}
            pendingValue={pendingSettings[id]}
            availableValues={allowedValues}
            settingName={getSettingName(id)}
            onCommit={(value) => void handleSettingChange(id, value)}
            colors={colors}
          />
          {isPending && (
            <ActivityIndicator
              size="small"
              color={colors.accent}
              style={styles.pendingIndicatorSlider}
            />
          )}
        </View>
      );
    }

    const isBool = GOPRO_SETTINGS_METADATA[id]?.isBool === true;
    if (isBool) {
      const { onValue: boolOnValue, offValue: boolOffValue } = getBoolValues(id, cameraModel);
      const isPending = pendingSettings[id] !== undefined;
      const displayValue = pendingSettings[id] ?? currentValue;
      const isOn = displayValue === boolOnValue;
      return (
        <View
          key={id}
          style={[
            styles.settingItem,
            { borderBottomColor: colors.border },
            disabled && styles.settingItemDisabled,
          ]}
        >
          <Text
            style={[
              styles.settingName,
              { color: disabled ? colors.textMuted : colors.textSecondary },
            ]}
          >
            {getSettingName(id)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator
              size="small"
              color={colors.accent}
              style={{ opacity: isPending ? 1 : 0 }}
            />
            <Switch
              value={isOn}
              onValueChange={(val) =>
                void handleSettingChange(id, val ? boolOnValue : boolOffValue)
              }
              trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
              thumbColor={'#ffffff'}
              disabled={currentValue === undefined || disabled || isPending}
            />
          </View>
        </View>
      );
    }

    const isToggleButton = GOPRO_SETTINGS_METADATA[id]?.isToggleButton === true;
    if (isToggleButton) {
      const isPending = pendingSettings[id] !== undefined;
      const displayValue = pendingSettings[id] ?? currentValue;
      return (
        <View
          key={id}
          style={[
            styles.settingItem,
            { borderBottomColor: colors.border },
            disabled && styles.settingItemDisabled,
          ]}
        >
          <Text
            style={[
              styles.settingName,
              { color: disabled ? colors.textMuted : colors.textSecondary },
            ]}
          >
            {getSettingName(id)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <ActivityIndicator
              size="small"
              color={colors.accent}
              style={{ opacity: isPending ? 1 : 0, marginRight: 4 }}
            />
            {[1, 0].map((val) => {
              const isSelected = displayValue === val;
              const label = val === 1 ? t('common.on') : t('common.off');
              return (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.toggleButton,
                    isSelected
                      ? {
                          backgroundColor: colors.toggleSelectedBg,
                          borderColor: colors.toggleSelectedBg,
                        }
                      : { backgroundColor: colors.toggleBg, borderColor: colors.toggleBorder },
                  ]}
                  onPress={() => {
                    if (!disabled && !isPending) void handleSettingChange(id, val);
                  }}
                  disabled={disabled || isPending}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: isSelected ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    // Normal case: value selection via modal
    const allowedValues = getOrderedSettingValues(
      id,
      capabilities[id] || [],
      cameraModel,
      firmwareVersion,
    );
    const canOpen = allowedValues.length > 0;
    const isPending = pendingSettings[id] !== undefined;
    const displayedValue = pendingSettings[id] ?? currentValue;

    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.settingItem,
          { borderBottomColor: colors.border },
          disabled && styles.settingItemDisabled,
        ]}
        onPress={() => {
          if (disabled || isPending) return;
          if (canOpen) {
            setSelectedSettingId(id);
          } else {
            goProBle.fetchCapabilityForSetting(id);
          }
        }}
        activeOpacity={disabled || isPending ? 1 : 0.7}
      >
        <Text
          style={[
            styles.settingName,
            { color: disabled ? colors.textMuted : colors.textSecondary },
          ]}
        >
          {getSettingName(id)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ActivityIndicator
            size="small"
            color={colors.accent}
            style={{ opacity: isPending ? 1 : 0 }}
          />
          <Text
            style={[
              styles.settingValue,
              { color: isNA || disabled ? colors.textMuted : colors.accent },
            ]}
          >
            {isNA
              ? t('common.notAvailable')
              : displayedValue !== undefined
                ? getSettingValueNameForModelWithContext(
                    id,
                    displayedValue,
                    cameraModel,
                    { settings },
                    firmwareVersion,
                  )
                : canOpen
                  ? '---'
                  : t('common.loading')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <CameraStatusBar />
      {cameraModel !== null && (
        <View>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
            {t('cameraSettings.actions')}
          </Text>
          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                void handleSetDateTime();
              }}
              disabled={isSettingTime}
              activeOpacity={0.7}
            >
              <Text style={[styles.settingName, { color: colors.textPrimary }]}>
                {t('cameraSettings.setCameraTime')}
              </Text>
              <Text
                style={[
                  styles.settingValue,
                  { color: isSettingTime ? colors.textMuted : colors.accent },
                ]}
              >
                {isSettingTime ? t('cameraSettings.setting') : t('cameraSettings.syncNow')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {availableSettingIds.length === 0 ? (
        <View
          style={[
            styles.emptySection,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {t('cameraSettings.empty')}
          </Text>
        </View>
      ) : (
        CAMERA_SETTINGS_GROUPS.map(({ titleKey, ids }) => {
          const groupIds = ids.filter((id) => availableSettingIds.includes(id));
          if (groupIds.length === 0) return null;
          return (
            <View key={titleKey}>
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t(titleKey)}</Text>
              <View
                style={[
                  styles.section,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {groupIds.map(renderSettingItem)}
              </View>
            </View>
          );
        })
      )}

      {/* Value selection modal */}
      <Modal
        visible={selectedSettingId !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedSettingId(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, styles.modalOverlayBg]}
            activeOpacity={1}
            onPress={() => setSelectedSettingId(null)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {selectedSettingId ? getSettingName(selectedSettingId) : ''}
            </Text>
            <FlatList
              data={
                selectedSettingId
                  ? getOrderedSettingValues(
                      selectedSettingId,
                      capabilities[selectedSettingId] || [],
                      cameraModel,
                      firmwareVersion,
                    )
                  : []
              }
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, { borderBottomColor: colors.border }]}
                  onPress={() => selectedSettingId && handleSettingChange(selectedSettingId, item)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: colors.textPrimary },
                      selectedSettingId && settings[selectedSettingId] === item
                        ? [styles.modalOptionSelected, { color: colors.accent }]
                        : null,
                    ]}
                  >
                    {selectedSettingId
                      ? getSettingValueNameForModelWithContext(
                          selectedSettingId,
                          item,
                          cameraModel,
                          { settings },
                          firmwareVersion,
                        )
                      : item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: colors.background }]}
              onPress={() => setSelectedSettingId(null)}
            >
              <Text style={[styles.modalCloseText, { color: colors.danger }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptySection: {
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 20,
    marginLeft: 4,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingItemDisabled: {
    opacity: 0.4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingName: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  pendingIndicatorSlider: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayBg: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOptionSelected: {
    fontWeight: 'bold',
  },
  modalClose: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

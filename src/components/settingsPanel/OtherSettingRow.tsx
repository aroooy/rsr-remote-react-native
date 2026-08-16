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
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GoProSettingId } from '../../constants/GoProSettingId';
import {
  getSettingName,
  getSettingValueNameForModelWithContext,
  GOPRO_SETTINGS_METADATA,
  getBoolValues,
  normalizeSettingValueForComparison,
  areSettingValuesEquivalent,
  type SettingValueComparisonContext,
} from '../../constants/GoProMetadata';
import { SliderSettingRow } from '../SliderSettingRow';
import { DASHBOARD_SUB_SETTING_IDS } from '../../constants/capabilityDependencies';
import { resolveOtherItemState } from './otherItemState';
import type { CameraModelKey } from '../../cameraModels/shared/modelManifest';
import type { ThemeColors } from '../../constants/Theme';

export interface OtherSettingRowProps {
  id: number;
  settings: Record<number, number | undefined>;
  pendingSettings: Record<number, number | undefined>;
  displaySettings: Record<number, number | undefined>;
  capabilities: Record<number, number[]>;
  allowedValues: number[];
  cameraModel: CameraModelKey;
  displayPresetId?: number;
  firmwareVersion: string | null;
  isRefreshing: boolean;
  mediaModMicStatus?: number;
  isMediaModConnected: boolean;
  isIosMultiColumn?: boolean;
  colors: ThemeColors;
  onSelectSetting: (settingId: number) => void;
  onChangeValue: (settingId: number, value: number) => void;
}

export const OtherSettingRow: React.FC<OtherSettingRowProps> = ({
  id,
  settings,
  pendingSettings,
  displaySettings,
  capabilities,
  allowedValues,
  cameraModel,
  displayPresetId,
  firmwareVersion,
  isRefreshing,
  mediaModMicStatus,
  isMediaModConnected,
  isIosMultiColumn = false,
  colors,
  onSelectSetting,
  onChangeValue,
}) => {
  const { t } = useTranslation();
  const currentValue = settings[id];
  const settingValueComparisonContext: SettingValueComparisonContext = {
    modelKey: cameraModel,
    firmwareVersion,
  };

  const otherItemState = resolveOtherItemState({
    settingId: id,
    settings,
    capabilities,
    cameraModel,
    allowedValues,
    dashboardSubSettingIds: DASHBOARD_SUB_SETTING_IDS,
  });

  const { kind, isCapabilityDisabled } = otherItemState;
  const hasPendingSettings = Object.keys(pendingSettings).length > 0;
  const isMediaModMicConnectedForUi =
    id === GoProSettingId.MEDIA_MOD_MIC && (mediaModMicStatus === 2 || isMediaModConnected);
  const isEffectivelyDisabled =
    (isMediaModMicConnectedForUi
      ? otherItemState.constraint !== 'ok'
      : otherItemState.isEffectivelyDisabled) ||
    isRefreshing ||
    hasPendingSettings;

  if (kind === 'na') {
    return (
      <View key={id} style={[styles.settingItem, { borderBottomColor: colors.border }]}>
        <Text
          style={[styles.settingName, { color: colors.textSecondary, flex: 1 }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {getSettingName(
            id,
            cameraModel,
            displayPresetId,
            displaySettings[GoProSettingId.MEDIA_FORMAT],
          )}
        </Text>
        <Text
          style={[styles.settingValue, { color: colors.textMuted, flexShrink: 0, marginLeft: 4 }]}
        >
          N/A
        </Text>
      </View>
    );
  }

  const sliderConfig = GOPRO_SETTINGS_METADATA[id]?.sliderConfig;
  if (kind === 'slider' && sliderConfig) {
    return (
      <View
        key={id}
        style={isEffectivelyDisabled ? { opacity: 0.4 } : undefined}
        pointerEvents={isEffectivelyDisabled ? 'none' : 'auto'}
      >
        <SliderSettingRow
          id={id}
          sliderConfig={sliderConfig}
          currentValue={settings[id]}
          pendingValue={undefined}
          availableValues={allowedValues}
          settingName={getSettingName(
            id,
            cameraModel,
            displayPresetId,
            displaySettings[GoProSettingId.MEDIA_FORMAT],
          )}
          onCommit={(val: number) => void onChangeValue(id, val)}
          colors={colors}
        />
      </View>
    );
  }

  const isBool = GOPRO_SETTINGS_METADATA[id]?.isBool === true;
  const isToggleButton = GOPRO_SETTINGS_METADATA[id]?.isToggleButton === true;

  if (kind === 'toggleButton' && isToggleButton) {
    const { onValue, offValue } = getBoolValues(id, cameraModel);
    const displayCurrentValue = normalizeSettingValueForComparison(
      id,
      currentValue,
      settingValueComparisonContext,
    );
    return (
      <View
        key={id}
        style={[
          styles.settingItem,
          { borderBottomColor: colors.border },
          isEffectivelyDisabled && { opacity: 0.4 },
        ]}
      >
        <Text style={[styles.settingName, { color: colors.textSecondary }]}>
          {getSettingName(
            id,
            cameraModel,
            displayPresetId,
            displaySettings[GoProSettingId.MEDIA_FORMAT],
          )}
        </Text>
        <View style={styles.toggleRowContainer}>
          {[onValue, offValue].map((val) => {
            const isSelected = areSettingValuesEquivalent(
              id,
              displayCurrentValue,
              val,
              settingValueComparisonContext,
            );
            const label = val === onValue ? t('common.on') : t('common.off');
            return (
              <TouchableOpacity
                key={val}
                style={[
                  styles.toggleButton,
                  isSelected && styles.toggleButtonSelected,
                  isSelected
                    ? {
                        backgroundColor: colors.toggleSelectedBg,
                        borderColor: colors.toggleSelectedBg,
                      }
                    : { backgroundColor: colors.toggleBg, borderColor: colors.toggleBorder },
                ]}
                onPress={() => {
                  if (!isEffectivelyDisabled) void onChangeValue(id, val);
                }}
                disabled={isEffectivelyDisabled}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isSelected && styles.toggleTextSelected,
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

  if (kind === 'bool' && isBool) {
    const { onValue: boolOnValue, offValue: boolOffValue } = getBoolValues(id, cameraModel);
    const isOn = areSettingValuesEquivalent(
      id,
      currentValue,
      boolOnValue,
      settingValueComparisonContext,
    );
    return (
      <View
        key={id}
        style={[
          styles.settingItem,
          { borderBottomColor: colors.border },
          isEffectivelyDisabled && { opacity: 0.4 },
        ]}
      >
        <Text
          style={[
            styles.settingName,
            { color: colors.textSecondary },
            isIosMultiColumn && styles.iosMultiColumnSettingName,
          ]}
          numberOfLines={isIosMultiColumn ? 1 : undefined}
          ellipsizeMode={isIosMultiColumn ? 'tail' : undefined}
        >
          {getSettingName(
            id,
            cameraModel,
            displayPresetId,
            displaySettings[GoProSettingId.MEDIA_FORMAT],
          )}
        </Text>
        <View style={isIosMultiColumn ? styles.iosMultiColumnControlGroup : undefined}>
          <Switch
            value={isOn}
            onValueChange={(val) => void onChangeValue(id, val ? boolOnValue : boolOffValue)}
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={'#ffffff'}
            disabled={currentValue === undefined || isEffectivelyDisabled}
          />
        </View>
      </View>
    );
  }

  const canOpenModal = allowedValues.length > 0;
  return (
    <TouchableOpacity
      key={id}
      style={[
        styles.settingItem,
        { borderBottomColor: colors.border },
        isEffectivelyDisabled && { opacity: 0.4 },
      ]}
      onPress={() => onSelectSetting(id)}
      disabled={isEffectivelyDisabled}
    >
      <Text
        style={[styles.settingName, { color: colors.textSecondary, flex: 1 }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {getSettingName(
          id,
          cameraModel,
          displayPresetId,
          displaySettings[GoProSettingId.MEDIA_FORMAT],
        )}
      </Text>
      <Text
        style={[
          styles.settingValue,
          {
            color: isCapabilityDisabled ? colors.textMuted : colors.accent,
            flexShrink: 0,
            marginLeft: 4,
          },
        ]}
      >
        {canOpenModal
          ? currentValue !== undefined
            ? getSettingValueNameForModelWithContext(
                id,
                currentValue,
                cameraModel,
                { settings: displaySettings },
                firmwareVersion,
              )
            : '---'
          : currentValue !== undefined
            ? getSettingValueNameForModelWithContext(
                id,
                currentValue,
                cameraModel,
                { settings: displaySettings },
                firmwareVersion,
              )
            : t('common.loading')}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingName: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 15,
  },
  toggleRowContainer: {
    flexDirection: 'row',
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonSelected: {
    elevation: 1,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '500',
  },
  toggleTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  iosMultiColumnSettingName: {
    flex: 1,
  },
  iosMultiColumnControlGroup: {
    marginLeft: 8,
  },
});

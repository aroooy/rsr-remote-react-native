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

import React, { MutableRefObject } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GoProSettingId } from '../../constants/GoProSettingId';
import { LAPSE_WITH_PHOTO_PRESETS } from '../../constants/layout';
import {
  getSettingName,
  getSettingValueNameForModelWithContext,
  GOPRO_SETTINGS_METADATA,
  normalizeSettingValueForComparison,
  areSettingValuesEquivalent,
  dedupeEquivalentSettingValues,
} from '../../constants/GoProMetadata';
import type { SettingValueComparisonContext } from '../../constants/GoProMetadata';
import { filterPrimaryItemValues } from './primaryItemValues';
import { isHero13Model, isMaxModel } from '../../cameraModels/shared/modelNoHelpers';
import type { CameraModelKey } from '../../cameraModels/shared/modelManifest';
import type { GoProModelNumber } from '../../constants/GoProModelNumbers';
import type { ThemeColors } from '../../constants/Theme';
import { PRESET_NIGHTLAPSE, PRESET_MACRO_NIGHTLAPSE } from '../../constants/presetIds';
import { HERO13_EASY_MACRO_NIGHTLAPSE_PRESET } from '../../constants/hero13PresetIds';

export interface PrimarySettingRowProps {
  id: number;
  settings: Record<number, number | undefined>;
  pendingSettings: Record<number, number | undefined>;
  displaySettings: Record<number, number | undefined>;
  allowedValues: number[];
  isHero12Or13MaxVideoPreset: boolean;
  displayPresetId?: number;
  isTimelapseContextActive: boolean;
  currentModelNo: GoProModelNumber | null;
  cameraModel: CameraModelKey;
  firmwareVersion: string | null;
  colors: ThemeColors;
  onChangeValue: (settingId: number, value: number) => void;
  toggleScrollRefs: MutableRefObject<Map<number, ScrollView | null>>;
  toggleChipOffsetsRef: MutableRefObject<Map<number, Map<number, number>>>;
  toggleAllowedSigsRef: MutableRefObject<Map<number, string>>;
}

export const PrimarySettingRow: React.FC<PrimarySettingRowProps> = ({
  id,
  settings,
  pendingSettings,
  displaySettings,
  allowedValues: rawAllowedValues,
  isHero12Or13MaxVideoPreset,
  displayPresetId,
  isTimelapseContextActive,
  currentModelNo,
  cameraModel,
  firmwareVersion,
  colors,
  onChangeValue,
  toggleScrollRefs,
  toggleChipOffsetsRef,
  toggleAllowedSigsRef,
}) => {
  const { t } = useTranslation();

  const currentValue = pendingSettings[id] ?? settings[id];
  let allowedValues = [...rawAllowedValues];

  if (
    isHero12Or13MaxVideoPreset &&
    id === GoProSettingId.HORIZONTAL_LEVELING &&
    allowedValues.length === 0
  ) {
    return null;
  }

  const isTimelapseFormatToggle =
    id === GoProSettingId.MEDIA_FORMAT &&
    displayPresetId !== undefined &&
    LAPSE_WITH_PHOTO_PRESETS.has(displayPresetId);

  if (isTimelapseFormatToggle) {
    const isNightlapse =
      displayPresetId === PRESET_NIGHTLAPSE ||
      displayPresetId === PRESET_MACRO_NIGHTLAPSE ||
      displayPresetId === HERO13_EASY_MACRO_NIGHTLAPSE_PRESET;
    const videoVal = isNightlapse ? 26 : 13;
    const photoVal = isNightlapse ? 21 : 20;
    const candidates = [videoVal, photoVal];
    const filtered = candidates.filter((v) => allowedValues.includes(v));
    if (filtered.length > 0) {
      allowedValues = filtered;
    } else {
      allowedValues = candidates;
    }
  }

  const currentMediaFormat = settings[GoProSettingId.MEDIA_FORMAT];
  const isTimelapsePhotoOutput =
    id === GoProSettingId.TIMELAPSE_PHOTO_OUTPUT &&
    !isMaxModel(currentModelNo) &&
    isTimelapseContextActive &&
    displayPresetId !== undefined &&
    LAPSE_WITH_PHOTO_PRESETS.has(displayPresetId) &&
    (currentMediaFormat === 20 || currentMediaFormat === 21);

  if (isTimelapsePhotoOutput && allowedValues.length === 0) {
    allowedValues = [0, 1];
  }

  allowedValues = filterPrimaryItemValues({
    settingId: id,
    allowedValues,
    settings,
    pendingSettings,
    cameraModel,
    currentPresetId: displayPresetId,
    currentValue,
  });

  const settingValueComparisonContext: SettingValueComparisonContext = {
    modelKey: cameraModel,
    modelNo: currentModelNo,
    firmwareVersion,
  };

  const isToggleLikePrimary =
    GOPRO_SETTINGS_METADATA[id]?.isToggleButton === true ||
    GOPRO_SETTINGS_METADATA[id]?.isBool === true;

  if (isToggleLikePrimary) {
    allowedValues = dedupeEquivalentSettingValues(
      id,
      allowedValues,
      settingValueComparisonContext,
    );
  }

  const renderValueLabel = (val: number): string => {
    if (isTimelapseFormatToggle) {
      if (val === 13 || val === 26) return t('control.timelapseVideo');
      if (val === 20 || val === 21) return t('control.timelapsePhoto');
    }
    return getSettingValueNameForModelWithContext(
      id,
      val,
      cameraModel,
      { settings: displaySettings },
      firmwareVersion,
    );
  };

  const sig = allowedValues.join(',');
  if (toggleAllowedSigsRef.current.get(id) !== sig) {
    toggleAllowedSigsRef.current.set(id, sig);
    toggleChipOffsetsRef.current.set(id, new Map());
  }

  let displayCurrentValue = normalizeSettingValueForComparison(
    id,
    currentValue,
    settingValueComparisonContext,
  );

  if (id === GoProSettingId.VIDEO_PROFILE && isHero13Model(currentModelNo)) {
    const hlgHdr = settings[GoProSettingId.HLG_HDR];
    if (hlgHdr !== undefined && (currentValue === 1 || currentValue === 101)) {
      displayCurrentValue = hlgHdr === 0 ? 1 : 101;
    }
  }

  return (
    <View style={[styles.primaryItemContainer, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.toggleGroup}
        ref={(ref) => {
          toggleScrollRefs.current.set(id, ref);
        }}
      >
        <View style={styles.toggleLabelChip} pointerEvents="none">
          <Text style={[styles.toggleLabelChipText, { color: colors.textMuted }]}>
            {getSettingName(
              id,
              cameraModel,
              displayPresetId,
              displaySettings[GoProSettingId.MEDIA_FORMAT],
            )}
          </Text>
        </View>
        {allowedValues.map((val) => {
          const isSelected = areSettingValuesEquivalent(
            id,
            displayCurrentValue,
            val,
            settingValueComparisonContext,
          );
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
                  : { borderColor: colors.toggleBorder, backgroundColor: colors.toggleBg },
              ]}
              onPress={() => onChangeValue(id, val)}
              onLayout={(e) => {
                if (!toggleChipOffsetsRef.current.has(id)) {
                  toggleChipOffsetsRef.current.set(id, new Map());
                }
                const x = e.nativeEvent.layout.x;
                toggleChipOffsetsRef.current.get(id)!.set(val, x);
                if (isSelected) {
                  toggleScrollRefs.current.get(id)?.scrollTo({ x: x - 8, animated: true });
                }
              }}
            >
              <Text
                style={[
                  styles.toggleText,
                  isSelected && styles.toggleTextSelected,
                  !isSelected && { color: colors.textSecondary },
                ]}
              >
                {renderValueLabel(val)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  primaryItemContainer: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleGroup: {
    flexDirection: 'row',
  },
  toggleLabelChip: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginRight: 4,
  },
  toggleLabelChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
});

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
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { GoProSettingId } from '../../constants/GoProSettingId';
import { GoProPresetGroup } from '../../constants/GoProPresetGroup';
import type { CameraModelKey } from '../../cameraModels/shared/modelNumber';
import { resolveFramingSelector } from './framingSelector';
import { resolveResolutionSelector } from './resolutionSelector';
import { getSettingName } from '../../constants/GoProMetadata';
import { getResolutionLabel } from '../../constants/ResolutionAspectMap';
import { AspectRatioIcon } from '../AspectRatioIcon';
import type { ThemeColors } from '../../constants/Theme';

export interface ResolutionFramingSectionProps {
  showFramingSelector: boolean;
  showResolutionSelector: boolean;
  displaySettings: Record<number, number>;
  pendingDisplaySettings: Record<number, number>;
  capabilities: Record<number, number[]>;
  cameraModel: CameraModelKey;
  currentGroupId?: number;
  displayPresetId?: number;
  isTimelapseContextActive: boolean;
  isHero13BurstSloMoActive: boolean;
  isHero12MaxVideo2Preset: boolean;
  isHero12MaxTimewarp2Preset: boolean;
  isHero12Trail2Preset: boolean;
  quickSettingIds: readonly number[];
  hero12EasyPresetConfig?: unknown;
  getFilteredSelectableValues: (id: number) => number[];
  onChangeValue: (settingId: number, value: number) => void;
  colors: ThemeColors;
  styles: Record<string, any>;
}

export const ResolutionFramingSection: React.FC<ResolutionFramingSectionProps> = ({
  showFramingSelector,
  showResolutionSelector,
  displaySettings,
  pendingDisplaySettings,
  capabilities,
  cameraModel,
  currentGroupId,
  displayPresetId,
  isTimelapseContextActive,
  isHero13BurstSloMoActive,
  isHero12MaxVideo2Preset,
  isHero12MaxTimewarp2Preset,
  isHero12Trail2Preset,
  quickSettingIds,
  hero12EasyPresetConfig,
  getFilteredSelectableValues,
  onChangeValue,
  colors,
  styles,
}) => {
  const renderFramingSelector = () => {
    if (!showFramingSelector) return null;

    const framingOptions = resolveFramingSelector({
      settings: displaySettings,
      capabilities,
      cameraModel,
      currentGroupId,
      currentPresetId: displayPresetId,
      isTimelapseContextActive,
      isHero13BurstSloMoActive,
      isHero12MaxVideo2Preset,
      isHero12MaxTimewarp2Preset,
      isHero12Trail2Preset,
    });

    if (framingOptions === null || framingOptions.length === 0) {
      return null;
    }

    return (
      <View style={styles.framingRow}>
        {framingOptions.map((option: any) => {
          const iconColor = option.isActive ? colors.accent : colors.textSecondary;
          return (
            <TouchableOpacity
              key={option.key}
              disabled={!option.isAvailable}
              style={[
                styles.framingButton,
                option.isActive && styles.framingButtonActive,
                option.isActive
                  ? { backgroundColor: colors.accentLight, borderColor: colors.accent }
                  : { borderColor: colors.toggleBorder, backgroundColor: colors.toggleBg },
                !option.isAvailable && { opacity: 0.3 },
              ]}
              onPress={() => {
                if (option.isActive || !option.isAvailable || option.targetValue === null) return;
                onChangeValue(option.settingId, option.targetValue);
              }}
            >
              <AspectRatioIcon ratio={option.ratio} size={18} color={iconColor} />
              <Text
                style={[
                  styles.framingButtonText,
                  option.isActive && styles.framingButtonTextActive,
                  { color: iconColor, marginLeft: 6 },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderResolutionSelector = () => {
    if (!showResolutionSelector) return null;

    const resolutionSelectorState = resolveResolutionSelector({
      resolutionValues: getFilteredSelectableValues(GoProSettingId.RESOLUTION),
      settings: displaySettings,
      pendingSettings: pendingDisplaySettings,
      capabilities,
      cameraModel,
      currentGroupId,
      currentPresetId: displayPresetId,
      quickSettingIds,
      isHero13BurstSloMoActive,
      hasHero12EasyPresetConfig: hero12EasyPresetConfig !== undefined,
    });
    if (resolutionSelectorState === null) return null;

    const { currentValue, resolutionValues } = resolutionSelectorState;

    return (
      <View style={[styles.primaryItemContainer, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toggleGroup}>
          <View style={styles.toggleLabelChip} pointerEvents="none">
            <Text style={[styles.toggleLabelChipText, { color: colors.textMuted }]}>
              {getSettingName(GoProSettingId.RESOLUTION)}
            </Text>
          </View>
          {resolutionValues.map((val: number) => {
            const isSelected = currentValue === val;
            const label = getResolutionLabel(cameraModel, val) ?? val.toString();
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
                onPress={() => onChangeValue(GoProSettingId.RESOLUTION, val)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isSelected && styles.toggleTextSelected,
                    !isSelected && { color: colors.textSecondary },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <>
      {renderFramingSelector()}
      {renderResolutionSelector()}
    </>
  );
};

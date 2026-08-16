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

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { GoProPreset } from '../../ble/PresetProtobuf';
import type { ThemeColors } from '../../constants/Theme';
import type { CameraModelKey } from '../../cameraModels/shared/modelManifest';
import { GoProPresetGroup, GoProPresetGroupSelectId } from '../../constants/GoProPresetGroup';
import { isHero11MiniModel, isMaxModel } from '../../cameraModels/shared/modelNoHelpers';

import type { GetPresetLabel } from './usePresetRename';

export interface PresetGroupGridProps {
  currentModelNo: number | null;
  cameraModel: CameraModelKey;
  currentGroupId: number | undefined;
  currentPresetId: number | undefined;
  currentGroupPresets: GoProPreset[];
  fallbackPresetsByModel: Record<string, Record<number, readonly number[]>>;
  supportsPresetRename: boolean;
  colors: ThemeColors;
  handleLoadPresetGroup: (selectId: number) => void;
  handleLoadPreset: (presetId: number) => void;
  handleLongPressPreset: (preset: GoProPreset) => void;
  getPresetLabel: GetPresetLabel;
  getPresetDisplayName: (presetId: number, modelKey: CameraModelKey) => string;
  getPresetIoniconName: (iconId?: number, groupId?: number) => string;
  renderMaxLensModeSelectors?: () => React.ReactNode;
}

export const PresetGroupGrid: React.FC<PresetGroupGridProps> = ({
  currentModelNo,
  cameraModel,
  currentGroupId,
  currentPresetId,
  currentGroupPresets,
  fallbackPresetsByModel,
  supportsPresetRename,
  colors,
  handleLoadPresetGroup,
  handleLoadPreset,
  handleLongPressPreset,
  getPresetLabel,
  getPresetDisplayName,
  getPresetIoniconName,
  renderMaxLensModeSelectors,
}) => {
  const { t } = useTranslation();
  const presetScrollRef = useRef<ScrollView>(null);
  const chipOffsetsRef = useRef<Map<number, { x: number; width: number }>>(new Map());

  return (
    <View style={[styles.modeSelectorContainer, { borderBottomColor: colors.border }]}>
      {/* Mode tabs — Hidden on HeroMini11 since it does not have a mode concept */}
      {!isHero11MiniModel(currentModelNo) && (
        <View style={styles.modeTabRow}>
          {(
            [
              {
                label: t('control.video'),
                icon: 'videocam' as const,
                groupId: GoProPresetGroup.VIDEO,
                selectId: GoProPresetGroupSelectId.VIDEO,
              },
              {
                label: t('control.photo'),
                icon: 'camera' as const,
                groupId: GoProPresetGroup.PHOTO,
                selectId: GoProPresetGroupSelectId.PHOTO,
              },
              {
                label: t('control.timelapse'),
                icon: 'timer-outline' as const,
                groupId: GoProPresetGroup.TIMELAPSE,
                selectId: GoProPresetGroupSelectId.TIMELAPSE,
              },
            ] as const
          ).map(({ label, icon, groupId, selectId }) => {
            const isActive = currentGroupId === groupId;
            return (
              <TouchableOpacity
                key={groupId}
                style={[
                  styles.modeTab,
                  isActive
                    ? [
                        styles.modeTabActive,
                        { backgroundColor: colors.modeActive, borderColor: colors.modeActive },
                      ]
                    : { borderColor: colors.toggleBorder, backgroundColor: colors.toggleBg },
                ]}
                onPress={() => handleLoadPresetGroup(selectId)}
              >
                <Ionicons
                  name={icon}
                  size={18}
                  color={isActive ? colors.modeActiveText : colors.textSecondary}
                  style={styles.modeTabIcon}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    isActive && styles.modeTabTextActive,
                    isActive ? { color: colors.modeActiveText } : { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Lens Mode / Lens Direction (Max exclusive, placed above preset chips) */}
      {isMaxModel(currentModelNo) && renderMaxLensModeSelectors && renderMaxLensModeSelectors()}

      {/* Preset chips */}
      {currentGroupPresets.length > 0 ? (
        <ScrollView
          ref={presetScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.presetChipScroll}
          contentContainerStyle={styles.presetChipContent}
        >
          {currentGroupPresets.map((preset) => {
            const isActive = currentPresetId === preset.id;
            const isCustomPreset = preset.userDefined;
            const label = getPresetLabel(preset.id, preset.customName, preset.iconId);
            const iconName = getPresetIoniconName(preset.iconId, currentGroupId);
            const iconColor = isActive ? colors.accent : colors.textSecondary;
            const presetIconShellColor = isActive
              ? colors.accent
              : isCustomPreset
                ? colors.accentLight
                : colors.surfaceSecondary;
            const presetIconBorderColor = isActive
              ? colors.accent
              : isCustomPreset
                ? colors.accentLight
                : colors.toggleBorder;
            const presetIconColor = isActive
              ? colors.toggleSelectedText
              : isCustomPreset
                ? colors.accent
                : colors.textSecondary;
            const canRename = preset.userDefined && supportsPresetRename;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetChip,
                  isActive && styles.presetChipActive,
                  isActive
                    ? { backgroundColor: colors.accentLight, borderColor: colors.accent }
                    : { borderColor: colors.toggleBorder, backgroundColor: colors.surface },
                ]}
                onPress={() => handleLoadPreset(preset.id)}
                onLongPress={canRename ? () => handleLongPressPreset(preset) : undefined}
                delayLongPress={450}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  chipOffsetsRef.current.set(preset.id, { x, width });
                  if (preset.id === currentPresetId) {
                    presetScrollRef.current?.scrollTo({ x: x - 12, animated: false });
                  }
                }}
              >
                <View style={styles.presetChipInner}>
                  <View
                    style={[
                      styles.presetChipIconShell,
                      {
                        backgroundColor: presetIconShellColor,
                        borderColor: presetIconBorderColor,
                      },
                    ]}
                  >
                    <Ionicons name={iconName as any} size={14} color={presetIconColor} />
                  </View>
                  <Text
                    style={[
                      styles.presetChipText,
                      isActive && styles.presetChipTextActive,
                      { color: iconColor },
                    ]}
                  >
                    {label}
                  </Text>
                  {isCustomPreset ? (
                    <View
                      style={[
                        styles.presetChipBadge,
                        {
                          backgroundColor: isActive ? colors.accent : colors.accentLight,
                          borderColor: colors.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetChipBadgeText,
                          { color: isActive ? colors.toggleSelectedText : colors.accent },
                        ]}
                      >
                        CUSTOM
                      </Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        // Prior to fetching Protobuf — display fallback known preset IDs per group
        <ScrollView
          ref={presetScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.presetChipScroll}
          contentContainerStyle={styles.presetChipContent}
        >
          {(
            (fallbackPresetsByModel[cameraModel] ?? {})[currentGroupId ?? GoProPresetGroup.VIDEO] ??
            []
          ).map((presetId) => {
            const isActive = currentPresetId === presetId;
            const label = getPresetDisplayName(presetId, cameraModel);
            const iconName = getPresetIoniconName(undefined, currentGroupId);
            const iconColor = isActive ? colors.accent : colors.textSecondary;
            const presetIconShellColor = isActive ? colors.accent : colors.surfaceSecondary;
            const presetIconColor = isActive ? colors.toggleSelectedText : iconColor;
            return (
              <TouchableOpacity
                key={presetId}
                style={[
                  styles.presetChip,
                  isActive && styles.presetChipActive,
                  isActive
                    ? { backgroundColor: colors.accentLight, borderColor: colors.accent }
                    : { borderColor: colors.toggleBorder, backgroundColor: colors.surface },
                ]}
                onPress={() => handleLoadPreset(presetId)}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  chipOffsetsRef.current.set(presetId, { x, width });
                  if (presetId === currentPresetId) {
                    presetScrollRef.current?.scrollTo({ x: x - 12, animated: false });
                  }
                }}
              >
                <View style={styles.presetChipInner}>
                  <View
                    style={[
                      styles.presetChipIconShell,
                      {
                        backgroundColor: presetIconShellColor,
                        borderColor: isActive ? colors.accent : colors.toggleBorder,
                      },
                    ]}
                  >
                    <Ionicons name={iconName as any} size={14} color={presetIconColor} />
                  </View>
                  <Text
                    style={[
                      styles.presetChipText,
                      isActive && styles.presetChipTextActive,
                      { color: iconColor },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modeSelectorContainer: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modeTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 8,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  modeTabActive: {
    borderWidth: 1,
  },
  modeTabIcon: {
    marginRight: 6,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modeTabTextActive: {
    fontWeight: '700',
  },
  presetChipScroll: {
    flexGrow: 0,
  },
  presetChipContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetChipActive: {
    borderWidth: 1,
  },
  presetChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetChipIconShell: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  presetChipTextActive: {
    fontWeight: '700',
  },
  presetChipBadge: {
    marginLeft: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  presetChipBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

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

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useGoProStore, useActiveCameraState } from '../store/GoProStore';
import {
  CustomPreset,
  saveCustomPreset,
  getCustomPresets,
  deleteCustomPreset,
  updateSortOrders,
} from '../device/CustomPresetRepository';
import { goProBle } from '../ble/GoProBLEManager';
import { GoProSettingId, GoProPresetGroup } from '../constants/GoProSettingIds';
import { getThemeColors } from '../constants/Theme';
import { getProductIdForModel, getProductDisplayName, IAPProductId } from '../iap/IAPProducts';
import { purchaseProduct } from '../iap/IAPManager';
import { generateDefaultPresetName } from '../utils/presetNaming';

const GROUP_LABEL_KEYS: Record<number, 'presets.video' | 'presets.photo' | 'presets.timelapse'> = {
  [GoProPresetGroup.VIDEO]: 'presets.video',
  [GoProPresetGroup.PHOTO]: 'presets.photo',
  [GoProPresetGroup.TIMELAPSE]: 'presets.timelapse',
};
const GROUP_COLORS: Record<number, string> = {
  [GoProPresetGroup.VIDEO]: '#4361ee',
  [GoProPresetGroup.PHOTO]: '#2b9348',
  [GoProPresetGroup.TIMELAPSE]: '#e07c24',
};

export const CustomPresetsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const settings = useActiveCameraState((cs) => cs.settings);
  const connectedDeviceId = useGoProStore((state) => state.connectedDeviceId);
  const hardwareInfo = useActiveCameraState((cs) => cs.hardwareInfo);
  const cameraModel = useActiveCameraState((cs) => cs.cameraModel);
  const cameraPresets = useActiveCameraState((cs) => cs.presets);
  const purchasedProducts = useGoProStore((state) => state.purchasedProducts);
  const theme = useGoProStore((state) => state.theme);
  const colors = useMemo(() => getThemeColors(theme), [theme]);

  const currentProductId = useMemo(
    () => getProductIdForModel(hardwareInfo?.modelName),
    [hardwareInfo],
  );
  const isPurchased = useMemo(
    () => (currentProductId ? purchasedProducts.includes(currentProductId) : false),
    [currentProductId, purchasedProducts],
  );

  const [presets, setPresets] = useState<CustomPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<CustomPreset | null>(null);
  const [includeSystemSettings, setIncludeSystemSettings] = useState(true);

  const wasOpenRef = useRef(false);

  // Pre-populate default preset name when opening the save modal
  useEffect(() => {
    if (isSaveModalVisible) {
      if (!wasOpenRef.current) {
        const defaultName = generateDefaultPresetName(
          settings,
          cameraModel || 'unknown',
          cameraPresets,
          hardwareInfo?.firmwareVersion ?? null,
        );
        setPresetNameInput(defaultName);
        wasOpenRef.current = true;
      }
    } else {
      wasOpenRef.current = false;
    }
  }, [isSaveModalVisible, settings, cameraModel, cameraPresets, hardwareInfo]);

  const loadPresets = async () => {
    if (!connectedDeviceId) return;
    setIsLoading(true);
    try {
      const items = await getCustomPresets(connectedDeviceId);
      setPresets(items);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPresets();
  }, [connectedDeviceId]);

  // Place "+ Save Current" button in header (only active when purchased)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={[
            styles.headerButton,
            { backgroundColor: isPurchased ? colors.accent : colors.lockedBg },
          ]}
          onPress={() => {
            if (!isPurchased) {
              if (currentProductId) {
                purchaseProduct(currentProductId as IAPProductId);
              } else {
                Alert.alert(t('presets.protuneRequired'), t('presets.protuneRequiredDesc'));
              }
              return;
            }
            setIsSaveModalVisible(true);
          }}
        >
          <Text style={[styles.headerButtonText, !isPurchased && { color: colors.lockedText }]}>
            {isPurchased ? t('presets.saveCurrent') : t('presets.lockedSaveCurrent')}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, isPurchased, currentProductId, t]);

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  const handleSave = async () => {
    if (!connectedDeviceId || !presetNameInput.trim()) return;
    const currentGroup = settings[GoProSettingId.MODE_PRESET_GROUP] ?? GoProPresetGroup.VIDEO;
    await saveCustomPreset(connectedDeviceId, presetNameInput.trim(), currentGroup, settings);
    setPresetNameInput('');
    setIsSaveModalVisible(false);
    await loadPresets();
  };

  // ---------------------------------------------------------------------------
  // Apply
  // ---------------------------------------------------------------------------
  const handleApply = async () => {
    if (!selectedPreset) return;
    const presetToApply = selectedPreset;
    let parsedSettings: Record<number, number>;
    try {
      parsedSettings = JSON.parse(presetToApply.settingsJson) as Record<number, number>;
    } catch (e) {
      console.warn('Failed to parse custom preset JSON', e);
      useGoProStore.getState().setToastMessage(t('presets.invalidPresetData'));
      return;
    }

    setIsApplyModalVisible(false);
    setSelectedPreset(null);
    navigation.goBack();

    void goProBle.applyCustomPreset(parsedSettings, includeSystemSettings).catch((e) => {
      console.warn('Failed to apply custom preset', e);
      useGoProStore.getState().setToastMessage(t('presets.applyFailed'));
    });
  };

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------
  const handleDelete = (preset: CustomPreset) => {
    Alert.alert(t('presets.deletePreset'), t('presets.deletePresetDesc', { name: preset.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteCustomPreset(preset.id);
          await loadPresets();
        },
      },
    ]);
  };

  // ---------------------------------------------------------------------------
  // Reorder
  // ---------------------------------------------------------------------------
  const movePreset = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= presets.length) return;

    const newPresets = [...presets];
    [newPresets[index], newPresets[swapIndex]] = [newPresets[swapIndex], newPresets[index]];

    // Reassign sortOrder to sequential numbers starting from 1 in the reordered array
    const updates = newPresets.map((p, i) => ({ id: p.id, sortOrder: i + 1 }));
    const updated = newPresets.map((p, i) => ({ ...p, sortOrder: i + 1 }));
    setPresets(updated);
    await updateSortOrders(updates);
  };

  const openApplyModal = (preset: CustomPreset) => {
    setSelectedPreset(preset);
    setIsApplyModalVisible(true);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const renderItem = ({ item, index }: { item: CustomPreset; index: number }) => {
    const groupColor = GROUP_COLORS[item.presetGroup] ?? '#6c757d';
    const groupLabelKey = GROUP_LABEL_KEYS[item.presetGroup];
    const groupLabel = groupLabelKey ? t(groupLabelKey) : t('common.unknown');

    return (
      <View style={[styles.row, { backgroundColor: colors.surface }]}>
        {/* Reorder buttons */}
        <View style={styles.orderButtons}>
          <TouchableOpacity
            style={[styles.orderButton, index === 0 && styles.orderButtonDisabled]}
            onPress={() => movePreset(index, 'up')}
            disabled={index === 0}
          >
            <Text
              style={[
                styles.orderButtonText,
                { color: colors.textSecondary },
                index === 0 && { color: colors.textMuted },
              ]}
            >
              ▲
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.orderButton, index === presets.length - 1 && styles.orderButtonDisabled]}
            onPress={() => movePreset(index, 'down')}
            disabled={index === presets.length - 1}
          >
            <Text
              style={[
                styles.orderButtonText,
                { color: colors.textSecondary },
                index === presets.length - 1 && { color: colors.textMuted },
              ]}
            >
              ▼
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.rowAction}
          onPress={() => openApplyModal(item)}
          activeOpacity={0.7}
        >
          <View style={styles.presetInfo}>
            <View style={[styles.groupBadge, { backgroundColor: groupColor }]}>
              <Text style={styles.groupBadgeText}>{groupLabel}</Text>
            </View>
            <Text style={[styles.presetName, { color: colors.textPrimary }]}>{item.name}</Text>
          </View>
          <Text style={[styles.rowChevron, { color: colors.textMuted }]}>{'>'}</Text>
        </TouchableOpacity>

        {/* Delete button */}
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteButtonText}>🗑</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.accent} />
      ) : presets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            {t('presets.noCustomPresets')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {t('presets.noCustomPresetsDesc')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={presets}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
      {/* Save Modal */}
      <Modal visible={isSaveModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsSaveModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalContent, { backgroundColor: colors.modalBg }]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t('presets.saveCurrentSettings')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBg,
                  color: colors.inputText,
                },
              ]}
              placeholder={t('presets.presetNamePlaceholder')}
              placeholderTextColor={colors.placeholderText}
              value={presetNameInput}
              onChangeText={setPresetNameInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setPresetNameInput('');
                  setIsSaveModalVisible(false);
                }}
              >
                <Text style={[styles.modalButtonCancelText, { color: colors.textMuted }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButtonConfirm,
                  { backgroundColor: colors.accent },
                  !presetNameInput.trim() && { backgroundColor: colors.textMuted },
                ]}
                onPress={handleSave}
                disabled={!presetNameInput.trim()}
              >
                <Text style={styles.modalButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Apply confirmation modal */}
      <Modal visible={isApplyModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setIsApplyModalVisible(false);
            setSelectedPreset(null);
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalContent, { backgroundColor: colors.modalBg }]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t('presets.applyTitle', { name: selectedPreset?.name ?? '' })}
            </Text>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelCol}>
                <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>
                  {t('presets.includeSystemSettings')}
                </Text>
                <Text style={[styles.switchSubLabel, { color: colors.textMuted }]}>
                  {t('presets.includeSystemSettingsDesc')}
                </Text>
              </View>
              <Switch
                value={includeSystemSettings}
                onValueChange={setIncludeSystemSettings}
                trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
                thumbColor="#ffffff"
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setIsApplyModalVisible(false);
                  setSelectedPreset(null);
                }}
              >
                <Text style={[styles.modalButtonCancelText, { color: colors.textMuted }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonApply} onPress={handleApply}>
                <Text style={styles.modalButtonText}>{t('common.apply')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginTop: 60,
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  // --- Row ---
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 5,
    paddingVertical: 10,
    paddingHorizontal: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  // --- Reorder ---
  orderButtons: {
    flexDirection: 'column',
    marginRight: 8,
  },
  orderButton: {
    padding: 4,
    marginVertical: 2,
  },
  orderButtonDisabled: {
    opacity: 0.25,
  },
  orderButtonText: {
    fontSize: 14,
  },
  rowAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // --- Preset info ---
  presetInfo: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 8,
  },
  groupBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  groupBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  presetName: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
    lineHeight: 20,
  },
  rowChevron: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 6,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  // --- Header button ---
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 4,
  },
  headerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  // --- Empty State ---
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  // --- Applying overlay ---
  applyingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  applyingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // --- Common modal styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '88%',
    borderRadius: 14,
    padding: 22,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  switchLabelCol: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalButtonCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 4,
  },
  modalButtonCancelText: {
    fontWeight: '600',
    fontSize: 15,
  },
  modalButtonConfirm: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalButtonApply: {
    backgroundColor: '#2b9348',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

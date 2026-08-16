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
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { GoProSettingId } from '../../constants/GoProSettingId';
import {
  getSettingName,
  getSettingValueNameForModelWithContext,
} from '../../constants/GoProMetadata';
import type { CameraModelKey } from '../../cameraModels/shared/modelManifest';
import type { ThemeColors } from '../../constants/Theme';

export interface SettingOptionModalProps {
  selectedSettingId: number | null;
  onClose: () => void;
  onSelectValue: (settingId: number, value: number) => void;
  selectableValues: number[];
  currentValue?: number;
  cameraModel: CameraModelKey;
  displayPresetId?: number;
  displaySettings: Record<number, number | undefined>;
  firmwareVersion: string | null;
  colors: ThemeColors;
}

export const SettingOptionModal: React.FC<SettingOptionModalProps> = ({
  selectedSettingId,
  onClose,
  onSelectValue,
  selectableValues,
  currentValue,
  cameraModel,
  displayPresetId,
  displaySettings,
  firmwareVersion,
  colors,
}) => {
  const { t } = useTranslation();

  if (selectedSettingId === null) return null;

  const settingTitle = getSettingName(
    selectedSettingId,
    cameraModel,
    displayPresetId,
    displaySettings[GoProSettingId.MEDIA_FORMAT],
  );

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, styles.modalOverlayBg]}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            {settingTitle}
          </Text>
          <FlatList
            data={selectableValues}
            keyExtractor={(item) => item.toString()}
            renderItem={({ item }) => {
              const isSelected = currentValue === item;
              return (
                <TouchableOpacity
                  style={[styles.modalOption, { borderBottomColor: colors.borderLight }]}
                  onPress={() => onSelectValue(selectedSettingId, item)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: colors.textPrimary },
                      isSelected && [styles.modalOptionSelected, { color: colors.accent }],
                    ]}
                  >
                    {getSettingValueNameForModelWithContext(
                      selectedSettingId,
                      item,
                      cameraModel,
                      { settings: displaySettings },
                      firmwareVersion,
                    )}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity
            style={[styles.modalClose, { backgroundColor: colors.surfaceSecondary }]}
            onPress={onClose}
          >
            <Text style={[styles.modalCloseText, { color: colors.danger }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOptionSelected: {
    fontWeight: 'bold',
  },
  modalClose: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

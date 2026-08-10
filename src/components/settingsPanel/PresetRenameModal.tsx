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
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  PRIMARY_ICON_CHOICES,
  EXTENDED_ICON_CHOICES,
  PresetIconChoice,
} from '../../constants/PresetIconMap';
import type { ThemeColors } from '../../constants/Theme';
import type { PresetRenameModalState } from './usePresetRename';

interface PresetRenameModalProps {
  state: PresetRenameModalState;
  colors: ThemeColors;
}

/**
 * Custom-preset rename dialog: name field (≤16 chars) + icon picker.
 * Presentational; all state and actions come from usePresetRename via `state`.
 */
export const PresetRenameModal: React.FC<PresetRenameModalProps> = ({ state, colors }) => {
  const { t } = useTranslation();
  const {
    renameTargetId,
    renameTargetPreset,
    renameInput,
    setRenameInput,
    renameSaving,
    renameIconId,
    setRenameIconId,
    showMoreIcons,
    setShowMoreIcons,
    isRenameKeyboardVisible,
    closeRenameModal,
    submitRename,
    getPresetLabel,
  } = state;

  return (
    <Modal
      visible={renameTargetId !== null}
      transparent={true}
      animationType="fade"
      onRequestClose={closeRenameModal}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, styles.modalOverlayBg]}
            activeOpacity={1}
            onPress={closeRenameModal}
          />
          <ScrollView
            style={styles.renameModalScrollView}
            contentContainerStyle={styles.renameModalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.modalContent,
                styles.renameModalContent,
                { backgroundColor: colors.modalBg },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {t('control.renamePreset')}
              </Text>
              {renameTargetPreset && (
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    textAlign: 'center',
                    marginTop: -6,
                    marginBottom: 14,
                  }}
                >
                  {getPresetLabel(
                    renameTargetPreset.id,
                    renameTargetPreset.customName,
                    renameTargetPreset.iconId,
                  )}
                </Text>
              )}
              <TextInput
                style={[
                  styles.renameInput,
                  {
                    color: colors.textPrimary,
                    borderColor: colors.toggleBorder,
                    backgroundColor: colors.surface,
                  },
                ]}
                value={renameInput}
                onChangeText={setRenameInput}
                placeholder={t('control.presetNamePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                maxLength={16}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                editable={!renameSaving}
                returnKeyType="done"
                onSubmitEditing={submitRename}
              />
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  textAlign: 'right',
                  marginTop: 4,
                  marginBottom: 10,
                }}
              >
                {renameInput.length}/16
              </Text>

              {!isRenameKeyboardVisible && (
                <>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 12,
                      fontWeight: '600',
                      marginBottom: 6,
                    }}
                  >
                    {t('control.icon')}
                  </Text>
                  <View style={styles.iconPickerGrid}>
                    {(() => {
                      const shownChoices: PresetIconChoice[] = showMoreIcons
                        ? [...PRIMARY_ICON_CHOICES, ...EXTENDED_ICON_CHOICES]
                        : PRIMARY_ICON_CHOICES;
                      const currentIcon = renameIconId ?? renameTargetPreset?.iconId;
                      return shownChoices.map((choice) => {
                        const isSelected = currentIcon === choice.id;
                        return (
                          <TouchableOpacity
                            key={choice.id}
                            style={[
                              styles.iconPickerCell,
                              {
                                borderColor: isSelected ? colors.accent : colors.toggleBorder,
                                backgroundColor: isSelected ? colors.accentLight : colors.surface,
                              },
                            ]}
                            onPress={() => setRenameIconId(choice.id)}
                            accessibilityLabel={choice.label}
                          >
                            <Ionicons
                              name={choice.ionicon as any}
                              size={22}
                              color={isSelected ? colors.accent : colors.textSecondary}
                            />
                          </TouchableOpacity>
                        );
                      });
                    })()}
                    {!showMoreIcons && (
                      <TouchableOpacity
                        style={[
                          styles.iconPickerCell,
                          { borderColor: colors.toggleBorder, backgroundColor: colors.surface },
                        ]}
                        onPress={() => setShowMoreIcons(true)}
                        accessibilityLabel={t('control.moreIcons')}
                      >
                        <Ionicons name="add" size={22} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              <View style={styles.renameModalButtonRow}>
                <TouchableOpacity
                  style={[
                    styles.modalClose,
                    { flex: 1, backgroundColor: colors.surfaceSecondary, marginTop: 4 },
                  ]}
                  onPress={closeRenameModal}
                  disabled={renameSaving}
                >
                  <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalClose,
                    {
                      flex: 1,
                      backgroundColor: colors.accent,
                      marginTop: 4,
                      opacity: renameInput.trim().length === 0 || renameSaving ? 0.5 : 1,
                    },
                  ]}
                  onPress={submitRename}
                  disabled={renameInput.trim().length === 0 || renameSaving}
                >
                  {renameSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.modalCloseText, { color: '#fff' }]}>
                      {t('common.save')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayBg: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
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
  modalClose: {
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  modalCloseText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  renameModalScrollView: {
    flex: 1,
  },
  renameModalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  renameModalContent: {
    paddingBottom: 28,
  },
  renameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginTop: 6,
  },
  iconPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  iconPickerCell: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renameModalButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
});

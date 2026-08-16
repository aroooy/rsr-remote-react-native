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
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '../../constants/Theme';
import type { CameraModelKey } from '../../cameraModels/shared/modelManifest';
import { GoProSettingId } from '../../constants/GoProSettingId';
import { getSettingName } from '../../constants/GoProMetadata';
import { getProductDisplayName, IAPProductId } from '../../iap/IAPProducts';

export interface VisibilityControlModalProps {
  visible: boolean;
  isPurchased: boolean;
  onClose: () => void;
  colors: ThemeColors;
  modalShootingConfigurableKeys: number[];
  isVisibleByDefault: (item: number) => boolean;
  handleVisibilityChange: (item: number, value: boolean) => void;
  cameraModel: CameraModelKey;
  displayPresetId: number | undefined;
  displaySettings: Record<number, number>;
  currentProductId: string | null;
  purchaseProduct: (productId: IAPProductId) => void;
}

export const VisibilityControlModal: React.FC<VisibilityControlModalProps> = ({
  visible,
  isPurchased,
  onClose,
  colors,
  modalShootingConfigurableKeys,
  isVisibleByDefault,
  handleVisibilityChange,
  cameraModel,
  displayPresetId,
  displaySettings,
  currentProductId,
  purchaseProduct,
}) => {
  const { t } = useTranslation();

  if (!visible) return null;

  if (isPurchased) {
    return (
      <Modal
        visible={visible}
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
              {t('control.visibleAdvancedItems')}
            </Text>
            <ScrollView showsVerticalScrollIndicator={true}>
              {modalShootingConfigurableKeys.length > 0 && (
                <View style={styles.modalSectionContainer}>
                  <Text style={[styles.modalSectionHeader, { color: colors.textMuted }]}>
                    {t('control.shootingSettings')}
                  </Text>
                  {modalShootingConfigurableKeys.map((item) => {
                    const isVisible = isVisibleByDefault(item);
                    return (
                      <View
                        key={item}
                        style={[styles.visibilityRow, { borderBottomColor: colors.borderLight }]}
                      >
                        <Text style={[styles.visibilityText, { color: colors.textPrimary }]}>
                          {getSettingName(
                            item,
                            cameraModel,
                            displayPresetId,
                            displaySettings[GoProSettingId.MEDIA_FORMAT],
                          )}
                        </Text>
                        <Switch
                          value={isVisible}
                          onValueChange={(value) => handleVisibilityChange(item, value)}
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: colors.surfaceSecondary }]}
              onPress={onClose}
            >
              <Text style={[styles.modalCloseText, { color: colors.danger }]}>
                {t('common.done')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Non-purchased prompt modal
  return (
    <Modal
      visible={visible}
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
            {t('control.protuneRequired')}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              textAlign: 'center',
              marginVertical: 16,
              paddingHorizontal: 16,
            }}
          >
            {currentProductId
              ? t('control.unlockAdvancedFor', {
                  product: getProductDisplayName(currentProductId as IAPProductId),
                })
              : t('control.connectForAdvanced')}
          </Text>
          {currentProductId && (
            <TouchableOpacity
              style={{
                backgroundColor: colors.premiumAccent,
                borderRadius: 10,
                paddingVertical: 14,
                paddingHorizontal: 32,
                marginBottom: 8,
              }}
              onPress={() => {
                onClose();
                purchaseProduct(currentProductId as IAPProductId);
              }}
            >
              <Text style={{ color: '#000', fontWeight: '700', fontSize: 16, textAlign: 'center' }}>
                {t('control.upgrade', {
                  product: getProductDisplayName(currentProductId as IAPProductId),
                })}
              </Text>
            </TouchableOpacity>
          )}
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSectionContainer: {
    marginBottom: 16,
  },
  modalSectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  visibilityText: {
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  modalClose: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

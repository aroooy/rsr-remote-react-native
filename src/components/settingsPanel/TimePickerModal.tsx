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

import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '../../constants/Theme';

const TIME_PICKER_ITEM_HEIGHT = 44;

interface TimePickerModalProps {
  visible: boolean;
  /** Initial hour/minute to preselect when the modal opens. */
  initialHour: number;
  initialMinute: number;
  colors: ThemeColors;
  /** Called with the chosen hour and minute when the user taps Set. */
  onConfirm: (hour: number, minute: number) => void;
  onClose: () => void;
}

/**
 * Scheduled-capture time picker (hour 0–23, minute in 5-min steps).
 * Self-contained: owns the scroll position and selection state; the parent
 * only supplies the initial values and confirm/close callbacks.
 */
export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  initialHour,
  initialMinute,
  colors,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation();
  const [pickerHour, setPickerHour] = useState(initialHour);
  const [pickerMinute, setPickerMinute] = useState(initialMinute);
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // Sync the selection from the initial values each time the modal opens.
  useEffect(() => {
    if (visible) {
      setPickerHour(initialHour);
      setPickerMinute(initialMinute);
    }
  }, [visible, initialHour, initialMinute]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        // Scroll to the selected value position (after modal display completes)
        setTimeout(() => {
          hourScrollRef.current?.scrollTo({
            y: pickerHour * TIME_PICKER_ITEM_HEIGHT,
            animated: false,
          });
          const minuteIndex = Math.round(pickerMinute / 5);
          minuteScrollRef.current?.scrollTo({
            y: minuteIndex * TIME_PICKER_ITEM_HEIGHT,
            animated: false,
          });
        }, 50);
      }}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, styles.modalOverlayBg]}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            {t('control.setScheduleTime')}
          </Text>
          <View style={styles.timePickerRow}>
            {/* Hour picker */}
            <View style={styles.timePickerColumn}>
              <Text style={[styles.timePickerLabel, { color: colors.textMuted }]}>
                {t('control.hour')}
              </Text>
              <ScrollView
                ref={hourScrollRef}
                style={styles.timePickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.timePickerItem,
                      pickerHour === h && { backgroundColor: colors.accentLight },
                    ]}
                    onPress={() => setPickerHour(h)}
                  >
                    <Text
                      style={[
                        styles.timePickerItemText,
                        { color: colors.textSecondary },
                        pickerHour === h && styles.timePickerItemTextSelected,
                        pickerHour === h && { color: colors.accent },
                      ]}
                    >
                      {String(h).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={[styles.timePickerColon, { color: colors.textPrimary }]}>:</Text>
            {/* Minute picker (5-minute steps) */}
            <View style={styles.timePickerColumn}>
              <Text style={[styles.timePickerLabel, { color: colors.textMuted }]}>
                {t('control.min')}
              </Text>
              <ScrollView
                ref={minuteScrollRef}
                style={styles.timePickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.timePickerItem,
                      pickerMinute === m && { backgroundColor: colors.accentLight },
                    ]}
                    onPress={() => setPickerMinute(m)}
                  >
                    <Text
                      style={[
                        styles.timePickerItemText,
                        { color: colors.textSecondary },
                        pickerMinute === m && styles.timePickerItemTextSelected,
                        pickerMinute === m && { color: colors.accent },
                      ]}
                    >
                      {String(m).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.modalClose, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => {
              onConfirm(pickerHour, pickerMinute);
              onClose();
            }}
          >
            <Text style={[styles.modalCloseText, { color: colors.danger }]}>
              {t('control.set')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalClose, { marginTop: 4, backgroundColor: colors.surfaceSecondary }]}
            onPress={onClose}
          >
            <Text style={[styles.modalCloseText, { color: colors.textMuted }]}>
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
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 16,
  },
  timePickerColumn: {
    alignItems: 'center',
    width: 70,
  },
  timePickerLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timePickerScroll: {
    height: 200,
    width: 70,
  },
  timePickerItem: {
    height: TIME_PICKER_ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  timePickerItemText: {
    fontSize: 20,
    color: '#495057',
    fontVariant: ['tabular-nums'],
  },
  timePickerItemTextSelected: {
    color: '#4361ee',
    fontWeight: '700',
  },
  timePickerColon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#343a40',
    marginTop: 36,
  },
});

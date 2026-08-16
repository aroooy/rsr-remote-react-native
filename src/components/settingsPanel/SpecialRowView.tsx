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
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import type { SpecialRow, SpecialRowAction } from '../../cameraModels/shared/types';
import type { ThemeColors } from '../../constants/Theme';

export interface SpecialRowViewProps {
  row: SpecialRow;
  colors: ThemeColors;
  onHandleActions: (actions: readonly SpecialRowAction[]) => Promise<void>;
}

export const SpecialRowView: React.FC<SpecialRowViewProps> = ({
  row,
  colors,
  onHandleActions,
}) => {
  return (
    <View style={[styles.primaryItemContainer, { borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toggleGroup}>
        <View style={styles.toggleLabelChip} pointerEvents="none">
          <Text style={[styles.toggleLabelChipText, { color: colors.textMuted }]}>
            {row.label}
          </Text>
        </View>
        {row.options.map((option) => {
          const isSelected = option.isSelected;
          return (
            <TouchableOpacity
              key={option.key}
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
              onPress={() => {
                void onHandleActions(option.actions);
              }}
              disabled={option.actions.length === 0}
            >
              <Text
                style={[
                  styles.toggleText,
                  isSelected && styles.toggleTextSelected,
                  !isSelected && { color: colors.textSecondary },
                ]}
              >
                {option.label}
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

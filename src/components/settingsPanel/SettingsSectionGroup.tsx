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
import { View, Text, TouchableOpacity } from 'react-native';
import type { ThemeColors } from '../../constants/Theme';
import type { IAPProductId } from '../../iap/IAPProducts';

export function renderGridItemsHelper(
  keys: number[],
  columnCount: number,
  renderer: (id: number) => React.ReactNode,
  gridRowStyle: any,
): React.ReactNode {
  if (columnCount <= 1) {
    return keys.map(renderer);
  }
  const rows: number[][] = [];
  for (let i = 0; i < keys.length; i += columnCount) {
    rows.push(keys.slice(i, i + columnCount));
  }
  return rows.map((row, rowIdx) => (
    <View key={rowIdx} style={gridRowStyle}>
      {row.map((id) => (
        <View key={id} style={{ flex: 1 }}>
          {renderer(id)}
        </View>
      ))}
      {row.length < columnCount &&
        Array.from({ length: columnCount - row.length }, (_, i) => (
          <View key={`pad-${i}`} style={{ flex: 1 }} />
        ))}
    </View>
  ));
}

export function renderLockedRowHelper(
  colors: ThemeColors,
  currentProductId: string | null,
  t: (key: string, options?: Record<string, any>) => string,
  getProductDisplayName: (productId: IAPProductId) => string,
  purchaseProduct: (productId: IAPProductId) => void,
): React.ReactNode {
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: colors.lockedBg,
        borderRadius: 10,
        marginTop: 4,
      }}
      onPress={() => {
        if (currentProductId) {
          purchaseProduct(currentProductId as IAPProductId);
        }
      }}
    >
      <Text style={{ fontSize: 24, marginRight: 8 }}>🔒</Text>
      <Text style={{ color: colors.lockedText, fontSize: 14, fontWeight: '600' }}>
        {currentProductId
          ? t('control.upgradeToUnlock', {
              product: getProductDisplayName(currentProductId as IAPProductId),
            })
          : t('control.connectToUnlock')}
      </Text>
    </TouchableOpacity>
  );
}

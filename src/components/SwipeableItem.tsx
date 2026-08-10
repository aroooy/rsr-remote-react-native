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
import { Animated, PanResponder, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '../constants/Theme';

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  disabled?: boolean;
  /** Swiping is only enabled for rows that support actions (known devices). */
  active?: boolean;
  colors: ThemeColors;
}

/**
 * Swipe-to-reveal action wrapper for device rows: swiping left exposes
 * move-up / move-down / delete buttons behind the card.
 */
export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  onDelete,
  onMoveUp,
  onMoveDown,
  disabled,
  active,
  colors,
}) => {
  const { t } = useTranslation();
  const [cardHeight, setCardHeight] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const hasUp = !!onMoveUp;
  const hasDown = !!onMoveDown;
  const actionButtonWidth = 64;
  const buttonWidth = actionButtonWidth * (1 + (hasUp ? 1 : 0) + (hasDown ? 1 : 0));

  // The PanResponder below is created once (useRef), so its callbacks would
  // capture the first render's props. Mirror the live values into refs so the
  // gesture handlers always see the current active/disabled state and the
  // current button width (which changes when the row gains/loses move buttons).
  const activeRef = useRef(active);
  const disabledRef = useRef(disabled);
  const buttonWidthRef = useRef(buttonWidth);
  activeRef.current = active;
  disabledRef.current = disabled;
  buttonWidthRef.current = buttonWidth;

  const handleLayout = (event: { nativeEvent: { layout: { height: number } } }) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== cardHeight) {
      setCardHeight(height);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!activeRef.current || disabledRef.current) return false;
        const { dx, dy } = gestureState;
        // Detect horizontal swipe: significant horizontal movement and horizontal > vertical
        return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!activeRef.current || disabledRef.current) return;
        let newX = gestureState.dx;
        // Do not allow swiping to the right
        if (newX > 0) newX = 0;
        // Apply resistance if swiped beyond button width
        const openWidth = buttonWidthRef.current;
        if (newX < -openWidth - 20) {
          const overflow = newX + openWidth + 20;
          newX = -openWidth - 20 + overflow * 0.2;
        }
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!activeRef.current || disabledRef.current) return;
        // Snap open if swiped significantly, otherwise snap back
        if (gestureState.dx < -30) {
          Animated.spring(translateX, {
            toValue: -buttonWidthRef.current,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    }),
  ).current;

  const close = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (disabled) {
      close();
    }
  }, [disabled]);

  return (
    <View style={{ position: 'relative', marginVertical: 6 }}>
      {active && !disabled && cardHeight > 0 && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: 4,
            height: cardHeight - 8,
            width: buttonWidth,
            flexDirection: 'row',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {hasUp && (
            <TouchableOpacity
              style={{
                width: actionButtonWidth,
                backgroundColor: '#007aff',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => {
                close();
                onMoveUp?.();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-up-outline" size={20} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 11, marginTop: 4, fontWeight: 'bold' }}>
                {t('common.up')}
              </Text>
            </TouchableOpacity>
          )}

          {hasDown && (
            <TouchableOpacity
              style={{
                width: actionButtonWidth,
                backgroundColor: '#5856d6',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => {
                close();
                onMoveDown?.();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-down-outline" size={20} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 11, marginTop: 4, fontWeight: 'bold' }}>
                {t('common.down')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={{
              width: actionButtonWidth,
              backgroundColor: colors.danger,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => {
              close();
              onDelete();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 11, marginTop: 4, fontWeight: 'bold' }}>
              {t('common.delete')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View
        onLayout={handleLayout}
        style={{
          transform: [{ translateX }],
          backgroundColor: colors.surface,
          borderRadius: 12,
        }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

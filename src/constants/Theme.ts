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

import { StatusBarStyle } from 'expo-status-bar';

export type AppTheme = 'light' | 'dark';

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceSecondary: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Accent
  accent: string;
  accentLight: string;

  // Borders
  border: string;
  borderLight: string;

  // Danger
  danger: string;

  // Status (shared semantic colors for camera state indicators)
  success: string; // connected / GPS lock / OK
  warning: string; // searching / hindsight / SD warning / on-camera
  recording: string; // active recording dot & shutter inner
  cold: string; // low-temperature indicator
  busy: string; // syncing / short-term busy

  // Overlay
  overlay: string;

  // Shutter
  shutterBg: string;
  shutterText: string;
  // Shutter (new circular design)
  shutterRing: string; // outer ring color
  shutterInnerIdle: string; // inner fill when idle
  shutterInnerRecording: string; // inner fill while recording

  // Mode selector
  modeActive: string; // common active background for Video/Photo/Timelapse tabs
  modeActiveText: string;

  // Toggle
  toggleBg: string;
  toggleBorder: string;
  toggleSelectedBg: string;
  toggleSelectedText: string;

  // Switch track
  switchTrackOff: string;
  switchTrackOn: string;

  // Modal
  modalBg: string;

  // StatusBar
  statusBarStyle: StatusBarStyle;

  // Navigation header
  headerBackground: string;
  headerText: string;

  // Input
  inputBg: string;
  inputBorder: string;
  inputText: string;
  placeholderText: string;

  // Slider
  sliderRail: string;

  // Recording
  recordingBorder: string;
  recordingDot: string;
  recordingText: string;

  // Lock / Premium
  lockedBg: string;
  lockedText: string;
  premiumAccent: string;
}

const lightColors: ThemeColors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  surfaceSecondary: '#f1f3f5',

  textPrimary: '#343a40',
  textSecondary: '#495057',
  textMuted: '#868e96',

  accent: '#0096c7',
  accentLight: '#dff3fb',

  border: '#e9ecef',
  borderLight: '#f1f3f5',

  danger: '#dc3545',

  success: '#22c55e',
  warning: '#f59e0b',
  recording: '#ef4444',
  cold: '#38bdf8',
  busy: '#a78bfa',

  overlay: 'rgba(255, 255, 255, 0.8)',

  shutterBg: '#343a40',
  shutterText: '#ffffff',
  shutterRing: '#343a40',
  shutterInnerIdle: '#E53935',
  shutterInnerRecording: '#ef4444',

  modeActive: '#E53935',
  modeActiveText: '#ffffff',

  toggleBg: '#f8f9fa',
  toggleBorder: '#ced4da',
  toggleSelectedBg: '#0096c7',
  toggleSelectedText: '#ffffff',

  switchTrackOff: '#ced4da',
  switchTrackOn: '#0096c7',

  modalBg: '#ffffff',

  statusBarStyle: 'dark',

  headerBackground: '#ffffff',
  headerText: '#343a40',

  inputBg: '#ffffff',
  inputBorder: '#ced4da',
  inputText: '#212529',
  placeholderText: '#adb5bd',

  sliderRail: '#dee2e6',

  recordingBorder: '#fa5252',
  recordingDot: '#fa5252',
  recordingText: '#fa5252',

  lockedBg: '#f8f9fa',
  lockedText: '#868e96',
  premiumAccent: '#ffc107',
};

const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1e1e1e',
  surfaceSecondary: '#2a2a2a',

  textPrimary: '#e0e0e0',
  textSecondary: '#b0b0b0',
  textMuted: '#787878',

  accent: '#2bb3e0',
  accentLight: '#0a3a4c',

  border: '#333333',
  borderLight: '#2a2a2a',

  danger: '#ff6b6b',

  success: '#30d158',
  warning: '#f59e0b',
  recording: '#ff5a5f',
  cold: '#38bdf8',
  busy: '#a78bfa',

  overlay: 'rgba(0, 0, 0, 0.7)',

  shutterBg: '#e0e0e0',
  shutterText: '#121212',
  shutterRing: '#e0e0e0',
  shutterInnerIdle: '#E53935',
  shutterInnerRecording: '#ff5a5f',

  modeActive: '#E53935',
  modeActiveText: '#ffffff',

  toggleBg: '#2a2a2a',
  toggleBorder: '#444444',
  toggleSelectedBg: '#2bb3e0',
  toggleSelectedText: '#ffffff',

  switchTrackOff: '#444444',
  switchTrackOn: '#2bb3e0',

  modalBg: '#1e1e1e',

  statusBarStyle: 'light',

  headerBackground: '#1e1e1e',
  headerText: '#e0e0e0',

  inputBg: '#2a2a2a',
  inputBorder: '#444444',
  inputText: '#e0e0e0',
  placeholderText: '#787878',

  sliderRail: '#444444',

  recordingBorder: '#ff6b6b',
  recordingDot: '#ff6b6b',
  recordingText: '#ff6b6b',

  lockedBg: '#2a2a2a',
  lockedText: '#787878',
  premiumAccent: '#ffd700',
};

export const getThemeColors = (theme: AppTheme): ThemeColors => {
  return theme === 'dark' ? darkColors : lightColors;
};

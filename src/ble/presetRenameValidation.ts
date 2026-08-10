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

import { t } from '../i18n';

const CUSTOM_PRESET_NAME_PATTERN = /^[A-Za-z0-9 _-]+$/;

export const CUSTOM_PRESET_NAME_MAX_LENGTH = 16;

export const getCustomPresetNameValidationError = (name: string): string | null => {
  const trimmed = name.trim();

  if (trimmed.length === 0 || trimmed.length > CUSTOM_PRESET_NAME_MAX_LENGTH) {
    return t('validation.presetNameLength');
  }

  if (!CUSTOM_PRESET_NAME_PATTERN.test(trimmed)) {
    return t('validation.presetNameChars');
  }

  return null;
};

export const isValidCustomPresetName = (name: string): boolean => {
  return getCustomPresetNameValidationError(name) === null;
};

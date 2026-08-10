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

import { describe, it, expect, vi } from 'vitest';
import {
  getCustomPresetNameValidationError,
  isValidCustomPresetName,
  CUSTOM_PRESET_NAME_MAX_LENGTH,
} from './presetRenameValidation';

// Mock the i18n t function (replace with a fake implementation)
vi.mock('../i18n', () => ({
  t: (key: string) => `[translation:${key}]`,
}));

describe('getCustomPresetNameValidationError', () => {
  it('valid name returns no error', () => {
    expect(getCustomPresetNameValidationError('My Preset')).toBeNull();
    expect(getCustomPresetNameValidationError('test-name_1')).toBeNull();
    expect(getCustomPresetNameValidationError('A')).toBeNull();
  });

  it('trims whitespace before validating', () => {
    expect(getCustomPresetNameValidationError('  My Preset  ')).toBeNull();
  });

  it('returns error for empty name', () => {
    expect(getCustomPresetNameValidationError('')).toMatch(
      /translation:validation.presetNameLength/,
    );
    expect(getCustomPresetNameValidationError('   ')).toMatch(
      /translation:validation.presetNameLength/,
    );
  });

  it('returns error for name exceeding max length', () => {
    const tooLong = 'a'.repeat(CUSTOM_PRESET_NAME_MAX_LENGTH + 1);
    expect(getCustomPresetNameValidationError(tooLong)).toMatch(
      /translation:validation.presetNameLength/,
    );
  });

  it('accepts name at exactly max length', () => {
    const exact = 'a'.repeat(CUSTOM_PRESET_NAME_MAX_LENGTH);
    expect(getCustomPresetNameValidationError(exact)).toBeNull();
  });

  it('returns error for invalid characters', () => {
    expect(getCustomPresetNameValidationError('test!name')).toMatch(
      /translation:validation.presetNameChars/,
    );
    expect(getCustomPresetNameValidationError('日本語')).toMatch(
      /translation:validation.presetNameChars/,
    );
    expect(getCustomPresetNameValidationError('my.preset')).toMatch(
      /translation:validation.presetNameChars/,
    );
  });
});

describe('isValidCustomPresetName', () => {
  it('returns true for valid names', () => {
    expect(isValidCustomPresetName('My Preset')).toBe(true);
    expect(isValidCustomPresetName('test-name_1')).toBe(true);
  });

  it('returns false for invalid names', () => {
    expect(isValidCustomPresetName('')).toBe(false);
    expect(isValidCustomPresetName('test!name')).toBe(false);
  });
});

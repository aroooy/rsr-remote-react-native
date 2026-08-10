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

import { describe, it, expect } from 'vitest';
import {
  encodeRequestGetPresetStatus,
  encodeRequestCustomPresetUpdate,
  decodeResponseGeneric,
  PRESET_TITLE_USER_DEFINED_CUSTOM_NAME,
  RESULT_SUCCESS,
} from './PresetProtobuf';

describe('encodeRequestGetPresetStatus', () => {
  it('returns expected byte sequence', () => {
    const bytes = encodeRequestGetPresetStatus();
    // field1=varint(0x08), val=1(0x01), field3=varint(0x18), val=1(0x01), field4=varint(0x20), val=1(0x01)
    expect(bytes).toEqual([0x08, 0x01, 0x18, 0x01, 0x20, 0x01]);
  });
});

describe('encodeRequestCustomPresetUpdate', () => {
  it('encodes titleId only', () => {
    const bytes = encodeRequestCustomPresetUpdate({ titleId: 94 });
    // field1=varint(0x08), val=94(0x5E)
    expect(bytes).toEqual([0x08, 0x5e]);
  });

  it('encodes iconId only', () => {
    const bytes = encodeRequestCustomPresetUpdate({ iconId: 5 });
    // field3=varint(0x18), val=5(0x05)
    expect(bytes).toEqual([0x18, 0x05]);
  });

  it('encodes customName (ASCII)', () => {
    const bytes = encodeRequestCustomPresetUpdate({ customName: 'AB' });
    // field2=length-delimited(0x12), length=2(0x02), 'A'(0x41), 'B'(0x42)
    expect(bytes).toEqual([0x12, 0x02, 0x41, 0x42]);
  });

  it('encodes all fields together', () => {
    const bytes = encodeRequestCustomPresetUpdate({
      titleId: PRESET_TITLE_USER_DEFINED_CUSTOM_NAME,
      customName: 'Test',
      iconId: 3,
    });
    // field1: 0x08 0x5e (94)
    // field2: 0x12 0x04 'T' 'e' 's' 't'
    // field3: 0x18 0x03
    expect(bytes).toEqual([0x08, 0x5e, 0x12, 0x04, 0x54, 0x65, 0x73, 0x74, 0x18, 0x03]);
  });

  it('encodes empty options as empty array', () => {
    expect(encodeRequestCustomPresetUpdate({})).toEqual([]);
  });

  it('encodes multi-byte UTF-8 characters', () => {
    // "é" = 0xC3 0xA9 in UTF-8
    const bytes = encodeRequestCustomPresetUpdate({ customName: 'é' });
    expect(bytes[0]).toBe(0x12); // field2 tag
    expect(bytes[1]).toBe(0x02); // length 2
    expect(bytes[2]).toBe(0xc3);
    expect(bytes[3]).toBe(0xa9);
  });

  it('encodes emoji (surrogate pair)', () => {
    // "😀" = 4 bytes in UTF-8: F0 9F 98 80
    const bytes = encodeRequestCustomPresetUpdate({ customName: '😀' });
    expect(bytes[0]).toBe(0x12); // field2 tag
    expect(bytes[1]).toBe(0x04); // length 4
    expect(bytes[2]).toBe(0xf0);
    expect(bytes[3]).toBe(0x9f);
    expect(bytes[4]).toBe(0x98);
    expect(bytes[5]).toBe(0x80);
  });
});

describe('decodeResponseGeneric', () => {
  it('decodes success response', () => {
    // field1=varint(0x08), val=1(0x01)
    const { result } = decodeResponseGeneric([0x08, 0x01]);
    expect(result).toBe(RESULT_SUCCESS);
  });

  it('decodes failure response', () => {
    // field1=varint(0x08), val=2(0x02)
    const { result } = decodeResponseGeneric([0x08, 0x02]);
    expect(result).toBe(2);
  });

  it('decodes empty bytes as result 0', () => {
    const { result } = decodeResponseGeneric([]);
    expect(result).toBe(0);
  });
});

describe('PRESET_TITLE_USER_DEFINED_CUSTOM_NAME', () => {
  it('equals 94', () => {
    expect(PRESET_TITLE_USER_DEFINED_CUSTOM_NAME).toBe(94);
  });
});

describe('RESULT_SUCCESS', () => {
  it('equals 1', () => {
    expect(RESULT_SUCCESS).toBe(1);
  });
});

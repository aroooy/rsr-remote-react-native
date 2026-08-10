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

/**
 * Minimal hand-written protobuf encoder/decoder for GoPro preset status.
 *
 * Covers:
 *   - RequestGetPresetStatus  (request_get_preset_status.proto)
 *   - NotifyPresetStatus      (preset_status.proto)
 *
 * Wire format reference: https://protobuf.dev/programming-guides/encoding/
 *   Wire type 0 = varint
 *   Wire type 2 = length-delimited (bytes / string / embedded message / repeated)
 *   tag = (field_number << 3) | wire_type
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GoProPresetSetting = {
  id: number;
  value: number;
  isCaption: boolean;
};

export type GoProPreset = {
  id: number;
  titleId: number;
  titleNumber: number;
  basePresetId?: number;
  userDefined: boolean;
  isModified: boolean;
  isFixed: boolean;
  isVisible: boolean;
  customName: string | null;
  iconId: number; // EnumPresetIcon
  settings: GoProPresetSetting[];
};

export type GoProPresetGroupData = {
  groupId: number; // EnumPresetGroup: 1000=Video, 1001=Photo, 1002=Timelapse
  presets: GoProPreset[];
};

// ---------------------------------------------------------------------------
// Encoder: RequestGetPresetStatus
//
// Fields:
//   1 (repeated varint): register_preset_status  → [1] = PRESET
//   3 (optional bool):   use_constant_setting_ids → true
//   4 (optional bool):   include_hidden           → true
// ---------------------------------------------------------------------------

export function encodeRequestGetPresetStatus(): number[] {
  const bytes: number[] = [];
  // field 1, wire type 0 (varint): register_preset_status = 1
  bytes.push(0x08, 0x01);
  // field 3, wire type 0 (varint): use_constant_setting_ids = true (1)
  bytes.push(0x18, 0x01);
  // field 4, wire type 0 (varint): include_hidden = true (1)
  bytes.push(0x20, 0x01);
  return bytes;
}

// ---------------------------------------------------------------------------
// Decoder helpers
// ---------------------------------------------------------------------------

function readVarint(bytes: number[], offset: number): { value: number; offset: number } {
  let result = 0;
  let shift = 0;
  while (offset < bytes.length) {
    const b = bytes[offset++];
    result |= (b & 0x7f) << shift;
    shift += 7;
    if ((b & 0x80) === 0) break;
  }
  return { value: result, offset };
}

function readLengthDelimited(bytes: number[], offset: number): { data: number[]; offset: number } {
  const len = readVarint(bytes, offset);
  offset = len.offset;
  const data = bytes.slice(offset, offset + len.value);
  return { data, offset: offset + len.value };
}

function readUtf8String(bytes: number[]): string {
  return bytes.map((b) => String.fromCharCode(b)).join('');
}

// ---------------------------------------------------------------------------
// Decoder: PresetSetting (field 7 inside Preset)
//   1: id (varint)
//   2: value (varint)
//   3: is_caption (varint bool)
// ---------------------------------------------------------------------------

function decodePresetSetting(bytes: number[]): GoProPresetSetting {
  let offset = 0;
  let id = 0;
  let value = 0;
  let isCaption = false;

  while (offset < bytes.length) {
    const tag = readVarint(bytes, offset);
    offset = tag.offset;
    const fieldNumber = tag.value >>> 3;
    const wireType = tag.value & 0x07;

    if (wireType === 0) {
      const v = readVarint(bytes, offset);
      offset = v.offset;
      if (fieldNumber === 1) id = v.value;
      else if (fieldNumber === 2) value = v.value;
      else if (fieldNumber === 3) isCaption = v.value !== 0;
    } else if (wireType === 2) {
      const ld = readLengthDelimited(bytes, offset);
      offset = ld.offset;
      // unexpected length-delimited field — skip
    } else {
      break; // unknown wire type, stop
    }
  }

  return { id, value, isCaption };
}

// ---------------------------------------------------------------------------
// Decoder: Preset (field 2 inside PresetGroup)
//   1:  id            (varint)
//   2:  mode          (varint, EnumFlatMode)
//   3:  title_id      (varint, EnumPresetTitle)
//   4:  title_number  (varint)
//   5:  user_defined  (varint bool)
//   6:  icon          (varint, EnumPresetIcon)
//   7:  setting_array (length-delimited, repeated)
//   8:  is_modified   (varint bool)
//   9:  is_fixed      (varint bool)
//   10: custom_name   (length-delimited, string)
//   11: is_visible    (varint bool)
// ---------------------------------------------------------------------------

function decodePreset(bytes: number[]): GoProPreset {
  let offset = 0;
  let id = 0;
  let basePresetId: number | undefined; // raw EnumFlatMode from protobuf field 2; normalized later
  let titleId = 0;
  let titleNumber = 0;
  let userDefined = false;
  let isModified = false;
  let isFixed = false;
  let isVisible = true;
  let customName: string | null = null;
  let iconId = 0;
  const settings: GoProPresetSetting[] = [];

  while (offset < bytes.length) {
    const tag = readVarint(bytes, offset);
    offset = tag.offset;
    const fieldNumber = tag.value >>> 3;
    const wireType = tag.value & 0x07;

    if (wireType === 0) {
      const v = readVarint(bytes, offset);
      offset = v.offset;
      if (fieldNumber === 1) id = v.value;
      else if (fieldNumber === 2) basePresetId = v.value;
      else if (fieldNumber === 3) titleId = v.value;
      else if (fieldNumber === 4) titleNumber = v.value;
      else if (fieldNumber === 5) userDefined = v.value !== 0;
      else if (fieldNumber === 6) iconId = v.value;
      else if (fieldNumber === 8) isModified = v.value !== 0;
      else if (fieldNumber === 9) isFixed = v.value !== 0;
      else if (fieldNumber === 11) isVisible = v.value !== 0;
    } else if (wireType === 2) {
      const ld = readLengthDelimited(bytes, offset);
      offset = ld.offset;
      if (fieldNumber === 7) {
        settings.push(decodePresetSetting(ld.data));
      } else if (fieldNumber === 10) {
        customName = readUtf8String(ld.data);
      }
      // other length-delimited fields (e.g. mode=2) skipped
    } else {
      break;
    }
  }

  return {
    id,
    titleId,
    titleNumber,
    basePresetId,
    userDefined,
    isModified,
    isFixed,
    isVisible,
    customName,
    iconId,
    settings,
  };
}

// ---------------------------------------------------------------------------
// Decoder: PresetGroup (field 1 inside NotifyPresetStatus)
//   1: id           (varint, EnumPresetGroup)
//   2: preset_array (length-delimited, repeated)
//   3: can_add_preset (varint bool)
//   4: icon         (varint, EnumPresetGroupIcon)
//   5: mode_array   (varint, repeated)
// ---------------------------------------------------------------------------

function decodePresetGroup(bytes: number[]): GoProPresetGroupData {
  let offset = 0;
  let groupId = 0;
  const presets: GoProPreset[] = [];

  while (offset < bytes.length) {
    const tag = readVarint(bytes, offset);
    offset = tag.offset;
    const fieldNumber = tag.value >>> 3;
    const wireType = tag.value & 0x07;

    if (wireType === 0) {
      const v = readVarint(bytes, offset);
      offset = v.offset;
      if (fieldNumber === 1) groupId = v.value;
    } else if (wireType === 2) {
      const ld = readLengthDelimited(bytes, offset);
      offset = ld.offset;
      if (fieldNumber === 2) {
        presets.push(decodePreset(ld.data));
      }
      // other length-delimited fields skipped
    } else {
      break;
    }
  }

  return { groupId, presets };
}

// ---------------------------------------------------------------------------
// Decoder: NotifyPresetStatus (top-level)
//   1: preset_group_array (length-delimited, repeated PresetGroup)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Encoder: RequestCustomPresetUpdate
//
// Fields:
//   1 (optional varint):  title_id    (EnumPresetTitle, 94 = USER_DEFINED_CUSTOM_NAME)
//   2 (optional string):  custom_name (UTF-8, 1-16 chars; used when title_id = 94)
//   3 (optional varint):  icon_id     (EnumPresetIcon)
//
// Supported by HERO12 / HERO13 / MAX 2 on the currently active custom preset
// (user_defined = true). Returns ResponseGeneric.
// ---------------------------------------------------------------------------

export const PRESET_TITLE_USER_DEFINED_CUSTOM_NAME = 94;

function encodeVarint(value: number): number[] {
  const out: number[] = [];
  let v = value >>> 0;
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v = v >>> 7;
  }
  out.push(v & 0x7f);
  return out;
}

function encodeUtf8String(str: string): number[] {
  // Buffer is polyfilled by 'buffer' package elsewhere; use manual UTF-8 here
  // to avoid importing Buffer into this pure-logic module.
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      // surrogate pair
      const hi = code;
      const lo = str.charCodeAt(++i);
      const cp = 0x10000 + ((hi - 0xd800) << 10) + (lo - 0xdc00);
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return bytes;
}

export function encodeRequestCustomPresetUpdate(opts: {
  titleId?: number;
  customName?: string;
  iconId?: number;
}): number[] {
  const bytes: number[] = [];
  if (opts.titleId !== undefined) {
    // field 1, wire type 0 (varint)
    bytes.push(0x08, ...encodeVarint(opts.titleId));
  }
  if (opts.customName !== undefined) {
    // field 2, wire type 2 (length-delimited string)
    const strBytes = encodeUtf8String(opts.customName);
    bytes.push(0x12, ...encodeVarint(strBytes.length), ...strBytes);
  }
  if (opts.iconId !== undefined) {
    // field 3, wire type 0 (varint)
    bytes.push(0x18, ...encodeVarint(opts.iconId));
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Decoder: ResponseGeneric
//   1: result (varint, EnumResultGeneric: 1 = SUCCESS)
// ---------------------------------------------------------------------------

export const RESULT_SUCCESS = 1;

export function decodeResponseGeneric(bytes: number[]): { result: number } {
  let offset = 0;
  let result = 0;
  while (offset < bytes.length) {
    const tag = readVarint(bytes, offset);
    offset = tag.offset;
    const fieldNumber = tag.value >>> 3;
    const wireType = tag.value & 0x07;
    if (wireType === 0) {
      const v = readVarint(bytes, offset);
      offset = v.offset;
      if (fieldNumber === 1) result = v.value;
    } else if (wireType === 2) {
      const ld = readLengthDelimited(bytes, offset);
      offset = ld.offset;
    } else {
      break;
    }
  }
  return { result };
}

export function decodeNotifyPresetStatus(bytes: number[]): GoProPresetGroupData[] {
  let offset = 0;
  const groups: GoProPresetGroupData[] = [];

  while (offset < bytes.length) {
    const tag = readVarint(bytes, offset);
    offset = tag.offset;
    const fieldNumber = tag.value >>> 3;
    const wireType = tag.value & 0x07;

    if (wireType === 2) {
      const ld = readLengthDelimited(bytes, offset);
      offset = ld.offset;
      if (fieldNumber === 1) {
        groups.push(decodePresetGroup(ld.data));
      }
    } else if (wireType === 0) {
      const v = readVarint(bytes, offset);
      offset = v.offset;
      // no varint fields at top level — skip
    } else {
      break;
    }
  }

  return groups;
}

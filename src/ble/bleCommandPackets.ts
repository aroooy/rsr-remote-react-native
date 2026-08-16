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
 * Pure functions for constructing binary command byte arrays for GoPro BLE communication.
 * Separated from GoProBLEManager.ts to enable unit testing and clean architectural boundaries.
 */

/**
 * Packet: [0x03, 0x01, 0x01, 0x01 (start) or 0x00 (stop)]
 */
export function buildShutterPacket(isStart: boolean): number[] {
  return [0x03, 0x01, 0x01, isStart ? 0x01 : 0x00];
}

/**
 * Packet: [0x06, 0x40, 0x04, b3, b2, b1, b0] — 4-byte Big-Endian preset ID
 */
export function buildLoadPresetPacket(presetId: number): number[] {
  const b3 = (presetId >> 24) & 0xff;
  const b2 = (presetId >> 16) & 0xff;
  const b1 = (presetId >> 8) & 0xff;
  const b0 = presetId & 0xff;
  return [0x06, 0x40, 0x04, b3, b2, b1, b0];
}

/**
 * Packet: [0x04, 0x3E, 0x02, 0x03, selectId]
 */
export function buildLoadPresetGroupPacket(selectId: number): number[] {
  return [0x04, 0x3e, 0x02, 0x03, selectId];
}

/**
 * Packet:
 * 4-byte: [0x06, bleSetting, 0x04, b3, b2, b1, b0]
 * 1-byte: [0x03, bleSetting, 0x01, value]
 */
export function buildSetSettingPacket(
  bleSetting: number,
  value: number,
  isFourByte: boolean,
): number[] {
  if (isFourByte) {
    const b3 = (value >> 24) & 0xff;
    const b2 = (value >> 16) & 0xff;
    const b1 = (value >> 8) & 0xff;
    const b0 = value & 0xff;
    return [0x06, bleSetting, 0x04, b3, b2, b1, b0];
  }
  return [0x03, bleSetting, 0x01, value];
}

/**
 * HERO11 or newer: [0x0C, 0x0F, 0x0A, YY_H, YY_L, MM, DD, HH, mm, SS, OF_H, OF_L, 0x01] (UTC + offset)
 * HERO10 or older: [0x09, 0x0D, 0x07, YY_H, YY_L, MM, DD, HH, mm, SS] (Local time)
 */
export function buildSetDateTimePacket(date: Date, isHero11OrNewer: boolean): number[] {
  if (isHero11OrNewer) {
    const utcYear = date.getUTCFullYear();
    const utcMonth = date.getUTCMonth() + 1;
    const utcDay = date.getUTCDate();
    const utcHour = date.getUTCHours();
    const utcMin = date.getUTCMinutes();
    const utcSec = date.getUTCSeconds();

    // getTimezoneOffset() returns difference from UTC in minutes (UTC+9 -> -540)
    // Legacy app: intValue = utcOffsetMinutes + 60 (big-endian int16)
    const utcOffsetMinutes = -date.getTimezoneOffset();
    const offsetValue = utcOffsetMinutes + 60;
    const ofH = (offsetValue >> 8) & 0xff;
    const ofL = offsetValue & 0xff;

    return [
      0x0c,
      0x0f,
      0x0a,
      (utcYear >> 8) & 0xff,
      utcYear & 0xff,
      utcMonth,
      utcDay,
      utcHour,
      utcMin,
      utcSec,
      ofH,
      ofL,
      0x01, // UTC enabled
    ];
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const min = date.getMinutes();
  const sec = date.getSeconds();

  return [
    0x09,
    0x0d,
    0x07,
    (year >> 8) & 0xff,
    year & 0xff,
    month,
    day,
    hour,
    min,
    sec,
  ];
}

/**
 * Packet: [0x06, 0xa8, 0x04, 0x00, 0x00, hour, encodedMinute]
 */
export function buildSetAutoOffPacket(hour: number, minute: number): number[] {
  const encodedMinute = minute * 4 + 3;
  return [0x06, 0xa8, 0x04, 0x00, 0x00, hour, encodedMinute];
}

/**
 * Packet: [0x06, 0x48, 0x04, 0x00, 0x00, 0x00, 0x00]
 */
export function buildClearAutoOffPacket(): number[] {
  return [0x06, 0xa8, 0x04, 0x00, 0x00, 0x00, 0x00];
}

/**
 * Packet: [0x02, 0x69, param]
 */
export function buildSetHighlightPointPacket(param: number): number[] {
  return [0x02, 0x69, param];
}

/**
 * Packet: [0x03, 0x17, 0x01, 0x01]
 */
export function buildSetAPControlPacket(): number[] {
  return [0x03, 0x17, 0x01, 0x01];
}

/**
 * Packet: [0x01, 0x00]
 */
export function buildKeepAlivePacket(): number[] {
  return [0x01, 0x00];
}

/**
 * Packet: [0x01, 0x3C]
 */
export function buildFetchHardwareInfoPacket(): number[] {
  return [0x01, 0x3c];
}

/**
 * Packet: [0xF5, 0x72, ...protobufPayload]
 */
export function buildFetchPresetStatusPacket(
  protobufPayload: Uint8Array | number[],
): number[] {
  return [0xf5, 0x72, ...protobufPayload];
}

/**
 * Packet: [0xF1, 0x64, ...protobufPayload]
 */
export function buildCustomPresetUpdatePacket(
  protobufPayload: Uint8Array | number[],
): number[] {
  return [0xf1, 0x64, ...protobufPayload];
}

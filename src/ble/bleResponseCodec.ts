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
 * Pure functions for inspecting and decoding binary notification and response packets from GoPro cameras over BLE.
 * Separated from GoProBLEManager.ts to enable isolated unit testing and clean component boundaries.
 */

import { decodeNotifyPresetStatus, decodeResponseGeneric, GoProPresetGroupData } from './PresetProtobuf';
import { parseHardwareInfo } from './GoProPacketCodec';
import { HardwareInfo } from '../types/KnownDevice';

/**
 * Checks if the byte array is a Protobuf PresetStatus response or async push.
 * Feature 0xF5, Action 0xF2 (Sync response) or 0xF3 (Async push).
 */
export function isPresetStatusPacket(data: number[]): boolean {
  return data.length >= 2 && data[0] === 0xf5 && (data[1] === 0xf2 || data[1] === 0xf3);
}

/**
 * Decodes a Protobuf PresetStatus packet data into GoProPresetGroupData array.
 * Returns null if the packet format is invalid.
 */
export function parsePresetStatusPacket(data: number[]): {
  groups: GoProPresetGroupData[];
  isSyncResponse: boolean;
} | null {
  if (!isPresetStatusPacket(data)) return null;
  const isSyncResponse = data[1] === 0xf2;
  const presetBytes = data.slice(2);
  const groups = decodeNotifyPresetStatus(presetBytes);
  return { groups, isSyncResponse };
}

/**
 * Checks if the byte array is a Hardware Info response.
 * Command 0x3C, Result 0x00 (Success).
 */
export function isHardwareInfoPacket(data: number[]): boolean {
  return data.length >= 2 && data[0] === 0x3c && data[1] === 0x00;
}

/**
 * Decodes a Hardware Info response packet into a HardwareInfo object.
 * Returns null if parsing fails or packet is not a hardware info response.
 */
export function parseHardwareInfoPacket(data: number[]): HardwareInfo | null {
  if (!isHardwareInfoPacket(data)) return null;
  return parseHardwareInfo(data);
}

/**
 * Checks if the byte array is a Custom Preset Update response.
 * Feature 0xF1, Action 0xE4 (ResponseGeneric).
 */
export function isCustomPresetUpdatePacketResponse(data: number[]): boolean {
  return data.length >= 2 && data[0] === 0xf1 && data[1] === 0xe4;
}

/**
 * Decodes a Custom Preset Update response packet into a result code object.
 * Returns null if the packet is not a custom preset update response.
 */
export function parseCustomPresetUpdatePacketResponse(data: number[]): { result: number } | null {
  if (!isCustomPresetUpdatePacketResponse(data)) return null;
  return decodeResponseGeneric(data.slice(2));
}

export type SettingWriteResult = {
  settingId: number;
  resultCode: number;
};

/**
 * Parses a 1-byte header GoPro setting write response (SETTINGS_NOTIFY).
 * GoPro settings SET response format: [1-byte-header=length, settingId, resultCode]
 * Header bit layout: bit7=continuation, bit6=2-byte-ext, bit5=12bit-ext, else 1-byte length.
 * Returns null if the bytes do not match a valid 1-byte header setting response.
 */
export function parseSettingWriteResponse(bytes: number[]): SettingWriteResult | null {
  if (bytes.length < 3) return null;
  if ((bytes[0] & 0x60) !== 0) return null; // Multi-byte header
  const len = bytes[0] & 0x3f;
  if (len < 2 || bytes.length < 1 + len) return null;
  return {
    settingId: bytes[1],
    resultCode: bytes[2],
  };
}

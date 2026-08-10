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
 * GoPro BLE packet codec — pure encode/parse helpers shared by the BLE
 * manager. No store or connection state: everything here is unit-testable.
 *
 * Packet framing (Open GoPro BLE spec):
 *   header byte layout: bit7=continuation, bit6=2-byte-ext, bit5=12bit-ext,
 *   otherwise the low 5 bits are the payload length.
 */
import { Buffer } from 'buffer';
import { HardwareInfo } from '../types/KnownDevice';

export const GOPRO_BLE_PACKET_CHUNK_SIZE = 20;
export const GOPRO_BLE_CONTINUATION_HEADER = 0x80;

export const encodeGoProPacketHeader = (payloadLength: number): number[] => {
  if (payloadLength < 0x20) {
    return [payloadLength];
  }
  if (payloadLength < 0x1000) {
    return [0x20 | ((payloadLength >> 8) & 0x0f), payloadLength & 0xff];
  }
  if (payloadLength <= 0xffff) {
    return [0x40, (payloadLength >> 8) & 0xff, payloadLength & 0xff];
  }

  throw new Error(`GoPro BLE payload too large: ${payloadLength}`);
};

/**
 * Split a payload into 20-byte GATT write chunks: the first chunk carries the
 * length header, every following chunk starts with the continuation header.
 */
export const buildGoProPacketChunks = (payload: number[]): number[][] => {
  const header = encodeGoProPacketHeader(payload.length);
  const chunks: number[][] = [];
  const firstChunkPayloadSize = GOPRO_BLE_PACKET_CHUNK_SIZE - header.length;

  if (firstChunkPayloadSize <= 0) {
    throw new Error('GoPro BLE packet header exceeds chunk size');
  }

  let offset = 0;
  chunks.push([...header, ...payload.slice(0, firstChunkPayloadSize)]);
  offset += firstChunkPayloadSize;

  while (offset < payload.length) {
    const nextOffset = offset + (GOPRO_BLE_PACKET_CHUNK_SIZE - 1);
    chunks.push([GOPRO_BLE_CONTINUATION_HEADER, ...payload.slice(offset, nextOffset)]);
    offset = nextOffset;
  }

  return chunks;
};

/**
 * Parse a Hardware Info (0x3C) command response into HardwareInfo.
 * data = [0x3C, 0x00(success), ...length-value fields]. Returns null when the
 * payload is malformed (truncated LV fields throw and are caught here).
 */
export const parseHardwareInfo = (data: number[]): HardwareInfo | null => {
  try {
    let pos = 2; // skip [commandId(0x3C), resultCode(0x00)]
    const readInt = (len: number) => {
      let val = 0;
      for (let i = 0; i < len; i++) val = (val << 8) | data[pos + i];
      pos += len;
      return val;
    };
    const readString = (len: number) => {
      const str = Buffer.from(data.slice(pos, pos + len)).toString('utf-8');
      pos += len;
      return str;
    };

    const modelNoLen = data[pos++];
    const modelNo = readInt(modelNoLen);
    const modelNameLen = data[pos++];
    const modelName = readString(modelNameLen);
    const boardTypeLen = data[pos++];
    const boardType = data[pos];
    pos += boardTypeLen;
    const fwLen = data[pos++];
    const firmwareVersion = readString(fwLen);
    const snLen = data[pos++];
    const serialNumber = readString(snLen);
    const ssidLen = data[pos++];
    const ssid = readString(ssidLen);
    const macLen = data[pos++];
    const macAddress = readString(macLen);

    return { modelNo, modelName, boardType, firmwareVersion, serialNumber, ssid, macAddress };
  } catch {
    return null;
  }
};

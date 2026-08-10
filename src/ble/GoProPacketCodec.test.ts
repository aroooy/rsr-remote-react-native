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
  encodeGoProPacketHeader,
  buildGoProPacketChunks,
  parseHardwareInfo,
  GOPRO_BLE_PACKET_CHUNK_SIZE,
  GOPRO_BLE_CONTINUATION_HEADER,
} from './GoProPacketCodec';

describe('encodeGoProPacketHeader', () => {
  it('encodes lengths below 0x20 as a single byte', () => {
    expect(encodeGoProPacketHeader(0)).toEqual([0x00]);
    expect(encodeGoProPacketHeader(0x1f)).toEqual([0x1f]);
  });

  it('encodes 13-bit lengths with the 0x20 extension flag', () => {
    expect(encodeGoProPacketHeader(0x20)).toEqual([0x20, 0x20]);
    expect(encodeGoProPacketHeader(0x0fff)).toEqual([0x2f, 0xff]);
  });

  it('encodes 16-bit lengths with the 0x40 extension flag', () => {
    expect(encodeGoProPacketHeader(0x1000)).toEqual([0x40, 0x10, 0x00]);
    expect(encodeGoProPacketHeader(0xffff)).toEqual([0x40, 0xff, 0xff]);
  });

  it('throws for payloads beyond 16-bit lengths', () => {
    expect(() => encodeGoProPacketHeader(0x10000)).toThrow();
  });
});

describe('buildGoProPacketChunks', () => {
  const reassemble = (chunks: number[][]): number[] => {
    const [first, ...rest] = chunks;
    const headerLen = encodeGoProPacketHeader(
      // re-derive payload length from chunk content size
      first.length + rest.reduce((acc, c) => acc + c.length - 1, 0) - 1,
    ).length;
    const payload = first.slice(headerLen);
    for (const chunk of rest) {
      expect(chunk[0]).toBe(GOPRO_BLE_CONTINUATION_HEADER);
      payload.push(...chunk.slice(1));
    }
    return payload;
  };

  it('fits a short payload into a single chunk with header', () => {
    const payload = Array.from({ length: 10 }, (_, i) => i);
    const chunks = buildGoProPacketChunks(payload);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual([10, ...payload]);
  });

  it('splits long payloads into 20-byte chunks with continuation headers', () => {
    const payload = Array.from({ length: 50 }, (_, i) => i & 0xff);
    const chunks = buildGoProPacketChunks(payload);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(GOPRO_BLE_PACKET_CHUNK_SIZE);
    }
    for (const chunk of chunks.slice(1)) {
      expect(chunk[0]).toBe(GOPRO_BLE_CONTINUATION_HEADER);
    }
    expect(reassemble(chunks)).toEqual(payload);
  });

  it('round-trips a payload exactly at the chunk boundary', () => {
    // 19 bytes payload + 1 header byte = exactly one 20-byte chunk
    const payload = Array.from({ length: 19 }, () => 0xab);
    const chunks = buildGoProPacketChunks(payload);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toHaveLength(GOPRO_BLE_PACKET_CHUNK_SIZE);
  });
});

describe('parseHardwareInfo', () => {
  const lv = (bytes: number[]): number[] => [bytes.length, ...bytes];
  const str = (s: string): number[] => lv([...s].map((c) => c.charCodeAt(0)));

  it('parses a well-formed 0x3C response', () => {
    const data = [
      0x3c,
      0x00,
      ...lv([65]), // modelNo = 65 (HERO13)
      ...str('HERO13 Black'), // modelName
      ...lv([4]), // boardType
      ...str('H24.01.01.10.00'), // firmwareVersion
      ...str('C0000123456789'), // serialNumber
      ...str('GP12345678'), // ssid
      ...str('AA:BB:CC:DD:EE:FF'), // macAddress
    ];
    const info = parseHardwareInfo(data);
    expect(info).not.toBeNull();
    expect(info!.modelNo).toBe(65);
    expect(info!.modelName).toBe('HERO13 Black');
    expect(info!.boardType).toBe(4);
    expect(info!.firmwareVersion).toBe('H24.01.01.10.00');
    expect(info!.serialNumber).toBe('C0000123456789');
    expect(info!.ssid).toBe('GP12345678');
    expect(info!.macAddress).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('parses multi-byte model numbers big-endian', () => {
    const data = [
      0x3c,
      0x00,
      ...lv([0x01, 0x02]), // modelNo = 0x0102 = 258
      ...str('X'),
      ...lv([1]),
      ...str('fw'),
      ...str('sn'),
      ...str('ssid'),
      ...str('mac'),
    ];
    expect(parseHardwareInfo(data)!.modelNo).toBe(0x0102);
  });
});

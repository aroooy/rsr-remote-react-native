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
import { PacketParser } from './PacketParser';

describe('PacketParser stateful parsing tests', () => {
  it('should parse a single complete packet (8-bit header)', () => {
    const parser = new PacketParser();
    // Payload length = 3. Payload: [0x01, 0x02, 0x03]
    const bytes = [0x03, 0x01, 0x02, 0x03];
    const result = parser.parse(bytes);
    expect(result.isComplete).toBe(true);
    expect(result.data).toEqual([0x01, 0x02, 0x03]);
  });

  it('should parse a single complete packet (13-bit header)', () => {
    const parser = new PacketParser();
    // First byte 0x20 | ((len >> 8) & 0x0F). Let len = 4.
    // 0x20 | 0 = 0x20. Second byte = 4. Payload: [0x0a, 0x0b, 0x0c, 0x0d]
    const bytes = [0x20, 0x04, 0x0a, 0x0b, 0x0c, 0x0d];
    const result = parser.parse(bytes);
    expect(result.isComplete).toBe(true);
    expect(result.data).toEqual([0x0a, 0x0b, 0x0c, 0x0d]);
  });

  it('should parse a split packet with continuation header', () => {
    const parser = new PacketParser();
    // Total payload length = 5. First chunk has header + 2 bytes, next has continuation header (0x80) + 3 bytes
    const chunk1 = [0x05, 0x01, 0x02];
    const chunk2 = [0x80, 0x03, 0x04, 0x05];

    const res1 = parser.parse(chunk1);
    expect(res1.isComplete).toBe(false);
    expect(res1.remainingExpectedLength).toBe(3);

    const res2 = parser.parse(chunk2);
    expect(res2.isComplete).toBe(true);
    expect(res2.data).toEqual([0x01, 0x02, 0x03, 0x04, 0x05]);
  });

  it('should isolate states between different parser instances (concurrency test)', () => {
    const parserA = new PacketParser();
    const parserB = new PacketParser();

    // Both parser A and B receive incomplete packets of length 5
    const chunkA1 = [0x05, 0xaa, 0xbb];
    const chunkB1 = [0x05, 0x11, 0x22];

    const resA1 = parserA.parse(chunkA1);
    const resB1 = parserB.parse(chunkB1);

    expect(resA1.isComplete).toBe(false);
    expect(resB1.isComplete).toBe(false);

    // Send continuation chunk for A
    const chunkA2 = [0x80, 0xcc, 0xdd, 0xee];
    const resA2 = parserA.parse(chunkA2);
    expect(resA2.isComplete).toBe(true);
    expect(resA2.data).toEqual([0xaa, 0xbb, 0xcc, 0xdd, 0xee]);

    // Send continuation chunk for B
    const chunkB2 = [0x80, 0x33, 0x44, 0x55];
    const resB2 = parserB.parse(chunkB2);
    expect(resB2.isComplete).toBe(true);
    expect(resB2.data).toEqual([0x11, 0x22, 0x33, 0x44, 0x55]);
  });
});

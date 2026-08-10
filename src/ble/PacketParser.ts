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
 * GoPro BLE packet parsing logic based on GoPro BLE Document 02
 */

export interface ParsedPacket {
  isComplete: boolean;
  data: number[];
  remainingExpectedLength?: number;
}

export class PacketParser {
  private receiveBuffer: number[] = [];
  private expectedLength: number = 0;

  public parse(bytes: number[]): ParsedPacket {
    if (bytes.length === 0) return { isComplete: false, data: [] };

    const firstByte = bytes[0];
    const isContinuation = (firstByte & 0x80) === 0x80;

    if (isContinuation) {
      this.receiveBuffer.push(...bytes.slice(1));

      if (this.receiveBuffer.length >= this.expectedLength) {
        const completeData = [...this.receiveBuffer];
        this.reset();
        return { isComplete: true, data: completeData };
      }

      return {
        isComplete: false,
        data: [],
        remainingExpectedLength: this.expectedLength - this.receiveBuffer.length,
      };
    }

    this.reset();

    let headerLength = 0;
    let payloadLength = 0;

    if ((firstByte & 0x40) === 0x40) {
      headerLength = 3;
      payloadLength = (bytes[1] << 8) | bytes[2];
    } else if ((firstByte & 0x20) === 0x20) {
      headerLength = 2;
      payloadLength = ((firstByte & 0x0f) << 8) | bytes[1];
    } else {
      headerLength = 1;
      payloadLength = firstByte;
    }

    const payloadData = bytes.slice(headerLength);

    if (payloadData.length >= payloadLength) {
      return { isComplete: true, data: payloadData.slice(0, payloadLength) };
    } else {
      this.expectedLength = payloadLength;
      this.receiveBuffer = [...payloadData];
      return {
        isComplete: false,
        data: [],
        remainingExpectedLength: this.expectedLength - this.receiveBuffer.length,
      };
    }
  }

  public reset() {
    this.receiveBuffer = [];
    this.expectedLength = 0;
  }
}

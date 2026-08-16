import { describe, it, expect } from 'vitest';
import {
  buildShutterPacket,
  buildLoadPresetPacket,
  buildLoadPresetGroupPacket,
  buildSetSettingPacket,
  buildSetDateTimePacket,
  buildSetAutoOffPacket,
  buildClearAutoOffPacket,
  buildSetHighlightPointPacket,
  buildSetAPControlPacket,
  buildKeepAlivePacket,
  buildFetchHardwareInfoPacket,
  buildFetchPresetStatusPacket,
  buildCustomPresetUpdatePacket,
} from './bleCommandPackets';

describe('bleCommandPackets', () => {
  it('builds shutter packets correctly', () => {
    expect(buildShutterPacket(true)).toEqual([0x03, 0x01, 0x01, 0x01]);
    expect(buildShutterPacket(false)).toEqual([0x03, 0x01, 0x01, 0x00]);
  });

  it('builds load preset packets with 4-byte big-endian preset ID', () => {
    expect(buildLoadPresetPacket(0x00010203)).toEqual([0x06, 0x40, 0x04, 0x00, 0x01, 0x02, 0x03]);
    expect(buildLoadPresetPacket(232)).toEqual([0x06, 0x40, 0x04, 0x00, 0x00, 0x00, 0xe8]);
  });

  it('builds load preset group packet', () => {
    expect(buildLoadPresetGroupPacket(232)).toEqual([0x04, 0x3e, 0x02, 0x03, 232]);
  });

  it('builds set setting packets (1-byte and 4-byte)', () => {
    expect(buildSetSettingPacket(0x02, 0x01, false)).toEqual([0x03, 0x02, 0x01, 0x01]);
    expect(buildSetSettingPacket(0x0d, 0x00010203, true)).toEqual([
      0x06, 0x0d, 0x04, 0x00, 0x01, 0x02, 0x03,
    ]);
  });

  it('builds date time packet for HERO11+ (13 bytes, UTC + offset) and legacy models (10 bytes, Local)', () => {
    const testDate = new Date(Date.UTC(2026, 7, 16, 0, 30, 45)); // UTC 2026-08-16 00:30:45
    const hero11PlusPacket = buildSetDateTimePacket(testDate, true);
    expect(hero11PlusPacket.length).toBe(13);
    expect(hero11PlusPacket[0]).toBe(0x0c);
    expect(hero11PlusPacket[1]).toBe(0x0f);
    expect(hero11PlusPacket[2]).toBe(0x0a);
    expect(hero11PlusPacket[3]).toBe((2026 >> 8) & 0xff); // Year High
    expect(hero11PlusPacket[4]).toBe(2026 & 0xff);       // Year Low
    expect(hero11PlusPacket[5]).toBe(8);                 // Month (Aug)
    expect(hero11PlusPacket[6]).toBe(16);                // Day
    expect(hero11PlusPacket[7]).toBe(0);                 // UTC Hour
    expect(hero11PlusPacket[8]).toBe(30);                // UTC Minute
    expect(hero11PlusPacket[9]).toBe(45);                // UTC Second
    expect(hero11PlusPacket[12]).toBe(0x01);             // UTC enabled flag

    // Verify timezone offset calculation offsetValue = (-getTimezoneOffset() + 60)
    const expectedOffsetVal = -testDate.getTimezoneOffset() + 60;
    const expectedOfH = (expectedOffsetVal >> 8) & 0xff;
    const expectedOfL = expectedOffsetVal & 0xff;
    expect(hero11PlusPacket[10]).toBe(expectedOfH);
    expect(hero11PlusPacket[11]).toBe(expectedOfL);

    const legacyPacket = buildSetDateTimePacket(testDate, false);
    expect(legacyPacket.length).toBe(10);
    expect(legacyPacket[0]).toBe(0x09);
    expect(legacyPacket[1]).toBe(0x0d);
    expect(legacyPacket[2]).toBe(0x07);
    expect(legacyPacket[3]).toBe((2026 >> 8) & 0xff);
    expect(legacyPacket[4]).toBe(2026 & 0xff);
    expect(legacyPacket[5]).toBe(testDate.getMonth() + 1);
    expect(legacyPacket[6]).toBe(testDate.getDate());
    expect(legacyPacket[7]).toBe(testDate.getHours());
  });

  it('builds auto off packets with minute * 4 + 3 encoding', () => {
    // minute 30 -> 30 * 4 + 3 = 123 (0x7B)
    expect(buildSetAutoOffPacket(1, 30)).toEqual([0x06, 0xa8, 0x04, 0x00, 0x00, 1, 123]);
    expect(buildClearAutoOffPacket()).toEqual([0x06, 0xa8, 0x04, 0x00, 0x00, 0x00, 0x00]);
  });

  it('builds highlight point, AP control, keep alive, hardware info packets', () => {
    expect(buildSetHighlightPointPacket(0)).toEqual([0x02, 0x69, 0]);
    expect(buildSetAPControlPacket()).toEqual([0x03, 0x17, 0x01, 0x01]);
    expect(buildKeepAlivePacket()).toEqual([0x01, 0x00]);
    expect(buildFetchHardwareInfoPacket()).toEqual([0x01, 0x3c]);
  });

  it('builds protobuf wrapper packets', () => {
    const dummyPayload = new Uint8Array([0x10, 0x20]);
    expect(buildFetchPresetStatusPacket(dummyPayload)).toEqual([0xf5, 0x72, 0x10, 0x20]);
    expect(buildCustomPresetUpdatePacket(dummyPayload)).toEqual([0xf1, 0x64, 0x10, 0x20]);
  });
});

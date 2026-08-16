import { describe, it, expect } from 'vitest';
import {
  isPresetStatusPacket,
  parsePresetStatusPacket,
  isHardwareInfoPacket,
  parseHardwareInfoPacket,
  isCustomPresetUpdatePacketResponse,
  parseCustomPresetUpdatePacketResponse,
  parseSettingWriteResponse,
} from './bleResponseCodec';

describe('bleResponseCodec', () => {
  describe('PresetStatus response parsing', () => {
    it('correctly identifies 0xF5 0xF2 (sync) and 0xF5 0xF3 (async push) packets', () => {
      expect(isPresetStatusPacket([0xf5, 0xf2, 0x00])).toBe(true);
      expect(isPresetStatusPacket([0xf5, 0xf3, 0x00])).toBe(true);
      expect(isPresetStatusPacket([0xf5, 0x72])).toBe(false);
      expect(isPresetStatusPacket([0x3c, 0x00])).toBe(false);
    });

    it('parses preset status packet correctly', () => {
      // Empty protobuf payload
      const syncParsed = parsePresetStatusPacket([0xf5, 0xf2]);
      expect(syncParsed).not.toBeNull();
      expect(syncParsed?.isSyncResponse).toBe(true);
      expect(syncParsed?.groups).toBeDefined();

      const asyncParsed = parsePresetStatusPacket([0xf5, 0xf3]);
      expect(asyncParsed).not.toBeNull();
      expect(asyncParsed?.isSyncResponse).toBe(false);

      expect(parsePresetStatusPacket([0x01, 0x02])).toBeNull();
    });
  });

  describe('HardwareInfo response parsing', () => {
    it('correctly identifies 0x3C 0x00 packets', () => {
      expect(isHardwareInfoPacket([0x3c, 0x00, 0x01])).toBe(true);
      expect(isHardwareInfoPacket([0x3c, 0x01])).toBe(false);
      expect(isHardwareInfoPacket([0x01])).toBe(false);
    });

    it('returns null for non-hardware info packets', () => {
      expect(parseHardwareInfoPacket([0x01, 0x02])).toBeNull();
    });
  });

  describe('CustomPresetUpdate response parsing', () => {
    it('correctly identifies 0xF1 0xE4 packets', () => {
      expect(isCustomPresetUpdatePacketResponse([0xf1, 0xe4])).toBe(true);
      expect(isCustomPresetUpdatePacketResponse([0xf1, 0x64])).toBe(false);
    });

    it('parses custom preset update response result', () => {
      // 0xF1, 0xE4, followed by ResponseGeneric protobuf (result=0 SUCCESS)
      const parsed = parseCustomPresetUpdatePacketResponse([0xf1, 0xe4, 0x08, 0x00]);
      expect(parsed).not.toBeNull();
      expect(parsed?.result).toBe(0);

      expect(parseCustomPresetUpdatePacketResponse([0x00, 0x00])).toBeNull();
    });
  });

  describe('SettingWriteResponse parsing', () => {
    it('parses 1-byte header setting write result correctly', () => {
      // len = 2, settingId = 2 (RESOLUTION), resultCode = 0 (SUCCESS)
      const bytes = [0x02, 0x02, 0x00];
      const parsed = parseSettingWriteResponse(bytes);
      expect(parsed).toEqual({ settingId: 2, resultCode: 0 });
    });

    it('handles setting write failure result code', () => {
      // len = 2, settingId = 13 (FPS), resultCode = 1 (FAILED)
      const bytes = [0x02, 0x0d, 0x01];
      const parsed = parseSettingWriteResponse(bytes);
      expect(parsed).toEqual({ settingId: 13, resultCode: 1 });
    });

    it('returns null for multi-byte header or short packets', () => {
      // Length < 3
      expect(parseSettingWriteResponse([0x02, 0x02])).toBeNull();
      // 2-byte ext bit set (0x40)
      expect(parseSettingWriteResponse([0x42, 0x02, 0x00])).toBeNull();
      // 12-bit ext bit set (0x20)
      expect(parseSettingWriteResponse([0x22, 0x02, 0x00])).toBeNull();
      // Declared length mismatch
      expect(parseSettingWriteResponse([0x05, 0x02, 0x00])).toBeNull();
    });
  });
});

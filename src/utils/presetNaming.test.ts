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

import { describe, it, expect, vi } from 'vitest';
import { GoProSettingId } from '../constants/GoProSettingId';
import { GoProPresetGroup } from '../constants/GoProPresetGroup';
import { generateDefaultPresetName } from './presetNaming';
import type { CameraModelKey } from '../cameraModels/shared/modelManifest';

// Mock the i18n module to prevent loading expo-localization which crashes Node test environment
vi.mock('../i18n', () => ({
  t: (key: string) => `[translation:${key}]`,
}));

import type { SettingValueLabelContext } from '../constants/GoProMetadata';

describe('generateDefaultPresetName', () => {
  it('generates standard video name correctly', () => {
    const settings: Record<number, number> = {
      [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.VIDEO,
      [GoProSettingId.MODE_PRESET]: 0, // Video (Standard)
      [GoProSettingId.RESOLUTION]: 1, // 4K (Val: 1 is 4K)
      [GoProSettingId.FPS]: 5, // 60 fps (Val: 5 is 60 fps)
      [GoProSettingId.VIDEO_LENS]: 0, // Wide (Val: 0 is Wide)
    };

    const name = generateDefaultPresetName(settings, 'hero13');
    expect(name).toContain('Standard');
    expect(name).toContain('4K');
    expect(name).toContain('60 fps');
    expect(name).toContain('Wide');
  });

  it('incorporates HLG_HDR status for Hero13 HDR/HLG profiles', () => {
    // Test HLG (HLG_HDR = 1)
    const settingsHLG: Record<number, number> = {
      [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.VIDEO,
      [GoProSettingId.MODE_PRESET]: 0,
      [GoProSettingId.RESOLUTION]: 1,
      [GoProSettingId.FPS]: 5,
      [GoProSettingId.VIDEO_PROFILE]: 101, // HLG
      [GoProSettingId.HLG_HDR]: 1, // On -> Native HLG
      [GoProSettingId.VIDEO_LENS_HERO13]: 0,
    };
    const nameHLG = generateDefaultPresetName(settingsHLG, 'hero13');
    expect(nameHLG).toContain('HLG');
    expect(nameHLG).not.toContain('HDR');

    // Test HDR (HLG_HDR = 0)
    const settingsHDR: Record<number, number> = {
      ...settingsHLG,
      [GoProSettingId.HLG_HDR]: 0, // Off -> HDR
    };
    const nameHDR = generateDefaultPresetName(settingsHDR, 'hero13');
    expect(nameHDR).toContain('HDR');
    expect(nameHDR).not.toContain('HLG');
  });

  it('reflects HyperSmooth Off/Boost and Horizontal Leveling states', () => {
    const settings: Record<number, number> = {
      [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.VIDEO,
      [GoProSettingId.MODE_PRESET]: 0,
      [GoProSettingId.RESOLUTION]: 1,
      [GoProSettingId.FPS]: 5,
      [GoProSettingId.VIDEO_LENS]: 0,
      [GoProSettingId.HYPERSMOOTH]: 0, // Off
      [GoProSettingId.HORIZONTAL_LEVELING]: 1, // On
    };
    const name = generateDefaultPresetName(settings, 'hero13');
    expect(name).toContain('HS-Off');
    expect(name).toContain('Leveling');
  });

  it('uses model-specific bool on-values for Hero11 leveling and lock', () => {
    const settings: Record<number, number> = {
      [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.PHOTO,
      [GoProSettingId.MODE_PRESET]: 65536,
      [GoProSettingId.PHOTO_OUTPUT]: 1,
      [GoProSettingId.PHOTO_LENS]: 31,
      [GoProSettingId.HORIZONTAL_LOCK_HERO11]: 2,
    };

    const name = generateDefaultPresetName(settings, 'hero11');
    expect(name).toContain('HorizLock');
  });

  it('reflects Hero13 lens attachments', () => {
    const settings: Record<number, number> = {
      [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.VIDEO,
      [GoProSettingId.MODE_PRESET]: 0,
      [GoProSettingId.RESOLUTION]: 1,
      [GoProSettingId.FPS]: 5,
      [GoProSettingId.VIDEO_LENS]: 0,
      [GoProSettingId.LENS_ATTACHMENT]: 4, // Macro (According to baseSettingMetadata.ts)
    };
    const name = generateDefaultPresetName(settings, 'hero13');
    expect(name).toContain('Macro');
  });

  it('generates photo custom preset name correctly with RAW and HorizLock', () => {
    const settings: Record<number, number> = {
      [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.PHOTO,
      [GoProSettingId.MODE_PRESET]: 65536, // Photo preset
      [GoProSettingId.PHOTO_OUTPUT]: 1, // RAW
      [GoProSettingId.PHOTO_LENS]: 31, // Wide
      [GoProSettingId.HORIZONTAL_LOCK]: 1, // On
    };
    const name = generateDefaultPresetName(settings, 'hero13');
    expect(name).toContain('Photo');
    expect(name).toContain('RAW');
    expect(name).toContain('HorizLock');
  });

  it('generates timelapse custom preset name correctly', () => {
    const settings: Record<number, number> = {
      [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.TIMELAPSE,
      [GoProSettingId.MODE_PRESET]: 131072, // TimeWarp preset
      [GoProSettingId.RESOLUTION]: 1, // 4K
      [GoProSettingId.TIME_LAPSE_LENS]: 31, // Wide (27MP)
      [GoProSettingId.MAX_LENS_MOD_HERO13]: 3, // Max Lens 2.5
    };
    const name = generateDefaultPresetName(settings, 'hero13');
    expect(name).toContain('TimeWarp');
    expect(name).toContain('Max Lens 2.5');
    expect(name).toContain('4K');
  });

  it('skips english-label comparisons when translated labels differ', async () => {
    vi.resetModules();
    vi.doMock('../constants/GoProMetadata', async () => {
      const actual = await vi.importActual<typeof import('../constants/GoProMetadata')>(
        '../constants/GoProMetadata',
      );
      return {
        ...actual,
        getSettingValueNameForModelWithContext: (
          id: number,
          value: number,
          model: CameraModelKey,
          context: SettingValueLabelContext,
          firmwareVersion: string | null,
        ) => {
          if (id === GoProSettingId.LENS_ATTACHMENT && value === 10) return '標準レンズ';
          if (id === GoProSettingId.HYPERSMOOTH && value === 0) return 'オフ';
          if (id === GoProSettingId.PHOTO_OUTPUT && value === 0) return '標準';
          return actual.getSettingValueNameForModelWithContext(
            id,
            value,
            model,
            context,
            firmwareVersion,
          );
        },
      };
    });

    const { generateDefaultPresetName: generateDefaultPresetNameWithMock } =
      await import('./presetNaming');

    const videoName = generateDefaultPresetNameWithMock(
      {
        [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.VIDEO,
        [GoProSettingId.MODE_PRESET]: 0,
        [GoProSettingId.RESOLUTION]: 1,
        [GoProSettingId.FPS]: 5,
        [GoProSettingId.VIDEO_LENS]: 0,
        [GoProSettingId.LENS_ATTACHMENT]: 10,
        [GoProSettingId.HYPERSMOOTH]: 0,
        [GoProSettingId.HORIZONTAL_LEVELING]: 1,
      },
      'hero13',
    );

    expect(videoName).toContain('HS-Off');
    expect(videoName).toContain('Leveling');
    expect(videoName).not.toContain('標準レンズ');

    const photoName = generateDefaultPresetNameWithMock(
      {
        [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.PHOTO,
        [GoProSettingId.MODE_PRESET]: 65536,
        [GoProSettingId.PHOTO_OUTPUT]: 0,
        [GoProSettingId.PHOTO_LENS]: 31,
      },
      'hero13',
    );

    expect(photoName).not.toContain('標準');

    vi.doUnmock('../constants/GoProMetadata');
    vi.resetModules();
  });

  it('resolves active customPreset name correctly from presetsList for Hero12/13', () => {
    const settings: Record<number, number> = {
      [GoProSettingId.MODE_PRESET_GROUP]: GoProPresetGroup.VIDEO,
      [GoProSettingId.MODE_PRESET]: 999, // Unmapped preset ID
      [GoProSettingId.RESOLUTION]: 1, // 4K
      [GoProSettingId.FPS]: 5, // 60 fps
      [GoProSettingId.VIDEO_LENS]: 0, // Wide
    };

    const presetsList = [
      {
        groupId: 1000,
        presets: [
          {
            id: 999,
            titleId: 0,
            titleNumber: 0,
            userDefined: true,
            isModified: false,
            isFixed: false,
            isVisible: true,
            customName: 'CustomSunny',
            iconId: 999, // Unmapped icon ID to prevent icon map resolution
            settings: [],
          },
        ],
      },
    ];

    // Hero13 supports preset name renaming and customName is matched
    const nameHero13 = generateDefaultPresetName(settings, 'hero13', presetsList);
    expect(nameHero13).toContain('CustomSunny');
    expect(nameHero13).not.toContain('Preset 999');

    // Hero11 does NOT support custom renaming, so customName is ignored and getPresetDisplayName fallback applies
    const nameHero11 = generateDefaultPresetName(settings, 'hero11', presetsList);
    expect(nameHero11).not.toContain('CustomSunny');
    expect(nameHero11).toContain('Preset 999'); // Default name fallback
  });
});

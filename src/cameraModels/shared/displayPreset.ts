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

import type { GoProPreset } from '../../ble/PresetProtobuf';
import {
  PRESET_ACTIVITY,
  PRESET_STANDARD,
  PRESET_PHOTO,
  PRESET_LIVE_BURST,
  PRESET_BURST,
  PRESET_NIGHT_PHOTO,
  PRESET_SLOMO,
  PRESET_TIMEWARP,
  PRESET_TIMELAPSE,
  PRESET_NIGHTLAPSE,
  PRESET_STAR_TRAILS,
  PRESET_LIGHT_PAINTING,
  PRESET_VEHICLE_LIGHTS,
  PRESET_VIRTUAL_LOOPING,
} from '../../constants/presetIds';

export type BaseDisplayPresetResolution = {
  presetId: number | undefined;
  source: 'stored' | 'derived' | 'current';
  reason: string;
};

// NOTE: Since GoProSettingIds.ts imports displayPreset.ts, reverse imports are not allowed.
// Use numeric values for GoProPresetGroup and GoProSettingId directly, clarifying their meanings via comments.
// GoProPresetGroup: VIDEO=1000, PHOTO=1001, TIMELAPSE=1002
// GoProSettingId:
//   MEDIA_FORMAT=128, LOOPING_INTERVAL=6, STAR_TRAILS_LENGTH=179, STAR_TRAILS_LENGTH_HERO11=131
//   NIGHT_PHOTO_SHUTTER=19, VIDEO_SHUTTER=145, PHOTO_SHUTTER=146, BURST_RATE=147

// Values for MEDIA_FORMAT (128):
//   13 = Time Lapse Video, 20 = Time Lapse Photo
//   26 = Night Lapse Video, 21 = Night Lapse Photo

// OpenGoPro protobuf/preset_status.proto EnumFlatMode (2024-11-04 generated).
// Since field 2 of custom presets contains a flat mode enum instead of a full preset ID,
// normalize it to the canonical preset ID expected by the UI before use.
const FLAT_MODE_TO_DISPLAY_PRESET_ID: Readonly<Record<number, number>> = {
  12: PRESET_STANDARD,
  13: PRESET_TIMELAPSE,
  15: PRESET_VIRTUAL_LOOPING,
  16: PRESET_PHOTO,
  17: PRESET_PHOTO,
  18: PRESET_NIGHT_PHOTO,
  19: PRESET_BURST,
  20: PRESET_TIMELAPSE,
  21: PRESET_NIGHTLAPSE,
  24: PRESET_TIMEWARP,
  25: PRESET_LIVE_BURST,
  26: PRESET_NIGHTLAPSE,
  27: PRESET_SLOMO,
  29: PRESET_STAR_TRAILS,
  30: PRESET_LIGHT_PAINTING,
  31: PRESET_VEHICLE_LIGHTS,
  32: PRESET_ACTIVITY,
};

export const normalizeBaseDisplayPresetId = (
  basePresetId: number | undefined,
): number | undefined => {
  if (basePresetId === undefined) return undefined;
  return FLAT_MODE_TO_DISPLAY_PRESET_ID[basePresetId] ?? basePresetId;
};

/**
 * Resolves the base display preset ID for custom presets (userDefined === true).
 *
 * Custom presets have large ID values (e.g. 65536) and are not included in whitelists
 * like LAPSE_WITH_PHOTO_PRESETS. Consequently, correct UI controls cannot be determined directly.
 * This function deterministically derives the base preset ID based on the group and stored settings.
 *
 * @param activePreset - Preset information retrieved from Protobuf (including settings array)
 * @param currentPresetId - Current preset ID reported by the camera
 * @param currentGroupId - Current preset group ID reported by the camera
 */
export const inspectBaseDisplayPresetResolution = (
  activePreset: GoProPreset | undefined,
  currentPresetId: number | undefined,
  currentGroupId: number | undefined,
): BaseDisplayPresetResolution => {
  if (activePreset?.basePresetId !== undefined) {
    const normalizedBasePresetId = normalizeBaseDisplayPresetId(activePreset.basePresetId);
    return {
      presetId: normalizedBasePresetId,
      source: 'stored',
      reason:
        normalizedBasePresetId === activePreset.basePresetId
          ? 'preset.basePresetId'
          : `preset.basePresetId_flat_mode=${activePreset.basePresetId}`,
    };
  }

  if (activePreset?.userDefined !== true || currentGroupId === undefined) {
    return {
      presetId: currentPresetId,
      source: 'current',
      reason: activePreset?.userDefined !== true ? 'not_custom_preset' : 'missing_group_id',
    };
  }

  const hasSetting = (id: number): boolean => activePreset.settings.some((s) => s.id === id);
  const getSettingValue = (id: number): number | undefined =>
    activePreset.settings.find((s) => s.id === id)?.value;

  const mediaFormat = getSettingValue(128); // MEDIA_FORMAT

  switch (currentGroupId) {
    case 1002: {
      // GoProPresetGroup.TIMELAPSE
      if (mediaFormat === 26 || mediaFormat === 21) {
        return {
          presetId: PRESET_NIGHTLAPSE,
          source: 'derived',
          reason: `timelapse_media_format=${mediaFormat}`,
        };
      }
      if (mediaFormat === 13 || mediaFormat === 20) {
        return {
          presetId: PRESET_TIMELAPSE,
          source: 'derived',
          reason: `timelapse_media_format=${mediaFormat}`,
        };
      }
      if (hasSetting(179) || hasSetting(131)) {
        return {
          presetId: PRESET_STAR_TRAILS,
          source: 'derived',
          reason: hasSetting(179) ? 'has_star_trails_length_179' : 'has_star_trails_length_131',
        };
      }
      return {
        presetId: PRESET_TIMEWARP,
        source: 'derived',
        reason: `timelapse_fallback_media_format=${mediaFormat ?? 'undefined'}`,
      };
    }

    case 1000: {
      // GoProPresetGroup.VIDEO
      if (hasSetting(6)) {
        return {
          presetId: PRESET_VIRTUAL_LOOPING,
          source: 'derived',
          reason: 'has_looping_interval_6',
        };
      }
      return {
        presetId: PRESET_STANDARD,
        source: 'derived',
        reason: 'video_fallback_standard',
      };
    }

    case 1001: {
      // GoProPresetGroup.PHOTO
      if (hasSetting(19)) {
        return {
          presetId: PRESET_NIGHT_PHOTO,
          source: 'derived',
          reason: 'has_night_photo_shutter_19',
        };
      }
      if (hasSetting(145) && !hasSetting(146)) {
        return {
          presetId: PRESET_LIVE_BURST,
          source: 'derived',
          reason: 'has_video_shutter_145_without_photo_shutter_146',
        };
      }
      if (hasSetting(147)) {
        return {
          presetId: PRESET_BURST,
          source: 'derived',
          reason: 'has_burst_rate_147',
        };
      }
      return {
        presetId: PRESET_PHOTO,
        source: 'derived',
        reason: 'photo_fallback_standard',
      };
    }

    default:
      return {
        presetId: currentPresetId,
        source: 'current',
        reason: `unknown_group_${currentGroupId}`,
      };
  }
};

export const resolveBaseDisplayPresetId = (
  activePreset: GoProPreset | undefined,
  currentPresetId: number | undefined,
  currentGroupId: number | undefined,
): number | undefined => {
  return inspectBaseDisplayPresetResolution(activePreset, currentPresetId, currentGroupId).presetId;
};

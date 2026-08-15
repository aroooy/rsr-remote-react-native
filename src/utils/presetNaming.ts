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

import { GoProSettingId } from '../constants/GoProSettingId';
import { GoProPresetGroup } from '../constants/GoProPresetGroup';
import {
  getBoolValues,
  getPresetDisplayName,
  getSettingValueNameForModelWithContext,
} from '../constants/GoProMetadata';
import { getPresetLabelFromIconId } from '../constants/PresetIconMap';
import { isHero12Or13Model } from '../cameraModels/shared/modelNoHelpers';
import { resolveModelNoFromCameraModelKey } from '../cameraModels/shared/modelNumber';

const HLG_HDR_PROFILE_VALUES = new Set<number>([1, 101, 200]);
const ATTACHMENT_VALUES_TO_SKIP = new Set<number>([0, 10, 100]);
const PHOTO_OUTPUT_STANDARD_VALUE = 0;
const HYPERSMOOTH_BOOST_VALUE = 3;
const HYPERSMOOTH_AUTO_BOOST_VALUE = 4;

/**
 * Generates a descriptive default name for a custom preset based on current active GoPro settings.
 * Focuses on settings that are rendered as toggle buttons, toggle chips, or switches on the main control panel.
 *
 * @param settings Record of setting IDs and their current values.
 * @param cameraModel The active camera model key (e.g., 'hero13', 'hero12').
 * @param presetsList List of GoProPresetGroupData from store.
 * @param firmwareVersion The active camera firmware version string.
 * @returns A space-separated descriptive string for the default preset name.
 */
export const generateDefaultPresetName = (
  settings: Record<number, number | undefined>,
  cameraModel: string,
  presetsList: any[] = [], // GoProPresetGroupData[]
  firmwareVersion: string | null = null,
): string => {
  const modelKey = cameraModel as any; // Cast to CameraModelKey for GoProMetadata queries
  const modelNo = resolveModelNoFromCameraModelKey(modelKey);
  const supportsPresetRename = isHero12Or13Model(modelNo);

  // 1. Get Preset Group
  const presetGroup = settings[GoProSettingId.MODE_PRESET_GROUP] ?? GoProPresetGroup.VIDEO;

  // 2. Get Active Preset Name from presetsList or fallback
  const presetId = settings[GoProSettingId.MODE_PRESET];
  let presetName = '';
  if (presetId !== undefined) {
    let customName: string | null = null;
    let iconId: number | undefined = undefined;

    // Look up in presetsList
    for (const group of presetsList) {
      const p = group.presets?.find((item: any) => item.id === presetId);
      if (p) {
        customName = p.customName;
        iconId = p.iconId;
        break;
      }
    }

    if (supportsPresetRename && customName) {
      presetName = customName;
    } else {
      const defaultLabel = getPresetDisplayName(presetId, cameraModel);
      if (defaultLabel === `Preset ${presetId}`) {
        presetName = getPresetLabelFromIconId(iconId) ?? defaultLabel;
      } else {
        presetName = defaultLabel;
      }
    }
  } else {
    // Fallback if preset is not defined
    if (presetGroup === GoProPresetGroup.VIDEO) presetName = 'Video';
    else if (presetGroup === GoProPresetGroup.PHOTO) presetName = 'Photo';
    else if (presetGroup === GoProPresetGroup.TIMELAPSE) presetName = 'Timelapse';
  }

  // 3. Helper to resolve setting string
  const getValName = (id: number): string | undefined => {
    const val = settings[id];
    if (val === undefined) return undefined;
    const name = getSettingValueNameForModelWithContext(
      id,
      val,
      modelKey,
      { settings },
      firmwareVersion,
    );
    if (!name || name.startsWith('Val:')) return undefined;
    return name;
  };

  const parts: string[] = [presetName];

  // 4. Lens Attachment Check (Macro, Anamorphic, Max Lens Mod, etc.)
  // We check LENS_ATTACHMENT (217) first (Hero13), then MAX_LENS_MOD_HERO13 (189) (Hero12)
  const attachmentId =
    settings[GoProSettingId.LENS_ATTACHMENT] !== undefined
      ? GoProSettingId.LENS_ATTACHMENT
      : GoProSettingId.MAX_LENS_MOD_HERO13;

  const attachmentVal = settings[attachmentId];
  if (attachmentVal !== undefined && !ATTACHMENT_VALUES_TO_SKIP.has(attachmentVal)) {
    const attachmentName = getValName(attachmentId);
    if (attachmentName) {
      parts.push(attachmentName);
    }
  }

  if (presetGroup === GoProPresetGroup.VIDEO) {
    // Format: [PresetName] [Attachment] [Resolution] [FrameRate] [Profile/HLG_HDR] [Lens] [HyperSmooth] [Leveling]

    // Resolution
    const res = getValName(GoProSettingId.RESOLUTION);
    if (res) parts.push(res);

    // Frame rate
    const fps = getValName(GoProSettingId.FPS);
    if (fps) {
      if (/^\d+$/.test(fps)) {
        parts.push(`${fps}fps`);
      } else {
        parts.push(fps);
      }
    }

    // Video Profile & HLG_HDR priority resolution
    const hlgHdr = settings[GoProSettingId.HLG_HDR];
    const profile = getValName(GoProSettingId.VIDEO_PROFILE);
    if (
      hlgHdr !== undefined &&
      HLG_HDR_PROFILE_VALUES.has(settings[GoProSettingId.VIDEO_PROFILE] ?? -1)
    ) {
      // HLG_HDR value controls Native HLG vs In-camera HDR
      parts.push(hlgHdr === 1 ? 'HLG' : 'HDR');
    } else if (profile && profile.toLowerCase() !== 'standard') {
      parts.push(profile);
    }

    // Lens
    const lens =
      getValName(GoProSettingId.VIDEO_LENS_HERO13) || getValName(GoProSettingId.VIDEO_LENS);
    if (lens) parts.push(lens);

    // HyperSmooth State (Toggle Button)
    const hsSettingId =
      settings[GoProSettingId.HYPERSMOOTH] !== undefined
        ? GoProSettingId.HYPERSMOOTH
        : GoProSettingId.HYPERSMOOTH_MAX;
    const hsVal = settings[hsSettingId];
    if (hsVal !== undefined) {
      const { offValue } = getBoolValues(hsSettingId, cameraModel);
      if (hsVal === offValue) {
        parts.push('HS-Off');
      } else if (hsSettingId === GoProSettingId.HYPERSMOOTH && hsVal === HYPERSMOOTH_BOOST_VALUE) {
        parts.push('Boost');
      } else if (
        hsSettingId === GoProSettingId.HYPERSMOOTH &&
        hsVal === HYPERSMOOTH_AUTO_BOOST_VALUE
      ) {
        parts.push('AutoBoost');
      }
    }

    // Horizontal Leveling (Toggle Button)
    const levelingVal =
      settings[GoProSettingId.HORIZONTAL_LEVELING] ??
      settings[GoProSettingId.HORIZONTAL_LEVELING_HERO11];
    const { onValue: levelingOnValue } = getBoolValues(
      GoProSettingId.HORIZONTAL_LEVELING,
      cameraModel,
    );
    if (levelingVal === levelingOnValue) {
      parts.push('Leveling');
    }
  } else if (presetGroup === GoProPresetGroup.PHOTO) {
    // Format: [PresetName] [Attachment] [Output] [Lens] [HorizLock]

    // Photo Output (RAW, SuperPhoto, HDR, etc.)
    const photoOutputVal = settings[GoProSettingId.PHOTO_OUTPUT];
    const output = getValName(GoProSettingId.PHOTO_OUTPUT);
    if (output && photoOutputVal !== undefined && photoOutputVal !== PHOTO_OUTPUT_STANDARD_VALUE) {
      parts.push(output);
    }

    // Lens
    const lens =
      getValName(GoProSettingId.PHOTO_LENS_HERO13) ||
      getValName(GoProSettingId.PHOTO_LENS) ||
      getValName(GoProSettingId.MULTI_SHOT_LENS);
    if (lens) parts.push(lens);

    // Horizontal Lock (Toggle Button)
    const lockVal =
      settings[GoProSettingId.HORIZONTAL_LOCK] ?? settings[GoProSettingId.HORIZONTAL_LOCK_HERO11];
    const { onValue: lockOnValue } = getBoolValues(GoProSettingId.HORIZONTAL_LOCK, cameraModel);
    if (lockVal === lockOnValue) {
      parts.push('HorizLock');
    }
  } else if (presetGroup === GoProPresetGroup.TIMELAPSE) {
    // Format: [PresetName] [Attachment] [Resolution] [Lens] [HorizLock]

    // Resolution
    const res = getValName(GoProSettingId.RESOLUTION); // Timelapse uses RESOLUTION: 2
    if (res) parts.push(res);

    // Lens
    const lens =
      getValName(GoProSettingId.TIME_LAPSE_LENS) ||
      getValName(GoProSettingId.VIDEO_LENS_HERO13) ||
      getValName(GoProSettingId.VIDEO_LENS);
    if (lens) parts.push(lens);

    // Horizontal Lock / Leveling
    const lockVal =
      settings[GoProSettingId.HORIZONTAL_LOCK] ??
      settings[GoProSettingId.HORIZONTAL_LEVELING] ??
      settings[GoProSettingId.HORIZONTAL_LOCK_HERO11] ??
      settings[GoProSettingId.HORIZONTAL_LEVELING_HERO11];
    const { onValue: timewarpLockOnValue } = getBoolValues(
      GoProSettingId.HORIZONTAL_LOCK,
      cameraModel,
    );
    const { onValue: timewarpLevelingOnValue } = getBoolValues(
      GoProSettingId.HORIZONTAL_LEVELING,
      cameraModel,
    );
    if (lockVal === timewarpLockOnValue || lockVal === timewarpLevelingOnValue) {
      parts.push('HorizLock');
    }
  }

  // Filter out empty parts and join with spaces
  return parts.filter(Boolean).join(' ');
};

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
 * BLE wire-ID aliasing for setting writes and notifications.
 *
 * GoPro reuses / renumbers some setting IDs per model generation. The app
 * keeps ONE canonical ID per feature (used by metadata, layouts and the
 * store) and converts to/from the model-specific wire ID at the BLE boundary
 * only:
 *
 * - Outgoing (resolveOutgoingBleSettingId): canonical ID → wire ID actually
 *   written to the camera. Also resolves app-internal virtual IDs that share
 *   a single wire ID.
 * - Incoming (INCOMING_SETTING_SYNC_RULES): when the camera notifies a
 *   model-specific wire ID, the value is mirrored onto the canonical ID so
 *   the UI (which renders canonical IDs) updates.
 *
 * Legacy app reference: GetSetTrailLengthCommand / GetSetHorizontalLeveling /
 * GetSetHorizontalLock in ViewModels/{Hero11,HeroMini11,Max}/FullControlPanelViewModel.cs
 */
import { GoProSettingId } from './GoProSettingIds';
import {
  isHero11FamilyModel,
  isHero11FamilyOrMaxModel,
  isHero11Model,
  isMaxModel,
} from '../cameraModels/shared/modelNoHelpers';

/** App-internal virtual shutter IDs that all write to BLE ID 31. */
const VIRTUAL_SHUTTER_IDS_TO_BLE31: ReadonlySet<number> = new Set([
  GoProSettingId.STAR_TRAIL_SHUTTER,
  GoProSettingId.LIGHT_PAINTING_SHUTTER,
  GoProSettingId.VEHICLE_LIGHTS_SHUTTER,
]);

/**
 * Resolve the wire ID to write for a canonical (or virtual) setting ID on the
 * given model. Returns the input unchanged when no alias applies.
 */
export const resolveOutgoingBleSettingId = (
  settingId: number,
  modelNo: number | null | undefined,
): number => {
  // Virtual IDs (model-independent)
  let bleId = settingId;
  if (VIRTUAL_SHUTTER_IDS_TO_BLE31.has(bleId)) {
    bleId = 31; // BLE ID 31 = shared between NightlapsePhotoShutter / TrailShutter
  } else if (bleId === GoProSettingId.TIMELAPSE_VIDEO_SHUTTER) {
    bleId = GoProSettingId.VIDEO_SHUTTER; // BLE ID 145
  }

  if (isHero11Model(modelNo)) {
    if (bleId === GoProSettingId.STAR_TRAILS_LENGTH)
      return GoProSettingId.STAR_TRAILS_LENGTH_HERO11; // 179 → 131
    if (bleId === GoProSettingId.HORIZONTAL_LEVELING)
      return GoProSettingId.HORIZONTAL_LEVELING_HERO11; // 165 → 150
    if (bleId === GoProSettingId.HORIZONTAL_LOCK) return GoProSettingId.HORIZONTAL_LOCK_HERO11; // 166 → 151
    return bleId;
  }
  if (isHero11FamilyModel(modelNo)) {
    // HERO11 Mini: leveling keeps 165, only the lock ID is renumbered
    if (bleId === GoProSettingId.HORIZONTAL_LOCK) return GoProSettingId.HORIZONTAL_LOCK_HERO11; // 166 → 151
    return bleId;
  }
  if (isMaxModel(modelNo)) {
    // MAX uses 150 even in 0x92 notifications, so the sending side aligns too
    if (bleId === GoProSettingId.HORIZONTAL_LEVELING)
      return GoProSettingId.HORIZONTAL_LEVELING_HERO11; // 165 → 150
    if (bleId === GoProSettingId.HORIZONTAL_LOCK) return GoProSettingId.HORIZONTAL_LOCK_HERO11; // 166 → 151
    if (bleId === GoProSettingId.HYPERSMOOTH) return GoProSettingId.HYPERSMOOTH_MAX; // 135 → 148
    if (bleId === GoProSettingId.WIND_REDUCTION) return GoProSettingId.MAX_WIND_REDUCTION; // 214 → 149
    return bleId;
  }
  return bleId;
};

export type IncomingSettingSyncRule = {
  /** Wire ID the camera uses in notifications */
  wireId: number;
  /** Canonical ID the app renders */
  canonicalId: number;
  /** Does this rule apply to the given model? */
  appliesTo: (modelNo: number | null | undefined) => boolean;
  /**
   * Whether a notified value that matches the canonical pending entry also
   * clears that pending entry immediately. Where false the pending entry is
   * resolved by the 5-second timeout in setSetting instead — behavior carried
   * over unchanged from the pre-table implementation, which only had explicit
   * pending-clears for leveling and star-trails length.
   */
  clearPendingOnMatch: boolean;
};

/**
 * Camera-notification wire IDs that must be mirrored onto canonical IDs.
 * Evaluated by the BLE notification router for every settings notification.
 */
export const INCOMING_SETTING_SYNC_RULES: ReadonlyArray<IncomingSettingSyncRule> = [
  {
    wireId: GoProSettingId.HORIZONTAL_LEVELING_HERO11, // 150
    canonicalId: GoProSettingId.HORIZONTAL_LEVELING, // 165
    appliesTo: isHero11FamilyOrMaxModel,
    clearPendingOnMatch: true,
  },
  {
    wireId: GoProSettingId.HYPERSMOOTH_MAX, // 148
    canonicalId: GoProSettingId.HYPERSMOOTH, // 135
    appliesTo: isMaxModel,
    clearPendingOnMatch: false,
  },
  {
    wireId: GoProSettingId.MAX_WIND_REDUCTION, // 149
    canonicalId: GoProSettingId.WIND_REDUCTION, // 214
    appliesTo: isMaxModel,
    clearPendingOnMatch: false,
  },
  {
    wireId: GoProSettingId.HORIZONTAL_LOCK_HERO11, // 151
    canonicalId: GoProSettingId.HORIZONTAL_LOCK, // 166
    appliesTo: isHero11FamilyOrMaxModel,
    clearPendingOnMatch: false,
  },
  {
    wireId: GoProSettingId.STAR_TRAILS_LENGTH_HERO11, // 131
    canonicalId: GoProSettingId.STAR_TRAILS_LENGTH, // 179
    appliesTo: isHero11Model,
    clearPendingOnMatch: true,
  },
];

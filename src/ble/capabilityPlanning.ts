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
 * Capability planning — which setting IDs to (pre)fetch for a camera state.
 *
 * Pure functions pulled out of GoProBLEManager: they derive ID lists from a
 * CameraSpecificState via the display plan and model constraints, with no
 * store or connection access. The manager keeps thin wrappers that resolve the
 * active camera state before delegating here.
 */
import type { CameraSpecificState } from '../store/GoProStore';
import { GoProSettingId } from '../constants/GoProSettingId';
import { GoProPresetGroup } from '../constants/GoProPresetGroup';
import { getDisplaySettingPlan } from '../constants/layout';
import { isSettingModelSupported } from '../constants/settingConstraints';
import { resolveCameraModelFromHardwareInfo } from '../cameraModels/shared/modelNumber';

/** IDs to prefetch for the current quick-settings view of this camera state. */
export const getDefaultCapabilityPrefetchIds = (cameraState: CameraSpecificState): number[] => {
  const plan = getDisplaySettingPlan(
    cameraState.settings,
    resolveCameraModelFromHardwareInfo(cameraState.hardwareInfo),
    cameraState.presets,
  );
  return [...plan.defaultCapabilityPrefetchIds];
};

/** Base IDs for a full planned capability refresh of this camera state. */
export const getPlannedFullCapabilityRefreshIds = (cameraState: CameraSpecificState): number[] => {
  const plan = getDisplaySettingPlan(
    cameraState.settings,
    resolveCameraModelFromHardwareInfo(cameraState.hardwareInfo),
    cameraState.presets,
  );
  return [...plan.fullRefreshBaseIds];
};

/**
 * Filter candidate capability IDs to those worth fetching in the current
 * context: finite, supported by the model, never MODE_PRESET(_GROUP), and the
 * framing IDs only in their relevant preset group.
 */
export const filterCapabilityIdsForCurrentContext = (
  settingIds: number[],
  cameraState: CameraSpecificState,
): number[] => {
  const cameraModel = resolveCameraModelFromHardwareInfo(cameraState.hardwareInfo);
  const settings = cameraState.settings;

  const currentGroupId =
    cameraState.pendingSettings[GoProSettingId.MODE_PRESET_GROUP] ??
    settings[GoProSettingId.MODE_PRESET_GROUP];

  return settingIds.filter((id) => {
    if (!Number.isFinite(id)) return false;
    if (!isSettingModelSupported(id, cameraModel)) return false;

    if (id === GoProSettingId.MODE_PRESET || id === GoProSettingId.MODE_PRESET_GROUP) {
      return false;
    }

    if (id === GoProSettingId.VIDEO_FRAMING) {
      return currentGroupId === undefined || currentGroupId === GoProPresetGroup.VIDEO;
    }

    if (id === GoProSettingId.MULTI_SHOT_FRAMING) {
      return currentGroupId === GoProPresetGroup.TIMELAPSE;
    }

    return true;
  });
};

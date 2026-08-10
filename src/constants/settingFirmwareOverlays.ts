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

import { CapabilityPolicy } from './settingFallbackPolicies';
import type { CameraModelKey } from './ResolutionAspectMap';
import { resolveModelNoFromCameraModelKey } from '../cameraModels/shared/modelNumber';
import { VersionOperator, compareVersions } from '../utils/versionUtils';

export type FirmwareOverlay = {
  operator: VersionOperator;
  version: string; // e.g. "H24.01.01.12.00" or "2.0.0"
  addedValues?: Record<number, string>; // Value ID -> Label
  removedValues?: readonly number[];
  overrideLabels?: Record<number, string>;
  overrideOrder?: readonly number[];
  capabilityPolicy?: CapabilityPolicy;
};

/**
 * Thin diff definition of model metadata based on firmware version.
 * Serves as a placeholder to prepare for future updates and new models (introduced in Phase 4).
 */
export const FIRMWARE_OVERLAYS: Partial<
  Record<number, Partial<Record<number, FirmwareOverlay[]>>>
> = {
  // Real data is undecided. For example, to be used when a new value is added in HERO14 v1.20 or later.
};

export const getActiveFirmwareOverlayByModelNo = (
  settingId: number,
  modelNo?: number | null,
  firmwareVersion?: string | null,
): FirmwareOverlay | undefined => {
  if (!modelNo || !firmwareVersion) return undefined;
  const overlays = FIRMWARE_OVERLAYS[settingId]?.[modelNo];
  if (!overlays) return undefined;

  // Returns the first matching overlay
  return overlays.find((o) => compareVersions(firmwareVersion, o.operator, o.version));
};

export const getActiveFirmwareOverlay = (
  settingId: number,
  modelKey?: string | null,
  firmwareVersion?: string | null,
): FirmwareOverlay | undefined => {
  if (!modelKey || !firmwareVersion) return undefined;
  const modelNo = resolveModelNoFromCameraModelKey(modelKey as CameraModelKey);
  return getActiveFirmwareOverlayByModelNo(settingId, modelNo, firmwareVersion);
};

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
 * Capability-cache key derivation.
 *
 * The key uniquely identifies the camera context whose capability lists were
 * fetched, so cached capabilities are only reused when every input that can
 * change them (model, firmware, preset, media format, framing, resolution,
 * fps, lens, hypersmooth, visible special rows) matches.
 *
 * Pulled out of GoProBLEManager as a pure function so it is unit-testable and
 * has no connection/store state. The manager passes isBooting (the only piece
 * of connection state the original method read) explicitly.
 */
import type { CameraSpecificState } from '../store/GoProStore';
import { GoProSettingId, getDisplaySettingPlan } from '../constants/GoProSettingIds';
import { selectIsShortTermBusy } from '../store/GoProSelectors';

/**
 * Build the capability-cache key for a camera state, or null when the state is
 * not stable enough to key on (initial settings not loaded, camera busy, or
 * still booting) — returning null suppresses cache reads/writes for that state.
 */
export function buildCapabilityCacheKey(
  cameraState: CameraSpecificState,
  isBooting: boolean,
): string | null {
  if (!cameraState.hardwareInfo?.modelName) return null;

  // Retrieve pendingSettings with priority (for optimistic UI support)
  const getVal = (id: number) => cameraState.pendingSettings[id] ?? cameraState.settings[id];

  const fw = cameraState.hardwareInfo.firmwareVersion ?? 'unknown';
  const preset = getVal(GoProSettingId.MODE_PRESET);

  // If the initial setting load (0x52) is not complete and MODE_PRESET is unknown,
  // return null to prevent redundant capability fetches on incomplete states.
  // Also, if the camera is busy (isShortTermBusy), the state is transitional (e.g., resolution has changed but preset has not),
  // and generating an invalid cache key could occur, so block fetching until transition is complete.
  // Note: On HERO13, the Standard Preset ID is 0, so 0 is accepted as a normal value.
  if (preset === undefined || selectIsShortTermBusy(cameraState) || isBooting) return null;

  const plan = getDisplaySettingPlan(
    cameraState.settings,
    cameraState.cameraModel,
    cameraState.presets,
  );
  const { cacheKeyProjection, specialRowsProjection } = plan;
  const mediaFormat =
    cacheKeyProjection.mediaFormatSettingId !== null
      ? (getVal(cacheKeyProjection.mediaFormatSettingId) ?? 0)
      : 'X';
  const framing =
    cacheKeyProjection.framingSettingId !== null
      ? (getVal(cacheKeyProjection.framingSettingId) ?? 0)
      : 'X';

  // RESOLUTION / FPS tend to be dependencies for video capabilities, so include them in the key regardless of visibility.
  const res = getVal(GoProSettingId.RESOLUTION) ?? 'X';
  const fps = getVal(GoProSettingId.FPS) ?? 'X';

  // レンズは機種によってIDが異なるため、レイアウトに含まれている方の値を採用する
  let lens: number | string = 'X';
  if (cacheKeyProjection.lensSettingId !== null) {
    lens = getVal(cacheKeyProjection.lensSettingId) ?? 0;
  }

  // VIDEO_LENS capability は RESOLUTION / FPS / HYPERSMOOTH に依存するため、
  // video 系レイアウトでは HyperSmooth 状態も key に含めて stale cache を避ける。
  const hyperSmooth =
    cacheKeyProjection.hyperSmoothSettingId !== null
      ? (getVal(cacheKeyProjection.hyperSmoothSettingId) ?? 0)
      : 'X';
  const specialRowsKey =
    specialRowsProjection.visibleRowKeys.length > 0
      ? [...specialRowsProjection.visibleRowKeys].sort().join('+')
      : 'none';

  return `${cameraState.hardwareInfo.modelName}_${fw}_P${preset}_MF${mediaFormat}_FR${framing}_R${res}_F${fps}_L${lens}_H${hyperSmooth}_SR${specialRowsKey}`;
}

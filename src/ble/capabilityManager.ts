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

import { buildCapabilityCacheKey } from './capabilityCacheKey';
import type { CameraSpecificState } from '../store/GoProStore';

export {
  getDefaultCapabilityPrefetchIds,
  getPlannedFullCapabilityRefreshIds,
  filterCapabilityIdsForCurrentContext,
} from './capabilityPlanning';

/**
 * Computes the unique capability cache key for a given camera state.
 */
export function getCapabilityCacheKey(
  cameraState: CameraSpecificState,
  isBooting: boolean,
): string | null {
  return buildCapabilityCacheKey(cameraState, isBooting);
}

/**
 * Enqueues a pending capability cache key for a specific setting ID.
 */
export function enqueuePendingCapabilityCacheKey(
  pendingMap: Map<number, string[]>,
  settingId: number,
  cacheKey: string,
): void {
  const queue = pendingMap.get(settingId) ?? [];
  queue.push(cacheKey);
  pendingMap.set(settingId, queue);
}

/**
 * Consumes (dequeues) the oldest pending capability cache key for a specific setting ID.
 */
export function consumePendingCapabilityCacheKey(
  pendingMap: Map<number, string[]>,
  settingId: number,
): string | null {
  const queue = pendingMap.get(settingId);
  if (!queue || queue.length === 0) return null;
  const key = queue.shift()!;
  if (queue.length === 0) {
    pendingMap.delete(settingId);
  } else {
    pendingMap.set(settingId, queue);
  }
  return key;
}

export interface CapabilityCacheEvaluationResult {
  hitIds: number[];
  missingIds: number[];
  isFullHit: boolean;
}

/**
 * Evaluates requested capability setting IDs against the in-memory cache map.
 */
export function evaluateCapabilityCacheHit(
  uniqueIds: number[],
  cacheKey: string,
  capabilityCache: Record<string, Record<number, number[]>>,
  bypassCache: boolean,
): CapabilityCacheEvaluationResult {
  if (bypassCache || !capabilityCache[cacheKey]) {
    return {
      hitIds: [],
      missingIds: uniqueIds,
      isFullHit: false,
    };
  }

  const cached = capabilityCache[cacheKey];
  const hitIds = uniqueIds.filter((id) => id in cached);
  const missingIds = uniqueIds.filter((id) => !(id in cached));

  return {
    hitIds,
    missingIds,
    isFullHit: missingIds.length === 0,
  };
}

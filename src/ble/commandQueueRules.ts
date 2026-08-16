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
 * Pure scheduling and gating functions for CommandQueue.
 * Free of side-effects and store dependencies for easy unit testing.
 */

import type { CommandCategory } from '../store/GoProSelectors';

export type BusyRejectReason =
  | 'userOnCamera' // Status 114=1: User is operating the camera body
  | 'encoding' // Status 10=1 or HindSight is Active
  | 'shortTermTimeout' // SystemBusy/Ready wait timeout
  | 'dynamic' // Setting ID that dynamically learned 403 rejection
  | 'notReady'; // Status 82=0 static not ready (without waiting for timeout)

/**
 * Returns true if the command category is exempt from Lane B (shooting lock) blocking.
 * Emergency, system settings, shutter controls, and general camera controls can be executed even while recording.
 */
export function shouldBypassShootingLock(category: CommandCategory): boolean {
  return (
    category === 'emergency' ||
    category === 'systemSetting' ||
    category === 'shutter' ||
    category === 'control'
  );
}

/**
 * Returns true if the command category is exempt from Lane A (short-term SystemBusy) waiting.
 * Emergency, shutter, and system settings bypass SystemBusy wait.
 */
export function shouldBypassShortTermBusy(category: CommandCategory): boolean {
  return (
    category === 'emergency' ||
    category === 'shutter' ||
    category === 'systemSetting'
  );
}

/**
 * Evaluates whether a command should be rejected due to shooting lock (recording / Hindsight active).
 * Returns 'encoding' if locked and category is not exempt, or null if allowed.
 */
export function evaluateShootingLockRejection(
  category: CommandCategory,
  isShootingLocked: boolean,
): BusyRejectReason | null {
  if (isShootingLocked && !shouldBypassShootingLock(category)) {
    return 'encoding';
  }
  return null;
}

/**
 * Evaluates whether a command should be rejected due to dynamic 403 lock learning.
 * Returns 'dynamic' if the setting ID was dynamically learned as locked during recording, or null if allowed.
 */
export function evaluateDynamicLockRejection(
  settingId: number | undefined,
  isShootingLocked: boolean,
  dynamicShootingLockedIds: ReadonlySet<number> | undefined,
): BusyRejectReason | null {
  if (
    settingId !== undefined &&
    isShootingLocked &&
    dynamicShootingLockedIds?.has(settingId)
  ) {
    return 'dynamic';
  }
  return null;
}

/**
 * Evaluates whether a command must wait for SystemBusy or be rejected when not ready.
 * Returns true if the command needs to wait for short-term busy to clear.
 */
export function shouldWaitForReady(
  category: CommandCategory,
  isShortTermBusy: boolean,
): boolean {
  if (shouldBypassShortTermBusy(category)) {
    return false;
  }
  return isShortTermBusy;
}

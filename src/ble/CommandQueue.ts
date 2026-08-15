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
 * CommandQueue — A serialized execution queue that controls execution eligibility, waiting,
 * and rejection of BLE write commands depending on the camera state (SystemBusy/Encoding/UserOnCamera/Ready).
 *
 * Design: docs/implementation-plans/camera-state-control-plan.md §6
 * Model differences consideration: docs/technical/09_camera-state-control.md §4
 */

import {
  COMMAND_QUEUE_LANE_A_WAIT_TIMEOUT_MS,
  COMMAND_QUEUE_STALL_CHECK_TIMEOUT_MS,
  COMMAND_QUEUE_SKIP_CHECK_INTERVAL_MS,
} from '../constants/Timeouts';
import { useGoProStore, selectActiveCameraState } from '../store/GoProStore';
import { debugDebug, debugWarn } from '../utils/debugLogging';
import {
  CommandCategory,
  selectCanWrite,
  selectIsShootingLocked,
  selectIsShortTermBusy,
  selectIsUserHoldingCamera,
} from '../store/GoProSelectors';

export type BusyRejectReason =
  | 'userOnCamera' // Status 114=1: User is operating the camera body
  | 'encoding' // Status 10=1 or HindSight is Active
  | 'shortTermTimeout' // SystemBusy/Ready wait timeout
  | 'dynamic' // Setting ID that dynamically learned 403 rejection
  | 'notReady'; // Status 82=0 static not ready (without waiting for timeout)

export class BusyRejectedError extends Error {
  readonly reason: BusyRejectReason;
  readonly category: CommandCategory;
  readonly label?: string;
  constructor(reason: BusyRejectReason, category: CommandCategory, label?: string) {
    super(`Command rejected: ${reason} (category=${category}${label ? `, ${label}` : ''})`);
    this.name = 'BusyRejectedError';
    this.reason = reason;
    this.category = category;
    this.label = label;
  }
}

export interface EnqueueOptions {
  category: CommandCategory;
  /** 'waitForReady' (default) | 'rejectImmediately' */
  waitPolicy?: 'waitForReady' | 'rejectImmediately';
  /** Lane A wait timeout. Default is 3000ms */
  timeoutMs?: number;
  /** Human-readable name for toast notifications or logs */
  label?: string;
  /** Setting ID subject to dynamic lock learning (optional). Used to detect 403 during recording */
  settingId?: number;
  /** Skip/discard obsolete commands before or after waiting instead of transmitting them */
  shouldSkip?: () => boolean;
}

export class CommandQueue {
  private tail: Promise<unknown> = Promise.resolve();
  private pendingCount = 0;

  enqueue<T>(fn: () => Promise<T>, opts: EnqueueOptions): Promise<T | undefined> {
    const waitPolicy = opts.waitPolicy ?? 'waitForReady';
    const timeoutMs = opts.timeoutMs ?? COMMAND_QUEUE_LANE_A_WAIT_TIMEOUT_MS;
    this.pendingCount += 1;
    const queuedCount = this.pendingCount;
    const commandName = opts.label ?? opts.category;
    const enqueueTime = Date.now();

    if (queuedCount > 1) {
      debugDebug('bleQueue', `[BLE Queue] enqueue depth=${queuedCount} ${commandName}`);
    }

    // For validation: Monitor when the wait time until execution starts is long
    const queueStallTimer = setTimeout(() => {
      debugWarn(
        'bleQueue',
        `[BLE Diagnostics] QUEUE STALL: Command '${commandName}' has been waiting in queue for >5s! Pending count: ${this.pendingCount}`,
      );
    }, COMMAND_QUEUE_STALL_CHECK_TIMEOUT_MS);
    const run = async (): Promise<T | undefined> => {
      clearTimeout(queueStallTimer);

      if (opts.shouldSkip?.()) {
        debugDebug('bleQueue', `[BLE Queue] skip obsolete ${commandName}`);
        return undefined;
      }

      // Lane C (userOnCamera): Deprecated. Since GoPro accepts BLE commands even when Status 114=1,
      // app-side blocking is unnecessary. Just display an indicator in CameraStatusBar.

      // Lane B: Reject shooting settings immediately if recording
      const cameraBefore = selectActiveCameraState(useGoProStore.getState());
      if (
        opts.category !== 'emergency' &&
        opts.category !== 'systemSetting' &&
        opts.category !== 'shutter' &&
        opts.category !== 'control' &&
        selectIsShootingLocked(cameraBefore)
      ) {
        throw new BusyRejectedError('encoding', opts.category, opts.label);
      }

      // Dynamic learning: Pre-emptively reject settings that previously returned 403 during recording
      if (
        opts.settingId !== undefined &&
        selectIsShootingLocked(cameraBefore) &&
        cameraBefore.dynamicShootingLockedIds.has(opts.settingId)
      ) {
        throw new BusyRejectedError('dynamic', opts.category, opts.label);
      }

      // Lane A: Wait for SystemBusy/NotReady to clear
      // Since shutter commands may return SystemBusy=1 / Ready=0 even when stopping recording,
      // blocking them during wait would prevent stopping. Bypass Lane A like emergency commands.
      // systemSetting represents camera settings (e.g., LCD brightness) that can be sent during recording,
      // so transmit them directly without waiting for systemBusy state to clear.
      if (
        opts.category !== 'emergency' &&
        opts.category !== 'shutter' &&
        opts.category !== 'systemSetting' &&
        selectIsShortTermBusy(selectActiveCameraState(useGoProStore.getState()))
      ) {
        if (waitPolicy === 'rejectImmediately') {
          throw new BusyRejectedError('notReady', opts.category, opts.label);
        }
        const readyResult = await waitForReady(timeoutMs, opts.shouldSkip);
        if (readyResult === 'skipped') {
          debugDebug(
            'bleQueue',
            `[BLE Queue] skip obsolete while waiting ${opts.label ?? opts.category}`,
          );
          return undefined;
        }
        if (readyResult === 'timeout') {
          throw new BusyRejectedError('shortTermTimeout', opts.category, opts.label);
        }
      }

      if (opts.shouldSkip?.()) {
        debugDebug(
          'bleQueue',
          `[BLE Queue] skip obsolete after wait ${opts.label ?? opts.category}`,
        );
        return undefined;
      }

      // Final gate check (state might have changed while waiting)
      const cameraFinal = selectActiveCameraState(useGoProStore.getState());
      if (!selectCanWrite(cameraFinal, opts.category)) {
        throw new BusyRejectedError('encoding', opts.category, opts.label);
      }

      return fn();
    };

    // Serialization: Wait for the previous task to complete. Even if the previous task throws an exception, continue execution.
    const chained = this.tail.then(run, run);
    const tracked = chained.finally(() => {
      this.pendingCount = Math.max(0, this.pendingCount - 1);
    });
    this.tail = tracked.catch(() => undefined);
    return tracked;
  }
}

/**
 * Wait up to timeoutMs until isReady=true and systemBusy=false.
 * Event-driven using Zustand subscription instead of polling.
 */
function waitForReady(
  timeoutMs: number,
  shouldSkip?: () => boolean,
): Promise<'ready' | 'timeout' | 'skipped'> {
  return new Promise<'ready' | 'timeout' | 'skipped'>((resolve) => {
    const check = () => {
      if (shouldSkip?.()) {
        return 'skipped' as const;
      }
      const cs = selectActiveCameraState(useGoProStore.getState());
      return selectIsShortTermBusy(cs) ? ('busy' as const) : ('ready' as const);
    };
    const initialResult = check();
    if (initialResult === 'ready' || initialResult === 'skipped') {
      resolve(initialResult);
      return;
    }
    const unsubscribe = useGoProStore.subscribe((state) => {
      if (shouldSkip?.()) {
        cleanup();
        resolve('skipped');
        return;
      }
      if (!selectIsShortTermBusy(selectActiveCameraState(state))) {
        cleanup();
        resolve('ready');
      }
    });
    const timer = setTimeout(() => {
      cleanup();
      resolve(shouldSkip?.() ? 'skipped' : 'timeout');
    }, timeoutMs);
    const skipTimer = setInterval(() => {
      if (shouldSkip?.()) {
        cleanup();
        resolve('skipped');
      }
    }, COMMAND_QUEUE_SKIP_CHECK_INTERVAL_MS);
    const cleanup = () => {
      clearTimeout(timer);
      clearInterval(skipTimer);
      unsubscribe();
    };
  });
}

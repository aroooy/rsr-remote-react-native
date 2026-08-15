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
 * Centralized timeout, debounce, and interval constants for BLE, Wi-Fi, and storage operations.
 *
 * Hardware-tested timing reference:
 * - GoPro BLE notifications typically arrive within 100ms–1500ms depending on camera load.
 * - SystemBusy status debouncing (150ms) prevents UI flickering during rapid setting queries.
 * - Lane A wait timeout (3000ms) matches the GoPro bootup/busy release window.
 */

// ── BLE Connection & Lifecycle ──────────────────────────────────────────────

/** Timeout for BLE device scanning (10 seconds). */
export const BLE_SCAN_TIMEOUT_MS = 10_000;

/** Timeout waiting for camera bootup status after BLE connection (3 seconds). */
export const BLE_BOOTING_TIMEOUT_MS = 3_000;

/** Interval between keep-alive heartbeat pings (15 seconds). */
export const BLE_KEEPALIVE_INTERVAL_MS = 15_000;

/** Duration to retain intentional disconnect device IDs to suppress warning toasts (15 seconds). */
export const BLE_INTENTIONAL_DISCONNECT_RETENTION_MS = 15_000;

/** Delay between chunked BLE packet writes (25 milliseconds). */
export const BLE_CHUNK_SEND_DELAY_MS = 25;

/** Delay between sequential initial query commands during device bootstrap (300 milliseconds). */
export const BLE_BOOTSTRAP_QUERY_DELAY_MS = 300;

/** Delay before initial preset status fetch during device bootstrap (500 milliseconds). */
export const BLE_BOOTSTRAP_PRESET_DELAY_MS = 500;

/** Interval between batched capability query requests (60 milliseconds). */
export const BLE_CAPABILITY_QUERY_INTERVAL_MS = 60;

/** Delay before retrying hardware info query (500 milliseconds). */
export const BLE_HARDWARE_INFO_RETRY_DELAY_MS = 500;

// ── BLE Response & Notification Timeouts ─────────────────────────────────────

/** Default timeout for BLE notification responses (3 seconds). */
export const BLE_DEFAULT_NOTIFICATION_TIMEOUT_MS = 3_000;

/** Extended timeout for slow operations like preset switches or wifi setup (5 seconds). */
export const BLE_EXTENDED_NOTIFICATION_TIMEOUT_MS = 5_000;

/** Timeout for preset rename or custom preset updates (4 seconds). */
export const BLE_PRESET_UPDATE_TIMEOUT_MS = 4_000;

// ── Command Queue ────────────────────────────────────────────────────────────

/** Maximum wait time in Lane A for camera SystemBusy to clear before rejecting (3 seconds). */
export const COMMAND_QUEUE_LANE_A_WAIT_TIMEOUT_MS = 3_000;

/** Timeout to detect stalled queue execution and trigger auto-recovery (5 seconds). */
export const COMMAND_QUEUE_STALL_CHECK_TIMEOUT_MS = 5_000;

/** Interval for checking and purging skipped queue items (50 milliseconds). */
export const COMMAND_QUEUE_SKIP_CHECK_INTERVAL_MS = 50;

// ── Debounce & State Update Timers ───────────────────────────────────────────

/** Debounce duration for Status 8 (SystemBusy) updates to avoid UI jitter (150 milliseconds). */
export const SYSTEM_BUSY_DEBOUNCE_MS = 150;

/** Debounce duration for triggering capability re-fetch after setting changes (300 milliseconds). */
export const CAPABILITY_REFRESH_DEBOUNCE_MS = 300;

/** Debounce duration for preset list refresh (300 milliseconds). */
export const PRESET_REFRESH_DEBOUNCE_MS = 300;

/** Debounce duration for preset state query execution (150 milliseconds). */
export const PRESET_STATE_QUERY_DEBOUNCE_MS = 150;

/** Debounce duration for saving capability cache to SQLite storage (2 seconds). */
export const CAPABILITY_CACHE_SAVE_DEBOUNCE_MS = 2_000;

// ── Wi-Fi & Network ──────────────────────────────────────────────────────────

/** Timeout for Wi-Fi HTTP requests (2 seconds). */
export const WIFI_HTTP_REQUEST_TIMEOUT_MS = 2_000;

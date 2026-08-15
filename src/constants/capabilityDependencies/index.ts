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
 * Capability dependency graph and refresh triggers.
 *
 * Defines which Setting IDs need their capabilities re-fetched when another
 * Setting ID changes, and the priority order for bulk preset restoration.
 */

export {
  CAPABILITY_REFRESH_DEPENDENCIES,
  CAPABILITY_REFRESH_TRIGGER_IDS,
  RESTORE_PRIORITY_ORDER,
  PRESET_REFRESH_TRIGGER_IDS,
  DASHBOARD_SUB_SETTING_IDS,
  CAMERA_ADVANCED_SETTING_IDS,
  PRESET_RESTORE_SYSTEM_SETTING_IDS,
} from './refreshTriggers';

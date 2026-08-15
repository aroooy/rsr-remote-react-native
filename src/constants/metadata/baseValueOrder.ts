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

import { GoProSettingId } from '../GoProSettingId';

/* =========================================================================
 * Base Order & Model Order Overrides
 * ========================================================================= */

// Prioritize the sort order of the legacy C# version ValueNameSettings (HERO13)
export const GOPRO_SETTING_VALUE_ORDER: { [settingId: number]: readonly number[] } = {
  [GoProSettingId.VIDEO_PROFILE]: [0, 101, 1, 2, 3, 100, 102, 200],
  [GoProSettingId.HLG_HDR]: [1, 0], // On / Off
  [GoProSettingId.RESOLUTION]: [
    100, 24, 1, 4, 9, 109, 110, 111, 107, 103, 108, 102, 18, 12, 101, 6, 7, 35, 36, 37, 38, 112,
    113, 21, 22,
    // Hero12 specific
    26, 28, 29, 30, 104, 105, 106,
  ],
  [GoProSettingId.FPS]: [15, 16, 17, 0, 13, 1, 2, 5, 6, 8, 9, 10],
  [GoProSettingId.MAX_LENS_MODE]: [0, 1],
  [GoProSettingId.MAX_LENS_DIRECTION]: [0, 1],
  [GoProSettingId.VIDEO_LENS]: [104, 11, 7, 12, 9, 3, 13, 0, 14, 4, 8, 10, 2, 6],
  // Hero13-specific VideoLens (229) has the same value scheme as VIDEO_LENS (121), so it uses the same order
  [GoProSettingId.VIDEO_LENS_HERO13]: [104, 11, 7, 12, 9, 3, 13, 0, 14, 4, 8, 10, 2, 6],
  [GoProSettingId.PHOTO_LENS]: [100, 101, 102, 19, 22, 23, 24, 25],
  // TIME_LAPSE_LENS: Wide/Linear/Narrow (+ MaxSuperView/27MP variants) — Timelapse/Nightlapse Photo
  // Registered for static fallback because the camera returns empty capabilities when in RAW mode
  [GoProSettingId.TIME_LAPSE_LENS]: [101, 102, 19, 100, 31, 32],
  [GoProSettingId.COLOR]: [100, 101, 2, 102, 1], // 100=Vibrant; 101/2=Natural (new/legacy); 102/1=Flat (new/legacy)
  [GoProSettingId.SHARPNESS]: [0, 1, 2],
  [GoProSettingId.EV_COMP]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [GoProSettingId.WB]: [3, 7, 2, 12, 11, 0, 4, 5, 10, 9, 8],
  [GoProSettingId.VIDEO_ISO_MIN]: [0, 3, 1, 4, 2, 7, 8, 9],
  [GoProSettingId.VIDEO_ISO_MAX]: [0, 3, 1, 4, 2, 7, 8, 9],
  [GoProSettingId.VIDEO_SHUTTER]: [
    67, 56, 66, 51, 55, 50, 65, 31, 64, 30, 54, 49, 63, 24, 62, 29, 53, 48, 61, 23, 60, 28, 27, 47,
    59, 22, 58, 21, 20, 46, 18, 17, 15, 45, 13, 12, 10, 44, 8, 7, 52, 5, 4, 43, 42, 34, 41, 33, 40,
    32, 39, 25, 38, 16, 37, 11, 36, 6, 35, 3, 0,
  ],
  [GoProSettingId.VIDEO_BITRATE]: [1, 0],
  [GoProSettingId.VIDEO_BITRATE_HERO11]: [1, 100], // Hero10/11/HeroMini11: High(1) / Standard(100)
  [GoProSettingId.VIDEO_BITRATE_HERO09]: [1, 0], // Hero09: High(1) / Standard(0)
  // Quick Capture Default (MAX-specific BLE ID 0x8D=141): Sort order from the legacy database MAX/ValueNameSettings.cs
  [GoProSettingId.QUICK_CAPTURE_DEFAULT]: [2, 0, 1], // Last Used / HERO / 360
  // Auto Off: Maintain the static order of existing models to keep compatibility with the legacy database.
  // The second-based options of HeroMini11 are overridden chronologically in the model override.
  [GoProSettingId.AUTO_OFF]: [4, 6, 7, 0],
  // LED (Hero09/10/11/12/Hero13: 3=All On / 4=All Off / 5=Front Off Only)
  // Verified for all models in the legacy database: value=100 (Back Screen Only) does not exist on any model
  [GoProSettingId.LED]: [3, 4, 5],
  // Beep Volume (Hero09-12/HeroMini11/Max): Sort order from the legacy database Hero11/ValueNameSettings.cs
  [GoProSettingId.BEEPS]: [100, 70, 40, 0], // High / Medium / Low / Mute
  // Orientation base (Hero11/12/HeroMini11/Hero13: 100=All / 5=Landscape etc.)
  // Maintain original values. Hero09/10/Max are managed separately via model override.
  [GoProSettingId.ORIENTATION]: [100, 5, 101, 102, 103, 104, 255],
  // Video Compression (Max/Hero09/10): Sort order in legacy database has HEVC (1) first / H.264+HEVC after
  // Max has H.264+HEVC=0, so it uses model override
  [GoProSettingId.VIDEO_COMPRESSION]: [1, 2], // Hero09/10: HEVC(1) / H.264+HEVC(2)
  // Anti Flicker (All models): Sort order in legacy database has 60Hz first / 50Hz after
  // Max is 60Hz=0/50Hz=1, while Hero09/10/11/12 is 60Hz=2/50Hz=3; uses model override
  [GoProSettingId.ANTI_FLICKER]: [2, 3], // Hero09/10/11/12: 60Hz(2) / 50Hz(3)
  [GoProSettingId.BIT_DEPTH]: [2, 0],
  [GoProSettingId.TEN_BIT_COLOR_HERO11]: [1, 0], // Hero11/HeroMini11: On (10bit) first / Off (8bit) after
  [GoProSettingId.HINDSIGHT]: [4, 2, 3],
  [GoProSettingId.HYPERSMOOTH]: [4, 3, 100, 1, 2, 0],
  [GoProSettingId.HYPERSMOOTH_MAX]: [1, 0], // HERO09 Max Video: On / Off
  [GoProSettingId.PHOTO_OUTPUT]: [3, 2, 1, 0],
  [GoProSettingId.TIMELAPSE_PHOTO_OUTPUT]: [0, 1],
  [GoProSettingId.PHOTO_INTERVAL]: [0, 2, 3, 4, 10, 5, 6, 7, 8, 9],
  [GoProSettingId.PHOTO_SHUTTER]: [0, 1, 2, 3, 4, 5],
  [GoProSettingId.NIGHT_PHOTO_SHUTTER]: [0, 1, 2, 3, 4, 5, 6],
  [GoProSettingId.NIGHTLAPSE_PHOTO_SHUTTER]: [0, 1, 2, 3, 4, 5, 6],
  [GoProSettingId.PHOTO_ISO_MIN]: [5, 4, 0, 1, 2, 3],
  [GoProSettingId.PHOTO_ISO_MAX]: [5, 4, 0, 1, 2, 3],
  [GoProSettingId.MULTI_SHOT_ISO_MIN]: [5, 4, 0, 1, 2, 3],
  [GoProSettingId.MULTI_SHOT_ISO_MAX]: [5, 4, 0, 1, 2, 3],
  [GoProSettingId.PHOTO_MODE]: [0, 1, 2],
  [GoProSettingId.TIMEWARP_SPEED]: [10, 7, 8, 9, 0, 1], // Auto/2x/5x/10x/15x/30x
  [GoProSettingId.LOOPING_INTERVAL]: [1, 2, 3, 4],
  [GoProSettingId.CAPTURE_DELAY]: [2, 1, 0], // 10 Sec / 3 Sec / Off
  [GoProSettingId.VIDEO_CLIPS]: [0, 1, 2], // Off / 15 sec / 30 sec (MAX-specific)
  [GoProSettingId.WIND_REDUCTION]: [2, 4, 0], // Auto / On / Off (Hero13-specific)
  [GoProSettingId.MAX_WIND_REDUCTION]: [2, 4, 0], // Auto / On / Off (Hero09-12/HeroMini11; Max uses MODEL_OVERRIDE with [2,1,0])
  [GoProSettingId.DENOISE]: [2, 1, 0], // High / Medium / Low
  [GoProSettingId.RAW_AUDIO]: [2, 1, 0, 3], // High / Medium / Low / Off
  [GoProSettingId.MAX_AUDIO_MODE]: [5, 0, 1, 2, 3], // 360+Stereo / Stereo / Front / Back / Match Lens (MAX-specific)
  [GoProSettingId.AUDIO_TUNING]: [1, 0], // Voice / Standard
  [GoProSettingId.MEDIA_MOD_MIC]: [100, 1, 2, 4], // Camera Mics / Front / Back / Front+Back
  [GoProSettingId.BURST_RATE]: [13, 12, 8, 7, 5, 4, 2, 1, 0, 9], // 60/10s → 3/1s → Auto
  [GoProSettingId.EASY_VIDEO_QUALITY]: [0, 1, 2], // Highest / Standard / Basic
  [GoProSettingId.HORIZONTAL_LEVELING]: [1, 0], // On / Off (Hero11/HeroMini11 uses model override with [2, 0])
  [GoProSettingId.HORIZONTAL_LOCK]: [1, 0], // On / Off
  [GoProSettingId.STAR_TRAILS_LENGTH]: [1, 2, 3], // Short / Long / Max
  // Language (Hero13): English / French / German / Italian / Spanish / Chinese / Japanese / Korean / Portuguese / Russian / Swedish / Chinese(Traditional)
  [GoProSettingId.LANGUAGE]: [0, 6, 2, 3, 4, 1, 5, 7, 8, 9, 10, 11],
  // Voice Language (Hero13): Chinese / English(AUS) / English(IND) / English(UK) / English(US) / French / German / Italian / Japanese / Korean / Portuguese / Russian / Spanish / Spanish(NA) / Swedish
  [GoProSettingId.VOICE_LANGUAGE]: [8, 2, 13, 1, 0, 4, 3, 5, 9, 10, 11, 12, 6, 7, 14],
  // Voice Language Legacy (Hero11/12/HeroMini11): Same order
  [GoProSettingId.VOICE_LANGUAGE_LEGACY]: [8, 2, 13, 1, 0, 4, 3, 5, 9, 10, 11, 12, 6, 7, 14],
  [GoProSettingId.LAPSE_MODE]: [0, 4, 8, 9, 1, 5, 2, 6, 3, 7],
  // Hero13 Dashboard — static values (camera never reports capabilities for these)
  [GoProSettingId.DASHBOARD_ORIENTATION]: [0, 1, 2, 3, 4],
  [GoProSettingId.DASHBOARD_FRONT_DISPLAY]: [0, 1, 2, 3],
  // Front LCD Mode (non-Dashboard, BLE 0x9A): Screen Off / Status Only / Actual View / Full Screen
  [GoProSettingId.FRONT_LCD_MODE]: [0, 1, 2, 3],
  // Screen Saver Rear (BLE 0x9F): 1/2/3/5 Min / Never (Hero09/10/11/12)
  [GoProSettingId.SCREEN_SAVER_REAR]: [1, 2, 3, 4, 0],
  // Screen Saver Max (BLE 0x33=51): 1/2/3 Min / Never (MAX-specific)
  [GoProSettingId.SCREEN_SAVER_MAX]: [1, 2, 3, 0],
  // Screen Saver Front (BLE 0x9E): Never / Match Rear / 1-5 Min
  [GoProSettingId.SCREEN_SAVER_FRONT]: [0, 1, 2, 3, 4, 5],
  // Quick Capture (BLE 0x36): On / Off
  [GoProSettingId.QUICK_CAPTURE]: [1, 0],
  // Default Preset (BLE 0xA1): Last Used / Last Used Video / Last Used Photo / Last Used Time Lapse
  [GoProSettingId.DEFAULT_PRESET]: [200, 100, 101, 102],
  // Default Preset Max (BLE 0x7F=127, 4-byte): Sort order for MAX-specific values (ValueNameSettings.cs Sort order)
  [GoProSettingId.DEFAULT_PRESET_MAX]: [7, 0, 1, 2, 3, 4, 5], // Last Used / HERO Video / HERO Photo / HERO TL / 360 Video / 360 Photo / 360 TL
  // Timelapse formats (camera doesn't report capabilities dynamically)
  [GoProSettingId.MEDIA_FORMAT]: [13, 20, 21, 26],
  // Timelapse/Nightlapse interval: longest -> shortest (ValueNameSettings.cs Sort order)
  [GoProSettingId.VIDEO_TIMELAPSE_RATE]: [10, 9, 8, 7, 6, 5, 4, 3, 11, 2, 1, 0],
  // Hero13 PHOTO_TIMELAPSE_RATE: Sort the index values (100-110, 11) from longest to shortest
  // MAX values (60/30/10/5/2/1/0) are overridden in GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE[max]
  [GoProSettingId.PHOTO_TIMELAPSE_RATE]: [
    100, 101, 102, 103, 104, 105, 106, 107, 11, 108, 109, 110,
  ],
  [GoProSettingId.NIGHTLAPSE_RATE]: [3600, 1800, 300, 120, 100, 30, 20, 15, 10, 5, 4, 3601],
  // Duration: No Limit first / then shortest to longest
  // VIDEO_DURATION (ID=156): Timelapse Video / Timewarp
  // MULTI_SHOT_DURATION (ID=157): Nightlapse Video (all models) / Timelapse & Nightlapse Photo / trail_like
  [GoProSettingId.VIDEO_DURATION]: [100, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [GoProSettingId.MULTI_SHOT_DURATION]: [100, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  // Virtual ID (BLE ID = 31): Shutter value sets for each trail_like preset (ValueNameSettings.cs Sort order)
  [GoProSettingId.STAR_TRAIL_SHUTTER]: [6, 3, 2, 1, 8, 7], // 30s/10s/5s/2s/1s/0.5s
  [GoProSettingId.LIGHT_PAINTING_SHUTTER]: [1, 8, 7], // 2s/1s/0.5s
  [GoProSettingId.VEHICLE_LIGHTS_SHUTTER]: [6, 3, 2, 1, 8, 7], // 30s/10s/5s/2s/1s/0.5s
  // Virtual ID (BLE ID = 145): Timelapse Video shutter (same order as VIDEO_SHUTTER)
  [GoProSettingId.TIMELAPSE_VIDEO_SHUTTER]: [
    67, 56, 66, 51, 55, 50, 65, 31, 64, 30, 54, 49, 63, 24, 62, 29, 53, 48, 61, 23, 60, 28, 27, 47,
    59, 22, 58, 21, 20, 46, 18, 17, 15, 45, 13, 12, 10, 44, 8, 7, 52, 5, 4, 43, 42, 34, 41, 33, 40,
    32, 39, 25, 38, 16, 37, 11, 36, 6, 35, 3, 0,
  ],
};

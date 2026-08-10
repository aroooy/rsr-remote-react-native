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

import { CameraModelKey } from './ResolutionAspectMap';
import { GoProPresetGroup, GoProPresetGroupSelectId } from './GoProPresetGroup';
import {
  EASY_ANAMORPHIC_NIGHT_PHOTO_PRESET_HERO13,
  EASY_ANAMORPHIC_SUPER_PHOTO_PRESET_HERO13,
  EASY_ANAMORPHIC_TIMEWARP_PRESET_HERO13,
  EASY_MACRO_NIGHTLAPSE_PRESET_HERO13,
  EASY_MACRO_NIGHT_PHOTO_PRESET_HERO13,
  EASY_MACRO_PHOTO_PRESET_HERO13,
  EASY_MACRO_TIMELAPSE_PRESET_HERO13,
} from './hero13PresetIds';
import {
  PRESET_ACTIVITY,
  PRESET_ANAMORPHIC_NIGHT_PHOTO,
  PRESET_BURST,
  PRESET_EASY_BASIC_QUALITY,
  PRESET_EASY_ANAMORPHIC_VIDEO,
  PRESET_EASY_EB_VIDEO,
  PRESET_EASY_HIGHEST_QUALITY,
  PRESET_EASY_LB_VIDEO,
  PRESET_EASY_MACRO_VIDEO,
  PRESET_EASY_MAX_LIGHT_PAINTING,
  PRESET_EASY_MAX_PHOTO,
  PRESET_EASY_MAX_PHOTO_1,
  PRESET_EASY_MAX_STAR_TRAILS,
  PRESET_EASY_MAX_TIMEWARP,
  PRESET_EASY_MAX_VEHICLE_LIGHTS,
  PRESET_EASY_MAX_VIDEO_1,
  PRESET_EASY_MAX_VIDEO,
  PRESET_ANAMORPHIC_TIMEWARP,
  PRESET_EASY_STANDARD_QUALITY,
  PRESET_HERO11_EB_ACTIVITY_VIDEO,
  PRESET_HERO11_EB_CINEMATIC_VIDEO,
  PRESET_HERO11_EB_SLO_MO_VIDEO,
  PRESET_HERO11_EB_STANDARD_VIDEO,
  PRESET_HERO11_LB_ACTIVITY_VIDEO,
  PRESET_HERO11_LB_CINEMATIC_VIDEO,
  PRESET_HERO11_LB_SLO_MO_VIDEO,
  PRESET_HERO11_LB_STANDARD_VIDEO,
  PRESET_LEGACY_EASY_BURST_PHOTO,
  PRESET_LEGACY_EASY_LIGHT_PAINTING,
  PRESET_LEGACY_EASY_NIGHT_PHOTO,
  PRESET_LEGACY_EASY_PHOTO,
  PRESET_LEGACY_EASY_STAR_TRAILS,
  PRESET_LEGACY_EASY_TIMEWARP,
  PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
  PRESET_LIGHT_PAINTING,
  PRESET_LIVE_BURST,
  PRESET_MACRO_NIGHTLAPSE,
  PRESET_MACRO_NIGHT_PHOTO,
  PRESET_MACRO_PHOTO,
  PRESET_MACRO_TIMELAPSE,
  PRESET_MACRO_VIDEO,
  PRESET_MAX_LIGHT_PAINTING_2,
  PRESET_MAX_NIGHTLAPSE,
  PRESET_MAX_PHOTO,
  PRESET_MAX_PHOTO_2,
  PRESET_MAX_STAR_TRAILS_2,
  PRESET_MAX_TIMELAPSE,
  PRESET_MAX_TIMEWARP,
  PRESET_MAX_TIMEWARP_2,
  PRESET_MAX_VEHICLE_LIGHTS_2,
  PRESET_MAX_VIDEO,
  PRESET_MAX_VIDEO_2,
  PRESET_NIGHTLAPSE,
  PRESET_NIGHT_PHOTO,
  PRESET_PHOTO,
  PRESET_STANDARD,
  PRESET_STAR_TRAILS,
  PRESET_TIMELAPSE,
  PRESET_TIMEWARP,
  PRESET_VEHICLE_LIGHTS,
} from './presetIds';
import { GOPRO_MODEL_NUMBERS } from './GoProModelNumbers';
import { resolveModelDisplayLayout } from './displayLayoutResolver';
import { resolvePhotoLayoutState } from './photoLayoutState';
import { resolveBaseDisplayPresetId } from '../cameraModels/shared/displayPreset';
import { resolveSpecialRowsProjection } from '../cameraModels/shared/specialRowsProjection';
import { resolveTimelapseLayoutState } from './timelapseLayoutState';
import { resolveVideoLayout } from './videoLayoutResolver';
import { resolveModelNoFromCameraModelKey } from '../cameraModels/shared/modelNumber';
import type { GoProPreset, GoProPresetGroupData } from '../ble/PresetProtobuf';
import type { SpecialRowsProjection } from '../cameraModels/shared/types';

export const GoProSettingId = {
  RESOLUTION: 2,
  FPS: 3,
  VIDEO_ISO_MAX: 13,
  VIDEO_TIMELAPSE_RATE: 5,
  LOOPING_INTERVAL: 6,
  PHOTO_TIMELAPSE_RATE: 30,
  NIGHTLAPSE_RATE: 32,
  NIGHTLAPSE_PHOTO_SHUTTER: 31, // Nightlapse Video/Photo Shutter (4-byte int)
  // ── Virtual IDs: BLE ID is always 31, but since the set of values differs per preset, they have UI-exclusive IDs ──
  // Legacy app: TL_StarTrailShutter(3047)/TL_LightPaintingShutter(3048)/TL_VehicleLightsShutter(3049) are
  //             all set/get using BLE ID 31, but their value sets differ (StarTrail: 30s to 0.5s, LP: 2s/1s/0.5s, VL: 30s to 0.5s)
  STAR_TRAIL_SHUTTER: 10031, // Virtual: BLE ID 31, Value set = {30s, 10s, 5s, 2s, 1s, 0.5s}
  LIGHT_PAINTING_SHUTTER: 10032, // Virtual: BLE ID 31, Value set = {2s, 1s, 0.5s}
  VEHICLE_LIGHTS_SHUTTER: 10033, // Virtual: BLE ID 31, Value set = {30s, 10s, 5s, 2s, 1s, 0.5s}
  // ── Virtual ID: BLE ID is 145, but static full list is displayed for Timelapse Video, ignoring capability ──
  // Virtual ID to separate from Video mode (capability-based) because the camera only reports
  // Auto ({0}) for VIDEO_SHUTTER (145) in Timelapse Video mode.
  TIMELAPSE_VIDEO_SHUTTER: 10145, // Virtual: BLE ID 145, statically displays all VIDEO_SHUTTER values
  AUTO_OFF: 59,
  MODE_PRESET_GROUP: 92,
  MODE_PRESET: 93,
  VIDEO_ISO_MIN: 102,
  COLOR: 116,
  SHARPNESS: 117,
  EV_COMP: 118,
  WB: 115,
  PHOTO_OUTPUT: 125, // Photo / NightPhoto (Photo group)
  TIMELAPSE_PHOTO_OUTPUT: 126, // Timelapse / Nightlapse Photo (Timelapse group)
  MEDIA_FORMAT: 128,
  PHOTO_MODE: 227,
  ANTI_FLICKER: 134,
  HYPERSMOOTH: 135,
  HYPERSMOOTH_MAX: 148, // BLE ID 0x94: Max 専用 HyperSmooth (書き込み先 ID)
  VIDEO_SHUTTER: 145,
  PHOTO_SHUTTER: 146, // Photo (Photo group)
  NIGHT_PHOTO_SHUTTER: 19, // NightPhoto (Photo group)
  PHOTO_ISO_MIN: 75, // Photo / NightPhoto (Photo group, shared)
  PHOTO_ISO_MAX: 24, // Photo / NightPhoto (Photo group, shared)
  MULTI_SHOT_ISO_MIN: 76, // Burst (Photo) / Nightlapse (Timelapse), shared
  MULTI_SHOT_ISO_MAX: 37, // Burst (Photo) / Nightlapse (Timelapse), shared
  TIMEWARP_SPEED: 111, // Speed setting for TimeWarp / MaxTimeWarp2_0 (1-byte)
  SPEED_RAMP: 155, // BLE ID 0x9B: Speed ramp for TimeWarp (shared Hero09-13) values: 100=Real Speed, 101=Half Speed
  CAPTURE_DELAY: 105, // Timer (from shutter to record start) = BLE ID 0x69 (1-byte)
  VIDEO_DURATION: 156,
  MULTI_SHOT_DURATION: 157,
  HINDSIGHT: 167,
  SCHEDULED_CAPTURE: 168,
  PHOTO_INTERVAL: 171,
  PHOTO_INTERVAL_DURATION: 172,
  CONTROL_MODE: 175,
  STAR_TRAILS_LENGTH: 179, // BLE ID 0xB3: Hero12/13 (書き込み先 ID)
  STAR_TRAILS_LENGTH_HERO11: 131, // BLE ID 0x83: Hero11 legacy write/notify ID
  SYSTEM_VIDEO_MODE: 180,
  VIDEO_BITRATE: 182, // BLE ID 0xB6: Hero12/13 専用
  VIDEO_BITRATE_HERO11: 124, // BLE ID 0x7C: Hero10/11/HeroMini11 共通 (values: 1=High, 100=Standard)
  VIDEO_BITRATE_HERO09: 160, // BLE ID 0xA0: Hero09 exclusive (values: 1=High, 0=Standard) *Confirmed via device logs
  BIT_DEPTH: 183,
  TEN_BIT_COLOR_ALT: 114,
  TEN_BIT_COLOR_HERO11: 174, // 10-Bit Color (BLE ID 0xAE) — Hero11/HeroMini11 exclusive (Hero12/13 use BIT_DEPTH=183)
  VIDEO_LENS: 121,
  PHOTO_LENS: 122,
  TIME_LAPSE_LENS: 123,
  // Hero13 exclusive Lens IDs (from override commands in legacy app Hero13/FullControlPanelViewModel.cs)
  // In Hero13, 229 is used instead of VIDEO_LENS (121) in Timelapse Video / Video modes.
  // Hero12 and earlier continue to use VIDEO_LENS (121).
  VIDEO_LENS_HERO13: 229, // Hero13 VideoLens (0xE5)
  PHOTO_LENS_HERO13: 230, // Hero13 PhotoLens (0xE6) — For future compatibility
  // MULTI_SHOT_LENS (231) has the same ID in Hero13, so the common definition is reused
  LAPSE_MODE: 187,
  MAX_LENS_MOD_HERO13: 189,
  MAX_LENS_MOD_ENABLE: 190,
  MULTI_SHOT_ASPECT_RATIO: 192,
  FRAMING: 193,
  VIDEO_FRAMING: 232,
  MULTI_SHOT_FRAMING: 233,
  MULTI_SHOT_LENS: 231,
  TEN_BIT_COLOR: 143,
  MAX_LENS_DIRECTION: 143, // GoPro Max: Front/Rear
  MAX_LENS_MODE: 142, // GoPro Max: Single/Dual
  MAX_LENS_MOD: 162,
  VIDEO_PROFILE: 184,
  HLG_HDR: 199, // HLG HDR (BLE ID 0xC7) Hero13 exclusive; On=Native HLG, Off=In-camera HDR processing
  GPS: 83,
  LCD_BRIGHTNESS: 88,
  LED: 91,
  WIRELESS_BAND: 178,
  BEEP_VOLUME: 216,
  SCREEN_SAVER: 219, // Rear Screen Saver (BLE ID 0xDB) Hero13 exclusive *Verified in legacy app
  SCREEN_SAVER_REAR: 159, // Rear Screen Saver (BLE ID 0x9F) Hero09/10/11/12 exclusive *Verified in legacy app
  SCREEN_SAVER_MAX: 51, // Rear Screen Saver (BLE ID 0x33) MAX exclusive *Verified in legacy app
  SCREEN_SAVER_FRONT: 158, // Front Screen Saver (BLE ID 0x9E) ※Hero13/12/10/9
  FRONT_LCD_MODE: 154, // Front LCD Mode non-Dashboard (BLE ID 0x9A) — Active when Dashboard Override is OFF
  LANGUAGE: 84, // Setup Language (BLE ID 0x54) *Verified in legacy app
  VOICE_LANGUAGE: 223, // Voice Control Language (BLE ID 0xDF) Hero13 exclusive *Verified in legacy app
  VOICE_LANGUAGE_LEGACY: 85, // Voice Control Language (BLE ID 0x55) Hero11/12/HeroMini11 *Verified in legacy app
  VOICE_CONTROL: 86, // Voice Control On/Off (BLE ID 0x56) Shared by all models *Verified in legacy app
  BEEPS: 87, // Beep Volume (BLE ID 0x57) Hero9-12/Mini11/MAX (Hero13 uses BEEP_VOLUME: 216)
  ENABLE_BEEP: 221, // Enable Beep On/Off (BLE ID 0xDD) Hero13 exclusive *Verified in legacy app
  ORIENTATION: 112, // Orientation / Landscape Lock (BLE ID 0x70) Shared by all models *Verified in legacy app
  SCREEN_LOCK: 103, // Screen Lock On/Off (BLE ID 0x67) Shared by all models *Verified in legacy app
  QUICK_CAPTURE: 54, // Quick Capture (BLE ID 0x36) *Verified in legacy app
  DEFAULT_PRESET: 161, // Default Preset (BLE ID 0xA1) Hero09-13/HeroMini11 *Verified in legacy app
  DEFAULT_PRESET_MAX: 127, // Default Preset (BLE ID 0x7F, 4-byte) MAX exclusive *Verified in legacy app (Values: 7=Last Used, 0=HERO Video, 1=HERO Photo, 2=HERO Time Lapse, 3=360 Video, 4=360 Photo, 5=360 Time Lapse)

  // Hero13 Dashboard Override Controls (0xCD–0xD4)
  DASHBOARD_OVERRIDE: 205,
  DASHBOARD_VOICE_CONTROL: 206,
  DASHBOARD_SCREEN_SAVER: 207,
  DASHBOARD_BEEPS: 208,
  DASHBOARD_ORIENTATION: 209,
  DASHBOARD_FRONT_DISPLAY: 210,
  DASHBOARD_SCREEN_LOCK: 211,
  DASHBOARD_LED: 212,

  // Photo Burst
  BURST_RATE: 147, // Burst Rate (BLE ID 0x93) *Confirmed on Hero13 device

  // Easy Video
  EASY_VIDEO_QUALITY: 201, // Quality (0=Highest / 1=Standard / 2=Basic) BLE ID 0xC9 *Hero13 confirmed on device

  // Horizontal Level / Lock (Exclusive to Max Lens 2.0 presets)
  HORIZONTAL_LEVELING: 165, // BLE ID 0xA5: Hero12/13 + MaxVideo2_0 / MaxTimewarp2_0 / EasyMaxTimeWarp2_0
  HORIZONTAL_LEVELING_HERO11: 150, // BLE ID 0x96: Hero11/HeroMini11 exclusive (write-only ID)
  HORIZONTAL_LOCK: 166, // BLE ID 0xA6: Hero12/13 + MaxPhoto2_0 / MacroPhoto / MacroNightPhoto / EasyMaxPhoto / EasyMaxPhoto2_0
  HORIZONTAL_LOCK_HERO11: 151, // BLE ID 0x97: Hero11/HeroMini11 exclusive (write-only ID)

  // Audio / Image Processing
  WIND_REDUCTION: 214, // Wind Reduction — Hero13: BLE ID 0xD6. Other models use MAX_WIND_REDUCTION
  MAX_WIND_REDUCTION: 149, // Wind Reduction — Hero09-12/HeroMini11/MAX: BLE ID 0x95. Hero13 uses WIND_REDUCTION (214)
  DENOISE: 198, // Denoise (BLE ID 0xC6) High/Medium/Low
  RAW_AUDIO: 139, // RAW Audio (BLE ID 0x8B) — Shared by all models. Legacy app BaseFullControlPanelViewModel line 9793
  AUDIO_TUNING: 203, // Audio Tuning (BLE ID 0xCB) — Hero13 exclusive (Standard/Activity/MacroVideo only). Legacy app line 11964
  MAX_AUDIO_MODE: 137, // Microphone Mode (BLE ID 0x89) — MAX exclusive. Stereo/Front/Back/Match Lens.
  // Legacy app: V_360RAWAudio (SettingElements=1035). Value scheme changed from 0/5 to 0/1/2/3 via firmware updates.
  // BLE change notifications arrive simultaneously for ID=137 and ID=138 (0x8A), but only 137 is used for writes.

  // Media Mod / External Microphone
  MEDIA_MOD_MIC: 164, // Media Mod Audio Source (BLE ID 0xA4) — Visibility condition: mediaModMicStatus === 2
  // Confirmed via legacy app BaseFullControlPanelViewModel.cs line 9435
  MEDIA_MOD: 169, // Media Mod Type (BLE ID 0xA9) — Hero09-13. Standard Mic/Powered Mic, etc.

  // System Settings (Camera Advanced)
  VIDEO_PERFORMANCE_MODE: 173, // Video Performance Mode (BLE ID 0xAD) — Hero10 exclusive
  VIDEO_COMPRESSION: 106, // Video Compression (BLE ID 0x6A) — MAX/Hero09/Hero10
  VIDEO_CLIPS: 107, // Clips (BLE ID 0x6B, 1-byte) — MAX Standard Video exclusive (0=Off/1=15sec/2=30sec)
  LENS_ATTACHMENT: 217, // Lens Attachment (BLE ID 0xD9) — Hero13 exclusive
  QUICK_CAPTURE_DEFAULT: 141, // Quick Capture Default Mode (BLE ID 0x8D, 4-byte) — MAX exclusive

  // Preset Settings (Macro presets only)
  FOCUS_PEAKING: 200, // Focus Peaking (BLE ID 0xC8) — Hero13 Macro preset exclusive
} as const;

export const MODE_AND_PROFILE_SETTING_IDS: readonly number[] = [
  GoProSettingId.MODE_PRESET_GROUP,
  GoProSettingId.MODE_PRESET,
] as const;

export const PRIMARY_SETTING_IDS: readonly number[] = [
  GoProSettingId.VIDEO_PROFILE,
  GoProSettingId.RESOLUTION,
  GoProSettingId.FPS,
  GoProSettingId.VIDEO_LENS,
  GoProSettingId.PHOTO_LENS,
] as const;

export const PRIMARY_SETTING_DISPLAY_ORDER: readonly number[] = [
  GoProSettingId.VIDEO_PROFILE,
  GoProSettingId.RESOLUTION,
  GoProSettingId.FPS,
  GoProSettingId.VIDEO_LENS,
  GoProSettingId.PHOTO_LENS,
] as const;

export const CAPABILITY_REFRESH_TRIGGER_IDS: readonly number[] = [
  GoProSettingId.MEDIA_FORMAT,
  GoProSettingId.LAPSE_MODE,
  GoProSettingId.MEDIA_MOD,
  GoProSettingId.MEDIA_MOD_MIC,
  GoProSettingId.MODE_PRESET_GROUP,
  GoProSettingId.MODE_PRESET,
  GoProSettingId.VIDEO_PROFILE,
  GoProSettingId.VIDEO_BITRATE, // Changing VIDEO_BITRATE changes choices for BIT_DEPTH
  GoProSettingId.BIT_DEPTH,
  GoProSettingId.TEN_BIT_COLOR_HERO11,
  GoProSettingId.VIDEO_LENS,
  GoProSettingId.PHOTO_LENS,
  GoProSettingId.VIDEO_FRAMING,
  GoProSettingId.RESOLUTION, // Changing RESOLUTION changes choices for FPS/VIDEO_LENS/HYPERSMOOTH
  GoProSettingId.FPS, // Changing FPS changes choices for RESOLUTION/VIDEO_LENS/HYPERSMOOTH/VIDEO_SHUTTER
  GoProSettingId.ANTI_FLICKER, // Changing ANTI_FLICKER (50/60Hz) changes choices for VIDEO_SHUTTER
  GoProSettingId.VIDEO_ISO_MIN, // Changing VIDEO_ISO_MIN changes the lower limit of VIDEO_ISO_MAX
  GoProSettingId.VIDEO_ISO_MAX, // Changing VIDEO_ISO_MAX changes the upper limit of VIDEO_ISO_MIN
  GoProSettingId.DASHBOARD_OVERRIDE, // Fetch capabilities of conflicting items in Camera Settings again on Dashboard Override ON/OFF
] as const;

/**
 * Priority application order list of "parent" settings (which open up other options and available presets)
 * to avoid restrictions caused by Capability checks during bulk restoration of custom presets, etc.
 * Parent settings originating from Camera Settings must be applied before MODE_PRESET; otherwise,
 * subsequent settings might be rounded down in an incorrect preset/capability context.
 * Although MEDIA_MOD_MIC is not a Camera Setting, it is applied with the highest priority immediately after sending the preset ID.
 * Settings listed here are sent in this exact order, and all other settings are sent last.
 */
const PRESET_RESTORE_PRESET_PARENT_SETTING_IDS: readonly number[] = [
  GoProSettingId.CONTROL_MODE,
  GoProSettingId.SYSTEM_VIDEO_MODE,
  GoProSettingId.VIDEO_PERFORMANCE_MODE,
  GoProSettingId.MAX_LENS_MOD,
  GoProSettingId.MAX_LENS_MOD_HERO13,
  GoProSettingId.MAX_LENS_MOD_ENABLE,
  GoProSettingId.LENS_ATTACHMENT,
  GoProSettingId.ANTI_FLICKER,
] as const;

const PRESET_RESTORE_POST_PRESET_PRIORITY_SETTING_IDS: readonly number[] = [
  GoProSettingId.MEDIA_MOD_MIC,
] as const;

export const RESTORE_PRIORITY_ORDER: readonly number[] = [
  ...PRESET_RESTORE_PRESET_PARENT_SETTING_IDS,
  GoProSettingId.MODE_PRESET_GROUP,
  GoProSettingId.MODE_PRESET,
  ...PRESET_RESTORE_POST_PRESET_PRIORITY_SETTING_IDS,
  GoProSettingId.VIDEO_PROFILE,
  GoProSettingId.VIDEO_FRAMING,
  GoProSettingId.RESOLUTION,
  GoProSettingId.FPS,
  GoProSettingId.VIDEO_LENS,
  GoProSettingId.PHOTO_LENS,
  GoProSettingId.TIME_LAPSE_LENS,
] as const;

/**
 * When these settings change, the list of available presets may also change.
 * Although the camera's Protobuf push notification (0xF3) is primary, fetchPresetStatus()
 * is re-triggered as a fallback when changes to these settings are detected.
 *
 *  175 CONTROL_MODE           Easy/Pro          Hero11/12/13
 *  180 SYSTEM_VIDEO_MODE      HQ/Standard/Basic Hero11
 *  173 VIDEO_PERFORMANCE_MODE Max/ExtBat/Tripod Hero10
 *  162 MAX_LENS_MOD           Off/On            Hero9/10/11
 *  189 MAX_LENS_MOD_HERO13    None/1.0/2.0/...  Hero12 (Hero13 integrates this into LENS_ATTACHMENT (217))
 *  217 LENS_ATTACHMENT        Lens / Max Lens / Anamorphic / Macro ... Hero13
 *  190 MAX_LENS_MOD_ENABLE    Off/On            Hero9/10/11/12
 */
export const PRESET_REFRESH_TRIGGER_IDS: readonly number[] = [
  GoProSettingId.CONTROL_MODE,
  GoProSettingId.SYSTEM_VIDEO_MODE,
  GoProSettingId.VIDEO_PERFORMANCE_MODE,
  GoProSettingId.MAX_LENS_MOD,
  GoProSettingId.MAX_LENS_MOD_HERO13,
  GoProSettingId.LENS_ATTACHMENT,
  GoProSettingId.MAX_LENS_MOD_ENABLE,
] as const;

export const CAMERA_ADVANCED_SETTING_IDS: readonly number[] = [
  // General
  GoProSettingId.CONTROL_MODE,
  GoProSettingId.SYSTEM_VIDEO_MODE,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET,
  GoProSettingId.DEFAULT_PRESET_MAX,
  GoProSettingId.LED,
  // Sound
  GoProSettingId.BEEPS,
  GoProSettingId.ENABLE_BEEP,
  GoProSettingId.BEEP_VOLUME,
  // Voice Control
  GoProSettingId.VOICE_CONTROL,
  GoProSettingId.VOICE_LANGUAGE,
  GoProSettingId.VOICE_LANGUAGE_LEGACY,
  // Displays
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.SCREEN_SAVER, // Hero13 専用 (BLE ID 0xDB=219)
  GoProSettingId.SCREEN_SAVER_REAR, // Hero09/10/11/12 (BLE ID 0x9F=159)
  GoProSettingId.SCREEN_SAVER_MAX, // Max 専用 (BLE ID 0x33=51)
  GoProSettingId.SCREEN_SAVER_FRONT,
  GoProSettingId.FRONT_LCD_MODE,
  GoProSettingId.SCREEN_LOCK,
  GoProSettingId.ORIENTATION,
  // Regional
  GoProSettingId.GPS,
  // WIRELESS_BAND (178) is excluded because BLE write is rejected with 0x01 (Error).
  // The camera's specification only accepts band changes when it is operating as a Wi-Fi AP.
  // Changes must be made via the camera's physical menu.
  GoProSettingId.LANGUAGE,
  // Mods
  GoProSettingId.MAX_LENS_MOD_HERO13,
  GoProSettingId.MAX_LENS_MOD,
  GoProSettingId.MAX_LENS_MOD_ENABLE,
  GoProSettingId.LENS_ATTACHMENT,
  GoProSettingId.MEDIA_MOD,
  // Video System
  GoProSettingId.VIDEO_PERFORMANCE_MODE,
  GoProSettingId.VIDEO_COMPRESSION,
  // Anti Flicker (全モデル共通 Camera Settings)
  GoProSettingId.ANTI_FLICKER,
  // Quick Capture Default (Max only)
  GoProSettingId.QUICK_CAPTURE_DEFAULT,
] as const;

// Evaluation of "system settings" during custom preset restoration.
// Include MEDIA_MOD_MIC, which is not exposed in the Camera Settings UI, under includeSystemSettings.
export const PRESET_RESTORE_SYSTEM_SETTING_IDS: readonly number[] = [
  ...CAMERA_ADVANCED_SETTING_IDS,
  GoProSettingId.MEDIA_MOD_MIC,
] as const;

export const DASHBOARD_SUB_SETTING_IDS: readonly number[] = [
  GoProSettingId.DASHBOARD_VOICE_CONTROL,
  GoProSettingId.DASHBOARD_SCREEN_SAVER,
  GoProSettingId.DASHBOARD_BEEPS,
  GoProSettingId.DASHBOARD_ORIENTATION,
  GoProSettingId.DASHBOARD_FRONT_DISPLAY,
  GoProSettingId.DASHBOARD_SCREEN_LOCK,
  GoProSettingId.DASHBOARD_LED,
] as const;

/**
 * A list of Setting IDs whose capabilities should be re-fetched when a certain Setting ID changes.
 * Used as arguments for fetchCapabilitiesByIds to handle processing automatically at the BLE layer rather than the SettingsPanel side.
 */
export const CAPABILITY_REFRESH_DEPENDENCIES: Readonly<Record<number, readonly number[]>> = {
  // Reason for including VIDEO_LENS_HERO13 (229):
  //   Since Hero13 uses VIDEO_LENS_HERO13 in Timelapse Video,
  //   its capability is always re-fetched when MEDIA_FORMAT/LAPSE_MODE/MODE_PRESET changes.
  [GoProSettingId.MEDIA_FORMAT]: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.TIME_LAPSE_LENS,
    GoProSettingId.VIDEO_LENS_HERO13,
    GoProSettingId.PHOTO_LENS,
    GoProSettingId.PHOTO_OUTPUT,
    GoProSettingId.TIMELAPSE_PHOTO_OUTPUT,
    GoProSettingId.MULTI_SHOT_FRAMING,
    GoProSettingId.NIGHTLAPSE_PHOTO_SHUTTER,
    GoProSettingId.MULTI_SHOT_ISO_MIN,
    GoProSettingId.MULTI_SHOT_ISO_MAX,
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.VIDEO_ISO_MIN,
    GoProSettingId.VIDEO_ISO_MAX,
  ],
  [GoProSettingId.LAPSE_MODE]: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.TIME_LAPSE_LENS,
    GoProSettingId.VIDEO_LENS_HERO13,
    GoProSettingId.PHOTO_LENS,
    GoProSettingId.PHOTO_OUTPUT,
    GoProSettingId.TIMELAPSE_PHOTO_OUTPUT,
    GoProSettingId.MULTI_SHOT_FRAMING,
    GoProSettingId.STAR_TRAILS_LENGTH,
    GoProSettingId.NIGHTLAPSE_PHOTO_SHUTTER,
    GoProSettingId.MULTI_SHOT_ISO_MIN,
    GoProSettingId.MULTI_SHOT_ISO_MAX,
  ],
  [GoProSettingId.MEDIA_MOD]: [GoProSettingId.MEDIA_MOD_MIC],
  [GoProSettingId.MEDIA_MOD_MIC]: [GoProSettingId.MEDIA_MOD_MIC],
  [GoProSettingId.VIDEO_FRAMING]: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.HYPERSMOOTH,
  ],
  [GoProSettingId.VIDEO_LENS]: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.HYPERSMOOTH,
  ],
  [GoProSettingId.VIDEO_LENS_HERO13]: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.HYPERSMOOTH,
  ],
  [GoProSettingId.PHOTO_LENS]: [GoProSettingId.PHOTO_OUTPUT],
  [GoProSettingId.VIDEO_PROFILE]: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_BITRATE,
    GoProSettingId.HYPERSMOOTH,
  ],
  [GoProSettingId.BIT_DEPTH]: [GoProSettingId.VIDEO_BITRATE],
  [GoProSettingId.VIDEO_BITRATE]: [GoProSettingId.BIT_DEPTH], // Re-fetch options for BIT_DEPTH when VIDEO_BITRATE changes
  [GoProSettingId.TEN_BIT_COLOR_HERO11]: [GoProSettingId.VIDEO_BITRATE],
  [GoProSettingId.RESOLUTION]: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.VIDEO_LENS_HERO13,
    GoProSettingId.HYPERSMOOTH,
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.VIDEO_BITRATE,
  ],
  [GoProSettingId.FPS]: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.VIDEO_LENS_HERO13,
    GoProSettingId.HYPERSMOOTH,
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.VIDEO_BITRATE,
  ],
  [GoProSettingId.ANTI_FLICKER]: [
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.PHOTO_SHUTTER,
    GoProSettingId.NIGHT_PHOTO_SHUTTER,
    GoProSettingId.NIGHTLAPSE_PHOTO_SHUTTER,
  ],
  [GoProSettingId.VIDEO_ISO_MIN]: [GoProSettingId.VIDEO_ISO_MAX],
  [GoProSettingId.VIDEO_ISO_MAX]: [GoProSettingId.VIDEO_ISO_MIN],
  [GoProSettingId.PHOTO_ISO_MIN]: [GoProSettingId.PHOTO_ISO_MAX],
  [GoProSettingId.PHOTO_ISO_MAX]: [GoProSettingId.PHOTO_ISO_MIN],
  [GoProSettingId.MULTI_SHOT_ISO_MIN]: [GoProSettingId.MULTI_SHOT_ISO_MAX],
  [GoProSettingId.MULTI_SHOT_ISO_MAX]: [GoProSettingId.MULTI_SHOT_ISO_MIN],
  [GoProSettingId.MODE_PRESET]: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.VIDEO_LENS_HERO13,
    GoProSettingId.PHOTO_LENS,
    GoProSettingId.TIME_LAPSE_LENS,
    GoProSettingId.MULTI_SHOT_LENS,
    GoProSettingId.VIDEO_PROFILE,
    GoProSettingId.VIDEO_BITRATE,
    GoProSettingId.BIT_DEPTH,
    GoProSettingId.HYPERSMOOTH,
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.PHOTO_SHUTTER,
    GoProSettingId.NIGHT_PHOTO_SHUTTER,
    GoProSettingId.NIGHTLAPSE_PHOTO_SHUTTER,
    GoProSettingId.PHOTO_ISO_MIN,
    GoProSettingId.PHOTO_ISO_MAX,
    GoProSettingId.MULTI_SHOT_ISO_MIN,
    GoProSettingId.MULTI_SHOT_ISO_MAX,
    GoProSettingId.STAR_TRAILS_LENGTH,
    GoProSettingId.PHOTO_OUTPUT,
    GoProSettingId.TIMELAPSE_PHOTO_OUTPUT,
    GoProSettingId.VIDEO_FRAMING,
    GoProSettingId.MULTI_SHOT_FRAMING,
    GoProSettingId.MEDIA_FORMAT,
    GoProSettingId.LAPSE_MODE,
  ],
  [GoProSettingId.MODE_PRESET_GROUP]: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.VIDEO_LENS_HERO13,
    GoProSettingId.PHOTO_LENS,
    GoProSettingId.TIME_LAPSE_LENS,
    GoProSettingId.MULTI_SHOT_LENS,
    GoProSettingId.VIDEO_PROFILE,
    GoProSettingId.VIDEO_BITRATE,
    GoProSettingId.BIT_DEPTH,
    GoProSettingId.HYPERSMOOTH,
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.PHOTO_SHUTTER,
    GoProSettingId.NIGHT_PHOTO_SHUTTER,
    GoProSettingId.NIGHTLAPSE_PHOTO_SHUTTER,
    GoProSettingId.PHOTO_ISO_MIN,
    GoProSettingId.PHOTO_ISO_MAX,
    GoProSettingId.MULTI_SHOT_ISO_MIN,
    GoProSettingId.MULTI_SHOT_ISO_MAX,
    GoProSettingId.PHOTO_OUTPUT,
    GoProSettingId.TIMELAPSE_PHOTO_OUTPUT,
    GoProSettingId.VIDEO_FRAMING,
    GoProSettingId.MULTI_SHOT_FRAMING,
    GoProSettingId.MEDIA_FORMAT,
    GoProSettingId.LAPSE_MODE,
  ],
  // On Dashboard Override ON/OFF: The camera restricts or releases capabilities of items conflicting with Dashboard settings.
  // Prevents a bug where conflicting items remain disabled even when opening the Camera Settings screen after turning it OFF.
  [GoProSettingId.DASHBOARD_OVERRIDE]: [
    GoProSettingId.LED,
    GoProSettingId.SCREEN_SAVER,
    GoProSettingId.SCREEN_SAVER_FRONT,
    GoProSettingId.VOICE_CONTROL,
    GoProSettingId.BEEPS,
    GoProSettingId.BEEP_VOLUME,
    GoProSettingId.ENABLE_BEEP,
    GoProSettingId.ORIENTATION,
    GoProSettingId.SCREEN_LOCK,
    GoProSettingId.FRONT_LCD_MODE,
    GoProSettingId.VOICE_LANGUAGE,
    GoProSettingId.VOICE_LANGUAGE_LEGACY,
  ],
} as const;

type SettingsMap = Record<number, number>;

const findActivePreset = (
  presets: readonly GoProPresetGroupData[] | undefined,
  currentGroupId: number | undefined,
  currentPresetId: number | undefined,
): GoProPreset | undefined => {
  if (!presets || currentPresetId === undefined) return undefined;

  for (const group of presets) {
    if (currentGroupId !== undefined && group.groupId !== currentGroupId) continue;
    const preset = group.presets.find((item) => item.id === currentPresetId);
    if (preset) return preset;
  }

  for (const group of presets) {
    const preset = group.presets.find((item) => item.id === currentPresetId);
    if (preset) return preset;
  }

  return undefined;
};

export type GoProDisplayLayout = {
  quickSettingIds: readonly number[];
  prioritizedAdvancedSettingIds: readonly number[];
  defaultVisibleAdvancedSettingIds: readonly number[];
};

export type GoProLayoutExternalControls = {
  showsMediaFormatPrimary: boolean;
  showsFramingSelector: boolean;
  showsResolutionSelector: boolean;
};

export type GoProSpecialRowsProjection = SpecialRowsProjection;

export type GoProCapabilityCacheKeyProjection = {
  dependencySettingIds: readonly number[];
  mediaFormatSettingId: number | null;
  framingSettingId: number | null;
  lensSettingId: number | null;
  hyperSmoothSettingId: number | null;
};

export type GoProDisplaySettingPlan = {
  displayLayout: GoProDisplayLayout;
  uiSettingIds: readonly number[];
  layoutExternalControls: GoProLayoutExternalControls;
  specialRowsProjection: GoProSpecialRowsProjection;
  cacheKeyProjection: GoProCapabilityCacheKeyProjection;
  defaultCapabilityPrefetchIds: readonly number[];
  fullRefreshBaseIds: readonly number[];
  displayRelevantSettingIds: readonly number[];
  dependencyRelevantSettingIds: readonly number[];
};

export class LayoutBuilder {
  private quickSettingIds: number[];
  private prioritizedAdvancedSettingIds: number[];
  private defaultVisibleAdvancedSettingIds: number[];

  constructor(base?: GoProDisplayLayout) {
    this.quickSettingIds = base ? [...base.quickSettingIds] : [];
    this.prioritizedAdvancedSettingIds = base ? [...base.prioritizedAdvancedSettingIds] : [];
    this.defaultVisibleAdvancedSettingIds = base ? [...base.defaultVisibleAdvancedSettingIds] : [];
  }

  insertAfter(
    arrayName: 'quickSettingIds' | 'prioritizedAdvancedSettingIds',
    targetId: number,
    newId: number,
  ) {
    const arr = this[arrayName];
    const idx = arr.indexOf(targetId);
    if (idx !== -1) {
      arr.splice(idx + 1, 0, newId);
    } else {
      arr.push(newId);
    }
    return this;
  }

  replace(
    arrayName: 'quickSettingIds' | 'prioritizedAdvancedSettingIds',
    targetId: number,
    newId: number,
  ) {
    const arr = this[arrayName];
    const idx = arr.indexOf(targetId);
    if (idx !== -1) arr[idx] = newId;
    return this;
  }

  remove(arrayName: 'quickSettingIds' | 'prioritizedAdvancedSettingIds', targetId: number) {
    const arr = this[arrayName];
    const idx = arr.indexOf(targetId);
    if (idx !== -1) arr.splice(idx, 1);
    return this;
  }

  build(): GoProDisplayLayout {
    return {
      quickSettingIds: this.quickSettingIds,
      prioritizedAdvancedSettingIds: this.prioritizedAdvancedSettingIds,
      defaultVisibleAdvancedSettingIds: this.defaultVisibleAdvancedSettingIds,
    };
  }
}

const composeDisplayLayout = (
  presetLayout: GoProDisplayLayout,
  cameraAdvancedSettingIds: readonly number[],
): GoProDisplayLayout => ({
  quickSettingIds: presetLayout.quickSettingIds,
  prioritizedAdvancedSettingIds: Array.from(
    new Set([...presetLayout.prioritizedAdvancedSettingIds, ...cameraAdvancedSettingIds]),
  ),
  defaultVisibleAdvancedSettingIds: presetLayout.defaultVisibleAdvancedSettingIds,
});

export { GoProPresetGroup, GoProPresetGroupSelectId };

export const GoProVideoPreset = {
  STANDARD: PRESET_STANDARD,
  ACTIVITY: PRESET_ACTIVITY,
  MAX_VIDEO_2_0: PRESET_MAX_VIDEO_2,
  MACRO_VIDEO: PRESET_MACRO_VIDEO,
} as const;

/**
 * Preset ID list displayed temporarily before Protobuf acquisition (per model).
 * Migrated from Pro mode + MaximumVideoPerformance + MaxLensModEnable=0 entry in legacy app UIPresetRepository.cs.
 * Overwritten with the exact list upon receiving Protobuf push (0xF3).
 */
type FallbackPresetsByGroup = Readonly<Record<number, readonly number[]>>;

export const fallbackPresetsByModel: Readonly<
  Partial<Record<CameraModelKey, FallbackPresetsByGroup>>
> = {
  hero13: {
    // UIPresetRepository.cs Hero13 Pro/High: Standard, Activity(BurstSloMo), MaxVideo2_0, MacroVideo
    // *Cinematic/SloMo/LiveBurst do not exist in the legacy app database
    [GoProPresetGroup.VIDEO]: [
      PRESET_STANDARD,
      PRESET_ACTIVITY,
      GoProVideoPreset.MAX_VIDEO_2_0,
      PRESET_MACRO_VIDEO,
    ],
    // Photo, Burst, NightPhoto (LiveBurst does not exist in the legacy database for Hero13)
    [GoProPresetGroup.PHOTO]: [
      PRESET_PHOTO,
      PRESET_BURST,
      PRESET_NIGHT_PHOTO,
      PRESET_MAX_PHOTO_2,
      PRESET_MACRO_PHOTO,
      PRESET_MACRO_NIGHT_PHOTO,
    ],
    // Timewarp, StarTrails, LightPainting, VehicleLights, Timelapse, Nightlapse, MacroTimelapse, MacroNightlapse
    [GoProPresetGroup.TIMELAPSE]: [
      PRESET_TIMEWARP,
      PRESET_STAR_TRAILS,
      PRESET_LIGHT_PAINTING,
      PRESET_VEHICLE_LIGHTS,
      PRESET_TIMELAPSE,
      PRESET_NIGHTLAPSE,
      PRESET_MACRO_TIMELAPSE,
      PRESET_MACRO_NIGHTLAPSE,
    ],
  },
  hero12: {
    // Standard only (MaxVideo/MaxVideo2_0 are excluded as MaxLensModEnable=1)
    [GoProPresetGroup.VIDEO]: [PRESET_STANDARD],
    // Photo, Burst, NightPhoto
    [GoProPresetGroup.PHOTO]: [PRESET_PHOTO, PRESET_BURST, PRESET_NIGHT_PHOTO],
    // Timewarp, StarTrails, LightPainting, VehicleLights, Timelapse, Nightlapse
    [GoProPresetGroup.TIMELAPSE]: [
      PRESET_TIMEWARP,
      PRESET_STAR_TRAILS,
      PRESET_LIGHT_PAINTING,
      PRESET_VEHICLE_LIGHTS,
      PRESET_TIMELAPSE,
      PRESET_NIGHTLAPSE,
    ],
  },
  hero11: {
    // Standard, FullFrame(SloMo=3), Activity, Cinematic, UltraSloMo
    [GoProPresetGroup.VIDEO]: [PRESET_STANDARD, 3, PRESET_ACTIVITY, 2, 4],
    // Photo, Burst, NightPhoto (LiveBurst does not exist in the legacy database for Hero11)
    [GoProPresetGroup.PHOTO]: [PRESET_PHOTO, PRESET_BURST, PRESET_NIGHT_PHOTO],
    // Timewarp, StarTrails, LightPainting, VehicleLights, Timelapse, Nightlapse
    [GoProPresetGroup.TIMELAPSE]: [
      PRESET_TIMEWARP,
      PRESET_STAR_TRAILS,
      PRESET_LIGHT_PAINTING,
      PRESET_VEHICLE_LIGHTS,
      PRESET_TIMELAPSE,
      PRESET_NIGHTLAPSE,
    ],
  },
  heromi11: {
    // HeroMini11: VIDEO group contains Timewarp/Trail series. PHOTO group does not exist.
    // Standard + Timewarp + StarTrails + LightPainting + VehicleLights + Timelapse + Nightlapse
    [GoProPresetGroup.VIDEO]: [
      PRESET_STANDARD,
      PRESET_TIMEWARP,
      PRESET_STAR_TRAILS,
      PRESET_LIGHT_PAINTING,
      PRESET_VEHICLE_LIGHTS,
      PRESET_TIMELAPSE,
      PRESET_NIGHTLAPSE,
    ],
    // TIMELAPSE group also has the same preset structure as VIDEO (from legacy app database)
    [GoProPresetGroup.TIMELAPSE]: [
      PRESET_STANDARD,
      PRESET_TIMEWARP,
      PRESET_STAR_TRAILS,
      PRESET_LIGHT_PAINTING,
      PRESET_VEHICLE_LIGHTS,
      PRESET_TIMELAPSE,
      PRESET_NIGHTLAPSE,
    ],
  },
  hero10: {
    // Standard, Activity, Cinematic, UltraSloMo, Basic
    [GoProPresetGroup.VIDEO]: [PRESET_STANDARD, PRESET_ACTIVITY, 2, 4, 5],
    // Photo, LiveBurst, Burst, NightPhoto
    [GoProPresetGroup.PHOTO]: [PRESET_PHOTO, PRESET_LIVE_BURST, PRESET_BURST, PRESET_NIGHT_PHOTO],
    // Timewarp, Timelapse, Nightlapse (MaxTimewarp is excluded as MaxLensModEnable=1)
    [GoProPresetGroup.TIMELAPSE]: [PRESET_TIMEWARP, PRESET_TIMELAPSE, PRESET_NIGHTLAPSE],
  },
  hero09: {
    // Standard, Activity, Cinematic, SloMo (MaxVideo is excluded as MaxLensModEnable=1)
    [GoProPresetGroup.VIDEO]: [PRESET_STANDARD, PRESET_ACTIVITY, 2, 3],
    // Photo, LiveBurst, Burst, NightPhoto
    [GoProPresetGroup.PHOTO]: [PRESET_PHOTO, PRESET_LIVE_BURST, PRESET_BURST, PRESET_NIGHT_PHOTO],
    // Timewarp, Timelapse, Nightlapse
    [GoProPresetGroup.TIMELAPSE]: [PRESET_TIMEWARP, PRESET_TIMELAPSE, PRESET_NIGHTLAPSE],
  },
  max: {
    // HERO Video, 360 Video
    [GoProPresetGroup.VIDEO]: [PRESET_STANDARD, PRESET_MAX_VIDEO],
    // HERO Photo, PowerPano(LiveBurst), 360 Photo
    [GoProPresetGroup.PHOTO]: [PRESET_PHOTO, PRESET_LIVE_BURST, PRESET_MAX_PHOTO],
    // HERO Timelapse, 360 Timelapse, HERO Timewarp, 360 Timewarp
    [GoProPresetGroup.TIMELAPSE]: [
      PRESET_TIMELAPSE,
      PRESET_MAX_TIMELAPSE,
      PRESET_TIMEWARP,
      PRESET_MAX_TIMEWARP,
    ],
  },
  // unknown: No entry -> Do not display preset list before receiving Protobuf
};

const STANDARD_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [
    GoProSettingId.VIDEO_PROFILE,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.HYPERSMOOTH,
  ],
  prioritizedAdvancedSettingIds: [
    GoProSettingId.HYPERSMOOTH,
    GoProSettingId.TEN_BIT_COLOR_HERO11,
    GoProSettingId.VIDEO_BITRATE_HERO11,
    GoProSettingId.BIT_DEPTH,
    GoProSettingId.HLG_HDR,
    GoProSettingId.VIDEO_BITRATE,
    GoProSettingId.HINDSIGHT,
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.EV_COMP,
    GoProSettingId.WB,
    GoProSettingId.VIDEO_ISO_MIN,
    GoProSettingId.VIDEO_ISO_MAX,
    GoProSettingId.SHARPNESS,
    GoProSettingId.COLOR,
    GoProSettingId.MAX_WIND_REDUCTION, // Hero09-12/HeroMini11 (BLE 0x95=149)
    GoProSettingId.WIND_REDUCTION, // Hero13 (BLE 0xD6=214)
    GoProSettingId.DENOISE,
    GoProSettingId.RAW_AUDIO,
    GoProSettingId.AUDIO_TUNING,
    GoProSettingId.MEDIA_MOD_MIC,
    GoProSettingId.VIDEO_DURATION,
    GoProSettingId.SCHEDULED_CAPTURE,
    GoProSettingId.CAPTURE_DELAY,
  ],
  defaultVisibleAdvancedSettingIds: [],
};

const MAX_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.HYPERSMOOTH,
    GoProSettingId.HORIZONTAL_LEVELING,
  ],
  prioritizedAdvancedSettingIds: [
    GoProSettingId.HYPERSMOOTH,
    GoProSettingId.HINDSIGHT,
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.EV_COMP,
    GoProSettingId.WB,
    GoProSettingId.VIDEO_ISO_MIN,
    GoProSettingId.VIDEO_ISO_MAX,
    GoProSettingId.SHARPNESS,
    GoProSettingId.COLOR,
    GoProSettingId.MAX_WIND_REDUCTION, // Hero11/12 with Max Lens (BLE 0x95=149)
    GoProSettingId.DENOISE,
    GoProSettingId.RAW_AUDIO,
    GoProSettingId.MEDIA_MOD_MIC,
    GoProSettingId.VIDEO_DURATION,
    GoProSettingId.SCHEDULED_CAPTURE,
    GoProSettingId.CAPTURE_DELAY,
  ],
  defaultVisibleAdvancedSettingIds: [],
};

// Hero13 Max Lens 2.5 の Max Video は Bit Depth / Bit Rate を操作可能。
// 共通の MAX_VIDEO_LAYOUT は Hero12/13 全体で共有されるため、ここだけ専用レイアウトで狭く上書きする。
const HERO13_MAX_LENS25_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: MAX_VIDEO_LAYOUT.quickSettingIds,
  prioritizedAdvancedSettingIds: [
    GoProSettingId.HYPERSMOOTH,
    GoProSettingId.BIT_DEPTH,
    GoProSettingId.VIDEO_BITRATE,
    ...MAX_VIDEO_LAYOUT.prioritizedAdvancedSettingIds.filter(
      (id) => id !== GoProSettingId.HYPERSMOOTH,
    ),
  ],
  defaultVisibleAdvancedSettingIds: MAX_VIDEO_LAYOUT.defaultVisibleAdvancedSettingIds,
};

/**
 * Hero09 + Max Lens Mod 装着時の Video レイアウト。
 * MAX_VIDEO_LAYOUT と同一構成だが、HYPERSMOOTH (135) を HYPERSMOOTH_MAX (148) に置換。
 * Hero09 Max Video では Max HyperSmooth は On/Off のみのトグルとして機能し、
 * BLE 実通信 ID も 0x94 (148) を直接使用する (BLE LOG: Setting changed ID=148 確認済み)。
 */
const MAX_VIDEO_HERO09_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.HYPERSMOOTH_MAX, // Hero09: Max HyperSmooth On/Off (BLE 0x94=148)
    GoProSettingId.HORIZONTAL_LEVELING,
  ],
  prioritizedAdvancedSettingIds: [
    GoProSettingId.HYPERSMOOTH_MAX, // Max HyperSmooth: On/Off toggle (BLE 0x94=148)
    GoProSettingId.VIDEO_BITRATE_HERO11, // Hero09=0/1 (Standard/High), Hero10=100/1 (Standard/High)
    GoProSettingId.HINDSIGHT,
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.EV_COMP,
    GoProSettingId.WB,
    GoProSettingId.VIDEO_ISO_MIN,
    GoProSettingId.VIDEO_ISO_MAX,
    GoProSettingId.SHARPNESS,
    GoProSettingId.COLOR,
    GoProSettingId.MAX_WIND_REDUCTION,
    GoProSettingId.DENOISE,
    GoProSettingId.RAW_AUDIO,
    GoProSettingId.MEDIA_MOD_MIC,
    GoProSettingId.VIDEO_DURATION,
    GoProSettingId.SCHEDULED_CAPTURE,
    GoProSettingId.CAPTURE_DELAY,
  ],
  defaultVisibleAdvancedSettingIds: [],
};

/**
 * Hero11 / HeroMini11 Max Video レイアウト。
 * 実機ログでは Max HyperSmooth が BLE ID 148 (0x94) で通知されるため、
 * Quick Settings / Advanced ともに HYPERSMOOTH_MAX を使って UI 表示を合わせる。
 */
const MAX_VIDEO_HERO11_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.HYPERSMOOTH_MAX,
    GoProSettingId.HORIZONTAL_LEVELING,
  ],
  prioritizedAdvancedSettingIds: [
    GoProSettingId.HYPERSMOOTH_MAX,
    GoProSettingId.TEN_BIT_COLOR_HERO11,
    GoProSettingId.VIDEO_BITRATE_HERO11,
    GoProSettingId.HINDSIGHT,
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.EV_COMP,
    GoProSettingId.WB,
    GoProSettingId.VIDEO_ISO_MIN,
    GoProSettingId.VIDEO_ISO_MAX,
    GoProSettingId.SHARPNESS,
    GoProSettingId.COLOR,
    GoProSettingId.MAX_WIND_REDUCTION,
    GoProSettingId.DENOISE,
    GoProSettingId.RAW_AUDIO,
    GoProSettingId.MEDIA_MOD_MIC,
    GoProSettingId.VIDEO_DURATION,
    GoProSettingId.SCHEDULED_CAPTURE,
    GoProSettingId.CAPTURE_DELAY,
  ],
  defaultVisibleAdvancedSettingIds: [
    GoProSettingId.TEN_BIT_COLOR_HERO11,
    GoProSettingId.VIDEO_BITRATE_HERO11,
  ],
};

/**
 * GoPro Max カメラ Video グループ共通のシステム設定。
 * 旧アプリ Max カメラ設定画面 (GoProDevice.cs / SYS_* 系) 準拠。
 * Hero 機種固有 ID (SCREEN_SAVER=219, BEEP_VOLUME=216, VOICE_LANGUAGE=223,
 * CONTROL_MODE=175, MAX_LENS_MOD_HERO13=189 等) は含めない。
 */
const MAX_CAMERA_SYSTEM_SETTINGS: readonly number[] = [
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.SCREEN_SAVER_MAX, // Max専用 BLE 0x33 (Hero13=219, Hero9-12=159 とは別)
  GoProSettingId.LED,
  GoProSettingId.BEEPS, // Max: BLE 0x57 (Hero13は BEEP_VOLUME=216)
  GoProSettingId.GPS,
  GoProSettingId.LANGUAGE,
  GoProSettingId.VOICE_CONTROL,
  GoProSettingId.ORIENTATION,
  GoProSettingId.SCREEN_LOCK,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET_MAX,
  GoProSettingId.VIDEO_COMPRESSION,
  GoProSettingId.QUICK_CAPTURE_DEFAULT,
] as const;

const HERO09_CAMERA_SYSTEM_SETTINGS: readonly number[] = [
  GoProSettingId.MAX_LENS_MOD,
  GoProSettingId.MAX_LENS_MOD_ENABLE,
  GoProSettingId.VIDEO_COMPRESSION,
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.SCREEN_SAVER_REAR,
  GoProSettingId.SCREEN_SAVER_FRONT,
  GoProSettingId.FRONT_LCD_MODE,
  GoProSettingId.LED,
  GoProSettingId.BEEPS,
  GoProSettingId.GPS,
  GoProSettingId.LANGUAGE,
  GoProSettingId.VOICE_LANGUAGE_LEGACY,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET,
] as const;

const HERO10_CAMERA_SYSTEM_SETTINGS: readonly number[] = [
  GoProSettingId.VIDEO_PERFORMANCE_MODE,
  GoProSettingId.MAX_LENS_MOD,
  GoProSettingId.MAX_LENS_MOD_ENABLE,
  GoProSettingId.VIDEO_COMPRESSION,
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.SCREEN_SAVER_REAR,
  GoProSettingId.SCREEN_SAVER_FRONT,
  GoProSettingId.FRONT_LCD_MODE,
  GoProSettingId.LED,
  GoProSettingId.BEEPS,
  GoProSettingId.GPS,
  GoProSettingId.LANGUAGE,
  GoProSettingId.VOICE_LANGUAGE_LEGACY,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET,
] as const;

const HERO11_CAMERA_SYSTEM_SETTINGS: readonly number[] = [
  GoProSettingId.CONTROL_MODE,
  GoProSettingId.SYSTEM_VIDEO_MODE,
  GoProSettingId.MAX_LENS_MOD,
  GoProSettingId.MAX_LENS_MOD_ENABLE,
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.SCREEN_SAVER_REAR,
  GoProSettingId.SCREEN_SAVER_FRONT,
  GoProSettingId.FRONT_LCD_MODE,
  GoProSettingId.LED,
  GoProSettingId.BEEPS,
  GoProSettingId.GPS,
  GoProSettingId.LANGUAGE,
  GoProSettingId.VOICE_LANGUAGE_LEGACY,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET,
] as const;

const HERO12_CAMERA_SYSTEM_SETTINGS: readonly number[] = [
  GoProSettingId.CONTROL_MODE,
  GoProSettingId.MAX_LENS_MOD_HERO13,
  GoProSettingId.MAX_LENS_MOD,
  GoProSettingId.MAX_LENS_MOD_ENABLE,
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.SCREEN_SAVER_REAR,
  GoProSettingId.SCREEN_SAVER_FRONT,
  GoProSettingId.FRONT_LCD_MODE,
  GoProSettingId.LED,
  GoProSettingId.BEEPS,
  GoProSettingId.GPS,
  GoProSettingId.LANGUAGE,
  GoProSettingId.VOICE_LANGUAGE_LEGACY,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET,
] as const;

const HEROMI11_CAMERA_SYSTEM_SETTINGS: readonly number[] = [
  GoProSettingId.CONTROL_MODE,
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.LED,
  GoProSettingId.BEEPS,
  GoProSettingId.GPS,
  GoProSettingId.LANGUAGE,
  GoProSettingId.VOICE_LANGUAGE_LEGACY,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET,
] as const;

const HERO13_CAMERA_SYSTEM_SETTINGS: readonly number[] = [
  GoProSettingId.CONTROL_MODE,
  GoProSettingId.LENS_ATTACHMENT,
  GoProSettingId.MEDIA_MOD,
  GoProSettingId.ANTI_FLICKER,
  GoProSettingId.AUTO_OFF,
  GoProSettingId.LCD_BRIGHTNESS,
  GoProSettingId.SCREEN_SAVER,
  GoProSettingId.SCREEN_SAVER_FRONT,
  GoProSettingId.FRONT_LCD_MODE,
  GoProSettingId.LED,
  GoProSettingId.BEEP_VOLUME,
  GoProSettingId.ENABLE_BEEP,
  GoProSettingId.GPS,
  GoProSettingId.LANGUAGE,
  GoProSettingId.VOICE_LANGUAGE,
  GoProSettingId.QUICK_CAPTURE,
  GoProSettingId.DEFAULT_PRESET,
] as const;

const getCameraAdvancedSettingIds = (cameraModel: CameraModelKey): readonly number[] => {
  switch (cameraModel) {
    case 'max':
      return MAX_CAMERA_SYSTEM_SETTINGS;
    case 'hero13':
      return HERO13_CAMERA_SYSTEM_SETTINGS;
    case 'hero12':
      return HERO12_CAMERA_SYSTEM_SETTINGS;
    case 'hero11':
      return HERO11_CAMERA_SYSTEM_SETTINGS;
    case 'heromi11':
      return HEROMI11_CAMERA_SYSTEM_SETTINGS;
    case 'hero10':
      return HERO10_CAMERA_SYSTEM_SETTINGS;
    case 'hero09':
      return HERO09_CAMERA_SYSTEM_SETTINGS;
    default:
      return HERO09_CAMERA_SYSTEM_SETTINGS;
  }
};

/**
 * GoPro Max カメラ専用: Standard (HERO) Video レイアウト (presetId=0)。
 * 旧アプリ Max/UIElementSettings.cs の Standard プリセット (Sort 0-12) 準拠。
 * ※ Hero11/Hero12 が MaxLens 装着時に使う MAX_VIDEO_LAYOUT (presetId=196608) とは別物。
 */
const MAX_CAMERA_STANDARD_VIDEO_LAYOUT: GoProDisplayLayout = {
  // Resolution/FPS/VideoLens は HERO モードで capability が返れば chip 表示
  // HYPERSMOOTH: Max Standard Video で「MaxHyperSmooth」トグルとして表示 (BLE 0x94=148 に自動オーバーライド)
  // HORIZONTAL_LEVELING: Max Standard Video で「Horizontal Leveling」トグルとして表示
  quickSettingIds: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.HYPERSMOOTH,
    GoProSettingId.HORIZONTAL_LEVELING,
  ],
  prioritizedAdvancedSettingIds: [
    // ProTune (旧アプリ Sort 0-12 準拠)
    GoProSettingId.VIDEO_CLIPS, // Max専用: Clips (BLE 0x6B=107)
    GoProSettingId.VIDEO_BITRATE_HERO11, // Max の BitRate は BLE 0x7C (ID=124) を使用
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.EV_COMP,
    GoProSettingId.WB,
    GoProSettingId.VIDEO_ISO_MIN,
    GoProSettingId.VIDEO_ISO_MAX,
    GoProSettingId.SHARPNESS,
    GoProSettingId.COLOR,
    GoProSettingId.MAX_AUDIO_MODE, // Microphone (BLE 0x89=137, Max専用)
    GoProSettingId.RAW_AUDIO,
    GoProSettingId.MAX_WIND_REDUCTION, // Max Standard Video (BLE 0x95=149)
    // System
    ...MAX_CAMERA_SYSTEM_SETTINGS,
  ],
  defaultVisibleAdvancedSettingIds: [],
};

/**
 * GoPro Max カメラ専用: 360 Video レイアウト (presetId=196608)。
 * 旧アプリ Max/UIElementSettings.cs の MaxVideo プリセット (Sort 0-8) 準拠。
 * Resolution は非表示 (-99)、Dual 360 レンズ固定のため VIDEO_LENS も含めない。
 */
const MAX_CAMERA_360_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [GoProSettingId.RESOLUTION, GoProSettingId.FPS],
  prioritizedAdvancedSettingIds: [
    // ProTune (旧アプリ Sort 0-8 準拠)
    GoProSettingId.VIDEO_SHUTTER,
    GoProSettingId.EV_COMP,
    GoProSettingId.WB,
    GoProSettingId.VIDEO_ISO_MIN,
    GoProSettingId.VIDEO_ISO_MAX,
    GoProSettingId.SHARPNESS,
    GoProSettingId.COLOR,
    GoProSettingId.MAX_AUDIO_MODE, // 360 Audio (BLE 0x89=137) — 旧アプリ V_360RAWAudio。値: 5=360+Stereo / 0=Stereo
    // RAW_AUDIO (BLE 0x8B=139) は Standard Video 専用のため 360 レイアウトには含めない
    GoProSettingId.MAX_WIND_REDUCTION, // Max 360 Video (BLE 0x95=149)
    // System
    ...MAX_CAMERA_SYSTEM_SETTINGS,
  ],
  defaultVisibleAdvancedSettingIds: [],
};

const MACRO_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: STANDARD_VIDEO_LAYOUT.quickSettingIds,
  prioritizedAdvancedSettingIds: [
    GoProSettingId.FOCUS_PEAKING,
    ...STANDARD_VIDEO_LAYOUT.prioritizedAdvancedSettingIds,
  ],
  defaultVisibleAdvancedSettingIds: [],
};

const HERO13_BURST_SLOMO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [GoProSettingId.HYPERSMOOTH],
  prioritizedAdvancedSettingIds: STANDARD_VIDEO_LAYOUT.prioritizedAdvancedSettingIds.filter(
    (id) =>
      id !== GoProSettingId.HLG_HDR &&
      id !== GoProSettingId.HINDSIGHT &&
      id !== GoProSettingId.RAW_AUDIO,
  ),
  defaultVisibleAdvancedSettingIds: [],
};

/**
 * Easy Video preset list (uses exclusive layout because BLE capabilities return empty)
 * *Confirmed on Hero13 device: the camera returns empty arrays for all capabilities when Easy Video is selected
 */
export const EASY_VIDEO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_EASY_HIGHEST_QUALITY, // Easy Video
  PRESET_EASY_STANDARD_QUALITY, // Longest Battery
  PRESET_EASY_BASIC_QUALITY, // Highest Quality
  PRESET_EASY_EB_VIDEO, // Easy EB Video
  PRESET_EASY_LB_VIDEO, // Easy LB Video
  PRESET_EASY_ANAMORPHIC_VIDEO, // Easy Anamorphic Video
  PRESET_EASY_MAX_VIDEO_1, // Easy Max Video
  PRESET_EASY_MAX_VIDEO, // Easy Max Video 2.0
  PRESET_EASY_MACRO_VIDEO, // Easy Macro Video
]);

// Hero11 Extended Battery presets for which 8:7 should be disabled.
// In actual device behavior, only 16:9 / 4:3 are practical for Standard[EB] / Activity[EB] / Cinematic[EB] / Slo-Mo[EB],
// so 8:7 is configured as unselectable to match.
export const HERO11_EB_VIDEO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_HERO11_EB_STANDARD_VIDEO, // Standard[EB]
  PRESET_HERO11_EB_ACTIVITY_VIDEO, // Activity[EB]
  PRESET_HERO11_EB_CINEMATIC_VIDEO, // Cinematic[EB]
  PRESET_HERO11_EB_SLO_MO_VIDEO, // Slo-Mo[EB]
]);

export const HERO11_LB_VIDEO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_HERO11_LB_STANDARD_VIDEO, // Standard[LB]
  PRESET_HERO11_LB_ACTIVITY_VIDEO, // Activity[LB]
  PRESET_HERO11_LB_CINEMATIC_VIDEO, // Cinematic[LB]
  PRESET_HERO11_LB_SLO_MO_VIDEO, // Slo-Mo[LB]
]);

export const HERO11_NO_87_VIDEO_PRESETS = HERO11_EB_VIDEO_PRESETS;

/**
 * Preset configuration in Hero13 Easy mode with a normal lens (confirmed via device logs).
 * Since the camera sends only one active preset per group in Easy mode via Protobuf,
 * missing ones are supplemented with this constant to display all presets as chips.
 */
export const HERO13_EASY_NORMAL_PRESET_GROUPS: Readonly<Record<number, readonly number[]>> = {
  [GoProPresetGroup.VIDEO]: [PRESET_EASY_HIGHEST_QUALITY, PRESET_EASY_STANDARD_QUALITY], // Easy Standard Video, Easy HDR Video
  [GoProPresetGroup.PHOTO]: [
    PRESET_LEGACY_EASY_PHOTO,
    PRESET_LEGACY_EASY_NIGHT_PHOTO,
    PRESET_LEGACY_EASY_BURST_PHOTO,
  ], // Easy Photo, Easy Night Photo, Easy Burst Photo
  [GoProPresetGroup.TIMELAPSE]: [
    PRESET_LEGACY_EASY_TIMEWARP,
    PRESET_LEGACY_EASY_STAR_TRAILS,
    PRESET_LEGACY_EASY_LIGHT_PAINTING,
    PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
  ], // Easy TimeWarp, Easy Star Trails, Easy Light Painting, Easy Vehicle Lights
};

/** Set summarizing all the above preset IDs (for Easy normal lens detection) */
export const HERO13_EASY_NORMAL_PRESET_IDS: ReadonlySet<number> = new Set([
  PRESET_EASY_HIGHEST_QUALITY,
  PRESET_EASY_STANDARD_QUALITY,
  PRESET_LEGACY_EASY_PHOTO,
  PRESET_LEGACY_EASY_NIGHT_PHOTO,
  PRESET_LEGACY_EASY_BURST_PHOTO,
  PRESET_LEGACY_EASY_TIMEWARP,
  PRESET_LEGACY_EASY_STAR_TRAILS,
  PRESET_LEGACY_EASY_LIGHT_PAINTING,
  PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
]);

/**
 * Preset configuration in Hero13 Easy mode when MaxLens Mod 2.0 is attached (confirmed via device logs).
 */
export const HERO13_EASY_MAXLENS2_PRESET_GROUPS: Readonly<Record<number, readonly number[]>> = {
  [GoProPresetGroup.VIDEO]: [PRESET_EASY_MAX_VIDEO], // Easy Max Video 2.0
  [GoProPresetGroup.PHOTO]: [PRESET_EASY_MAX_PHOTO], // Easy Max Photo 2.0
  [GoProPresetGroup.TIMELAPSE]: [
    PRESET_EASY_MAX_TIMEWARP,
    PRESET_EASY_MAX_STAR_TRAILS,
    PRESET_EASY_MAX_LIGHT_PAINTING,
    PRESET_EASY_MAX_VEHICLE_LIGHTS,
  ], // Easy Max TimeWarp/StarTrails/LightPainting/VehicleLights 2.0
};

/** Set summarizing all the above preset IDs (for Easy MaxLens 2.0 detection) */
export const HERO13_EASY_MAXLENS2_PRESET_IDS: ReadonlySet<number> = new Set([
  PRESET_EASY_MAX_VIDEO,
  PRESET_EASY_MAX_PHOTO,
  PRESET_EASY_MAX_TIMEWARP,
  PRESET_EASY_MAX_STAR_TRAILS,
  PRESET_EASY_MAX_LIGHT_PAINTING,
  PRESET_EASY_MAX_VEHICLE_LIGHTS,
]);

/**
 * Preset configuration in Hero13 Easy mode when Anamorphic Lens is attached (confirmed via device logs).
 */
export const HERO13_EASY_ANAMORPHIC_PRESET_GROUPS: Readonly<Record<number, readonly number[]>> = {
  [GoProPresetGroup.VIDEO]: [PRESET_EASY_ANAMORPHIC_VIDEO], // Easy Anamorphic Video
  [GoProPresetGroup.PHOTO]: [
    EASY_ANAMORPHIC_SUPER_PHOTO_PRESET_HERO13,
    EASY_ANAMORPHIC_NIGHT_PHOTO_PRESET_HERO13,
  ], // Easy Anamorphic SuperPhoto, Easy Anamorphic Night Photo
  [GoProPresetGroup.TIMELAPSE]: [EASY_ANAMORPHIC_TIMEWARP_PRESET_HERO13], // Easy Anamorphic TimeWarp
};

/** Set summarizing all the above preset IDs (for Easy Anamorphic lens detection) */
export const HERO13_EASY_ANAMORPHIC_PRESET_IDS: ReadonlySet<number> = new Set([
  PRESET_EASY_ANAMORPHIC_VIDEO,
  EASY_ANAMORPHIC_SUPER_PHOTO_PRESET_HERO13,
  EASY_ANAMORPHIC_NIGHT_PHOTO_PRESET_HERO13,
  EASY_ANAMORPHIC_TIMEWARP_PRESET_HERO13,
]);

/**
 * Preset configuration in Hero13 Easy mode when Macro Lens is attached (confirmed via device logs).
 */
export const HERO13_EASY_MACRO_PRESET_GROUPS: Readonly<Record<number, readonly number[]>> = {
  [GoProPresetGroup.VIDEO]: [PRESET_MACRO_VIDEO], // Easy Macro Video
  [GoProPresetGroup.PHOTO]: [EASY_MACRO_PHOTO_PRESET_HERO13, EASY_MACRO_NIGHT_PHOTO_PRESET_HERO13],
  [GoProPresetGroup.TIMELAPSE]: [
    EASY_MACRO_TIMELAPSE_PRESET_HERO13,
    EASY_MACRO_NIGHTLAPSE_PRESET_HERO13,
  ],
};

/** Set summarizing all the above preset IDs (for Easy Macro lens detection) */
export const HERO13_EASY_MACRO_PRESET_IDS: ReadonlySet<number> = new Set([
  PRESET_MACRO_VIDEO,
  EASY_MACRO_PHOTO_PRESET_HERO13,
  EASY_MACRO_NIGHT_PHOTO_PRESET_HERO13,
  EASY_MACRO_TIMELAPSE_PRESET_HERO13,
  EASY_MACRO_NIGHTLAPSE_PRESET_HERO13,
]);

// ── Hero12 Easy Normal Lens Supplement Table ──────────────────────────────────────
// Since the camera sends only one active preset per group in Hero12 Easy mode via Protobuf,
// known IDs are used to supplement the list and display all chips.
// Basis: Device BLE logs (group1000: 655360/655361/655362, group1001: 786432/786433, group1002: 851968-851971)
export const HERO12_EASY_NORMAL_PRESET_GROUPS: Readonly<Record<number, readonly number[]>> = {
  [GoProPresetGroup.VIDEO]: [
    PRESET_EASY_HIGHEST_QUALITY,
    PRESET_EASY_STANDARD_QUALITY,
    PRESET_EASY_BASIC_QUALITY,
  ], // Highest Quality / Standard Quality / Basic Quality
  [GoProPresetGroup.PHOTO]: [PRESET_LEGACY_EASY_PHOTO, PRESET_LEGACY_EASY_NIGHT_PHOTO], // Easy Photo / Easy Night Photo
  [GoProPresetGroup.TIMELAPSE]: [
    PRESET_LEGACY_EASY_TIMEWARP,
    PRESET_LEGACY_EASY_STAR_TRAILS,
    PRESET_LEGACY_EASY_LIGHT_PAINTING,
    PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
  ], // Easy TimeWarp / Star Trails / Light Painting / Vehicle Lights
};
export const HERO12_EASY_NORMAL_PRESET_IDS: ReadonlySet<number> = new Set([
  PRESET_EASY_HIGHEST_QUALITY,
  PRESET_EASY_STANDARD_QUALITY,
  PRESET_EASY_BASIC_QUALITY,
  PRESET_LEGACY_EASY_PHOTO,
  PRESET_LEGACY_EASY_NIGHT_PHOTO,
  PRESET_LEGACY_EASY_TIMEWARP,
  PRESET_LEGACY_EASY_STAR_TRAILS,
  PRESET_LEGACY_EASY_LIGHT_PAINTING,
  PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
]);

// ── Hero12 Easy MaxLens Mod 2.0 Supplement Table ─────────────────────────────────────
// Preset IDs are identical to Hero13.
// Basis: Device BLE logs (group1000: 1441792, group1001: 1507328, group1002: 1572864-1572867)
export const HERO12_EASY_MAXLENS2_PRESET_GROUPS: Readonly<Record<number, readonly number[]>> = {
  [GoProPresetGroup.VIDEO]: [PRESET_EASY_MAX_VIDEO], // Easy Max Video 2.0
  [GoProPresetGroup.PHOTO]: [PRESET_EASY_MAX_PHOTO], // Easy Max Photo 2.0
  [GoProPresetGroup.TIMELAPSE]: [
    PRESET_EASY_MAX_TIMEWARP,
    PRESET_EASY_MAX_STAR_TRAILS,
    PRESET_EASY_MAX_LIGHT_PAINTING,
    PRESET_EASY_MAX_VEHICLE_LIGHTS,
  ], // Easy Max TimeWarp/StarTrails/LightPainting/VehicleLights 2.0
};
export const HERO12_EASY_MAXLENS2_PRESET_IDS: ReadonlySet<number> = new Set([
  PRESET_EASY_MAX_VIDEO,
  PRESET_EASY_MAX_PHOTO,
  PRESET_EASY_MAX_TIMEWARP,
  PRESET_EASY_MAX_STAR_TRAILS,
  PRESET_EASY_MAX_LIGHT_PAINTING,
  PRESET_EASY_MAX_VEHICLE_LIGHTS,
]);

// Hero12 Easy Video presets for which the aspect ratio UI (renderFramingRow) should be hidden.
// EasyMaxVideo2_0 (1441792) is excluded because aspect switching between 16:9 and 9:16 is possible using 4K/4K_V on MaxLens v2.
// EasyMacroVideo (2555904) is exclusive to Hero13 and is out of scope for Hero12 checks.
export const HERO12_NO_ASPECT_EASY_VIDEO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_EASY_HIGHEST_QUALITY, // Easy Video
  PRESET_EASY_STANDARD_QUALITY, // Longest Battery
  PRESET_EASY_BASIC_QUALITY, // Highest Quality
  PRESET_EASY_MAX_VIDEO_1, // Easy Max Video (MaxLens v1: 2.7K 固定, アスペクト切替不可)
]);

// Set of Setting IDs whose BLE setting values must be encoded/decoded as 4-byte big-endian integers.
// The sending side (GoProBLEManager) and the receiving capability side (PacketParser) share this same rule.
//
// Basis: ProTuneRemote_Latest BaseFullControlPanelViewModel.cs / GoProRemoteMath.ConvertToByteFromInt
//   30  = TimelapsePhotoInterval     Hero09-13
//   31  = NightlapsePhotoShutter / StarTrailShutter / LightPaintingShutter / VehicleLightsShutter
//          Hero09-13 (4-byte if value exceeds 255; legacy app checks Data.Length on receive)
//   32  = NightlapseVideoInterval    Hero09-13
//   127 = DefaultPreset              GoPro MAX (0x7F)
//   141 = QuickCaptureDefault        GoPro MAX (0x8D)
//
// Excluded (investigated in legacy app, intentionally excluded):
//   107 = ScheduledPreset  — Exclusive to scheduled capture; not implemented in this app
//   168 = ScheduledTime    — Special encoding (hour/minute fields); not implemented in this app
export const FOUR_BYTE_SETTING_IDS: ReadonlySet<number> = new Set([30, 31, 32, 127, 141]);

/** Hero13 Macro Video プリセット ID */
export const MACRO_VIDEO_PRESET_HERO13 = PRESET_MACRO_VIDEO;
export {
  EASY_MACRO_PHOTO_PRESET_HERO13,
  EASY_MACRO_NIGHT_PHOTO_PRESET_HERO13,
  EASY_MACRO_TIMELAPSE_PRESET_HERO13,
  EASY_MACRO_NIGHTLAPSE_PRESET_HERO13,
};

const EASY_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [
    GoProSettingId.VIDEO_LENS_HERO13,
    GoProSettingId.EASY_VIDEO_QUALITY,
    GoProSettingId.HYPERSMOOTH,
  ],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
};

/**
 * Layout exclusive to Easy presets on Hero11 / HeroMini11.
 * In the legacy database, only three settings (V_Resolution / V_VideoLens / V_FrameRate) are defined for these presets.
 * VIDEO_LENS_HERO13 (229) and EASY_VIDEO_QUALITY (201) in EASY_VIDEO_LAYOUT are not available because
 * they do not exist in the capabilities of Hero11 / HeroMini11.
 *
 * Target presets:
 *   Hero11:      EasyVideo (655360), EasyEBVideo (720896), EasyLBVideo (917504)
 *   HeroMini11:  EasyVideo (655360), HighestQuality (655362), LongestBattery (655361)
 */
const LEGACY_EASY_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [GoProSettingId.FPS, GoProSettingId.VIDEO_LENS, GoProSettingId.HYPERSMOOTH],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
};

/**
 * Hero11 Easy Video synthesizes and displays an exclusive Speed mode UI on the SettingsPanel side.
 * Therefore, the layout side keeps only Lens as a quick setting.
 */
const HERO11_EASY_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [GoProSettingId.VIDEO_LENS],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
};

/**
 * Hero12 Easy Video quality presets use the same split pattern as Hero11 Easy Video.
 * Since Speed and Framing (other than Lens) are synthesized as exclusive rows on the SettingsPanel side,
 * the layout side is kept minimal.
 */
const HERO12_EASY_QUALITY_VIDEO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [GoProSettingId.VIDEO_LENS],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
};

/**
 * Hero11 Easy Photo / Easy Night Photo have only Lens and Shutter Timer in the legacy app.
 * Since Night switching synthesizes an exclusive UI on the SettingsPanel side, it is not included in the layout side.
 */
const HERO11_EASY_PHOTO_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [GoProSettingId.PHOTO_LENS, GoProSettingId.CAPTURE_DELAY],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
};

/**
 * Hero11 Easy TimeWarp has Lens and Speed Ramp in the legacy app.
 * Since Speed Ramp synthesizes an exclusive UI on the SettingsPanel side, the layout side keeps only Lens.
 */
const HERO11_EASY_TIMELAPSE_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [GoProSettingId.VIDEO_LENS],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
};

const getVideoLayout = (
  settings: SettingsMap,
  cameraModel: CameraModelKey,
  activePreset?: GoProPreset,
): GoProDisplayLayout => {
  const presetId = settings[GoProSettingId.MODE_PRESET];
  if (presetId !== undefined && EASY_VIDEO_PRESETS.has(presetId)) {
    return composeDisplayLayout(EASY_VIDEO_LAYOUT, getCameraAdvancedSettingIds(cameraModel));
  }
  const resolvedLayout = resolveVideoLayout({
    settings,
    cameraModel,
    currentPresetId: presetId,
    activePreset,
    composeDisplayLayout,
    getCameraAdvancedSettingIds,
    layouts: {
      maxVideoHero09: MAX_VIDEO_HERO09_LAYOUT,
      maxVideoHero11: MAX_VIDEO_HERO11_LAYOUT,
      hero13MaxLens25Video: HERO13_MAX_LENS25_VIDEO_LAYOUT,
      hero13BurstSloMo: HERO13_BURST_SLOMO_LAYOUT,
    },
    presetIds: {
      maxVideoLegacy: PRESET_MAX_VIDEO,
      maxVideo20: GoProVideoPreset.MAX_VIDEO_2_0,
      activity: GoProVideoPreset.ACTIVITY,
    },
    maxLensModEnableSettingId: GoProSettingId.MAX_LENS_MOD_ENABLE,
    lensAttachmentSettingId: GoProSettingId.LENS_ATTACHMENT,
    hero13Lens25AttachmentValue: 3,
    ids: {
      loopingInterval: GoProSettingId.LOOPING_INTERVAL,
      scheduledCapture: GoProSettingId.SCHEDULED_CAPTURE,
      captureDelay: GoProSettingId.CAPTURE_DELAY,
      fps: GoProSettingId.FPS,
      videoLens: GoProSettingId.VIDEO_LENS,
      hyperSmooth: GoProSettingId.HYPERSMOOTH,
    },
  });
  if (resolvedLayout) {
    return resolvedLayout;
  }

  switch (presetId) {
    case GoProVideoPreset.MAX_VIDEO_2_0:
      return composeDisplayLayout(MAX_VIDEO_LAYOUT, getCameraAdvancedSettingIds(cameraModel));
    case PRESET_MAX_VIDEO: // Hero11 MaxVideo
      return composeDisplayLayout(MAX_VIDEO_LAYOUT, getCameraAdvancedSettingIds(cameraModel));
    case GoProVideoPreset.MACRO_VIDEO:
      return composeDisplayLayout(MACRO_VIDEO_LAYOUT, getCameraAdvancedSettingIds(cameraModel));
    case GoProVideoPreset.ACTIVITY:
      return composeDisplayLayout(STANDARD_VIDEO_LAYOUT, getCameraAdvancedSettingIds(cameraModel));
    case GoProVideoPreset.STANDARD:
    default:
      return composeDisplayLayout(STANDARD_VIDEO_LAYOUT, getCameraAdvancedSettingIds(cameraModel));
  }
};

/**
 * Photo group preset IDs that use MULTI_SHOT_LENS (231) instead of PHOTO_LENS (122)
 * 参考: ProTuneRemote/Converters/Hero13/VisibleOfMultishotLensConverter.cs
 * (Burst / EasyBurstPhoto)
 */
export const BURST_LIKE_PHOTO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_BURST, // Burst
  PRESET_LEGACY_EASY_BURST_PHOTO, // EasyBurstPhoto
]);

export const HERO11_EASY_PHOTO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_LEGACY_EASY_PHOTO, // Easy Photo
  PRESET_LEGACY_EASY_NIGHT_PHOTO, // Easy Night Photo
]);

export const HERO11_EASY_TIMELAPSE_PRESETS: ReadonlySet<number> = new Set([
  PRESET_LEGACY_EASY_TIMEWARP, // Easy TimeWarp
]);

/** MaxPhoto preset IDs (PHOTO_OUTPUT does not exist) */
const MAX_PHOTO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_MAX_PHOTO_2, // MaxPhoto2_0  (旧 DB では P_PhotoOutput がコメントアウト)
  PRESET_MAX_PHOTO, // Hero11 MaxPhoto (P_PhotoOutput はコメントアウト)
]);

/**
 * Photo presets that display HorizontalLock (ID=166).
 * From P_HorizontalLock row in legacy app Hero13/UIElementSettings.cs.
 */
const HORIZONTAL_LOCK_PHOTO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_MAX_PHOTO_2, // MaxPhoto2_0
  PRESET_MAX_PHOTO, // Hero11 MaxPhoto
  PRESET_EASY_MAX_PHOTO_1, // EasyMaxPhoto
  PRESET_EASY_MAX_PHOTO, // EasyMaxPhoto2_0
]);

/**
 * Timelapse presets that display HorizontalLeveling (ID=165).
 * From legacy app Hero13/UIElementSettings.cs + ActiveHorizontalLevelingConverter.cs.
 * (MaxVideo2_0 belongs to the VIDEO group, so it is added directly to MAX_VIDEO_LAYOUT separately)
 */
const HORIZONTAL_LEVELING_TIMELAPSE_PRESETS: ReadonlySet<number> = new Set([
  PRESET_MAX_TIMEWARP_2, // MaxTimewarp2_0
  PRESET_EASY_MAX_TIMEWARP, // EasyMaxTimeWarp2_0
  PRESET_MAX_TIMEWARP, // Hero11 MaxTimewarp
]);

/**
 * Easy mode Photo group presets (all lens types).
 * No ProTune settings are displayed while these presets are selected.
 */
const EASY_PHOTO_PRESET_IDS: ReadonlySet<number> = new Set([
  // ノーマルレンズ
  PRESET_LEGACY_EASY_PHOTO,
  PRESET_LEGACY_EASY_NIGHT_PHOTO,
  PRESET_LEGACY_EASY_BURST_PHOTO,
  // MaxLens 2.0 / 2.5
  PRESET_EASY_MAX_PHOTO,
  // Anamorphic
  EASY_ANAMORPHIC_SUPER_PHOTO_PRESET_HERO13,
  EASY_ANAMORPHIC_NIGHT_PHOTO_PRESET_HERO13,
  // Macro
  EASY_MACRO_PHOTO_PRESET_HERO13,
  EASY_MACRO_NIGHT_PHOTO_PRESET_HERO13,
]);

/**
 * Easy mode Timelapse group presets (all lens types).
 * No ProTune settings are displayed while these presets are selected.
 */
const EASY_TIMELAPSE_PRESET_IDS: ReadonlySet<number> = new Set([
  // ノーマルレンズ
  PRESET_LEGACY_EASY_TIMEWARP,
  PRESET_LEGACY_EASY_STAR_TRAILS,
  PRESET_LEGACY_EASY_LIGHT_PAINTING,
  PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
  // MaxLens 2.0 / 2.5
  PRESET_EASY_MAX_TIMEWARP,
  PRESET_EASY_MAX_STAR_TRAILS,
  PRESET_EASY_MAX_LIGHT_PAINTING,
  PRESET_EASY_MAX_VEHICLE_LIGHTS,
  // Anamorphic
  EASY_ANAMORPHIC_TIMEWARP_PRESET_HERO13,
  // Macro
  EASY_MACRO_TIMELAPSE_PRESET_HERO13,
  EASY_MACRO_NIGHTLAPSE_PRESET_HERO13, // Easy Macro TimeLapse / Easy Macro NightLapse
]);

/**
 * Shared layout for Easy mode Photo / Timelapse.
 * ProTune settings and Visible Advanced Items are not displayed at all.
 */
const EASY_PHOTO_TIMELAPSE_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [],
  prioritizedAdvancedSettingIds: [],
  defaultVisibleAdvancedSettingIds: [],
};

const HERO13_ANAMORPHIC_NIGHT_PHOTO_PRESET = PRESET_ANAMORPHIC_NIGHT_PHOTO;
const HERO13_ANAMORPHIC_TIMEWARP_PRESET = PRESET_ANAMORPHIC_TIMEWARP;

const getPhotoLayout = (settings: SettingsMap, cameraModel: CameraModelKey): GoProDisplayLayout => {
  const activePreset = settings[GoProSettingId.MODE_PRESET];
  const isStandardPhoto = activePreset === PRESET_PHOTO; // Photo
  const isBurstLike = activePreset !== undefined && BURST_LIKE_PHOTO_PRESETS.has(activePreset);
  const isMacroPhoto = activePreset === PRESET_MACRO_PHOTO; // MacroPhoto
  const isMacroNightPhoto = activePreset === PRESET_MACRO_NIGHT_PHOTO; // MacroNightPhoto
  const isAnamorphicNightPhoto = activePreset === HERO13_ANAMORPHIC_NIGHT_PHOTO_PRESET;
  const isMacroPhotoFamily = isMacroPhoto || isMacroNightPhoto;
  const isNightPhoto =
    activePreset === PRESET_NIGHT_PHOTO || isMacroNightPhoto || isAnamorphicNightPhoto; // NightPhoto / MacroNightPhoto / Anamorphic NightPhoto
  const isLiveBurst = activePreset === PRESET_LIVE_BURST; // LiveBurst
  const isMaxPhoto = activePreset !== undefined && MAX_PHOTO_PRESETS.has(activePreset);

  const photoLayoutState = resolvePhotoLayoutState({
    cameraModel,
    activePreset,
    isBurstLike,
    isNightPhoto,
    isLiveBurst,
    ids: {
      timeLapseLens: GoProSettingId.TIME_LAPSE_LENS,
      multiShotLens: GoProSettingId.MULTI_SHOT_LENS,
      videoLens: GoProSettingId.VIDEO_LENS,
      photoLens: GoProSettingId.PHOTO_LENS,
      photoShutter: GoProSettingId.PHOTO_SHUTTER,
      nightPhotoShutter: GoProSettingId.NIGHT_PHOTO_SHUTTER,
      photoIsoMin: GoProSettingId.PHOTO_ISO_MIN,
      photoIsoMax: GoProSettingId.PHOTO_ISO_MAX,
      multiShotIsoMin: GoProSettingId.MULTI_SHOT_ISO_MIN,
      multiShotIsoMax: GoProSettingId.MULTI_SHOT_ISO_MAX,
      videoShutter: GoProSettingId.VIDEO_SHUTTER,
      videoIsoMin: GoProSettingId.VIDEO_ISO_MIN,
      videoIsoMax: GoProSettingId.VIDEO_ISO_MAX,
      maxWindReduction: GoProSettingId.MAX_WIND_REDUCTION,
      windReduction: GoProSettingId.WIND_REDUCTION,
      rawAudio: GoProSettingId.RAW_AUDIO,
    },
    presetIds: {
      standardPhoto: PRESET_PHOTO,
      liveBurst: PRESET_LIVE_BURST,
      max360Photo: PRESET_MAX_PHOTO,
    },
    horizontalLockPhotoPresets: HORIZONTAL_LOCK_PHOTO_PRESETS,
  });
  const { lensSettingId, hasLens, hasHorizontalLock, ssIsoIds, hasEvComp, liveBurstAdvancedIds } =
    photoLayoutState;

  // ── SS / ISO (Conforms to legacy DB: UIElementSettings.cs / BaseFullControlPanelViewModel.cs) ──
  //   Photo (65536) / MacroPhoto / MaxPhoto2_0
  //       → PHOTO_SHUTTER (146) + PHOTO_ISO_MIN (75) / MAX (24)
  //   LiveBurst (65537) — Hero models:
  //       → VIDEO_SHUTTER (145) [P_LiveBurstShutterSpeed = GetSettingVideoShutterSpeed]
  //         + VIDEO_ISO_MIN (102) / MAX (13) [P_LiveBurstISOMin/Max = Header 102/13]
  //   PowerPano (65537) — Max のみ: LiveBurst と同プリセット ID だが ISO は Photo 系を使用
  //       → PHOTO_SHUTTER (146) + PHOTO_ISO_MIN (75) / MAX (24)
  //         旧アプリ Max/UIElementSettings.cs: P_PhotoShutterSpeed, P_PhotoISOMin, P_PhotoISOMax
  //   Burst (65538) / EasyBurstPhoto (786434)
  //       → SS なし + MULTI_SHOT_ISO_MIN (76) / MAX (37)
  //   NightPhoto (65539) / MacroNightPhoto
  //       → NIGHT_PHOTO_SHUTTER (19) + PHOTO_ISO_MIN (75) / MAX (24)
  // ── PHOTO_OUTPUT: MaxPhoto2_0 では旧 DB でコメントアウト (= 非表示)、Burst は ID 126 を使用 ────
  const hasPhotoOutput = !isMaxPhoto;
  // Burst の出力設定: ID 126 (TIMELAPSE_PHOTO_OUTPUT) = Standard/RAW
  // 通常 Photo は ID 125 (PHOTO_OUTPUT)
  const photoOutputId = isBurstLike
    ? GoProSettingId.TIMELAPSE_PHOTO_OUTPUT
    : GoProSettingId.PHOTO_OUTPUT;

  // ── Interval: Used in normal Photo on Hero12/13 and Macro Photo on Hero13 ──
  // LiveBurst is excluded as there is no Interval definition in the legacy DB.
  const hasInterval = isStandardPhoto || isMacroPhoto;
  const intervalAdvancedIds: number[] = hasInterval
    ? [GoProSettingId.PHOTO_INTERVAL, GoProSettingId.PHOTO_INTERVAL_DURATION]
    : [];

  // ── Common advanced settings ─────────────────────────────────────────────────────
  const advancedCommon: number[] = [
    GoProSettingId.WB,
    GoProSettingId.SHARPNESS,
    GoProSettingId.COLOR,
    GoProSettingId.DENOISE,
    // Excluded here because it is explicitly added to the head of prioritizedAdvancedSettingIds for Burst
    ...(!isBurstLike && hasPhotoOutput ? [photoOutputId] : []),
    ...liveBurstAdvancedIds,
    GoProSettingId.SCHEDULED_CAPTURE,
    GoProSettingId.CAPTURE_DELAY,
  ];

  return composeDisplayLayout(
    {
      quickSettingIds: [
        ...(isBurstLike ? [GoProSettingId.TIMELAPSE_PHOTO_OUTPUT] : []),
        ...(!isBurstLike && hasPhotoOutput ? [GoProSettingId.PHOTO_OUTPUT] : []),
        ...(hasLens ? [lensSettingId] : []),
        GoProSettingId.PHOTO_MODE,
        ...(isBurstLike ? [GoProSettingId.BURST_RATE] : []),
        ...(hasHorizontalLock ? [GoProSettingId.HORIZONTAL_LOCK] : []),
      ],
      prioritizedAdvancedSettingIds: [
        ...(hasLens ? [lensSettingId] : []),
        ...(isMacroPhotoFamily ? [GoProSettingId.FOCUS_PEAKING] : []),
        ...(isBurstLike ? [GoProSettingId.BURST_RATE] : []),
        ...intervalAdvancedIds,
        ...ssIsoIds,
        ...(hasEvComp ? [GoProSettingId.EV_COMP] : []),
        ...advancedCommon,
      ],
      defaultVisibleAdvancedSettingIds: hasInterval ? [GoProSettingId.PHOTO_INTERVAL_DURATION] : [],
    },
    getCameraAdvancedSettingIds(cameraModel),
  );
};

/**
 * Classification of Timelapse sub-modes. Follows Visibility Converter in legacy app
 * TimelapseModeView.xaml to switch UI depending on Parent Preset ID.
 *
 *  - 'lapse_with_photo': Timelapse supporting both Video/Photo formats. Displays Photo/Video toggle.
 *      Timelapse, Nightlapse, Macro variants (2490368/9, 2686976/7)
 *  - 'trail_like': Long exposure series (Star Trails, Light Painting, Vehicle Lights). Displays Trail Length toggle.
 *      StarTrails/LightPainting/VehicleLights and their Easy/MAX 2.0 variants
 *  - 'timewarp_like': Single mode (TimeWarp, MaxTimeWarp 2.0, etc.). No toggle.
 */
export type TimelapseCategory = 'lapse_with_photo' | 'trail_like' | 'timewarp_like';

export const LAPSE_WITH_PHOTO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_TIMELAPSE, // Timelapse
  PRESET_NIGHTLAPSE, // Nightlapse
  PRESET_MACRO_TIMELAPSE, // MacroTimelapse
  PRESET_MACRO_NIGHTLAPSE, // MacroNightlapse
  EASY_MACRO_TIMELAPSE_PRESET_HERO13,
  EASY_MACRO_NIGHTLAPSE_PRESET_HERO13,
  PRESET_MAX_TIMELAPSE, // Max 360 Timelapse (TL_TimelapseFormat あり, Video/Photo 切替対応)
]);

/** Timelapse presets that display Focus Peaking (Hero13 Macro series) */
const FOCUS_PEAKING_TIMELAPSE_PRESETS: ReadonlySet<number> = new Set([
  PRESET_MACRO_TIMELAPSE, // MacroTimelapse
  PRESET_MACRO_NIGHTLAPSE, // MacroNightlapse
]);

/** Nightlapse preset IDs ("Night" series under LAPSE_WITH_PHOTO) */
const NIGHTLAPSE_PRESETS: ReadonlySet<number> = new Set([
  PRESET_NIGHTLAPSE, // Nightlapse
  PRESET_MACRO_NIGHTLAPSE, // MacroNightlapse
  EASY_MACRO_NIGHTLAPSE_PRESET_HERO13,
]);

const TRAIL_LIKE_PRESETS: ReadonlySet<number> = new Set([
  PRESET_STAR_TRAILS,
  PRESET_LIGHT_PAINTING,
  PRESET_VEHICLE_LIGHTS, // Pro: Star Trails / Light Painting / Vehicle Lights
  PRESET_LEGACY_EASY_STAR_TRAILS,
  PRESET_LEGACY_EASY_LIGHT_PAINTING,
  PRESET_LEGACY_EASY_VEHICLE_LIGHTS, // Easy variants
  PRESET_MAX_STAR_TRAILS_2,
  PRESET_MAX_LIGHT_PAINTING_2,
  PRESET_MAX_VEHICLE_LIGHTS_2, // Max 2.0 variants
  PRESET_EASY_MAX_STAR_TRAILS,
  PRESET_EASY_MAX_LIGHT_PAINTING,
  PRESET_EASY_MAX_VEHICLE_LIGHTS, // Easy Max Trail 2.0 variants
]);

const TIMEWARP_LIKE_PRESETS: ReadonlySet<number> = new Set([
  PRESET_TIMEWARP,
  PRESET_MAX_TIMEWARP, // Pro: TimeWarp / Max TimeWarp
  PRESET_LEGACY_EASY_TIMEWARP, // Easy TimeWarp
  HERO13_ANAMORPHIC_TIMEWARP_PRESET, // Anamorphic TimeWarp
  PRESET_MAX_TIMEWARP_2,
  PRESET_EASY_MAX_TIMEWARP, // Max TimeWarp 2.0 / Easy Max TimeWarp 2.0
  EASY_ANAMORPHIC_TIMEWARP_PRESET_HERO13, // Easy Anamorphic TimeWarp
]);

/** StarTrails preset IDs */
const STAR_TRAILS_PRESETS: ReadonlySet<number> = new Set([
  PRESET_STAR_TRAILS,
  PRESET_LEGACY_EASY_STAR_TRAILS,
  PRESET_MAX_STAR_TRAILS_2,
  PRESET_EASY_MAX_STAR_TRAILS, // Pro / Easy / Max 2.0 / Easy Max 2.0
]);

/** LightPainting preset IDs */
const LIGHT_PAINTING_PRESETS: ReadonlySet<number> = new Set([
  PRESET_LIGHT_PAINTING,
  PRESET_LEGACY_EASY_LIGHT_PAINTING,
  PRESET_MAX_LIGHT_PAINTING_2,
  PRESET_EASY_MAX_LIGHT_PAINTING, // Pro / Easy / Max 2.0 / Easy Max 2.0
]);

/** VehicleLights preset IDs */
const VEHICLE_LIGHTS_PRESETS: ReadonlySet<number> = new Set([
  PRESET_VEHICLE_LIGHTS,
  PRESET_LEGACY_EASY_VEHICLE_LIGHTS,
  PRESET_MAX_VEHICLE_LIGHTS_2,
  PRESET_EASY_MAX_VEHICLE_LIGHTS, // Pro / Easy / Max 2.0 / Easy Max 2.0
]);

const HERO13_MAX_TRAIL2_PRESETS: ReadonlySet<number> = new Set([
  PRESET_MAX_STAR_TRAILS_2,
  PRESET_MAX_LIGHT_PAINTING_2,
  PRESET_MAX_VEHICLE_LIGHTS_2, // Max Trail 2.0 variants
  PRESET_EASY_MAX_STAR_TRAILS,
  PRESET_EASY_MAX_LIGHT_PAINTING,
  PRESET_EASY_MAX_VEHICLE_LIGHTS, // Easy Max Trail 2.0 variants
]);

export const classifyTimelapsePreset = (presetId: number | undefined): TimelapseCategory => {
  if (presetId === undefined) return 'timewarp_like';
  if (LAPSE_WITH_PHOTO_PRESETS.has(presetId)) return 'lapse_with_photo';
  if (TRAIL_LIKE_PRESETS.has(presetId)) return 'trail_like';
  return 'timewarp_like';
};

export const isTimelapseLikePreset = (presetId: number | undefined): boolean => {
  if (presetId === undefined) return false;
  return (
    TIMEWARP_LIKE_PRESETS.has(presetId) ||
    LAPSE_WITH_PHOTO_PRESETS.has(presetId) ||
    TRAIL_LIKE_PRESETS.has(presetId)
  );
};

const getTimelapseLayout = (
  settings: SettingsMap,
  cameraModel: CameraModelKey,
): GoProDisplayLayout => {
  // TimelapseFormat (MEDIA_FORMAT=128) is shared across all models to switch between Video/Photo for Timelapse/Nightlapse
  // Ref: ProTuneRemote_Latest/ProTuneRemote/ViewModels/BaseFullControlPanelViewModel.cs (Header 128)
  const currentFormat = settings[GoProSettingId.MEDIA_FORMAT];
  const activePreset = settings[GoProSettingId.MODE_PRESET];
  const category = classifyTimelapsePreset(activePreset);

  // MEDIA_FORMAT values (derived from TimelapseFormatId):
  //   13 = Time Lapse Video, 20 = Time Lapse Photo
  //   26 = Night Lapse Video, 21 = Night Lapse Photo
  const isPhotoFormat = currentFormat === 20 || currentFormat === 21;
  const isVideoFormat = !isPhotoFormat;
  const isNightlapse = activePreset !== undefined && NIGHTLAPSE_PRESETS.has(activePreset);
  const isMacroTimelapse =
    activePreset !== undefined && FOCUS_PEAKING_TIMELAPSE_PRESETS.has(activePreset);
  const lensAttachment = settings[GoProSettingId.LENS_ATTACHMENT];

  const timelapseLayoutState = resolveTimelapseLayoutState({
    cameraModel,
    activePreset,
    category,
    isPhotoFormat,
    isVideoFormat,
    isNightlapse,
    lensAttachment,
    ids: {
      videoLens: GoProSettingId.VIDEO_LENS,
      videoLensHero13: GoProSettingId.VIDEO_LENS_HERO13,
      timeLapseLens: GoProSettingId.TIME_LAPSE_LENS,
      resolution: GoProSettingId.RESOLUTION,
      fps: GoProSettingId.FPS,
      timelapsePhotoOutput: GoProSettingId.TIMELAPSE_PHOTO_OUTPUT,
      horizontalLeveling: GoProSettingId.HORIZONTAL_LEVELING,
      videoBitrate: GoProSettingId.VIDEO_BITRATE,
      videoBitrateHero11: GoProSettingId.VIDEO_BITRATE_HERO11,
      videoBitrateHero09: GoProSettingId.VIDEO_BITRATE_HERO09,
      windReduction: GoProSettingId.WIND_REDUCTION,
      maxWindReduction: GoProSettingId.MAX_WIND_REDUCTION,
    },
    horizontalLevelingTimelapsePresets: HORIZONTAL_LEVELING_TIMELAPSE_PRESETS,
    hero13MaxTrail2Presets: HERO13_MAX_TRAIL2_PRESETS,
    hero13MaxLensAttachmentValues: [2, 3],
  });
  const {
    videoModeLensId,
    quickPhotoIds,
    quickTimewarpIds,
    lapsePhotoOutputIds,
    includeSpeedRamp,
    horizontalLevelingIds,
    lapseBitRateIds,
    windReductionSettingId,
    omitDuration,
  } = timelapseLayoutState;

  // ── Quick settings ──────────────────────────────────────────────────────────
  const quickSettingIds: number[] = [];
  if (category === 'lapse_with_photo') {
    // Excluded because MEDIA_FORMAT (Video/Photo switch) is always displayed directly under the preset chips in SettingsPanel
    if (isVideoFormat) {
      quickSettingIds.push(GoProSettingId.RESOLUTION, GoProSettingId.FPS, videoModeLensId);
    } else {
      quickSettingIds.push(...quickPhotoIds);
    }
  } else if (category === 'trail_like') {
    // Trail lens:
    //   Hero11/HeroMini11/12: VIDEO_LENS (121)
    //   Hero13: VIDEO_LENS_HERO13 (229)
    // In legacy app Hero11/HeroMini11 FullControlPanelViewModel.cs,
    // StarTrails / LightPainting / VehicleLights are drawn with TL_VideoLens.
    const trailLensId = videoModeLensId;
    quickSettingIds.push(
      GoProSettingId.RESOLUTION,
      GoProSettingId.FPS,
      trailLensId,
      GoProSettingId.STAR_TRAILS_LENGTH,
    );
  } else {
    quickSettingIds.push(...quickTimewarpIds);
  }

  // ── Interval ───────────────────────────────────────────────────────────
  // Legacy DB: TL_TimelapseVideoInterval / TL_TimelapsePhotoInterval / TL_NightlapseVideoInterval /
  //             TL_NightlapsePhotoInterval are format-specific. None for trail_like / timewarp_like.
  const lapseIntervalIds: number[] = [];
  if (category === 'lapse_with_photo') {
    if (isNightlapse) {
      lapseIntervalIds.push(GoProSettingId.NIGHTLAPSE_RATE); // Video / Photo 共通
    } else if (isVideoFormat) {
      lapseIntervalIds.push(GoProSettingId.VIDEO_TIMELAPSE_RATE); // Timelapse Video
    } else {
      lapseIntervalIds.push(GoProSettingId.PHOTO_TIMELAPSE_RATE); // Timelapse Photo
    }
  }

  // ── Photo Output ───────────────────────────────────────────────────────────
  // Legacy VM: TL_TimelapsePhotoOutput -> TimelapsePhoto only
  //             TL_NightlapsePhotoOutput -> NightlapsePhoto only
  // Added to advanced side only when lapse_with_photo and Photo format are active
  // (already included in quickSettingIds, but duplicates are automatically removed by the advanced side's exclusion filter)
  // Excluded for MAX camera as it does not use TIMELAPSE_PHOTO_OUTPUT
  // ── SS / ISO ──────────────────────────────────────────────────────────────
  // Conforms to legacy VM (BaseFullControlPanelViewModel.cs / Hero13 VM) + additions:
  //   lapse_with_photo + Nightlapse (both Video/Photo)
  //       → NIGHTLAPSE_PHOTO_SHUTTER (31) + MULTI_SHOT_ISO (76/37)
  //   lapse_with_photo + Timelapse Video
  //       → VIDEO_SHUTTER (145) + VIDEO_ISO_MIN/MAX
  //         *Omitted in legacy app. Added in this new app.
  //   lapse_with_photo + Timelapse Photo
  //       → MULTI_SHOT_ISO (76/37) only
  //   trail_like (StarTrails / LightPainting / VehicleLights)
  //       → NIGHTLAPSE_PHOTO_SHUTTER + MULTI_SHOT_ISO
  //   timewarp_like
  //       → VIDEO_ISO_MIN/MAX only (no shutter items exist in legacy DB)
  let lapseSsIsoIds: number[] = [];
  if (category === 'lapse_with_photo') {
    if (isNightlapse) {
      lapseSsIsoIds = [
        GoProSettingId.NIGHTLAPSE_PHOTO_SHUTTER,
        GoProSettingId.MULTI_SHOT_ISO_MIN,
        GoProSettingId.MULTI_SHOT_ISO_MAX,
      ];
    } else if (isVideoFormat) {
      // Timelapse Video: no shutter items (confirmed on Hero13 device), VIDEO_ISO only
      lapseSsIsoIds = [GoProSettingId.VIDEO_ISO_MIN, GoProSettingId.VIDEO_ISO_MAX];
    } else {
      // Timelapse Photo: no shutter items (confirmed on Hero13 device), MULTI_SHOT_ISO only
      lapseSsIsoIds = [GoProSettingId.MULTI_SHOT_ISO_MIN, GoProSettingId.MULTI_SHOT_ISO_MAX];
    }
  } else if (category === 'trail_like') {
    // StarTrails / LightPainting / VehicleLights: TL_StarTrailShutter series = BLE ID 31 (value set branches by virtual ID)
    let trailShutterId: number;
    if (activePreset !== undefined && STAR_TRAILS_PRESETS.has(activePreset)) {
      trailShutterId = GoProSettingId.STAR_TRAIL_SHUTTER; // {30s,10s,5s,2s,1s,0.5s}
    } else if (activePreset !== undefined && LIGHT_PAINTING_PRESETS.has(activePreset)) {
      trailShutterId = GoProSettingId.LIGHT_PAINTING_SHUTTER; // {2s,1s,0.5s}
    } else {
      trailShutterId = GoProSettingId.VEHICLE_LIGHTS_SHUTTER; // {30s,10s,5s,2s,1s,0.5s}
    }
    lapseSsIsoIds = [
      trailShutterId,
      GoProSettingId.MULTI_SHOT_ISO_MIN,
      GoProSettingId.MULTI_SHOT_ISO_MAX,
    ];
  } else {
    // timewarp_like: no shutter items, VIDEO_ISO only
    lapseSsIsoIds = [GoProSettingId.VIDEO_ISO_MIN, GoProSettingId.VIDEO_ISO_MAX];
  }

  // ── Timewarp Speed / Speed Ramp ──────────────────────────────────────────
  // Legacy DB: TL_TimewarpSpeed (3023) only for timewarp_like presets (Timewarp/MaxTimewarp2_0)
  //            Sort=0, IsVisibleDefault=true, BLE ID = 0x6F = 111
  // Legacy DB: TL_SpeedRamp (3004) exists in normal Timewarp, but is forced hidden (Sort=-96)
  //            in MAX series Timewarp presets. Unregistered in UIElementSettings.cs for MAX camera's HERO/360 Timewarp.
  //            values: Hero09=11(Real)/12(Half), Hero10+=100(Real)/101(Half)
  const timewarpSpeedIds: number[] = [];
  if (category === 'timewarp_like') {
    timewarpSpeedIds.push(GoProSettingId.TIMEWARP_SPEED);
    if (includeSpeedRamp) {
      timewarpSpeedIds.push(GoProSettingId.SPEED_RAMP);
    }
  }
  quickSettingIds.push(...horizontalLevelingIds);

  // ── BitRate ────────────────────────────────────────────────────────────────
  // Legacy DB: TL_VideoBitRate / TL_TimelapseBitRate only for lapse_with_photo + Video format.
  //             No BitRate item in DB for trail_like / timewarp_like.
  //             However, Hero13 Max Trail 2.0 / 2.5 exceptionally display it because they return BLE ID=182 change notifications on actual device.
  // → Hero09: Timelapse Video=ID124 (shared with HERO11) / Nightlapse Video=ID160.
  //           Since BitRate is unchangeable in Timewarp, VIDEO_BITRATE_HERO11 is hidden.
  // → Hero10: Since BitRate is unchangeable in Timewarp (write 0x02), VIDEO_BITRATE_HERO11 is hidden.
  // → Hero11/HeroMini11: Timelapse Video=ID124 / Nightlapse Video=ID160 (legacy app TL_TimelapseBitRate).
  // → timewarp_like: In addition to Hero09/10, Hero11/HeroMini11 also cannot change BitRate in Timewarp.
  //                  Hero12 also cannot change VIDEO_BITRATE (ID=182) in Timewarp.
  //                  Only Hero13 displays VIDEO_BITRATE.
  // ── Wind Reduction / Denoise ───────────────────────────────────────────────
  // Legacy DB: TL_WindReduction exists in Timewarp/MaxTimewarp, IsVisibleDefault=false.
  //            Restored as an optional advanced item for Timewarp in this new app.
  //            TL_Denoise is used in timewarp_like + lapse_with_photo(Video) + trail_like (IsVisibleDefault=true).
  //            V_WindReduction / V_Denoise are added on the Video Layout side for all Video presets (IsVisibleDefault=false).
  const lapseWindReductionIds: number[] = [];
  if (category === 'timewarp_like') {
    lapseWindReductionIds.push(windReductionSettingId);
  }

  const lapseDenoiseIds: number[] = [];
  if (
    category === 'timewarp_like' ||
    (category === 'lapse_with_photo' && isVideoFormat) ||
    category === 'trail_like'
  ) {
    lapseDenoiseIds.push(GoProSettingId.DENOISE);
  }

  // ── Duration ──────────────────────────────────────────────────────────────
  // Legacy DB: TL_TimelapseDuration exists in all presets (Sort=19, IsVisibleDefault=true).
  //   VIDEO_DURATION (ID=156): timewarp_like / lapse_with_photo Timelapse Video
  //   MULTI_SHOT_DURATION (ID=157): lapse_with_photo Nightlapse Video (all models) / Photo series
  //
  // Duration ID for trail_like:
  //   Hero13 C# source: explicitly checks StarTrails/LightPainting/VehicleLights beforehand
  //                    and uses GetSettingTimelapseDuration (0x9D=157)
  //   Hero09/10 (BaseVM): unconditionally GetSettingTimelapseDuration -> 157
  //   Hero11 / HeroMini11: since there was no Trail-specific branch determined in legacy app, and writing fails on physical device,
  //                        Duration itself is hidden from Trail series in this new app
  //
  // trail_like does not display Duration on Hero11 / HeroMini11.
  const lapseDurationId =
    category === 'timewarp_like' ||
    (category === 'lapse_with_photo' && isVideoFormat && !isNightlapse)
      ? GoProSettingId.VIDEO_DURATION
      : GoProSettingId.MULTI_SHOT_DURATION;

  return composeDisplayLayout(
    {
      quickSettingIds,
      prioritizedAdvancedSettingIds: [
        ...timewarpSpeedIds,
        ...(isMacroTimelapse ? [GoProSettingId.FOCUS_PEAKING] : []),
        ...lapseIntervalIds,
        ...lapsePhotoOutputIds,
        ...lapseSsIsoIds,
        GoProSettingId.EV_COMP,
        GoProSettingId.WB,
        GoProSettingId.SHARPNESS,
        GoProSettingId.COLOR,
        ...lapseWindReductionIds,
        ...lapseDenoiseIds,
        ...lapseBitRateIds,
        ...(omitDuration ? [] : [lapseDurationId]),
        GoProSettingId.SCHEDULED_CAPTURE,
        GoProSettingId.CAPTURE_DELAY,
      ],
      defaultVisibleAdvancedSettingIds: [],
    },
    getCameraAdvancedSettingIds(cameraModel),
  );
};

const FALLBACK_LAYOUT: GoProDisplayLayout = {
  quickSettingIds: [
    GoProSettingId.RESOLUTION,
    GoProSettingId.FPS,
    GoProSettingId.VIDEO_LENS,
    GoProSettingId.PHOTO_LENS,
  ],
  prioritizedAdvancedSettingIds: [
    GoProSettingId.TEN_BIT_COLOR_HERO11,
    GoProSettingId.VIDEO_BITRATE_HERO11,
    GoProSettingId.BIT_DEPTH,
    GoProSettingId.VIDEO_BITRATE,
  ],
  defaultVisibleAdvancedSettingIds: [],
};

export const getDisplayLayout = (
  settings: SettingsMap,
  cameraModel: CameraModelKey,
  presets?: readonly GoProPresetGroupData[],
): GoProDisplayLayout => {
  const currentGroupId = settings[GoProSettingId.MODE_PRESET_GROUP];
  const currentPresetId = settings[GoProSettingId.MODE_PRESET];
  const activePreset = findActivePreset(presets, currentGroupId, currentPresetId);
  const displayPresetId = resolveBaseDisplayPresetId(activePreset, currentPresetId, currentGroupId);

  const modelLayout = resolveModelDisplayLayout({
    settings,
    cameraModel,
    currentGroupId,
    currentPresetId: displayPresetId,
    presetGroups: {
      video: GoProPresetGroup.VIDEO,
      photo: GoProPresetGroup.PHOTO,
      timelapse: GoProPresetGroup.TIMELAPSE,
    },
    composeDisplayLayout,
    getCameraAdvancedSettingIds,
    getTimelapseLayout,
    isTimelapseLikePreset,
    easyVideoPresets: EASY_VIDEO_PRESETS,
    hero11EasyPhotoPresets: HERO11_EASY_PHOTO_PRESETS,
    hero11EasyTimelapsePresets: HERO11_EASY_TIMELAPSE_PRESETS,
    easyPhotoPresetIds: EASY_PHOTO_PRESET_IDS,
    easyTimelapsePresetIds: EASY_TIMELAPSE_PRESET_IDS,
    layouts: {
      legacyEasyVideo: LEGACY_EASY_VIDEO_LAYOUT,
      hero11EasyVideo: HERO11_EASY_VIDEO_LAYOUT,
      hero12EasyQualityVideo: HERO12_EASY_QUALITY_VIDEO_LAYOUT,
      hero11EasyPhoto: HERO11_EASY_PHOTO_LAYOUT,
      hero11EasyTimelapse: HERO11_EASY_TIMELAPSE_LAYOUT,
      easyPhotoTimelapse: EASY_PHOTO_TIMELAPSE_LAYOUT,
      maxCameraStandardVideo: MAX_CAMERA_STANDARD_VIDEO_LAYOUT,
      maxCamera360Video: MAX_CAMERA_360_VIDEO_LAYOUT,
    },
  });
  if (modelLayout) {
    return modelLayout;
  }

  const displaySettings =
    displayPresetId === undefined
      ? settings
      : {
          ...settings,
          [GoProSettingId.MODE_PRESET]: displayPresetId,
        };

  switch (currentGroupId) {
    case GoProPresetGroup.VIDEO: {
      return getVideoLayout(displaySettings, cameraModel, activePreset);
    }
    case GoProPresetGroup.PHOTO: {
      return getPhotoLayout(displaySettings, cameraModel);
    }
    case GoProPresetGroup.TIMELAPSE: {
      return getTimelapseLayout(displaySettings, cameraModel);
    }
    default:
      return composeDisplayLayout(FALLBACK_LAYOUT, getCameraAdvancedSettingIds(cameraModel));
  }
};

export const isDefaultVisibleAdvancedSetting = (
  settings: SettingsMap,
  settingId: number,
  cameraModel: CameraModelKey,
  presets?: readonly GoProPresetGroupData[],
): boolean => {
  const layout = getDisplayLayout(settings, cameraModel, presets);
  return layout.defaultVisibleAdvancedSettingIds.includes(settingId);
};

const DEFAULT_CAPABILITY_PREFETCH_SETTING_IDS: readonly number[] = [
  GoProSettingId.VIDEO_BITRATE_HERO11,
  GoProSettingId.VIDEO_BITRATE_HERO09,
  GoProSettingId.VIDEO_DURATION,
  GoProSettingId.MULTI_SHOT_DURATION,
  GoProSettingId.HYPERSMOOTH_MAX,
];

const getLayoutExternalControls = (
  settings: SettingsMap,
  cameraModel: CameraModelKey,
  displayLayout: GoProDisplayLayout,
  currentPresetIdOverride?: number,
): GoProLayoutExternalControls => {
  const currentGroupId = settings[GoProSettingId.MODE_PRESET_GROUP];
  const currentPresetId = currentPresetIdOverride ?? settings[GoProSettingId.MODE_PRESET];
  const modelNo = resolveModelNoFromCameraModelKey(cameraModel);
  const mediaFormat = settings[GoProSettingId.MEDIA_FORMAT];
  const category = currentPresetId === undefined ? null : classifyTimelapsePreset(currentPresetId);
  const isLapseWithPhoto =
    currentGroupId === GoProPresetGroup.TIMELAPSE &&
    currentPresetId !== undefined &&
    LAPSE_WITH_PHOTO_PRESETS.has(currentPresetId);
  const isTimelapsePhoto = isLapseWithPhoto && (mediaFormat === 20 || mediaFormat === 21);
  const shouldExposeMediaFormat =
    isLapseWithPhoto &&
    cameraModel !== 'heromi11' &&
    currentPresetId !== EASY_MACRO_TIMELAPSE_PRESET_HERO13;

  const hasHero12EasyVideoPreset =
    cameraModel === 'hero12' &&
    currentGroupId === GoProPresetGroup.VIDEO &&
    currentPresetId !== undefined &&
    new Set<number>([
      PRESET_EASY_HIGHEST_QUALITY,
      PRESET_EASY_STANDARD_QUALITY,
      PRESET_EASY_BASIC_QUALITY,
    ]).has(currentPresetId);

  const supportsFramingSelector =
    modelNo !== null &&
    new Set<number>([
      GOPRO_MODEL_NUMBERS.HERO11_BLACK,
      GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI,
      GOPRO_MODEL_NUMBERS.HERO12_BLACK,
      GOPRO_MODEL_NUMBERS.HERO13_BLACK,
    ]).has(modelNo);

  return {
    showsMediaFormatPrimary: shouldExposeMediaFormat,
    showsFramingSelector:
      supportsFramingSelector &&
      (currentGroupId === GoProPresetGroup.VIDEO ||
        (currentGroupId === GoProPresetGroup.TIMELAPSE && category !== null && !isTimelapsePhoto)),
    showsResolutionSelector:
      currentGroupId === GoProPresetGroup.VIDEO &&
      !displayLayout.quickSettingIds.includes(GoProSettingId.RESOLUTION) &&
      !(cameraModel === 'hero13' && currentPresetId === GoProVideoPreset.ACTIVITY) &&
      !(
        cameraModel === 'hero11' &&
        currentPresetId !== undefined &&
        EASY_VIDEO_PRESETS.has(currentPresetId)
      ) &&
      !hasHero12EasyVideoPreset,
  };
};

const getCapabilityCacheKeyProjection = (
  displayLayout: GoProDisplayLayout,
  layoutExternalControls: GoProLayoutExternalControls,
  currentGroupId: number | undefined,
): GoProCapabilityCacheKeyProjection => {
  const visibleIds = new Set([
    ...displayLayout.quickSettingIds,
    ...displayLayout.defaultVisibleAdvancedSettingIds,
  ]);
  const mediaFormatSettingId = layoutExternalControls.showsMediaFormatPrimary
    ? GoProSettingId.MEDIA_FORMAT
    : null;
  const framingSettingId = !layoutExternalControls.showsFramingSelector
    ? null
    : currentGroupId === GoProPresetGroup.TIMELAPSE
      ? GoProSettingId.MULTI_SHOT_FRAMING
      : currentGroupId === GoProPresetGroup.VIDEO
        ? GoProSettingId.VIDEO_FRAMING
        : null;
  const lensSettingId = visibleIds.has(GoProSettingId.VIDEO_LENS_HERO13)
    ? GoProSettingId.VIDEO_LENS_HERO13
    : visibleIds.has(GoProSettingId.VIDEO_LENS)
      ? GoProSettingId.VIDEO_LENS
      : null;
  const shouldTrackHyperSmooth =
    visibleIds.has(GoProSettingId.HYPERSMOOTH_MAX) ||
    visibleIds.has(GoProSettingId.HYPERSMOOTH) ||
    visibleIds.has(GoProSettingId.VIDEO_LENS_HERO13) ||
    visibleIds.has(GoProSettingId.VIDEO_LENS) ||
    visibleIds.has(GoProSettingId.FPS) ||
    visibleIds.has(GoProSettingId.RESOLUTION);
  const hyperSmoothSettingId = !shouldTrackHyperSmooth
    ? null
    : visibleIds.has(GoProSettingId.HYPERSMOOTH_MAX)
      ? GoProSettingId.HYPERSMOOTH_MAX
      : GoProSettingId.HYPERSMOOTH;

  return {
    dependencySettingIds: Array.from(
      new Set([
        GoProSettingId.MODE_PRESET,
        ...(mediaFormatSettingId !== null ? [mediaFormatSettingId] : []),
        ...(framingSettingId !== null ? [framingSettingId] : []),
        GoProSettingId.RESOLUTION,
        GoProSettingId.FPS,
        ...(lensSettingId !== null ? [lensSettingId] : []),
        ...(hyperSmoothSettingId !== null ? [hyperSmoothSettingId] : []),
      ]),
    ),
    mediaFormatSettingId,
    framingSettingId,
    lensSettingId,
    hyperSmoothSettingId,
  };
};

export const getDisplaySettingPlan = (
  settings: SettingsMap,
  cameraModel: CameraModelKey,
  presets?: readonly GoProPresetGroupData[],
): GoProDisplaySettingPlan => {
  const currentGroupId = settings[GoProSettingId.MODE_PRESET_GROUP];
  const currentPresetId = settings[GoProSettingId.MODE_PRESET];
  const activePreset = findActivePreset(presets, currentGroupId, currentPresetId);
  const displayPresetId = resolveBaseDisplayPresetId(activePreset, currentPresetId, currentGroupId);
  const displayLayout = getDisplayLayout(settings, cameraModel, presets);
  const layoutExternalControls = getLayoutExternalControls(
    settings,
    cameraModel,
    displayLayout,
    displayPresetId,
  );
  const externalFramingSettingIds = !layoutExternalControls.showsFramingSelector
    ? []
    : currentGroupId === GoProPresetGroup.TIMELAPSE
      ? [GoProSettingId.MULTI_SHOT_FRAMING]
      : [GoProSettingId.VIDEO_FRAMING];
  const externalUiSettingIds = [
    ...(layoutExternalControls.showsMediaFormatPrimary ? [GoProSettingId.MEDIA_FORMAT] : []),
    ...externalFramingSettingIds,
    ...(layoutExternalControls.showsResolutionSelector ? [GoProSettingId.RESOLUTION] : []),
  ];
  const uiSettingIds = Array.from(
    new Set([
      ...displayLayout.quickSettingIds,
      ...displayLayout.defaultVisibleAdvancedSettingIds,
      ...externalUiSettingIds,
    ]),
  ).filter((id) => Number.isFinite(id));
  const specialRowsProjection = resolveSpecialRowsProjection({
    settings,
    cameraModel,
    currentGroupId,
    currentPresetId,
  });
  const cacheKeyProjection = getCapabilityCacheKeyProjection(
    displayLayout,
    layoutExternalControls,
    currentGroupId,
  );
  const displayRelevantSettingIds = Array.from(
    new Set([...uiSettingIds, ...displayLayout.prioritizedAdvancedSettingIds]),
  ).filter((id) => Number.isFinite(id));
  const dependencyRelevantSettingIds = Array.from(
    new Set([...displayRelevantSettingIds, ...DEFAULT_CAPABILITY_PREFETCH_SETTING_IDS]),
  ).filter((id) => Number.isFinite(id));
  const fullRefreshBaseIds = Array.from(
    new Set([...dependencyRelevantSettingIds, ...cacheKeyProjection.dependencySettingIds]),
  ).filter((id) => Number.isFinite(id));

  return {
    displayLayout,
    uiSettingIds,
    layoutExternalControls,
    specialRowsProjection,
    cacheKeyProjection,
    defaultCapabilityPrefetchIds: Array.from(
      new Set([...uiSettingIds, ...DEFAULT_CAPABILITY_PREFETCH_SETTING_IDS]),
    ).filter((id) => Number.isFinite(id)),
    fullRefreshBaseIds,
    displayRelevantSettingIds,
    dependencyRelevantSettingIds,
  };
};

export const getCapabilityDependencyRefreshIds = (
  changedIds: readonly number[],
  settings: SettingsMap,
  cameraModel: CameraModelKey,
  presets?: readonly GoProPresetGroupData[],
): number[] => {
  const plan = getDisplaySettingPlan(settings, cameraModel, presets);
  const allowedIds = new Set(plan.dependencyRelevantSettingIds);

  return Array.from(
    new Set(changedIds.flatMap((id) => CAPABILITY_REFRESH_DEPENDENCIES[id] ?? [])),
  ).filter((id) => Number.isFinite(id) && allowedIds.has(id));
};

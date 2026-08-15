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
 * settingConstraints.ts
 *
 * Defines setting constraints as pure functions based on "static logic"
 * that cannot be resolved solely via the camera's on-board Capability API.
 *
 * Background:
 *   While the Capability API restricts valid value choices, determining when a
 *   control itself should be 'disabled' or 'na' (N/A) under specific presets or profiles
 *   relies on hardcoded logic (equivalent to C# Converters in the legacy app) and
 *   is not reported via BLE Capabilities.
 *
 * Return values:
 *   'ok'       -> Writable as usual.
 *   'disabled' -> Non-writable (grayed out). The current value can be read but not changed.
 *   'na'       -> Not Applicable under the active preset/profile (shows N/A).
 *
 * Target models: Hero13, Hero12, Hero11, HeroMini11, Hero10, Hero09, Max
 *
 * ---- How to extend ----
 * To add a new model, append its type key to `CameraModelKey`, add a corresponding
 * resolver function under `src/cameraModels/<model>/constraints.ts`, and register it
 * within the switch-case statement dispatching to `SETTING_CONSTRAINT_RESOLVERS`.
 */

import { CameraModelKey } from './ResolutionAspectMap';
import { GoProSettingId } from './GoProSettingId';
import { hero09SettingConstraintResolver } from '../cameraModels/hero09/constraints';
import { hero10SettingConstraintResolver } from '../cameraModels/hero10/constraints';
import { hero11SettingConstraintResolver } from '../cameraModels/hero11/constraints';
import { hero12SettingConstraintResolver } from '../cameraModels/hero12/constraints';
import { hero13SettingConstraintResolver } from '../cameraModels/hero13/constraints';
import { heromi11SettingConstraintResolver } from '../cameraModels/heromi11/constraints';
import { maxSettingConstraintResolver } from '../cameraModels/max/constraints';
import { dispatchSettingConstraintResolver } from '../cameraModels/shared/constraints';
import type { ModelResolverMap, SettingConstraintResolver } from '../cameraModels/shared/types';
import { GOPRO_MODEL_NUMBERS } from './GoProModelNumbers';
import { resolveModelNoFromCameraModelKey } from '../cameraModels/shared/modelNumber';

export type ConstraintState = 'ok' | 'disabled' | 'na';

type SettingsSnapshot = Record<number, number | undefined>;

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Hero13 Constraint Rules
// ---------------------------------------------------------------------------
// Referenced legacy app Converters:
//   EnableVideoShutterSpeedConverter, EnableVideoISO, EnableEVConverter,
//   NAColorConverter, EnableColorConverter, EnableVideo10BitConverter,
//   EnableVideoDurationConverter, NAPhotoISOConverter
//
// Rule list:
//   VIDEO_SHUTTER, VIDEO_ISO_MIN, VIDEO_ISO_MAX
//     -> Under Video group, if Profile=HDR(101) or HLG(200) -> disabled
//        Reason: The camera automatically controls shutter speed and ISO when HDR/HLG is active.
//
//   PHOTO_ISO_MIN (75), PHOTO_ISO_MAX (24)                  [NAPhotoISOConverter]
//     -> Under (Photo/NightPhoto/MacroPhoto/MacroNightPhoto), if PhotoOutput=HDR(2) or SuperPhoto(3) -> na
//        Reason: The camera automatically controls ISO during HDR/SuperPhoto.
//
//   PHOTO_SHUTTER (146), NIGHT_PHOTO_SHUTTER (19)            [NAPhotoSSConverter]
//     -> Under (Photo/NightPhoto/MacroPhoto/MacroNightPhoto), if PhotoOutput=HDR(2) or SuperPhoto(3) -> na
//        Reason: The camera automatically controls shutter speed during HDR/SuperPhoto.
//
//   EV_COMP
//     -> Under Video group, if Standard preset AND Profile=HDR(101) or HLG(200) -> disabled
//        Reason: EV Compensation is not supported in HDR/HLG.
//     -> Under (Photo/NightPhoto/MacroPhoto/MacroNightPhoto), if PhotoOutput=HDR(2) or SuperPhoto(3) -> na
//        Reason: EV Compensation is ignored because the camera automatically manages exposure under HDR/SuperPhoto [NAPhotoEVConverter].
//
//   COLOR
//     -> If Profile=GP-Log -> disabled
//        Reason: Disables in-camera color customization since GP-Log implies post-color grading.
//
//   TEN_BIT_COLOR (143), TEN_BIT_COLOR_ALT (114), BIT_DEPTH (183)
//     -> Under Macro Video with specific resolutions -> na
//     -> Under Video group, if [Profile=GP-Log] or [Standard preset AND (HDR or HLG)] or [Activity preset] -> disabled
//        Reason: GP-Log/HDR/HLG are fixed at 10-bit; Activity does not support 10-bit.
//
//   VIDEO_DURATION
//     -> Under Video group, if Activity preset -> disabled
//        Reason: Activity preset (action-oriented) does not support continuous video recording limits.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Hero12 Constraint Rules
// ---------------------------------------------------------------------------
// Referenced legacy app Converters:
//   EnableVideoShutterSpeedConverter, EnableVideoISO, EnableEVConverter,
//   NAColorConverter, EnableColorConverter, NAPhotoISOConverter
//
// Rule list (Key differences from Hero13):
//   VIDEO_SHUTTER, VIDEO_ISO_MIN, VIDEO_ISO_MAX
//     -> Under Video group, if Profile=HDR(1) -> disabled (HLG does not exist on Hero12)
//
//   PHOTO_ISO_MIN (75), PHOTO_ISO_MAX (24)                  [NAPhotoISOConverter]
//     -> Under (Photo/NightPhoto), if PhotoOutput=HDR(2) or SuperPhoto(3) -> na
//        * Hero12 does not support MacroPhoto, so it is excluded.
//
//   PHOTO_SHUTTER (146), NIGHT_PHOTO_SHUTTER (19)            [NAPhotoSSConverter]
//     -> Under (Photo/NightPhoto), if PhotoOutput=HDR(2) or SuperPhoto(3) -> na
//
//   EV_COMP
//     -> If Standard preset AND Profile=HDR(1) or LOG(2) -> disabled
//        * Note: Unlike Hero13, EV is disabled in LOG mode.
//     -> Under (Photo/NightPhoto), if PhotoOutput=HDR(2) or SuperPhoto(3) -> na [NAPhotoEVConverter]
//
//   COLOR
//     -> If Standard preset AND GP-Log(2) -> disabled
//     -> If (Photo or Nightlapse) preset AND PhotoOutput=HDR(2) or SuperPhoto(3) -> disabled
//
//   TEN_BIT_COLOR, VIDEO_DURATION: Deemed alternative-resolvable via capabilities, hence excluded.
// ---------------------------------------------------------------------------
const SETTING_CONSTRAINT_RESOLVERS: ModelResolverMap<SettingConstraintResolver> = {
  [GOPRO_MODEL_NUMBERS.HERO09_BLACK]: hero09SettingConstraintResolver,
  [GOPRO_MODEL_NUMBERS.HERO10_BLACK]: hero10SettingConstraintResolver,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK]: hero11SettingConstraintResolver,
  [GOPRO_MODEL_NUMBERS.HERO12_BLACK]: hero12SettingConstraintResolver,
  [GOPRO_MODEL_NUMBERS.HERO13_BLACK]: hero13SettingConstraintResolver,
  [GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]: heromi11SettingConstraintResolver,
  [GOPRO_MODEL_NUMBERS.MAX]: maxSettingConstraintResolver,
};

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Public Entry Point
// ---------------------------------------------------------------------------
/**
 * Returns the constraint state for the specified setting.
 *
 * @param settingId   - Numeric ID from GoProSettingId
 * @param settings    - Snapshot of Zustand settings (all setting values)
 * @param cameraModel - Connected camera model
 * @returns 'ok' | 'disabled' | 'na'
 */
export function getSettingConstraint(
  settingId: number,
  settings: SettingsSnapshot,
  cameraModel: CameraModelKey | null,
): ConstraintState {
  return dispatchSettingConstraintResolver(
    { settingId, settings, cameraModel },
    SETTING_CONSTRAINT_RESOLVERS,
    () => 'ok',
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Model-Level Compatibility Check
// ---------------------------------------------------------------------------
// Settings not defined in the legacy UIElementSettings.cs represent features non-existent on that model.
// Distinct from the state-dependent 'na' returned by `getSettingConstraint`.
// Used to completely hide settings at the filtering phase in SettingsPanel.
//
// Evaluation criteria (from legacy Database/*/UIElementSettings.cs):
//   HLG_HDR (199)     : V_HlgHDR is Hero13 only.
//   DENOISE (198)     : V_Denoise/TL_Denoise is Hero13 only.
//   AUDIO_TUNING (203): V_AudioTuning is Hero13 only.
//   VIDEO_PROFILE (184): V_VideoProfile is Hero12/13 only.
//   PHOTO_INTERVAL (171): P_Interval is Hero12/13 only.
//   PHOTO_INTERVAL_DURATION (172): P_IntervalDuration is Hero12/13 only.
//   BIT_DEPTH (183)   : V_10Bit is Hero11/Mini11/12/13 only (Hero09/10 do not support 10-bit).
//   ENABLE_BEEP (221) : Hero13-specific beep ON/OFF.
//   BEEP_VOLUME (216) : Hero13-specific beep volume (Hero09-12/Max use BEEPS (87)).
//   BEEPS (87)        : Hero09-12/Max beep volume (Hero13 uses BEEP_VOLUME).
//   CONTROL_MODE (175): Easy/Pro mode switch is Hero11 and later (undefined on Hero09/10).
//   MAX_LENS_MOD_HERO13 (189): Max Lens Mod 2.0 is Hero12/13 only.
//   MAX_LENS_MOD (162): Max Lens Mod is Hero09-12/13 only (not supported on HeroMini11).
// ---------------------------------------------------------------------------

/** Unsupported setting ID -> Set of supported model numbers */
const MODEL_SUPPORTED_SETTINGS: Readonly<Record<number, ReadonlySet<number>>> = {
  // ── 映像プロファイル ──
  [GoProSettingId.HLG_HDR]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO13_BLACK]),
  [GoProSettingId.DENOISE]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO13_BLACK]),
  [GoProSettingId.AUDIO_TUNING]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO13_BLACK]),
  [GoProSettingId.VIDEO_PROFILE]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
    GOPRO_MODEL_NUMBERS.HERO13_BLACK,
  ]),
  [GoProSettingId.PHOTO_INTERVAL]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
    GOPRO_MODEL_NUMBERS.HERO13_BLACK,
  ]),
  [GoProSettingId.PHOTO_INTERVAL_DURATION]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
    GOPRO_MODEL_NUMBERS.HERO13_BLACK,
  ]),
  [GoProSettingId.BIT_DEPTH]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
    GOPRO_MODEL_NUMBERS.HERO13_BLACK,
  ]),
  [GoProSettingId.VIDEO_BITRATE]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
    GOPRO_MODEL_NUMBERS.HERO13_BLACK,
  ]), // Hero12/13 only per OpenGoPro spec (ID:182)
  [GoProSettingId.VIDEO_BITRATE_HERO11]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO09_BLACK,
    GOPRO_MODEL_NUMBERS.HERO10_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI,
  ]), // BLE ID 0x7C=124 (Hero09 は Timelapse Video で使用)
  [GoProSettingId.VIDEO_BITRATE_HERO09]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO09_BLACK,
    GOPRO_MODEL_NUMBERS.HERO10_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI,
  ]), // BLE ID 0xA0=160 (Nightlapse Video 用)
  [GoProSettingId.TEN_BIT_COLOR_HERO11]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO11_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI,
  ]),
  // ── Beep ──
  [GoProSettingId.ENABLE_BEEP]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO13_BLACK]),
  [GoProSettingId.BEEP_VOLUME]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO13_BLACK]),
  [GoProSettingId.BEEPS]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO09_BLACK,
    GOPRO_MODEL_NUMBERS.HERO10_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI,
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
    GOPRO_MODEL_NUMBERS.MAX,
  ]),
  // ── 操作モード ──
  [GoProSettingId.CONTROL_MODE]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO11_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI,
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
    GOPRO_MODEL_NUMBERS.HERO13_BLACK,
  ]),
  [GoProSettingId.SYSTEM_VIDEO_MODE]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO11_BLACK]), // Deprecated in latest firmware on Hero12/13, unsupported on HeroMini11 (verified commented out in legacy app)
  // ── Max Lens Mod ──
  [GoProSettingId.MAX_LENS_MOD_HERO13]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO12_BLACK]), // Integrated into LENS_ATTACHMENT (217) on Hero13
  [GoProSettingId.MAX_LENS_MOD]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO09_BLACK,
    GOPRO_MODEL_NUMBERS.HERO10_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK,
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
    GOPRO_MODEL_NUMBERS.HERO13_BLACK,
  ]),
  [GoProSettingId.MAX_LENS_MOD_ENABLE]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO09_BLACK,
    GOPRO_MODEL_NUMBERS.HERO10_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK,
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
  ]), // Integrated into LensAttachment on Hero13, unsupported on HeroMini11/Max
  // ── 新規追加設定 ──
  [GoProSettingId.VIDEO_PERFORMANCE_MODE]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO10_BLACK]),
  [GoProSettingId.VIDEO_COMPRESSION]: new Set<number>([
    GOPRO_MODEL_NUMBERS.MAX,
    GOPRO_MODEL_NUMBERS.HERO09_BLACK,
    GOPRO_MODEL_NUMBERS.HERO10_BLACK,
  ]),
  [GoProSettingId.MEDIA_MOD]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO09_BLACK,
    GOPRO_MODEL_NUMBERS.HERO10_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK,
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
    GOPRO_MODEL_NUMBERS.HERO13_BLACK,
  ]),
  [GoProSettingId.MEDIA_MOD_MIC]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO09_BLACK,
    GOPRO_MODEL_NUMBERS.HERO10_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK,
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
    GOPRO_MODEL_NUMBERS.HERO13_BLACK,
  ]),
  [GoProSettingId.LENS_ATTACHMENT]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO13_BLACK]),
  [GoProSettingId.VIDEO_LENS_HERO13]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO13_BLACK]),
  [GoProSettingId.PHOTO_LENS_HERO13]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO13_BLACK]),
  [GoProSettingId.FOCUS_PEAKING]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO13_BLACK]),
  [GoProSettingId.QUICK_CAPTURE_DEFAULT]: new Set<number>([GOPRO_MODEL_NUMBERS.MAX]),
  [GoProSettingId.DEFAULT_PRESET_MAX]: new Set<number>([GOPRO_MODEL_NUMBERS.MAX]), // BLE ID 0x7F=127 (4-byte) Max-exclusive value scheme
  // ── Screen Saver (機種別 BLE ID が異なる) ──
  [GoProSettingId.SCREEN_SAVER]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO13_BLACK]), // BLE ID 0xDB=219 Hero13-exclusive
  [GoProSettingId.SCREEN_SAVER_REAR]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO09_BLACK,
    GOPRO_MODEL_NUMBERS.HERO10_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK,
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
  ]), // BLE ID 0x9F=159 Hero09-12-exclusive
  [GoProSettingId.SCREEN_SAVER_MAX]: new Set<number>([GOPRO_MODEL_NUMBERS.MAX]), // BLE ID 0x33=51 Max-exclusive
  // Front screen: Hero09/10/11/12 only (verified in legacy app DB; no registration for Max/HeroMini11)
  [GoProSettingId.SCREEN_SAVER_FRONT]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO09_BLACK,
    GOPRO_MODEL_NUMBERS.HERO10_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK,
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
  ]),
  // ── Voice Language (機種別 BLE ID が異なる) ──
  [GoProSettingId.VOICE_LANGUAGE]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO13_BLACK]), // BLE ID 0xDF=223 (Hero13-exclusive override)
  [GoProSettingId.VOICE_LANGUAGE_LEGACY]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO09_BLACK,
    GOPRO_MODEL_NUMBERS.HERO10_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK,
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI,
    GOPRO_MODEL_NUMBERS.MAX,
  ]), // BLE ID 0x55=85 (base class shared among legacy models)
  // ── Wind Reduction (Model-specific BLE IDs differ) ──
  // Hero13 uses BLE 0xD6=214 (WIND_REDUCTION), others use BLE 0x95=149 (MAX_WIND_REDUCTION)
  [GoProSettingId.WIND_REDUCTION]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO13_BLACK]),
  [GoProSettingId.MAX_WIND_REDUCTION]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO09_BLACK,
    GOPRO_MODEL_NUMBERS.HERO10_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK,
    GOPRO_MODEL_NUMBERS.HERO12_BLACK,
    GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI,
    GOPRO_MODEL_NUMBERS.MAX,
  ]),
};

/**
 * Denylist for settings non-existent on specific models.
 * While MODEL_SUPPORTED_SETTINGS functions as an allowlist,
 * this denylist is used for settings supported by almost all models except specific ones.
 * No need to add new models here upon release (models not listed are assumed supported).
 *
 * Reference: legacy app UISystemSettingRepository.cs:
 *   SYS_QuickCapture / SYS_DefaultPreset are commented out across all HeroMini11 firmware versions.
 *   QuickCapture is fixed as always-ON (no user operation needed).
 *   DefaultPreset is also unsupported, but not excluded here to allow static operations in this app.
 */
const MODEL_UNSUPPORTED_SETTINGS: Readonly<Record<number, ReadonlySet<number>>> = {
  // QuickCapture は HeroMini11 では常時ON固定のため設定項目自体が存在しない
  [GoProSettingId.QUICK_CAPTURE]: new Set<number>([GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI]),
  // DefaultPreset (0xA1) is an undocumented OpenGoPro ID. HeroMini11 rejects writes (code=0x02). Max uses 0x7F (DEFAULT_PRESET_MAX)
  [GoProSettingId.DEFAULT_PRESET]: new Set<number>([
    GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI,
    GOPRO_MODEL_NUMBERS.MAX,
  ]),
};

/**
 * Returns whether the setting ID is supported by the specified camera model.
 * If returning `false`, SettingsPanel must completely hide that row.
 * Returns `true` for setting IDs with no model constraints (supported by all models).
 */
export function isSettingModelSupported(
  settingId: number,
  cameraModel: CameraModelKey | null,
): boolean {
  if (cameraModel === null) return true; // 未接続時は隠さない
  const modelNo = resolveModelNoFromCameraModelKey(cameraModel);
  if (modelNo === null) return true;

  // denylist: 特定機種で明示的に非対応とされている設定
  if (MODEL_UNSUPPORTED_SETTINGS[settingId]?.has(modelNo)) return false;
  // allowlist: 対応機種が限定されている設定
  const supported = MODEL_SUPPORTED_SETTINGS[settingId];
  if (supported === undefined) return true; // 全モデル共通設定
  return supported.has(modelNo);
}

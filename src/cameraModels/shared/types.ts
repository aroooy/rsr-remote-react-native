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

import type { GoProPreset } from '../../ble/PresetProtobuf';
import type { GoProPresetGroupData } from '../../ble/PresetProtobuf';
import type { CameraModelKey } from './modelManifest';

export type AspectRatio = '16:9' | '4:3' | '8:7' | '9:16';

export type ResolutionFamily = '5.3K' | '5K' | '4K' | '2.7K' | '1080' | '1440' | '720' | 'other';

export interface ResolutionEntry {
  label: string;
  aspect: AspectRatio;
  family: ResolutionFamily;
}

export type ModelResolverMap<T> = Partial<Record<number, T>>;

export type SettingsSnapshot = Record<number, number | undefined>;

export type CapabilitiesSnapshot = Record<number, readonly number[] | undefined>;

export type FilterSelectableValuesParams = {
  settingId: number;
  selectableValues: readonly number[];
  settings: SettingsSnapshot;
  pendingSettings: SettingsSnapshot;
  cameraModel: CameraModelKey;
  currentGroupId: number | undefined;
  currentPresetId: number | undefined;
  isLoopingPresetActive: boolean;
  hero12EasyLensValues?: readonly number[];
  isHero12MaxVideo2Preset: boolean;
  isHero12Or13MaxVideoPreset: boolean;
};

export type SelectableValuesResolver = (params: FilterSelectableValuesParams) => number[];

export type ResolveCurrentGroupPresetsParams = {
  presets: GoProPresetGroupData[];
  currentGroupId: number | undefined;
  cameraModel: CameraModelKey;
};

export type CurrentGroupPresetsResolver = (
  params: ResolveCurrentGroupPresetsParams,
) => GoProPreset[];

export type ConstraintState = 'ok' | 'disabled' | 'na';

export type SettingConstraintParams = {
  settingId: number;
  settings: SettingsSnapshot;
  cameraModel: CameraModelKey | null;
};

export type SettingConstraintResolver = (params: SettingConstraintParams) => ConstraintState;

export type SettingModelSupportParams = {
  settingId: number;
  cameraModel: CameraModelKey | null;
};

export type SettingModelSupportResolver = (params: SettingModelSupportParams) => boolean;

export type ForceQuickVisibilityParams = {
  settingId: number;
  settings: SettingsSnapshot;
  pendingSettings: SettingsSnapshot;
  cameraModel: CameraModelKey;
  currentGroupId: number | undefined;
  currentPresetId: number | undefined;
  isEasyVideoActive: boolean;
  isHero11EasyPhotoActive: boolean;
  isHero11EasyTimelapseActive: boolean;
  isHero12Or13MaxVideoPreset: boolean;
  isTimelapsePhotoActive: boolean;
  forceVisibleStaticFallbackIds: ReadonlySet<number>;
};

export type ForceQuickVisibilityResolver = (
  params: ForceQuickVisibilityParams,
) => boolean | undefined;

export type FilterPrimaryItemValuesParams = {
  settingId: number;
  allowedValues: readonly number[];
  settings: SettingsSnapshot;
  pendingSettings: SettingsSnapshot;
  cameraModel: CameraModelKey;
  currentPresetId: number | undefined;
  currentValue: number | undefined;
};

export type PrimaryItemValuesResolver = (params: FilterPrimaryItemValuesParams) => number[];

export type FramingSelectorOption = {
  key: string;
  label: string;
  ratio: [number, number];
  isActive: boolean;
  isAvailable: boolean;
  settingId: number;
  targetValue: number | null;
};

export type ResolveFramingSelectorParams = {
  settings: SettingsSnapshot;
  capabilities: CapabilitiesSnapshot;
  cameraModel: CameraModelKey;
  currentGroupId: number | undefined;
  currentPresetId: number | undefined;
  isTimelapseContextActive: boolean;
  isHero13BurstSloMoActive: boolean;
  isHero12MaxVideo2Preset: boolean;
  isHero12MaxTimewarp2Preset: boolean;
  isHero12Trail2Preset: boolean;
};

export type FramingSelectorResolverParams = ResolveFramingSelectorParams & {
  isVideoGroup: boolean;
  isTimelapseVideo: boolean;
  isTimelapseVideoLike: boolean;
  isTrailLike: boolean;
  isTimewarpLike: boolean;
};

export type FramingSelectorResolver = (
  params: FramingSelectorResolverParams,
) => FramingSelectorOption[] | null;

export type OtherItemKind =
  'na' | 'scheduledCapture' | 'slider' | 'toggleButton' | 'bool' | 'default';

export type ResolveOtherItemStateParams = {
  settingId: number;
  settings: SettingsSnapshot;
  capabilities: CapabilitiesSnapshot;
  cameraModel: CameraModelKey;
  allowedValues: readonly number[];
  dashboardSubSettingIds: readonly number[];
};

export type OtherItemState = {
  kind: OtherItemKind;
  constraint: ConstraintState;
  isCapabilityDisabled: boolean;
  isEffectivelyDisabled: boolean;
};

export type OtherItemResolver = (params: ResolveOtherItemStateParams) => OtherItemState | undefined;

export type SpecialRowPlacement = 'beforePrimary' | 'afterPrimary';

export type SpecialRowAction =
  | { type: 'setSetting'; settingId: number; value: number }
  | { type: 'loadPreset'; presetId: number };

export type SpecialRowOption = {
  key: string;
  label: string;
  isSelected: boolean;
  actions: readonly SpecialRowAction[];
};

export type SpecialRow = {
  key: string;
  label: string;
  placement: SpecialRowPlacement;
  options: readonly SpecialRowOption[];
};

export type ResolveSpecialRowsParams = {
  settings: SettingsSnapshot;
  pendingSettings: SettingsSnapshot;
  cameraModel: CameraModelKey;
  currentGroupId: number | undefined;
  currentPresetId: number | undefined;
  firmwareVersion: string | null;
};

export type SpecialRowsResolver = (params: ResolveSpecialRowsParams) => SpecialRow[];

export type SpecialRowsProjection = {
  visibleRowKeys: readonly string[];
};

export type ResolveSpecialRowsProjectionParams = {
  settings: SettingsSnapshot;
  cameraModel: CameraModelKey;
  currentGroupId: number | undefined;
  currentPresetId: number | undefined;
};

export type SpecialRowsProjectionResolver = (
  params: ResolveSpecialRowsProjectionParams,
) => SpecialRowsProjection;

export type Hero12EasyFramingValue = 0 | 1 | 2;

export type Hero12EasySpeedOption = {
  key: string;
  label50: string;
  label60: string;
  resolutionNew: number;
  resolutionLegacy: number;
  fps50: number;
  fps60: number;
};

export type Hero12EasyPresetConfig = {
  lensValues: readonly number[];
  framingOptions: ReadonlyArray<{ key: string; label: string; value: Hero12EasyFramingValue }>;
  speedOptions: Partial<Record<Hero12EasyFramingValue, readonly Hero12EasySpeedOption[]>>;
};

export type DisplayLayoutShape = {
  quickSettingIds: readonly number[];
  prioritizedAdvancedSettingIds: readonly number[];
  defaultVisibleAdvancedSettingIds: readonly number[];
};

export type ComposeDisplayLayout = (
  presetLayout: DisplayLayoutShape,
  cameraAdvancedSettingIds: readonly number[],
) => DisplayLayoutShape;

export type ResolveModelDisplayLayoutParams = {
  settings: Record<number, number>;
  cameraModel: CameraModelKey;
  currentGroupId: number | undefined;
  currentPresetId: number | undefined;
  presetGroups: {
    video: number;
    photo: number;
    timelapse: number;
  };
  composeDisplayLayout: ComposeDisplayLayout;
  getCameraAdvancedSettingIds: (cameraModel: CameraModelKey) => readonly number[];
  getTimelapseLayout: (
    settings: Record<number, number>,
    cameraModel: CameraModelKey,
  ) => DisplayLayoutShape;
  isTimelapseLikePreset: (presetId: number | undefined) => boolean;
  easyVideoPresets: ReadonlySet<number>;
  hero11EasyPhotoPresets: ReadonlySet<number>;
  hero11EasyTimelapsePresets: ReadonlySet<number>;
  easyPhotoPresetIds: ReadonlySet<number>;
  easyTimelapsePresetIds: ReadonlySet<number>;
  layouts: {
    legacyEasyVideo: DisplayLayoutShape;
    hero11EasyVideo: DisplayLayoutShape;
    hero12EasyQualityVideo: DisplayLayoutShape;
    hero11EasyPhoto: DisplayLayoutShape;
    hero11EasyTimelapse: DisplayLayoutShape;
    easyPhotoTimelapse: DisplayLayoutShape;
    maxCameraStandardVideo: DisplayLayoutShape;
    maxCamera360Video: DisplayLayoutShape;
  };
};

export type ModelDisplayLayoutResolver = (
  params: ResolveModelDisplayLayoutParams,
) => DisplayLayoutShape | undefined;

export type ResolveVideoLayoutParams = {
  settings: Record<number, number>;
  cameraModel: CameraModelKey;
  currentPresetId: number | undefined;
  activePreset?: GoProPreset;
  composeDisplayLayout: ComposeDisplayLayout;
  getCameraAdvancedSettingIds: (cameraModel: CameraModelKey) => readonly number[];
  layouts: {
    maxVideoHero09: DisplayLayoutShape;
    maxVideoHero11: DisplayLayoutShape;
    hero13MaxLens25Video: DisplayLayoutShape;
    hero13BurstSloMo: DisplayLayoutShape;
  };
  presetIds: {
    maxVideoLegacy: number;
    maxVideo20: number;
    activity: number;
  };
  maxLensModEnableSettingId: number;
  lensAttachmentSettingId: number;
  hero13Lens25AttachmentValue: number;
  ids: {
    loopingInterval: number;
    scheduledCapture: number;
    captureDelay: number;
    fps: number;
    videoLens: number;
    hyperSmooth: number;
  };
};

export type VideoLayoutResolver = (
  params: ResolveVideoLayoutParams,
) => DisplayLayoutShape | undefined;

export type PhotoLayoutState = {
  lensSettingId: number;
  hasLens: boolean;
  hasHorizontalLock: boolean;
  ssIsoIds: readonly number[];
  hasEvComp: boolean;
  liveBurstAdvancedIds: readonly number[];
};

export type ResolvePhotoLayoutParams = {
  cameraModel: CameraModelKey;
  activePreset: number | undefined;
  isBurstLike: boolean;
  isNightPhoto: boolean;
  isLiveBurst: boolean;
  ids: {
    timeLapseLens: number;
    multiShotLens: number;
    videoLens: number;
    photoLens: number;
    photoShutter: number;
    nightPhotoShutter: number;
    photoIsoMin: number;
    photoIsoMax: number;
    multiShotIsoMin: number;
    multiShotIsoMax: number;
    videoShutter: number;
    videoIsoMin: number;
    videoIsoMax: number;
    maxWindReduction: number;
    windReduction: number;
    rawAudio: number;
  };
  presetIds: {
    standardPhoto: number;
    liveBurst: number;
    max360Photo: number;
  };
  horizontalLockPhotoPresets: ReadonlySet<number>;
};

export type PhotoLayoutStateResolver = (
  params: ResolvePhotoLayoutParams,
) => Partial<PhotoLayoutState> | undefined;

export type TimelapseLayoutCategory = 'lapse_with_photo' | 'trail_like' | 'timewarp_like';

export type TimelapseLayoutState = {
  videoModeLensId: number;
  quickPhotoIds: readonly number[];
  quickTimewarpIds: readonly number[];
  lapsePhotoOutputIds: readonly number[];
  includeSpeedRamp: boolean;
  horizontalLevelingIds: readonly number[];
  lapseBitRateIds: readonly number[];
  windReductionSettingId: number;
  omitDuration: boolean;
};

export type ResolveTimelapseLayoutParams = {
  cameraModel: CameraModelKey;
  activePreset: number | undefined;
  category: TimelapseLayoutCategory;
  isPhotoFormat: boolean;
  isVideoFormat: boolean;
  isNightlapse: boolean;
  lensAttachment: number | undefined;
  ids: {
    videoLens: number;
    videoLensHero13: number;
    timeLapseLens: number;
    resolution: number;
    fps: number;
    timelapsePhotoOutput: number;
    horizontalLeveling: number;
    videoBitrate: number;
    videoBitrateHero11: number;
    videoBitrateHero09: number;
    windReduction: number;
    maxWindReduction: number;
  };
  horizontalLevelingTimelapsePresets: ReadonlySet<number>;
  hero13MaxTrail2Presets: ReadonlySet<number>;
  hero13MaxLensAttachmentValues: readonly number[];
};

export type TimelapseLayoutStateResolver = (
  params: ResolveTimelapseLayoutParams,
) => Partial<TimelapseLayoutState> | undefined;

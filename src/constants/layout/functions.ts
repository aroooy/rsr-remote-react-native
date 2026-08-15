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
import { CameraModelKey } from '../ResolutionAspectMap';
import { GoProPresetGroup } from '../GoProPresetGroup';
import {
  EASY_ANAMORPHIC_NIGHT_PHOTO_PRESET_HERO13,
  EASY_ANAMORPHIC_TIMEWARP_PRESET_HERO13,
  EASY_MACRO_TIMELAPSE_PRESET_HERO13,
  EASY_MACRO_NIGHTLAPSE_PRESET_HERO13,
} from '../hero13PresetIds';
import {
  PRESET_ANAMORPHIC_NIGHT_PHOTO,
  PRESET_ANAMORPHIC_TIMEWARP,
  PRESET_BURST,
  PRESET_EASY_HIGHEST_QUALITY,
  PRESET_EASY_MAX_PHOTO,
  PRESET_EASY_MAX_PHOTO_1,
  PRESET_EASY_MAX_TIMEWARP,
  PRESET_EASY_STANDARD_QUALITY,
  PRESET_LEGACY_EASY_BURST_PHOTO,
  PRESET_LIGHT_PAINTING,
  PRESET_LIVE_BURST,
  PRESET_MACRO_NIGHTLAPSE,
  PRESET_MACRO_NIGHT_PHOTO,
  PRESET_MACRO_PHOTO,
  PRESET_MACRO_TIMELAPSE,
  PRESET_MAX_PHOTO,
  PRESET_MAX_PHOTO_2,
  PRESET_MAX_STAR_TRAILS_2,
  PRESET_MAX_TIMEWARP,
  PRESET_MAX_TIMEWARP_2,
  PRESET_MAX_VEHICLE_LIGHTS_2,
  PRESET_MAX_VIDEO,
  PRESET_NIGHTLAPSE,
  PRESET_NIGHT_PHOTO,
  PRESET_PHOTO,
  PRESET_STAR_TRAILS,
  PRESET_TIMELAPSE,
  PRESET_VEHICLE_LIGHTS,
} from '../presetIds';
import { resolveModelDisplayLayout } from '../displayLayoutResolver';
import { resolvePhotoLayoutState } from '../photoLayoutState';
import { resolveBaseDisplayPresetId } from '../../cameraModels/shared/displayPreset';
import { resolveSpecialRowsProjection } from '../../cameraModels/shared/specialRowsProjection';
import { resolveTimelapseLayoutState } from '../timelapseLayoutState';
import { resolveVideoLayout } from '../videoLayoutResolver';
import { resolveModelNoFromCameraModelKey } from '../../cameraModels/shared/modelNumber';
import {
  isHero11Model,
  isHero11MiniModel,
  isHero12Model,
  isHero13Model,
} from '../../cameraModels/shared/modelNoHelpers';
import type { GoProPreset, GoProPresetGroupData } from '../../ble/PresetProtobuf';
import {
  BURST_LIKE_PHOTO_PRESETS,
  classifyTimelapsePreset,
  EASY_VIDEO_PRESETS,
  GoProVideoPreset,
  isTimelapseLikePreset,
  LAPSE_WITH_PHOTO_PRESETS,
  layoutData,
  HERO11_EASY_PHOTO_PRESETS,
  HERO11_EASY_TIMELAPSE_PRESETS,
} from './constants';
import type {
  GoProCapabilityCacheKeyProjection,
  GoProDisplayLayout,
  GoProDisplaySettingPlan,
  GoProLayoutExternalControls,
  SettingsMap,
} from './types';
import { composeDisplayLayout, findActivePreset } from './types';

const {
  STANDARD_VIDEO_LAYOUT,
  MAX_VIDEO_LAYOUT,
  HERO13_MAX_LENS25_VIDEO_LAYOUT,
  MAX_VIDEO_HERO09_LAYOUT,
  MAX_VIDEO_HERO11_LAYOUT,
  MACRO_VIDEO_LAYOUT,
  HERO13_BURST_SLOMO_LAYOUT,
  EASY_VIDEO_LAYOUT,
  LEGACY_EASY_VIDEO_LAYOUT,
  HERO11_EASY_VIDEO_LAYOUT,
  HERO12_EASY_QUALITY_VIDEO_LAYOUT,
  HERO11_EASY_PHOTO_LAYOUT,
  HERO11_EASY_TIMELAPSE_LAYOUT,
  EASY_PHOTO_TIMELAPSE_LAYOUT,
  MAX_CAMERA_STANDARD_VIDEO_LAYOUT,
  MAX_CAMERA_360_VIDEO_LAYOUT,
  FALLBACK_LAYOUT,
  getCameraAdvancedSettingIds,
} = layoutData;

// ── Private Preset Sets ──────────────────────────────────────────────────────────

const MAX_PHOTO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_MAX_PHOTO_2,
  PRESET_MAX_PHOTO,
]);

const HORIZONTAL_LOCK_PHOTO_PRESETS: ReadonlySet<number> = new Set([
  PRESET_MAX_PHOTO_2,
  PRESET_MAX_PHOTO,
  PRESET_EASY_MAX_PHOTO_1,
  PRESET_EASY_MAX_PHOTO,
]);

const HORIZONTAL_LEVELING_TIMELAPSE_PRESETS: ReadonlySet<number> = new Set([
  PRESET_MAX_TIMEWARP_2,
  PRESET_EASY_MAX_TIMEWARP,
  PRESET_MAX_TIMEWARP,
]);

const EASY_PHOTO_PRESET_IDS: ReadonlySet<number> = new Set([
  PRESET_LEGACY_EASY_BURST_PHOTO,
  PRESET_EASY_MAX_PHOTO,
  EASY_ANAMORPHIC_NIGHT_PHOTO_PRESET_HERO13,
]);

const EASY_TIMELAPSE_PRESET_IDS: ReadonlySet<number> = new Set([
  PRESET_EASY_MAX_TIMEWARP,
  EASY_ANAMORPHIC_TIMEWARP_PRESET_HERO13,
  EASY_MACRO_TIMELAPSE_PRESET_HERO13,
]);

const FOCUS_PEAKING_TIMELAPSE_PRESETS: ReadonlySet<number> = new Set([
  PRESET_MACRO_TIMELAPSE,
  PRESET_MACRO_NIGHTLAPSE,
]);

const NIGHTLAPSE_PRESETS: ReadonlySet<number> = new Set([
  PRESET_NIGHTLAPSE,
  PRESET_MACRO_NIGHTLAPSE,
  EASY_MACRO_NIGHTLAPSE_PRESET_HERO13,
]);

const STAR_TRAILS_PRESETS: ReadonlySet<number> = new Set([
  PRESET_STAR_TRAILS,
  PRESET_MAX_STAR_TRAILS_2,
]);

const LIGHT_PAINTING_PRESETS: ReadonlySet<number> = new Set([
  PRESET_LIGHT_PAINTING,
  PRESET_MAX_STAR_TRAILS_2,
]);

const VEHICLE_LIGHTS_PRESETS: ReadonlySet<number> = new Set([
  PRESET_VEHICLE_LIGHTS,
  PRESET_MAX_VEHICLE_LIGHTS_2,
]);

const HERO13_MAX_TRAIL2_PRESETS: ReadonlySet<number> = new Set([
  PRESET_MAX_STAR_TRAILS_2,
  PRESET_MAX_VEHICLE_LIGHTS_2,
]);

const HERO13_ANAMORPHIC_NIGHT_PHOTO_PRESET = PRESET_ANAMORPHIC_NIGHT_PHOTO;
const HERO13_ANAMORPHIC_TIMEWARP_PRESET = PRESET_ANAMORPHIC_TIMEWARP;

const DEFAULT_CAPABILITY_PREFETCH_SETTING_IDS: readonly number[] = [
  GoProSettingId.VIDEO_BITRATE_HERO11,
  GoProSettingId.VIDEO_BITRATE_HERO09,
  GoProSettingId.VIDEO_DURATION,
  GoProSettingId.MULTI_SHOT_DURATION,
  GoProSettingId.HYPERSMOOTH_MAX,
];

// ── getVideoLayout ───────────────────────────────────────────────────────────────

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
    case PRESET_MAX_VIDEO:
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

// ── getPhotoLayout ───────────────────────────────────────────────────────────────

const getPhotoLayout = (settings: SettingsMap, cameraModel: CameraModelKey): GoProDisplayLayout => {
  const activePreset = settings[GoProSettingId.MODE_PRESET];
  const isStandardPhoto = activePreset === PRESET_PHOTO;
  const isBurstLike = activePreset !== undefined && BURST_LIKE_PHOTO_PRESETS.has(activePreset);
  const isMacroPhoto = activePreset === PRESET_MACRO_PHOTO;
  const isMacroNightPhoto = activePreset === PRESET_MACRO_NIGHT_PHOTO;
  const isAnamorphicNightPhoto = activePreset === HERO13_ANAMORPHIC_NIGHT_PHOTO_PRESET;
  const isMacroPhotoFamily = isMacroPhoto || isMacroNightPhoto;
  const isNightPhoto =
    activePreset === PRESET_NIGHT_PHOTO || isMacroNightPhoto || isAnamorphicNightPhoto;
  const isLiveBurst = activePreset === PRESET_LIVE_BURST;
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

  const hasPhotoOutput = !isMaxPhoto;
  const photoOutputId = isBurstLike
    ? GoProSettingId.TIMELAPSE_PHOTO_OUTPUT
    : GoProSettingId.PHOTO_OUTPUT;

  const hasInterval = isStandardPhoto || isMacroPhoto;
  const intervalAdvancedIds: number[] = hasInterval
    ? [GoProSettingId.PHOTO_INTERVAL, GoProSettingId.PHOTO_INTERVAL_DURATION]
    : [];

  const advancedCommon: number[] = [
    GoProSettingId.WB,
    GoProSettingId.SHARPNESS,
    GoProSettingId.COLOR,
    GoProSettingId.DENOISE,
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

// ── getTimelapseLayout ───────────────────────────────────────────────────────────

const getTimelapseLayout = (
  settings: SettingsMap,
  cameraModel: CameraModelKey,
): GoProDisplayLayout => {
  const currentFormat = settings[GoProSettingId.MEDIA_FORMAT];
  const activePreset = settings[GoProSettingId.MODE_PRESET];
  const category = classifyTimelapsePreset(activePreset);

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

  const quickSettingIds: number[] = [];
  if (category === 'lapse_with_photo') {
    if (isVideoFormat) {
      quickSettingIds.push(GoProSettingId.RESOLUTION, GoProSettingId.FPS, videoModeLensId);
    } else {
      quickSettingIds.push(...quickPhotoIds);
    }
  } else if (category === 'trail_like') {
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

  const lapseIntervalIds: number[] = [];
  if (category === 'lapse_with_photo') {
    if (isNightlapse) {
      lapseIntervalIds.push(GoProSettingId.NIGHTLAPSE_RATE);
    } else if (isVideoFormat) {
      lapseIntervalIds.push(GoProSettingId.VIDEO_TIMELAPSE_RATE);
    } else {
      lapseIntervalIds.push(GoProSettingId.PHOTO_TIMELAPSE_RATE);
    }
  }

  let lapseSsIsoIds: number[] = [];
  if (category === 'lapse_with_photo') {
    if (isNightlapse) {
      lapseSsIsoIds = [
        GoProSettingId.NIGHTLAPSE_PHOTO_SHUTTER,
        GoProSettingId.MULTI_SHOT_ISO_MIN,
        GoProSettingId.MULTI_SHOT_ISO_MAX,
      ];
    } else if (isVideoFormat) {
      lapseSsIsoIds = [GoProSettingId.VIDEO_ISO_MIN, GoProSettingId.VIDEO_ISO_MAX];
    } else {
      lapseSsIsoIds = [GoProSettingId.MULTI_SHOT_ISO_MIN, GoProSettingId.MULTI_SHOT_ISO_MAX];
    }
  } else if (category === 'trail_like') {
    let trailShutterId: number;
    if (activePreset !== undefined && STAR_TRAILS_PRESETS.has(activePreset)) {
      trailShutterId = GoProSettingId.STAR_TRAIL_SHUTTER;
    } else if (activePreset !== undefined && LIGHT_PAINTING_PRESETS.has(activePreset)) {
      trailShutterId = GoProSettingId.LIGHT_PAINTING_SHUTTER;
    } else {
      trailShutterId = GoProSettingId.VEHICLE_LIGHTS_SHUTTER;
    }
    lapseSsIsoIds = [
      trailShutterId,
      GoProSettingId.MULTI_SHOT_ISO_MIN,
      GoProSettingId.MULTI_SHOT_ISO_MAX,
    ];
  } else {
    lapseSsIsoIds = [GoProSettingId.VIDEO_ISO_MIN, GoProSettingId.VIDEO_ISO_MAX];
  }

  const timewarpSpeedIds: number[] = [];
  if (category === 'timewarp_like') {
    timewarpSpeedIds.push(GoProSettingId.TIMEWARP_SPEED);
    if (includeSpeedRamp) {
      timewarpSpeedIds.push(GoProSettingId.SPEED_RAMP);
    }
  }
  quickSettingIds.push(...horizontalLevelingIds);

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

// ── getDisplayLayout ─────────────────────────────────────────────────────────────

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

// ── isDefaultVisibleAdvancedSetting ──────────────────────────────────────────────

export const isDefaultVisibleAdvancedSetting = (
  settings: SettingsMap,
  settingId: number,
  cameraModel: CameraModelKey,
  presets?: readonly GoProPresetGroupData[],
): boolean => {
  const layout = getDisplayLayout(settings, cameraModel, presets);
  return layout.defaultVisibleAdvancedSettingIds.includes(settingId);
};

// ── getLayoutExternalControls ────────────────────────────────────────────────────

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
    !isHero11MiniModel(modelNo) &&
    currentPresetId !== EASY_MACRO_TIMELAPSE_PRESET_HERO13;

  const hasHero12EasyVideoPreset =
    isHero12Model(modelNo) &&
    currentGroupId === GoProPresetGroup.VIDEO &&
    currentPresetId !== undefined &&
    new Set<number>([
      PRESET_EASY_HIGHEST_QUALITY,
      PRESET_EASY_STANDARD_QUALITY,
    ]).has(currentPresetId);

  const supportsFramingSelector =
    isHero11Model(modelNo) ||
    isHero11MiniModel(modelNo) ||
    isHero12Model(modelNo) ||
    isHero13Model(modelNo);

  return {
    showsMediaFormatPrimary: shouldExposeMediaFormat,
    showsFramingSelector:
      supportsFramingSelector &&
      (currentGroupId === GoProPresetGroup.VIDEO ||
        (currentGroupId === GoProPresetGroup.TIMELAPSE && category !== null && !isTimelapsePhoto)),
    showsResolutionSelector:
      currentGroupId === GoProPresetGroup.VIDEO &&
      !displayLayout.quickSettingIds.includes(GoProSettingId.RESOLUTION) &&
      !(isHero13Model(modelNo) && currentPresetId === GoProVideoPreset.ACTIVITY) &&
      !(
        isHero11Model(modelNo) &&
        currentPresetId !== undefined &&
        EASY_VIDEO_PRESETS.has(currentPresetId)
      ) &&
      !hasHero12EasyVideoPreset,
  };
};

// ── getCapabilityCacheKeyProjection ──────────────────────────────────────────────

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

// ── getDisplaySettingPlan ────────────────────────────────────────────────────────

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

// ── getCapabilityDependencyRefreshIds ────────────────────────────────────────────

import { CAPABILITY_REFRESH_DEPENDENCIES } from '../capabilityDependencies/refreshTriggers';

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

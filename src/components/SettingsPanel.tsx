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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Pressable,
  Dimensions,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGoProStore, useCurrentModelNo, useActiveCameraState, useCameraModel } from '../store/GoProStore';
import { useShallow } from 'zustand/react/shallow';
import {
  getHardwareFeatures,
  getHardwareFeaturesByModelNo,
} from '../constants/hardwareFeatureFlags';
import { getThemeColors } from '../constants/Theme';
import {
  getSettingName,
  getSettingValueName,
  getSettingValueNameForModelWithContext,
  getOrderedSettingValues,
  GOPRO_SETTINGS_METADATA,
  getBoolValues,
  normalizeSettingValueForComparison,
  areSettingValuesEquivalent,
  dedupeEquivalentSettingValues,
} from '../constants/GoProMetadata';
import { SliderSettingRow } from './SliderSettingRow';
import { GoProSettingId } from '../constants/GoProSettingId';
import { GoProPresetGroup, GoProPresetGroupSelectId } from '../constants/GoProPresetGroup';
import { CAMERA_ADVANCED_SETTING_IDS, DASHBOARD_SUB_SETTING_IDS } from '../constants/capabilityDependencies';
import {
  MODE_AND_PROFILE_SETTING_IDS,
  getDisplaySettingPlan,
  fallbackPresetsByModel,
  isDefaultVisibleAdvancedSetting,
  GoProVideoPreset,
  LAPSE_WITH_PHOTO_PRESETS,
  classifyTimelapsePreset,
  isTimelapseLikePreset,
  EASY_VIDEO_PRESETS,
  HERO12_NO_ASPECT_EASY_VIDEO_PRESETS,
  MACRO_VIDEO_PRESET_HERO13,
  HERO13_EASY_MAXLENS2_PRESET_IDS,
  BURST_LIKE_PHOTO_PRESETS,
  HERO11_EASY_PHOTO_PRESETS,
  HERO11_EASY_TIMELAPSE_PRESETS,
  HERO11_LB_VIDEO_PRESETS,
  HERO11_NO_87_VIDEO_PRESETS,
} from '../constants/layout';
import { getPresetDisplayName } from '../constants/GoProMetadata';
import { goProBle } from '../ble/GoProBLEManager';
import { debugWarn } from '../utils/debugLogging';
import { PreviewPlayer } from './PreviewPlayer';
import { Ionicons } from '@expo/vector-icons';
import { AspectRatioIcon } from './AspectRatioIcon';
import { getPresetIoniconName } from '../constants/PresetIconMap';
import { getResolutionLabel } from '../constants/ResolutionAspectMap';
import { resolveFramingSelector } from './settingsPanel/framingSelector';
import { resolveCurrentGroupPresets } from './settingsPanel/currentGroupPresets';
import { isForcedQuickSettingVisible } from './settingsPanel/forcedQuickVisibility';
import { filterPrimaryItemValues } from './settingsPanel/primaryItemValues';
import { resolveResolutionSelector } from './settingsPanel/resolutionSelector';
import { resolveSpecialRows } from './settingsPanel/specialRows';
import { filterSelectableValues } from './settingsPanel/selectableValues';
import { resolveBaseDisplayPresetId } from '../cameraModels/shared/displayPreset';
import { isLoopingPreset } from '../cameraModels/shared/loopingPresetLayout';
import {
  getSettingVisibilityMap,
  initSettingVisibilityTable,
  setSettingVisible,
} from '../device/SettingVisibilityRepository';
import { getProductIdForModel, getProductDisplayName, IAPProductId } from '../iap/IAPProducts';
import { purchaseProduct } from '../iap/IAPManager';
import { isSettingModelSupported } from '../constants/settingConstraints';
import { selectIsShootingLocked, selectHindsightActive } from '../store/GoProSelectors';
import { resolveOtherItemState } from './settingsPanel/otherItemState';
import { getHero12EasyPresetConfig } from '../cameraModels/hero12/specialRows';
import type { SpecialRow, SpecialRowAction } from '../cameraModels/shared/types';
import {
  isHero13Model,
  isHero12Model,
  isHero12Or13Model,
  isMaxModel,
  isHero11FamilyModel,
  isHero11MiniModel,
} from '../cameraModels/shared/modelNoHelpers';
import { HERO13_EASY_MACRO_NIGHTLAPSE_PRESET } from '../constants/hero13PresetIds';
import { useTranslation } from 'react-i18next';
import {
  MAX_TRAIL_2_PRESET_IDS,
  PRESET_MACRO_NIGHTLAPSE,
  PRESET_MAX_TIMEWARP_2,
  PRESET_MAX_VIDEO,
  PRESET_NIGHTLAPSE,
} from '../constants/presetIds';
import { TimePickerModal } from './settingsPanel/TimePickerModal';
import { usePresetRename } from './settingsPanel/usePresetRename';
import { PresetRenameModal } from './settingsPanel/PresetRenameModal';
import { VisibilityControlModal } from './settingsPanel/VisibilityControlModal';
import { PresetGroupGrid } from './settingsPanel/PresetGroupGrid';
import { PrimarySettingRow } from './settingsPanel/PrimarySettingRow';
import { SpecialRowView } from './settingsPanel/SpecialRowView';
import { SettingOptionModal } from './settingsPanel/SettingOptionModal';
import { OtherSettingRow } from './settingsPanel/OtherSettingRow';
import { haptics } from '../utils/haptics';

export const SettingsPanel = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const CAPABILITY_REQUEST_THROTTLE_MS = 1500;
  const capabilities = useActiveCameraState(useShallow((cs) => cs.capabilities));
  const settings = useActiveCameraState(useShallow((cs) => cs.settings));
  const pendingSettings = useActiveCameraState(useShallow((cs) => cs.pendingSettings));
  const isApplyingCustomPreset = useActiveCameraState((cs) => cs.isApplyingCustomPreset);
  const isRefreshing = useActiveCameraState((cs) => cs.isRefreshingCapabilities);
  const isEncoding = useActiveCameraState((cs) => cs.isEncoding);
  const captureDelayActive = useActiveCameraState((cs) => cs.captureDelayActive);
  const recordingTimeSec = useActiveCameraState((cs) => cs.recordingTimeSec);
  const shootingLocked = useActiveCameraState(selectIsShootingLocked);
  const hindsightActive = useActiveCameraState(selectHindsightActive);
  const presets = useActiveCameraState((cs) => cs.presets);
  const cameraModel = useCameraModel();
  const currentModelNo = useCurrentModelNo();
  const connectedDeviceId = useGoProStore((state) => state.connectedDeviceId);
  const scheduledTime = useActiveCameraState((cs) => cs.scheduledTime);
  const columnCount = useGoProStore((state) => state.columnCount);
  const showPreviewModal = useActiveCameraState((cs) => cs.showPreviewModal);
  const isVisibilityModalVisible = useActiveCameraState((cs) => cs.showVisibilityModal);
  const setShowPreviewModal = useGoProStore((state) => state.setShowPreviewModal);
  const setIsVisibilityModalVisible = useGoProStore((state) => state.setShowVisibilityModal);
  const purchasedProducts = useGoProStore((state) => state.purchasedProducts);
  const hardwareInfo = useActiveCameraState((cs) => cs.hardwareInfo);
  const mediaModMicStatus = useActiveCameraState((cs) => cs.mediaModMicStatus);
  const mediaModStatus = useActiveCameraState((cs) => cs.mediaModStatus);
  const { width: windowWidth } = useWindowDimensions();
  const [selectedSettingId, setSelectedSettingId] = useState<number | null>(null);
  const [visibilityMap, setVisibilityMap] = useState<Record<number, boolean>>({});
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  // Fold state of Dashboard Controls (independent of Switch ON/OFF status)
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);
  const requestedCapabilityIdsRef = useRef<Map<number, number>>(new Map());
  // (Moved further down to use displaySettings)
  const theme = useGoProStore((state) => state.theme);
  const colors = useMemo(() => getThemeColors(theme), [theme]);

  // Pulse the shutter inner shape while recording for an at-a-glance "REC" cue.
  const shutterPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isEncoding) {
      shutterPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shutterPulse, { toValue: 0.4, duration: 650, useNativeDriver: true }),
        Animated.timing(shutterPulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isEncoding, shutterPulse]);
  const currentProductId = useMemo(
    () => getProductIdForModel(hardwareInfo?.modelName),
    [hardwareInfo],
  );
  const isPurchased = useMemo(
    () => (currentProductId ? purchasedProducts.includes(currentProductId) : false),
    [currentProductId, purchasedProducts],
  );
  const firmwareVersion = hardwareInfo?.firmwareVersion ?? null;
  const presetScrollRef = useRef<ScrollView>(null);
  const chipOffsetsRef = useRef<Map<number, { x: number; width: number }>>(new Map());
  const toggleScrollRefs = useRef<Map<number, ScrollView | null>>(new Map());
  const toggleChipOffsetsRef = useRef<Map<number, Map<number, number>>>(new Map());
  const toggleAllowedSigsRef = useRef<Map<number, string>>(new Map());

  const currentGroupId =
    pendingSettings[GoProSettingId.MODE_PRESET_GROUP] ?? settings[GoProSettingId.MODE_PRESET_GROUP];
  const currentPresetId =
    pendingSettings[GoProSettingId.MODE_PRESET] ?? settings[GoProSettingId.MODE_PRESET];
  const currentGroupPresets = useMemo(
    () => resolveCurrentGroupPresets({ presets, currentGroupId, cameraModel }),
    [presets, currentGroupId, cameraModel],
  );
  const activePreset = useMemo(
    () => currentGroupPresets.find((preset) => preset.id === currentPresetId),
    [currentGroupPresets, currentPresetId],
  );
  const displayPresetId = useMemo(
    () => resolveBaseDisplayPresetId(activePreset, currentPresetId, currentGroupId),
    [activePreset, currentPresetId, currentGroupId],
  );
  const isLoopingPresetActive = useMemo(
    () => isLoopingPreset(activePreset, GoProSettingId.LOOPING_INTERVAL),
    [activePreset],
  );
  const displaySettings = useMemo<{ [settingId: number]: number }>(() => {
    return displayPresetId !== undefined && displayPresetId !== currentPresetId
      ? { ...settings, [GoProSettingId.MODE_PRESET]: displayPresetId }
      : settings;
  }, [settings, displayPresetId, currentPresetId]);
  const pendingDisplaySettings = useMemo<{ [settingId: number]: number }>(() => {
    return displayPresetId !== undefined && displayPresetId !== currentPresetId
      ? { ...pendingSettings, [GoProSettingId.MODE_PRESET]: displayPresetId }
      : pendingSettings;
  }, [pendingSettings, displayPresetId, currentPresetId]);

  const displaySettingPlan = useMemo(
    () => getDisplaySettingPlan(displaySettings, cameraModel, presets),
    [displaySettings, cameraModel, presets],
  );
  const displayLayout = displaySettingPlan.displayLayout;
  const showMediaFormatPrimary = displaySettingPlan.layoutExternalControls.showsMediaFormatPrimary;
  const showFramingSelector = displaySettingPlan.layoutExternalControls.showsFramingSelector;
  const showResolutionSelector = displaySettingPlan.layoutExternalControls.showsResolutionSelector;
  const capabilityPrefetchIds = useMemo(
    () => [...displaySettingPlan.defaultCapabilityPrefetchIds],
    [displaySettingPlan],
  );
  const capabilityPrefetchKey = useMemo(
    () => Array.from(new Set(capabilityPrefetchIds)).join(','),
    [capabilityPrefetchIds],
  );

  const specialRows = useMemo(
    () =>
      resolveSpecialRows({
        settings: displaySettings,
        pendingSettings: pendingDisplaySettings,
        cameraModel,
        currentGroupId,
        currentPresetId: displayPresetId,
        firmwareVersion,
      }),
    [
      displaySettings,
      pendingDisplaySettings,
      cameraModel,
      currentGroupId,
      displayPresetId,
      firmwareVersion,
    ],
  );

  const hero12EasyPresetConfig = getHero12EasyPresetConfig(currentGroupId, displayPresetId);
  const settingValueComparisonContext = {
    modelKey: cameraModel,
    modelNo: currentModelNo,
  };
  const isHeroMini11TimelapseLikeActive =
    isHero11MiniModel(currentModelNo) && isTimelapseLikePreset(displayPresetId);
  const isTimelapseContextActive =
    currentGroupId === GoProPresetGroup.TIMELAPSE || isHeroMini11TimelapseLikeActive;
  const isHero12MaxVideo2Preset =
    isHero12Model(currentModelNo) && displayPresetId === GoProVideoPreset.MAX_VIDEO_2_0;
  const isHero12MaxTimewarp2Preset =
    isHero12Model(currentModelNo) && displayPresetId === PRESET_MAX_TIMEWARP_2;
  const isHero12Trail2Preset =
    isHero12Model(currentModelNo) &&
    displayPresetId !== undefined &&
    MAX_TRAIL_2_PRESET_IDS.has(displayPresetId);
  const isHero13BurstSloMoActive =
    isHero13Model(currentModelNo) &&
    currentGroupId === GoProPresetGroup.VIDEO &&
    displayPresetId === GoProVideoPreset.ACTIVITY;
  const isHero12Or13MaxVideoPreset =
    isHero12Or13Model(currentModelNo) &&
    (displayPresetId === PRESET_MAX_VIDEO || displayPresetId === GoProVideoPreset.MAX_VIDEO_2_0);

  // Capture Delay countdown display
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);
  useEffect(() => {
    if (!captureDelayActive) {
      setCaptureCountdown(null);
      return;
    }
    const delayValue = settings[GoProSettingId.CAPTURE_DELAY];
    const totalSecs = delayValue === 2 ? 10 : delayValue === 1 ? 3 : 0;
    if (totalSecs === 0) {
      setCaptureCountdown(null);
      return;
    }
    setCaptureCountdown(totalSecs);
    const id = setInterval(() => {
      setCaptureCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(id);
  }, [captureDelayActive]);

  // Auto-scroll to active preset chip with animation
  useEffect(() => {
    if (currentPresetId === undefined) return;
    const offset = chipOffsetsRef.current.get(currentPresetId);
    if (offset) {
      presetScrollRef.current?.scrollTo({ x: offset.x - 12, animated: true });
    }
  }, [currentPresetId]);

  // Toggle buttons row: Auto-scroll to active value button with animation
  // Since the primaryKeys variable is defined later, retrieve it directly from quickSettingIds
  const primaryValuesKey = useMemo(
    () => displayLayout.quickSettingIds.map((id) => settings[id] ?? -1).join(','),
    [displayLayout.quickSettingIds, settings],
  );

  useEffect(() => {
    displayLayout.quickSettingIds.forEach((id) => {
      const val = settings[id];
      if (val === undefined) return;
      const x = toggleChipOffsetsRef.current.get(id)?.get(val);
      if (x !== undefined) {
        toggleScrollRefs.current.get(id)?.scrollTo({ x: x - 8, animated: true });
      } else {
        // Offset not recorded (e.g. immediately after options change) -> Reset to start
        toggleScrollRefs.current.get(id)?.scrollTo({ x: 0, animated: true });
      }
    });
    // Fires only when primaryValuesKey changes (i.e. one of the primary setting values changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryValuesKey]);

  useEffect(() => {
    const loadVisibility = async () => {
      try {
        await initSettingVisibilityTable();
        if (!connectedDeviceId || displayPresetId === undefined) {
          setVisibilityMap({});
          return;
        }
        const map = await getSettingVisibilityMap(connectedDeviceId, displayPresetId);
        setVisibilityMap(map);
      } catch (e) {
        debugWarn('ui', 'Failed to load setting visibility', e);
      }
    };
    void loadVisibility();
  }, [connectedDeviceId, displayPresetId]);

  const settingKeys = useMemo(() => {
    const ids = new Set<number>([
      ...Object.keys(settings).map(Number),
      ...Object.keys(capabilities).map(Number),
    ]);

    return Array.from(ids).filter((id) => {
      const hasCurrentValue = settings[id] !== undefined;
      const hasCapability = !!capabilities[id] && capabilities[id].length > 0;
      return hasCurrentValue || hasCapability;
    });
  }, [settings, capabilities]);

  const hasCapability = (id: number) => (capabilities[id] || []).length > 0;
  const isMediaModConnected = (mediaModStatus & 0x01) === 0x01;
  const isMediaModMicAvailable =
    mediaModMicStatus === 2 ||
    (isMediaModConnected &&
      (settings[GoProSettingId.MEDIA_MOD_MIC] !== undefined ||
        hasCapability(GoProSettingId.MEDIA_MOD_MIC)));
  const isSettingAvailable = (id: number) => {
    if (id === GoProSettingId.SCHEDULED_CAPTURE || id === GoProSettingId.MEDIA_MOD_MIC) {
      return true;
    }
    return settings[id] !== undefined || hasCapability(id);
  };
  const getSelectableValues = (id: number): number[] => {
    const vals = getOrderedSettingValues(id, capabilities[id] || [], cameraModel, firmwareVersion);
    return [...new Set(vals)];
  };

  const getFilteredSelectableValues = (id: number) =>
    filterSelectableValues({
      settingId: id,
      selectableValues: getSelectableValues(id),
      settings: displaySettings,
      pendingSettings: pendingDisplaySettings,
      cameraModel,
      currentGroupId,
      currentPresetId: displayPresetId,
      isLoopingPresetActive,
      hero12EasyLensValues: hero12EasyPresetConfig?.lensValues,
      isHero12MaxVideo2Preset,
      isHero12Or13MaxVideoPreset,
    });

  const requestCapability = (id: number) => {
    if (hasCapability(id)) return;

    const now = Date.now();
    const lastRequestedAt = requestedCapabilityIdsRef.current.get(id) ?? 0;
    if (now - lastRequestedAt < CAPABILITY_REQUEST_THROTTLE_MS) {
      return;
    }

    requestedCapabilityIdsRef.current.set(id, now);
    void goProBle.fetchCapabilityForSetting(id);
  };

  // Refer to the latest value via capabilitiesRef and exclude capabilities from the useEffect dependency array.
  // This prevents cascading loops: capabilities update -> useEffect triggers -> prefetch -> capabilities update...
  const capabilitiesRef = useRef(capabilities);
  capabilitiesRef.current = capabilities;

  useEffect(() => {
    // Force refetch settings whose capabilities might change upon preset switching, even if cached
    // (e.g. in Macro Video, VIDEO_BITRATE supports both High/Standard)
    const forceRefetchIds = new Set<number>([
      GoProSettingId.VIDEO_BITRATE,
      GoProSettingId.BIT_DEPTH,
    ]);

    const timerId = setTimeout(() => {
      capabilityPrefetchIds.forEach((id) => {
        if (!forceRefetchIds.has(id) && (capabilitiesRef.current[id] || []).length > 0) return;
        void goProBle.fetchCapabilityForSetting(id);
      });
    }, 150);

    return () => clearTimeout(timerId);
  }, [capabilityPrefetchKey]);

  const curatedAdvancedOrder = useMemo(() => {
    const order = new Map<number, number>();
    displayLayout.prioritizedAdvancedSettingIds.forEach((id, index) => {
      order.set(id, index);
    });
    return order;
  }, [displayLayout]);

  const isVisibleByDefault = (id: number) => {
    const stored = visibilityMap[id];
    if (stored !== undefined) {
      return stored;
    }
    // Default to OFF if there is no saved value in DB (first connection).
    // However, for newly added SS/ISO/Output (FORCE_VISIBLE_STATIC_FALLBACK_IDS),
    // we want to display them even if capabilities are empty, so we exceptionally set them to ON
    // only if they are configured as default-visible in the current layout.
    // * Note: Turning all settings ON unconditionally would overwrite existing customizations
    //   for returning users, so keep the scope narrow.
    if (
      FORCE_VISIBLE_STATIC_FALLBACK_IDS.has(id) &&
      displayLayout.defaultVisibleAdvancedSettingIds.includes(id)
    ) {
      return true;
    }
    return false;
  };

  // List of presets for the current group (searches all groups retrieved from Protobuf)
  // Hero13 Easy mode: The camera only sends the active preset, so complement with known IDs
  // Automatically identify Normal Lens / Max Lens Mod 2.0 / Anamorphic Lens from received IDs

  const leadingSpecialRows = specialRows.filter((row) => row.placement === 'beforePrimary');
  const trailingSpecialRows = specialRows.filter((row) => row.placement === 'afterPrimary');

  const handleLoadPresetGroup = async (selectId: number) => {
    await goProBle.loadPresetGroup(selectId);
  };

  const handleLoadPreset = async (presetId: number) => {
    await goProBle.loadPreset(presetId);
  };

  const handleSpecialRowActions = async (actions: readonly SpecialRowAction[]) => {
    for (const action of actions) {
      if (action.type === 'setSetting') {
        await goProBle.setSetting(action.settingId, action.value);
        continue;
      }
      await handleLoadPreset(action.presetId);
    }
  };

  // --- Rename Custom Preset --- (HERO12/HERO13 only; see usePresetRename)
  // The hook owns all rename state and also provides getPresetLabel /
  // supportsPresetRename, which the preset list below uses.
  const {
    supportsPresetRename,
    getPresetLabel,
    openRename: handleLongPressPreset,
    modalState: renameModalState,
  } = usePresetRename({ presets, currentModelNo, currentPresetId, cameraModel });

  const renderFramingSelector = () => {
    const framingOptions = resolveFramingSelector({
      settings: displaySettings,
      capabilities,
      cameraModel,
      currentGroupId,
      currentPresetId: displayPresetId,
      isTimelapseContextActive,
      isHero13BurstSloMoActive,
      isHero12MaxVideo2Preset,
      isHero12MaxTimewarp2Preset,
      isHero12Trail2Preset,
    });

    if (framingOptions === null || framingOptions.length === 0) {
      return null;
    }

    return (
      <View style={styles.framingRow}>
        {framingOptions.map((option) => {
          const iconColor = option.isActive ? colors.accent : colors.textSecondary;
          return (
            <TouchableOpacity
              key={option.key}
              disabled={!option.isAvailable}
              style={[
                styles.framingButton,
                option.isActive && styles.framingButtonActive,
                option.isActive
                  ? { backgroundColor: colors.accentLight, borderColor: colors.accent }
                  : { borderColor: colors.toggleBorder, backgroundColor: colors.toggleBg },
                !option.isAvailable && { opacity: 0.3 },
              ]}
              onPress={() => {
                if (option.isActive || !option.isAvailable || option.targetValue === null) return;
                handleChangeValue(option.settingId, option.targetValue);
              }}
            >
              <AspectRatioIcon ratio={option.ratio} size={18} color={iconColor} />
              <Text
                style={[
                  styles.framingButtonText,
                  option.isActive && styles.framingButtonTextActive,
                  { color: iconColor, marginLeft: 6 },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderResolutionSelector = () => {
    const resolutionSelectorState = resolveResolutionSelector({
      resolutionValues: getFilteredSelectableValues(GoProSettingId.RESOLUTION),
      settings: displaySettings,
      pendingSettings: pendingDisplaySettings,
      capabilities,
      cameraModel,
      currentGroupId,
      currentPresetId: displayPresetId,
      quickSettingIds: displayLayout.quickSettingIds,
      isHero13BurstSloMoActive,
      hasHero12EasyPresetConfig: hero12EasyPresetConfig !== undefined,
    });
    if (resolutionSelectorState === null) return null;

    const { currentValue, resolutionValues } = resolutionSelectorState;

    return (
      <View style={[styles.primaryItemContainer, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toggleGroup}>
          <View style={styles.toggleLabelChip} pointerEvents="none">
            <Text style={[styles.toggleLabelChipText, { color: colors.textMuted }]}>
              {getSettingName(GoProSettingId.RESOLUTION)}
            </Text>
          </View>
          {resolutionValues.map((val) => {
            const isSelected = currentValue === val;
            const label = getResolutionLabel(cameraModel, val) ?? val.toString();
            return (
              <TouchableOpacity
                key={val}
                style={[
                  styles.toggleButton,
                  isSelected && styles.toggleButtonSelected,
                  isSelected
                    ? {
                        backgroundColor: colors.toggleSelectedBg,
                        borderColor: colors.toggleSelectedBg,
                      }
                    : { borderColor: colors.toggleBorder, backgroundColor: colors.toggleBg },
                ]}
                onPress={() => handleChangeValue(GoProSettingId.RESOLUTION, val)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isSelected && styles.toggleTextSelected,
                    !isSelected && { color: colors.textSecondary },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Force PHOTO_OUTPUT display (RAW/Standard) during Timelapse/Nightlapse Photo format.
  // Acts as a fallback UI because some camera models return empty capabilities.
  const mediaFormatNow = settings[GoProSettingId.MEDIA_FORMAT];
  const isTimelapsePhotoActive =
    isTimelapseContextActive &&
    displayPresetId !== undefined &&
    LAPSE_WITH_PHOTO_PRESETS.has(displayPresetId) &&
    (mediaFormatNow === 20 || mediaFormatNow === 21);
  // During Easy Video presets: Force display of Quality (ID=201) because capabilities are returned empty.
  const isEasyVideoActive =
    currentGroupId === GoProPresetGroup.VIDEO &&
    displayPresetId !== undefined &&
    EASY_VIDEO_PRESETS.has(displayPresetId);
  const isHero11EasyPhotoActive =
    isHero11FamilyModel(currentModelNo) &&
    currentGroupId === GoProPresetGroup.PHOTO &&
    displayPresetId !== undefined &&
    HERO11_EASY_PHOTO_PRESETS.has(displayPresetId);
  const isHero11EasyTimelapseActive =
    isHero11FamilyModel(currentModelNo) &&
    currentGroupId === GoProPresetGroup.TIMELAPSE &&
    displayPresetId !== undefined &&
    HERO11_EASY_TIMELAPSE_PRESETS.has(displayPresetId);

  // Settings to force-display using static fallbacks even if capabilities/current values are not retrieved.
  // Inherits the forced-visible behaviors from the legacy app upon preset change (Photo/Night SS, ISO, Output).
  // These settings already have static fallbacks set up in `getOrderedSettingValues`.
  const FORCE_VISIBLE_STATIC_FALLBACK_IDS = new Set<number>([
    GoProSettingId.PHOTO_SHUTTER,
    GoProSettingId.VIDEO_SHUTTER, // LiveBurst (P_LiveBurstShutterSpeed = VIDEO_SHUTTER)
    GoProSettingId.NIGHT_PHOTO_SHUTTER,
    GoProSettingId.NIGHTLAPSE_PHOTO_SHUTTER,
    GoProSettingId.PHOTO_ISO_MIN,
    GoProSettingId.PHOTO_ISO_MAX,
    GoProSettingId.MULTI_SHOT_ISO_MIN,
    GoProSettingId.MULTI_SHOT_ISO_MAX,
    GoProSettingId.TIMELAPSE_PHOTO_OUTPUT,
    GoProSettingId.PHOTO_INTERVAL_DURATION,
    GoProSettingId.TIME_LAPSE_LENS, // Camera returns empty capabilities when PHOTO_OUTPUT=RAW; static fallback
    GoProSettingId.LANGUAGE, // Camera never reports capabilities; use static list
    GoProSettingId.VOICE_LANGUAGE, // Camera never reports capabilities; use static list
    GoProSettingId.HORIZONTAL_LEVELING, // Camera never reports capabilities; use static list
    GoProSettingId.HORIZONTAL_LOCK, // Camera never reports capabilities; use static list
    GoProSettingId.STAR_TRAILS_LENGTH, // Capability list can be empty; static fallback ensures display
    GoProSettingId.BIT_DEPTH, // Camera reports only current value (1 choice); use static list
    GoProSettingId.TEN_BIT_COLOR_HERO11, // Hero11/HeroMini11: Camera reports only current value; use static list
    GoProSettingId.VIDEO_BITRATE_HERO11, // Hero11/HeroMini11: Camera reports only current value; use static list
    GoProSettingId.VIDEO_BITRATE_HERO09, // Hero09: Camera reports only current value; use static list (ID=0xA0)
    GoProSettingId.LOOPING_INTERVAL, // Hero09-11 Loop preset: static [5/20/60/120 Min]
    GoProSettingId.HLG_HDR, // Only valid when Hero13 VideoProfile=1/101; uses static [On/Off]
    GoProSettingId.HYPERSMOOTH_MAX, // Hero09 Max Video: Max HyperSmooth (ID=148) is always static [On/Off]
  ]);
  const isForcedQuickId = (id: number): boolean =>
    isForcedQuickSettingVisible({
      settingId: id,
      settings: displaySettings,
      pendingSettings: pendingDisplaySettings,
      cameraModel,
      currentGroupId,
      currentPresetId: displayPresetId,
      isEasyVideoActive,
      isHero11EasyPhotoActive,
      isHero11EasyTimelapseActive,
      isHero12Or13MaxVideoPreset,
      isTimelapsePhotoActive,
      forceVisibleStaticFallbackIds: FORCE_VISIBLE_STATIC_FALLBACK_IDS,
    });

  const isForcedAdvancedId = (id: number): boolean => {
    if (!FORCE_VISIBLE_STATIC_FALLBACK_IDS.has(id)) return false;
    // Force visible only if included in that preset's defaultVisible list
    return displayLayout.defaultVisibleAdvancedSettingIds.includes(id);
  };

  const primaryKeys = (displayLayout.quickSettingIds as readonly number[])
    .filter((id) => isSettingModelSupported(id, cameraModel))
    .filter((id) => {
      if (isForcedQuickId(id)) return true;
      return settingKeys.includes(id) && getFilteredSelectableValues(id).length > 0;
    })
    .slice(); // already ordered by quickSettingIds
  // For the main panel: Only display settings that have received values/capabilities from the camera.
  // However, FORCE_VISIBLE_STATIC_FALLBACK_IDS are shown even without capabilities.
  // CAMERA_ADVANCED_SETTING_IDS are preset-independent device settings (Screen Saver, Language, etc.),
  // so we bypass the isSettingAvailable check (making them selectable even if the camera doesn't report them on first dump).
  const layoutAdvancedKeys = displayLayout.prioritizedAdvancedSettingIds
    .filter((id) => !displayLayout.quickSettingIds.includes(id))
    .filter((id) => !MODE_AND_PROFILE_SETTING_IDS.includes(id))
    // Hide settings completely if unsupported by the model (not defined in legacy UIElementSettings.cs = non-existent feature)
    .filter((id) => isSettingModelSupported(id, cameraModel))
    .filter(
      (id) =>
        isSettingAvailable(id) ||
        isForcedAdvancedId(id) ||
        CAMERA_ADVANCED_SETTING_IDS.includes(id),
    );
  const shootingConfigurableKeys = layoutAdvancedKeys
    .filter((id) => !CAMERA_ADVANCED_SETTING_IDS.includes(id))
    .sort((a, b) => {
      const aRank = curatedAdvancedOrder.get(a) ?? Number.MAX_SAFE_INTEGER;
      const bRank = curatedAdvancedOrder.get(b) ?? Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) {
        return aRank - bRank;
      }
      return getSettingName(
        a,
        cameraModel,
        displayPresetId,
        displaySettings[GoProSettingId.MEDIA_FORMAT],
      ).localeCompare(
        getSettingName(
          b,
          cameraModel,
          displayPresetId,
          displaySettings[GoProSettingId.MEDIA_FORMAT],
        ),
      );
    });
  const cameraConfigurableKeys = layoutAdvancedKeys
    .filter((id) => CAMERA_ADVANCED_SETTING_IDS.includes(id))
    .sort((a, b) => {
      const aRank = curatedAdvancedOrder.get(a) ?? Number.MAX_SAFE_INTEGER;
      const bRank = curatedAdvancedOrder.get(b) ?? Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) {
        return aRank - bRank;
      }
      return getSettingName(
        a,
        cameraModel,
        displayPresetId,
        displaySettings[GoProSettingId.MEDIA_FORMAT],
      ).localeCompare(
        getSettingName(
          b,
          cameraModel,
          displayPresetId,
          displaySettings[GoProSettingId.MEDIA_FORMAT],
        ),
      );
    });

  // For Visible Items Modal: Display all defined settings regardless of isSettingAvailable
  const sortByRank = (a: number, b: number) => {
    const aRank = curatedAdvancedOrder.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bRank = curatedAdvancedOrder.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return getSettingName(
      a,
      cameraModel,
      displayPresetId,
      displaySettings[GoProSettingId.MEDIA_FORMAT],
    ).localeCompare(
      getSettingName(b, cameraModel, displayPresetId, displaySettings[GoProSettingId.MEDIA_FORMAT]),
    );
  };
  const allModalAdvancedKeys = displayLayout.prioritizedAdvancedSettingIds
    .filter((id) => !displayLayout.quickSettingIds.includes(id))
    .filter((id) => !MODE_AND_PROFILE_SETTING_IDS.includes(id))
    // Exclude settings unsupported by the model from the modal (do not show non-existent features as options)
    .filter((id) => isSettingModelSupported(id, cameraModel));
  const modalShootingConfigurableKeys = allModalAdvancedKeys
    .filter((id) => !CAMERA_ADVANCED_SETTING_IDS.includes(id))
    .sort(sortByRank);
  const modalCameraConfigurableKeys = allModalAdvancedKeys
    .filter((id) => CAMERA_ADVANCED_SETTING_IDS.includes(id))
    .sort(sortByRank);
  const visibleShootingKeys = shootingConfigurableKeys.filter((id) => {
    // MEDIA_MOD_MIC (164) prioritizes status 102, but maintains visibility via status 110 connection bit and known values/capabilities.
    if (id === GoProSettingId.MEDIA_MOD_MIC) return isMediaModMicAvailable;
    return isVisibleByDefault(id);
  });
  const visibleCameraKeys = cameraConfigurableKeys.filter((id) => isVisibleByDefault(id));

  const handleSelectSetting = (settingId: number) => {
    // Virtual IDs (TIMELAPSE_VIDEO_SHUTTER/STAR_TRAIL_SHUTTER, etc.) or static override IDs
    // (NIGHTLAPSE_PHOTO_SHUTTER) do not have capabilities reported by the camera.
    // If getSelectableValues returns static values, open the modal directly.
    const selectableValues = getFilteredSelectableValues(settingId);
    if (!hasCapability(settingId)) {
      if (selectableValues.length === 0) {
        // Request capability and wait only if there are absolutely no options available
        requestCapability(settingId);
        return;
      }
      // Static values exist -> Open the modal (no need to fetch capabilities)
    }
    setSelectedSettingId(settingId);
  };

  const handleChangeValue = async (settingId: number, value: number) => {
    // Send setting command to GoPro
    await goProBle.setSetting(settingId, value);
    setSelectedSettingId(null);
  };

  const normalizeToggleSelectionValue = (
    settingId: number,
    value: number | undefined,
  ): number | undefined => {
    return normalizeSettingValueForComparison(settingId, value, settingValueComparisonContext);
  };

  const renderPrimaryItem = (id: number) => {
    return (
      <PrimarySettingRow
        key={id}
        id={id}
        settings={settings}
        pendingSettings={pendingSettings}
        displaySettings={displaySettings}
        allowedValues={getFilteredSelectableValues(id)}
        isHero12Or13MaxVideoPreset={isHero12Or13MaxVideoPreset}
        displayPresetId={displayPresetId}
        isTimelapseContextActive={isTimelapseContextActive}
        currentModelNo={currentModelNo}
        cameraModel={cameraModel}
        firmwareVersion={firmwareVersion}
        colors={colors}
        onChangeValue={handleChangeValue}
        toggleScrollRefs={toggleScrollRefs}
        toggleChipOffsetsRef={toggleChipOffsetsRef}
        toggleAllowedSigsRef={toggleAllowedSigsRef}
      />
    );
  };

  const renderSpecialRow = (row: SpecialRow) => {
    return (
      <SpecialRowView
        key={row.key}
        row={row}
        colors={colors}
        onHandleActions={handleSpecialRowActions}
      />
    );
  };

  const isIosMultiColumn = Platform.OS === 'ios' && columnCount > 1;

  const renderOtherItem = (id: number) => {
    // Scheduled Capture: Keep inline for dedicated time picker modal triggering
    if (id === GoProSettingId.SCHEDULED_CAPTURE) {
      const isEnabled = scheduledTime !== null;
      const timeLabel = scheduledTime
        ? `${String(scheduledTime.hour).padStart(2, '0')}:${String(scheduledTime.minute).padStart(2, '0')}`
        : '--:--';
      return (
        <View key={id} style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <Text
            style={[
              styles.settingName,
              { color: colors.textSecondary },
              isIosMultiColumn && styles.iosMultiColumnSettingName,
            ]}
            numberOfLines={isIosMultiColumn ? 1 : undefined}
            ellipsizeMode={isIosMultiColumn ? 'tail' : undefined}
          >
            {getSettingName(
              id,
              cameraModel,
              displayPresetId,
              displaySettings[GoProSettingId.MEDIA_FORMAT],
            )}
          </Text>
          <View
            style={[
              styles.scheduledCaptureRight,
              isIosMultiColumn && styles.iosMultiColumnControlGroup,
            ]}
          >
            {isEnabled && (
              <TouchableOpacity
                style={[styles.scheduledTimeButton, { backgroundColor: colors.accentLight }]}
                onPress={() => setIsTimePickerVisible(true)}
              >
                <Text style={[styles.scheduledTimeText, { color: colors.accent }]}>
                  {timeLabel}
                </Text>
              </TouchableOpacity>
            )}
            <Switch
              value={isEnabled}
              onValueChange={(val) => {
                if (val) {
                  setIsTimePickerVisible(true);
                } else {
                  void goProBle.clearScheduledTime();
                }
              }}
              trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
              thumbColor={'#ffffff'}
            />
          </View>
        </View>
      );
    }

    return (
      <OtherSettingRow
        key={id}
        id={id}
        settings={settings}
        pendingSettings={pendingSettings}
        displaySettings={displaySettings}
        capabilities={capabilities}
        allowedValues={getFilteredSelectableValues(id)}
        cameraModel={cameraModel}
        displayPresetId={displayPresetId}
        firmwareVersion={firmwareVersion}
        isRefreshing={isRefreshing}
        mediaModMicStatus={mediaModMicStatus}
        isMediaModConnected={isMediaModConnected}
        isIosMultiColumn={isIosMultiColumn}
        colors={colors}
        onSelectSetting={handleSelectSetting}
        onChangeValue={handleChangeValue}
      />
    );
  };

  const handleVisibilityChange = async (settingId: number, isVisible: boolean) => {
    setVisibilityMap((prev) => ({ ...prev, [settingId]: isVisible }));
    if (connectedDeviceId && displayPresetId !== undefined) {
      await setSettingVisible(connectedDeviceId, displayPresetId, settingId, isVisible);
    }
  };

  // Grid rendering: Display setting items in columnCount columns
  const renderGridItems = (keys: number[], renderer: (id: number) => React.ReactNode) => {
    if (columnCount <= 1) {
      return keys.map(renderer);
    }
    const rows: number[][] = [];
    for (let i = 0; i < keys.length; i += columnCount) {
      rows.push(keys.slice(i, i + columnCount));
    }
    return rows.map((row, rowIdx) => (
      <View key={rowIdx} style={styles.gridRow}>
        {row.map((id) => (
          <View key={id} style={{ flex: 1 }}>
            {renderer(id)}
          </View>
        ))}
        {/* Fill empty cells in the final row to maintain uniform width */}
        {row.length < columnCount &&
          Array.from({ length: columnCount - row.length }, (_, i) => (
            <View key={`pad-${i}`} style={{ flex: 1 }} />
          ))}
      </View>
    ));
  };

  const renderLockedRow = () => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: colors.lockedBg,
        borderRadius: 10,
        marginTop: 4,
      }}
      onPress={() => {
        if (currentProductId) {
          purchaseProduct(currentProductId as IAPProductId);
        }
      }}
    >
      <Text style={{ fontSize: 24, marginRight: 8 }}>🔒</Text>
      <Text style={{ color: colors.lockedText, fontSize: 14, fontWeight: '600' }}>
        {currentProductId
          ? t('control.upgradeToUnlock', {
              product: getProductDisplayName(currentProductId as IAPProductId),
            })
          : t('control.connectToUnlock')}
      </Text>
    </TouchableOpacity>
  );

  const renderMaxLensModeSelectors = () => {
    if (!isMaxModel(currentModelNo)) return null;
    const lensModeVal = settings[GoProSettingId.MAX_LENS_MODE];
    const showLensDir = lensModeVal !== 1; // 1 = Dual, hide direction if Dual

    return (
      <View style={{ marginTop: 8, marginBottom: 8 }}>
        {renderPrimaryItem(GoProSettingId.MAX_LENS_MODE)}
        {showLensDir && renderPrimaryItem(GoProSettingId.MAX_LENS_DIRECTION)}
      </View>
    );
  };

  const hasPendingSettings = Object.keys(pendingSettings).length > 0;
  const isUiLocked = shootingLocked || isRefreshing || hasPendingSettings || isApplyingCustomPreset;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <PreviewPlayer visible={showPreviewModal} onClose={() => setShowPreviewModal(false)} />

      {/* Mode selection + preset chips (fixed outside ScrollView) */}
      <View
        pointerEvents={isUiLocked ? 'none' : 'auto'}
        style={isUiLocked ? { opacity: 0.5 } : undefined}
      >
        {/* Mode/preset switching tabs */}
        <PresetGroupGrid
          currentModelNo={currentModelNo}
          cameraModel={cameraModel}
          currentGroupId={currentGroupId}
          currentPresetId={currentPresetId}
          currentGroupPresets={currentGroupPresets}
          fallbackPresetsByModel={fallbackPresetsByModel}
          supportsPresetRename={supportsPresetRename}
          colors={colors}
          handleLoadPresetGroup={handleLoadPresetGroup}
          handleLoadPreset={handleLoadPreset}
          handleLongPressPreset={handleLongPressPreset}
          getPresetLabel={getPresetLabel}
          getPresetDisplayName={getPresetDisplayName}
          getPresetIoniconName={getPresetIoniconName}
          renderMaxLensModeSelectors={renderMaxLensModeSelectors}
        />
        {/* Media Format toggle (Timelapse/Nightlapse only) — Always visible right below preset chips, except on HeroMini11 */}
        {showMediaFormatPrimary && renderPrimaryItem(GoProSettingId.MEDIA_FORMAT)}
        {/* Framing (Aspect Ratio) — Always visible in all modes */}
        {showFramingSelector && renderFramingSelector()}
        {/* Resolution — Always visible */}
        {showResolutionSelector && renderResolutionSelector()}
      </View>

      {/* Primary items (Toggle Buttons) — Fixed outside ScrollView */}
      {(primaryKeys.length > 0 || specialRows.length > 0) && (
        <View
          style={[styles.sectionContainer, isUiLocked && { opacity: 0.5 }]}
          pointerEvents={isUiLocked ? 'none' : 'auto'}
        >
          {leadingSpecialRows.map(renderSpecialRow)}
          {primaryKeys.map(renderPrimaryItem)}
          {trailingSpecialRows.map(renderSpecialRow)}
        </View>
      )}

      {/* Loading/refreshing overlay layer */}
      {(isRefreshing || isApplyingCustomPreset) && (
        <View style={[styles.refreshingOverlay, { backgroundColor: colors.overlay }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.refreshingText, { color: colors.accent }]}>
            {isApplyingCustomPreset
              ? t('control.applyingPreset')
              : t('control.syncingCapabilities')}
          </Text>
        </View>
      )}

      <ScrollView style={styles.list}>
        {settingKeys.length === 0 && !isRefreshing ? (
          <Text style={[styles.loading, { color: colors.textMuted }]}>
            {t('control.loadingCapabilities')}
          </Text>
        ) : null}

        {/* Shooting Settings */}
        {visibleShootingKeys.length > 0 && (
          <View
            style={[styles.sectionContainer, isUiLocked && { opacity: 0.5 }]}
            pointerEvents={isUiLocked ? 'none' : 'auto'}
          >
            {isPurchased
              ? renderGridItems(visibleShootingKeys, renderOtherItem)
              : renderLockedRow()}
          </View>
        )}

        {/* Hero13 Dashboard Controls */}
        {isHero13Model(currentModelNo) && (
          <View style={styles.sectionContainer}>
            <Text
              style={[
                styles.sectionHeader,
                { color: colors.textMuted, borderBottomColor: colors.borderLight },
              ]}
            >
              {t('control.dashboardControls')}
            </Text>
            {isPurchased ? (
              <>
                {/* Override Dashboard row: Left tap to toggle folding, Switch controls the BLE setting only */}
                {/* During recording: Only the fold toggle works; Switch and sub-items are disabled */}
                {/* When Override is Off: Deplay is not allowed (closes automatically if expanded) */}
                {(() => {
                  const isDashboardOn = settings[GoProSettingId.DASHBOARD_OVERRIDE] === 1;
                  if (!isDashboardOn && isDashboardExpanded) {
                    setIsDashboardExpanded(false);
                  }
                  return null;
                })()}
                <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity
                    style={[
                      styles.dashboardOverrideLabel,
                      isIosMultiColumn && styles.iosMultiColumnDashboardLabel,
                    ]}
                    onPress={() => setIsDashboardExpanded((v) => !v)}
                    activeOpacity={0.7}
                    disabled={settings[GoProSettingId.DASHBOARD_OVERRIDE] !== 1}
                  >
                    <Ionicons
                      name={isDashboardExpanded ? 'chevron-down' : 'chevron-forward'}
                      size={14}
                      color={
                        settings[GoProSettingId.DASHBOARD_OVERRIDE] === 1
                          ? colors.textMuted
                          : colors.border
                      }
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.settingName,
                        { color: colors.textSecondary },
                        isIosMultiColumn && styles.iosMultiColumnSettingName,
                      ]}
                      numberOfLines={isIosMultiColumn ? 1 : undefined}
                      ellipsizeMode={isIosMultiColumn ? 'tail' : undefined}
                    >
                      {getSettingName(GoProSettingId.DASHBOARD_OVERRIDE)}
                    </Text>
                  </TouchableOpacity>
                  <View
                    style={[
                      shootingLocked ? { opacity: 0.4 } : undefined,
                      isIosMultiColumn && styles.iosMultiColumnControlGroup,
                    ]}
                  >
                    <Switch
                      value={settings[GoProSettingId.DASHBOARD_OVERRIDE] === 1}
                      onValueChange={(val) =>
                        void handleChangeValue(GoProSettingId.DASHBOARD_OVERRIDE, val ? 1 : 0)
                      }
                      trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
                      thumbColor={'#ffffff'}
                      disabled={
                        shootingLocked || settings[GoProSettingId.DASHBOARD_OVERRIDE] === undefined
                      }
                    />
                  </View>
                </View>
                {isDashboardExpanded && (
                  <View
                    pointerEvents={shootingLocked ? 'none' : 'auto'}
                    style={shootingLocked ? { opacity: 0.4 } : undefined}
                  >
                    {renderGridItems([...DASHBOARD_SUB_SETTING_IDS], renderOtherItem)}
                  </View>
                )}
              </>
            ) : (
              renderLockedRow()
            )}
          </View>
        )}
      </ScrollView>

      {/* Upgrade banner (shown only when not purchased and a camera is connected) */}
      {!isPurchased && currentProductId && (
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.premiumAccent,
            paddingVertical: 10,
            paddingHorizontal: 16,
            marginHorizontal: 8,
            marginBottom: 4,
            borderRadius: 10,
          }}
          onPress={() => purchaseProduct(currentProductId as IAPProductId)}
        >
          <Text style={{ fontSize: 16, marginRight: 6 }}>⭐</Text>
          <Text style={{ color: '#000', fontWeight: '700', fontSize: 14 }}>
            {t('control.unlockAllSettings', {
              product: getProductDisplayName(currentProductId as IAPProductId),
            })}
          </Text>
        </TouchableOpacity>
      )}

      {/* Shutter Button (Fixed at the very bottom of the screen)
           The elapsed time display has been moved next to the recording dot on the far right of CameraStatusBar.
           A pseudo-gradient band is placed at the top edge to softly mark the boundary with the scroll area
           (maintaining flatness while avoiding abrupt transitions). */}
      <View style={styles.shutterFade} pointerEvents="none">
        {[0, 0.12, 0.25, 0.4, 0.55, 0.7, 0.85].map((op, i) => (
          <View
            key={i}
            style={{ height: 2, backgroundColor: colors.surfaceSecondary, opacity: op }}
          />
        ))}
      </View>
      <View style={[styles.shutterContainer, { backgroundColor: colors.surfaceSecondary }]}>
        {/* Left spacer to keep shutter button centered */}
        <View style={styles.shutterSideContainer} />

        <View style={styles.shutterCenterContainer}>
          <TouchableOpacity
            style={[
              styles.shutterButton,
              { borderColor: captureDelayActive ? colors.warning : colors.shutterRing },
            ]}
            onPress={() => {
              haptics.impact();
              goProBle.toggleShutter(!isEncoding);
            }}
            accessibilityLabel={isEncoding ? t('control.stop') : t('control.shutter')}
            accessibilityRole="button"
          >
            {captureCountdown !== null ? (
              <Text style={styles.shutterCountdownText}>{captureCountdown}</Text>
            ) : (
              <Animated.View
                style={[
                  isEncoding ? styles.shutterInnerRecording : styles.shutterInnerIdle,
                  {
                    backgroundColor: isEncoding
                      ? colors.shutterInnerRecording
                      : colors.shutterInnerIdle,
                  },
                  isEncoding && { opacity: shutterPulse },
                ]}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Right HindSight Info panel */}
        <View style={styles.shutterSideContainer}>
          {hindsightActive && !isMaxModel(currentModelNo) && (
            <View style={styles.hindsightContainer}>
              <View
                style={[
                  styles.hindsightBadge,
                  {
                    backgroundColor: colors.accentLight,
                    borderColor: colors.accent,
                  },
                ]}
              >
                <Text style={[styles.hindsightBadgeText, { color: colors.accent }]}>
                  {settings[GoProSettingId.HINDSIGHT] === 2
                    ? '+15s'
                    : settings[GoProSettingId.HINDSIGHT] === 3
                      ? '+30s'
                      : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.stopHindsightButton, { backgroundColor: colors.accent }]}
                onPress={() => handleChangeValue(GoProSettingId.HINDSIGHT, 4)}
                accessibilityLabel={t('control.stopHindsight')}
                accessibilityRole="button"
              >
                <Text style={styles.stopHindsightText}>{t('control.stopHindsight')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Value Selection Modal */}
      <SettingOptionModal
        selectedSettingId={selectedSettingId}
        onClose={() => setSelectedSettingId(null)}
        onSelectValue={handleChangeValue}
        selectableValues={selectedSettingId ? getFilteredSelectableValues(selectedSettingId) : []}
        currentValue={selectedSettingId !== null ? settings[selectedSettingId] : undefined}
        cameraModel={cameraModel}
        displayPresetId={displayPresetId}
        displaySettings={displaySettings}
        firmwareVersion={firmwareVersion}
        colors={colors}
      />

      <VisibilityControlModal
        visible={isVisibilityModalVisible}
        isPurchased={isPurchased}
        onClose={() => setIsVisibilityModalVisible(false)}
        colors={colors}
        modalShootingConfigurableKeys={modalShootingConfigurableKeys}
        isVisibleByDefault={isVisibleByDefault}
        handleVisibilityChange={handleVisibilityChange}
        cameraModel={cameraModel}
        displayPresetId={displayPresetId}
        displaySettings={displaySettings}
        currentProductId={currentProductId}
        purchaseProduct={purchaseProduct}
      />

      {/* Rename Custom Preset (Triggered on long press) */}
      <PresetRenameModal state={renameModalState} colors={colors} />

      {/* Scheduled Capture Time Picker */}
      <TimePickerModal
        visible={isTimePickerVisible}
        initialHour={scheduledTime?.hour ?? 7}
        initialMinute={scheduledTime?.minute ?? 0}
        colors={colors}
        onConfirm={(hour, minute) => void goProBle.setScheduledTime(hour, minute)}
        onClose={() => setIsTimePickerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    elevation: 2,
  },
  list: {
    flex: 1,
  },
  refreshingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  shutterContainer: {
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  shutterSideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  shutterCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hindsightContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hindsightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
  },
  hindsightBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stopHindsightButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  stopHindsightText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  // Stack of thin, increasingly opaque bands sitting just above the
  // shutter container. Faked linear gradient (no extra dependency) that
  // softens the transition between the scroll content and the fixed
  // shutter region.
  shutterFade: {
    height: 14,
  },
  // Circular shutter button: outer ring + animated inner shape.
  // Idle = filled red circle; Recording = red rounded square (Stop).
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterInnerIdle: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  shutterCountdownText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#f59e0b',
    fontVariant: ['tabular-nums'],
  },
  shutterInnerRecording: {
    // Slightly smaller rounded square so the transition reads as "stop"
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  recordingTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fa5252',
    marginRight: 6,
  },
  recordingTimeText: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  refreshingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#4361ee',
    fontWeight: '600',
  },
  loading: {
    textAlign: 'center',
    color: '#868e96',
    marginTop: 20,
  },
  gridRow: {
    flexDirection: 'row',
    // Visual gap between adjacent label/value cells when columnCount >= 2.
    // Without this, the value text on the left cell sits flush against the
    // label text on the right cell.
    columnGap: 16,
  },
  sectionContainer: {},
  dashboardOverrideLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 8,
  },
  iosMultiColumnDashboardLabel: {
    minWidth: 0,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#868e96',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  primaryItemContainer: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  toggleLabelChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 4,
    justifyContent: 'center',
  },
  toggleLabelChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  toggleGroup: {
    flexDirection: 'row',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ced4da',
    marginRight: 8,
    backgroundColor: '#f8f9fa',
  },
  toggleButtonSelected: {
    backgroundColor: '#4361ee',
    borderColor: '#4361ee',
  },
  toggleText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  toggleTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  scheduledCaptureRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iosMultiColumnSettingName: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    marginRight: 8,
  },
  iosMultiColumnControlGroup: {
    flexShrink: 0,
  },
  scheduledTimeButton: {
    backgroundColor: '#e8ecfd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scheduledTimeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4361ee',
    fontVariant: ['tabular-nums'],
  },
  settingName: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 16,
    color: '#4361ee',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayBg: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSectionContainer: {
    marginBottom: 20,
  },
  modalSectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#343a40',
  },
  modalOptionSelected: {
    color: '#4361ee',
    fontWeight: 'bold',
  },
  modalClose: {
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  modalCloseText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  visibilityText: {
    fontSize: 15,
    color: '#343a40',
    flex: 1,
    marginRight: 12,
  },
  modeSelectorContainer: {},
  modeTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ced4da',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabActive: {
    backgroundColor: '#4361ee',
    borderColor: '#4361ee',
    // Subtle elevation so the active mode reads as the parent control
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  modeTabIcon: {
    marginRight: 6,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#495057',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  modeTabTextActive: {
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  presetChipScroll: {
    flexGrow: 0,
  },
  presetChipContent: {
    gap: 8,
    paddingHorizontal: 2,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#adb5bd',
    backgroundColor: '#ffffff',
  },
  presetChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetChipIconShell: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  presetChipBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  presetChipBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  presetChipActive: {
    backgroundColor: '#e7edff',
    borderColor: '#4361ee',
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#495057',
  },
  presetChipTextActive: {
    color: '#4361ee',
    fontWeight: '700',
  },
  framingRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  framingButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  framingButtonActive: {
    backgroundColor: '#e7edff',
    borderColor: '#4361ee',
  },
  framingButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#495057',
  },
  framingButtonTextActive: {
    color: '#4361ee',
    fontWeight: '700',
  },
});

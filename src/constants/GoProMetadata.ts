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

import { GoProSettingId } from './GoProSettingId';
import { classifyTimelapsePreset } from './layout';
import { GOPRO_SETTINGS_METADATA } from './metadata/baseSettingMetadata';
import { GOPRO_SETTING_VALUE_ORDER } from './metadata/baseValueOrder';
import type { SettingMetadata, SliderConfig } from './metadata/types';
import { getResolutionLabel } from './ResolutionAspectMap';
import { getCapabilityPolicy } from './settingFallbackPolicies';
import { resolveSemanticSettingId } from './settingIdTranslation';
import { getActiveFirmwareOverlay, type FirmwareOverlay } from './settingFirmwareOverlays';
import {
  GOPRO_BOOL_VALUES_MODEL_OVERRIDE,
  GOPRO_SETTING_STATIC_FALLBACKS_MODEL_OVERRIDE,
  GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE,
  MODEL_VALUE_OVERRIDES,
  PRESET_NAME_OVERRIDES,
} from './metadataOverrides';
import { resolveModelNoFromCameraModelKey } from '../cameraModels/shared/modelNumber';
import type { CameraModelKey } from '../cameraModels/shared/modelManifest';
import { GOPRO_MODEL_NUMBERS, type GoProModelNumber } from './GoProModelNumbers';
import { isMaxModel } from '../cameraModels/shared/modelNoHelpers';
import { t } from '../i18n';

export {
  GOPRO_BOOL_VALUES_MODEL_OVERRIDE,
  GOPRO_SETTING_STATIC_FALLBACKS_MODEL_OVERRIDE,
  GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE,
  MODEL_VALUE_OVERRIDES,
} from './metadataOverrides';

export { GOPRO_SETTINGS_METADATA } from './metadata/baseSettingMetadata';
export { GOPRO_SETTING_VALUE_ORDER } from './metadata/baseValueOrder';

export type { SettingMetadata, SliderConfig } from './metadata/types';

export interface SettingValueComparisonContext {
  modelKey?: string | null;
  modelNo?: number | null;
  firmwareVersion?: string | null;
}

type SettingValueAliasRule = {
  settingId: number;
  modelNos: readonly GoProModelNumber[];
  aliases: readonly number[];
  canonicalValue: number;
};

// Some camera models report alternate wire values for the same logical state.
// Keep those aliases in one table so UI selection and pending matching share the same rules.
const SETTING_VALUE_ALIAS_RULES: readonly SettingValueAliasRule[] = [
  {
    settingId: GoProSettingId.HYPERSMOOTH_MAX,
    modelNos: [GOPRO_MODEL_NUMBERS.HERO10_BLACK],
    aliases: [1, 100],
    canonicalValue: 100,
  },
  {
    settingId: GoProSettingId.HORIZONTAL_LEVELING,
    modelNos: [GOPRO_MODEL_NUMBERS.HERO11_BLACK, GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI],
    aliases: [1, 2],
    canonicalValue: 2,
  },
  {
    settingId: GoProSettingId.HORIZONTAL_LOCK,
    modelNos: [GOPRO_MODEL_NUMBERS.HERO11_BLACK, GOPRO_MODEL_NUMBERS.HERO11_BLACK_MINI],
    aliases: [1, 2],
    canonicalValue: 2,
  },
];

const doesAliasRuleMatch = (
  rule: SettingValueAliasRule,
  settingId: number,
  value: number,
  context: SettingValueComparisonContext,
): boolean => {
  if (rule.settingId !== settingId) return false;
  const modelNo =
    context.modelNo ??
    resolveModelNoFromCameraModelKey(
      context.modelKey as import('./ResolutionAspectMap').CameraModelKey | null | undefined,
    );
  if (!rule.modelNos.includes(modelNo as GoProModelNumber)) return false;
  if (!rule.aliases.includes(value)) return false;

  return true;
};

export const normalizeSettingValueForComparison = (
  settingId: number,
  value: number | undefined,
  context: SettingValueComparisonContext = {},
): number | undefined => {
  if (value === undefined) return value;

  for (const rule of SETTING_VALUE_ALIAS_RULES) {
    if (doesAliasRuleMatch(rule, settingId, value, context)) {
      return rule.canonicalValue;
    }
  }

  return value;
};

export const areSettingValuesEquivalent = (
  settingId: number,
  left: number | undefined,
  right: number | undefined,
  context: SettingValueComparisonContext = {},
): boolean => {
  if (left === undefined || right === undefined) return left === right;
  return (
    normalizeSettingValueForComparison(settingId, left, context) ===
    normalizeSettingValueForComparison(settingId, right, context)
  );
};

export const dedupeEquivalentSettingValues = (
  settingId: number,
  values: readonly number[],
  context: SettingValueComparisonContext = {},
): number[] => {
  const seen = new Set<number>();
  return values.filter((value) => {
    const normalized = normalizeSettingValueForComparison(settingId, value, context) ?? value;
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const translateSettingLabel = (id: number, englishName: string): string =>
  t(`metadata.settingNames.${id}`, { defaultValue: englishName });

export const getSettingName = (
  id: number,
  modelKey?: import('./ResolutionAspectMap').CameraModelKey,
  presetId?: number,
  mediaFormat?: number,
): string => {
  const modelNo = resolveModelNoFromCameraModelKey(modelKey);
  if (isMaxModel(modelNo) && id === GoProSettingId.MAX_LENS_DIRECTION) {
    return translateSettingLabel(GoProSettingId.MAX_LENS_DIRECTION, 'Lens Direction');
  }
  if (isMaxModel(modelNo) && id === GoProSettingId.HORIZONTAL_LEVELING) {
    return translateSettingLabel(GoProSettingId.HORIZONTAL_LEVELING, 'Horizontal Lock');
  }
  if (isMaxModel(modelNo) && id === GoProSettingId.MAX_AUDIO_MODE) {
    // 360 Video (presetId=196608): "360 Audio" / Standard Video: "Mics"
    const englishName = presetId === 196608 ? '360 Audio' : 'Mics';
    return translateSettingLabel(id, englishName);
  }
  // Hero09: Reuses TIME_LAPSE_LENS (123) as the MultiShotLens for Burst.
  // Display as 'Lens' while the Burst preset is active (shows 'Time Lapse Lens' on other models/presets).
  if (
    modelNo === GOPRO_MODEL_NUMBERS.HERO09_BLACK &&
    id === GoProSettingId.TIME_LAPSE_LENS &&
    presetId === 65538
  ) {
    return translateSettingLabel(id, 'Lens');
  }
  // All models: Nightlapse Video uses MULTI_SHOT_DURATION (ID=157)
  // but displays it with the label 'Video Duration'.
  // * Note: Displays as 'Multi Shot Duration' in Nightlapse Photo (format=21).
  if (id === GoProSettingId.MULTI_SHOT_DURATION) {
    const cat = classifyTimelapsePreset(presetId);
    if (cat === 'lapse_with_photo' && mediaFormat === 26 /* Nightlapse Video */) {
      return translateSettingLabel(id, 'Video Duration');
    }
  }
  const englishName = GOPRO_SETTINGS_METADATA[id]?.name || `Unknown (${id})`;
  return translateSettingLabel(id, englishName);
};

export const getSettingValueName = (id: number, value: number): string => {
  return GOPRO_SETTINGS_METADATA[id]?.values[value] || `Val: ${value}`;
};

export interface SettingValueLabelContext {
  settings?: Record<number, number | undefined>;
}

type ContextualSettingValueNameResolver = (
  value: number,
  model: import('./ResolutionAspectMap').CameraModelKey,
  context: SettingValueLabelContext,
) => string | undefined;

const HERO13_GP_LOG_VIDEO_PROFILE_VALUES = new Set<number>([2, 3, 102]);
const HERO13_GP_LOG_COLOR_VALUES = new Set<number>([2, 3, 101]);

const CONTEXTUAL_SETTING_VALUE_NAME_RESOLVERS: Partial<
  Record<number, ContextualSettingValueNameResolver>
> = {
  [GoProSettingId.COLOR]: (value, model, context) => {
    if (model !== 'hero13') return undefined;
    const profileValue = context.settings?.[GoProSettingId.VIDEO_PROFILE];
    if (profileValue === undefined || !HERO13_GP_LOG_VIDEO_PROFILE_VALUES.has(profileValue))
      return undefined;
    if (HERO13_GP_LOG_COLOR_VALUES.has(value)) return 'GP-Log';
    return undefined;
  },
};

const getEffectiveCapabilityPolicy = (
  settingId: number,
  modelKey?: string | null,
  modelNo?: number | null,
  overlay?: FirmwareOverlay,
) => overlay?.capabilityPolicy ?? getCapabilityPolicy(settingId, modelKey, modelNo);

const sortValuesByPreferredOrder = (
  values: readonly number[],
  preferredOrder?: readonly number[],
): number[] => {
  if (!preferredOrder || preferredOrder.length === 0) {
    return [...values];
  }

  const indexMap = new Map<number, number>();
  preferredOrder.forEach((value, idx) => {
    indexMap.set(value, idx);
  });

  return [...values]
    .map((value, originalIndex) => ({
      value,
      originalIndex,
      rank: indexMap.has(value) ? indexMap.get(value)! : Number.MAX_SAFE_INTEGER,
    }))
    .sort((left, right) => {
      if (left.rank !== right.rank) return left.rank - right.rank;
      return left.originalIndex - right.originalIndex;
    })
    .map((entry) => entry.value);
};

const applyFirmwareOverlayToValues = (
  values: readonly number[],
  overlay?: FirmwareOverlay,
  preferredOrder?: readonly number[],
): number[] => {
  let nextValues = [...values];

  if (overlay?.removedValues?.length) {
    const removedValues = new Set(overlay.removedValues);
    nextValues = nextValues.filter((value) => !removedValues.has(value));
  }

  if (overlay?.addedValues) {
    for (const value of Object.keys(overlay.addedValues).map(Number)) {
      if (!Number.isNaN(value) && !nextValues.includes(value)) {
        nextValues.push(value);
      }
    }
  }

  const effectiveOrder = overlay?.overrideOrder ?? preferredOrder;
  return sortValuesByPreferredOrder(nextValues, effectiveOrder);
};

const mergeValuesWithStaticSuperset = (
  values: readonly number[],
  preferred: readonly number[],
): number[] => {
  const mergedValues = [...preferred];
  for (const value of values) {
    if (!mergedValues.includes(value)) {
      mergedValues.push(value);
    }
  }
  return mergedValues;
};

const getFirmwareOverlayLabel = (value: number, overlay?: FirmwareOverlay): string | undefined =>
  overlay?.overrideLabels?.[value] ?? overlay?.addedValues?.[value];

/**
 * Overrides for cases where the same value number of the same Setting ID has different meanings on Hero12.
 * RESOLUTION is excluded here because it uses the model-specific full mapping in `ResolutionAspectMap.ts`.
 * Only other settings with model-specific value label discrepancies are added here.
 */
/**
 * Returns the value label corresponding to the camera model and current configuration context.
 * RESOLUTION prioritizes the model-specific mapping (ResolutionAspectMap) and falls back to the base dictionary only if not found.
 * Settings requiring context-dependent labels go through CONTEXTUAL_SETTING_VALUE_NAME_RESOLVERS;
 * others check MODEL_VALUE_OVERRIDES before falling back to GOPRO_SETTINGS_METADATA.
 */
export const getSettingValueNameForModelWithContext = (
  rawSettingId: number,
  value: number,
  model: import('./ResolutionAspectMap').CameraModelKey,
  context: SettingValueLabelContext = {},
  firmwareVersion?: string | null,
): string => {
  const id = resolveSemanticSettingId(rawSettingId, model);
  const overlay = getActiveFirmwareOverlay(id, model, firmwareVersion);

  const overlayLabel = getFirmwareOverlayLabel(value, overlay);
  if (overlayLabel !== undefined) return overlayLabel;

  if (id === GoProSettingId.RESOLUTION) {
    const modelLabel = getResolutionLabel(model, value);
    if (modelLabel !== null) return modelLabel;
  }

  const contextualResolver = CONTEXTUAL_SETTING_VALUE_NAME_RESOLVERS[id];
  if (contextualResolver) {
    const contextualLabel = contextualResolver(value, model, context);
    if (contextualLabel !== undefined) return contextualLabel;
  }

  const modelNo = resolveModelNoFromCameraModelKey(model);
  const modelOverride = modelNo !== null ? MODEL_VALUE_OVERRIDES[modelNo] : undefined;
  if (modelOverride) {
    const override = modelOverride[id]?.[value];
    if (override !== undefined) return override;
  }
  return GOPRO_SETTINGS_METADATA[id]?.values[value] || `Val: ${value}`;
};

export const getSettingValueNameForModel = (
  id: number,
  value: number,
  model: import('./ResolutionAspectMap').CameraModelKey,
): string => {
  return getSettingValueNameForModelWithContext(id, value, model);
};

/**
 * Returns boolOnValue / boolOffValue corresponding to the camera model.
 * Uses the model-specific entry in GOPRO_BOOL_VALUES_MODEL_OVERRIDE if it exists;
 * otherwise, falls back to base values in GOPRO_SETTINGS_METADATA.
 */
export const getBoolValues = (
  settingId: number,
  modelKey?: string | null,
): { onValue: number; offValue: number } => {
  const meta = GOPRO_SETTINGS_METADATA[settingId];
  const baseOn = meta?.boolOnValue ?? 1;
  const baseOff = meta?.boolOffValue ?? 0;
  if (modelKey) {
    const modelNo = resolveModelNoFromCameraModelKey(modelKey as CameraModelKey);
    const modelOverride = modelNo !== null ? GOPRO_BOOL_VALUES_MODEL_OVERRIDE[modelNo] : undefined;
    const override = modelOverride?.[settingId];
    if (override) {
      return { onValue: override.onValue ?? baseOn, offValue: override.offValue ?? baseOff };
    }
  }
  return { onValue: baseOn, offValue: baseOff };
};

/* =========================================================================
 * Static Fallback Policy Logic
 * ========================================================================= */

export const getOrderedSettingValues = (
  rawSettingId: number,
  values: number[],
  modelKey?: string | null,
  firmwareVersion?: string | null,
): number[] => {
  const modelNo = modelKey ? resolveModelNoFromCameraModelKey(modelKey as CameraModelKey) : null;
  const settingId = resolveSemanticSettingId(rawSettingId, modelKey, modelNo);
  const overlay = getActiveFirmwareOverlay(settingId, modelKey, firmwareVersion);

  const preferred = GOPRO_SETTING_VALUE_ORDER[settingId];
  if (!preferred || preferred.length === 0) {
    return applyFirmwareOverlayToValues(values, overlay);
  }

  const policy = getEffectiveCapabilityPolicy(settingId, modelKey, modelNo, overlay);

  if (policy === 'staticAlways') {
    const modelOverride =
      modelNo !== null
        ? GOPRO_SETTING_STATIC_FALLBACKS_MODEL_OVERRIDE[settingId]?.[modelNo]
        : undefined;
    return applyFirmwareOverlayToValues(
      modelOverride ?? preferred,
      overlay,
      modelOverride ?? preferred,
    );
  }

  if (values.length === 0 && policy === 'staticWhenEmpty') {
    const modelOverride =
      modelNo !== null
        ? GOPRO_SETTING_STATIC_FALLBACKS_MODEL_OVERRIDE[settingId]?.[modelNo]
        : undefined;
    return applyFirmwareOverlayToValues(
      modelOverride ?? preferred,
      overlay,
      modelOverride ?? preferred,
    );
  }

  if (policy === 'dynamicWithStaticSupersetCheck') {
    const modelOverrideOrder =
      modelNo !== null ? GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE[settingId]?.[modelNo] : undefined;
    const effectivePreferred = modelOverrideOrder ?? preferred;
    return applyFirmwareOverlayToValues(
      mergeValuesWithStaticSuperset(values, effectivePreferred),
      overlay,
      effectivePreferred,
    );
  }

  if (values.length === 0) {
    return [];
  }

  if (policy === 'dynamicWithStaticOrderAndLabelFallback') {
    return applyFirmwareOverlayToValues(values, overlay, preferred);
  }

  // -------------------------------------------------------------------------
  // Policy: dynamicOnly
  // -------------------------------------------------------------------------

  // Model-specific override takes priority over the generic preferred order.
  const modelOverrideOrder =
    modelNo !== null ? GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE[settingId]?.[modelNo] : undefined;
  const effectivePreferred = modelOverrideOrder ?? preferred;

  return applyFirmwareOverlayToValues(values, overlay, effectivePreferred);
};

/**
 * Returns the display name corresponding to the preset ID and camera model.
 * Since custom presets are overridden by customName, this returns the default name only.
 */
/**
 * Override table for model-specific preset display names.
 * Used when the same presetId maps to different display names on different models.
 *
 * Reference: ProTuneRemote/Database/UIPresetRepository.cs per-model sections
 *
 * [PresetId Conflicts Summary]
 *   196608: GoPro MAX = "360 Video"  / Hero11, 12, 10 = "Max Video"     / Hero13 = (non-existent)
 *   262144: GoPro MAX = "360 Photo"  / Hero11, 12, 10 = "Max Photo"     / Hero13 = (non-existent)
 *   327680: GoPro MAX = "360 TimeWarp" / Hero10, 11, 12 = "Max TimeWarp"
 *   327681: GoPro MAX = "360 TimeLapse" / Hero10 = "Max TimeLapse"
 *   3:      Hero11 = "Full Frame"    / Hero13 = "Slo-Mo"                / Other = "Slo-Mo"
 *   1:      Hero13 = "Burst Slo-Mo"  / Other = "Activity"
 *   655360: Hero11 = "Video"(Easy)   / HeroMini11 = "Extended Battery"  / Hero12 = "Highest Quality" / Hero13 = "Easy Standard Video"
 *   655361: HeroMini11 = "Longest Battery" / Hero12 = "Standard Quality" / Hero13 = "Easy HDR Video"
 *   655362: HeroMini11 = "Highest Quality" / Hero12 = "Basic Quality"   / Hero13 metadata = "Highest Quality" (OK)
 *   1245184: Hero12 Easy = "Max Video" (EasyMaxVideo)
 *   1441792: Hero12 Easy = "Max Video 2.0" / Hero13 Easy = "Easy Max Video"
 */
export const getPresetDisplayName = (presetId: number, model?: string): string => {
  // Check the model-specific override table first (since model-specific IDs might not exist in base metadata)
  if (model && model !== 'unknown') {
    const typedModel = model as import('./ResolutionAspectMap').CameraModelKey;
    const modelNo = resolveModelNoFromCameraModelKey(typedModel);
    const overrides = modelNo !== null ? PRESET_NAME_OVERRIDES[modelNo] : undefined;
    if (overrides) {
      const overrideName = overrides[presetId];
      if (overrideName !== undefined) return overrideName;
    }
  }

  const baseName = GOPRO_SETTINGS_METADATA[GoProSettingId.MODE_PRESET]?.values[presetId];
  if (!baseName) return `Preset ${presetId}`;

  return baseName;
};

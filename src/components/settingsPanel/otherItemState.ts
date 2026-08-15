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

import { GOPRO_SETTINGS_METADATA } from '../../constants/GoProMetadata';
import { GoProSettingId } from '../../constants/GoProSettingId';
import { getSettingConstraint } from '../../constants/settingConstraints';
import { dispatchOtherItemResolver } from '../../cameraModels/shared/otherItem';
import type {
  ModelResolverMap,
  OtherItemKind,
  OtherItemState,
  OtherItemResolver,
  ResolveOtherItemStateParams,
} from '../../cameraModels/shared/types';

const OTHER_ITEM_RESOLVERS: ModelResolverMap<OtherItemResolver> = {};

const resolveFallbackOtherItemState = ({
  settingId,
  settings,
  capabilities,
  cameraModel,
  allowedValues,
  dashboardSubSettingIds,
}: ResolveOtherItemStateParams): OtherItemState => {
  const constraint = getSettingConstraint(settingId, settings, cameraModel);
  const isConstrained = constraint !== 'ok';
  const isDashboardSubSetting = dashboardSubSettingIds.includes(settingId);
  const capabilityReceived = capabilities[settingId] !== undefined;
  const currentValue = settings[settingId];
  const isMediaModMic = settingId === GoProSettingId.MEDIA_MOD_MIC;
  const isSingleFixedValue =
    capabilityReceived && allowedValues.length === 1 && currentValue === allowedValues[0];
  const isCapabilityDisabled =
    !isConstrained &&
    !isMediaModMic &&
    !isDashboardSubSetting &&
    capabilityReceived &&
    (allowedValues.length === 0 || isSingleFixedValue);
  const isDashboardOverrideOn = settings[GoProSettingId.DASHBOARD_OVERRIDE] === 1;
  const isVoiceLanguageBlocked =
    settingId === GoProSettingId.VOICE_LANGUAGE && isDashboardOverrideOn;
  const isFrontDisplayBlocked =
    settingId === GoProSettingId.FRONT_LCD_MODE && isDashboardOverrideOn;

  let kind: OtherItemKind;
  if (constraint === 'na') {
    kind = 'na';
  } else if (settingId === GoProSettingId.SCHEDULED_CAPTURE) {
    kind = 'scheduledCapture';
  } else if (GOPRO_SETTINGS_METADATA[settingId]?.sliderConfig) {
    kind = 'slider';
  } else if (GOPRO_SETTINGS_METADATA[settingId]?.isToggleButton === true) {
    kind = 'toggleButton';
  } else if (GOPRO_SETTINGS_METADATA[settingId]?.isBool === true) {
    kind = 'bool';
  } else {
    kind = 'default';
  }

  return {
    kind,
    constraint,
    isCapabilityDisabled,
    isEffectivelyDisabled:
      isConstrained || isCapabilityDisabled || isVoiceLanguageBlocked || isFrontDisplayBlocked,
  };
};

export const resolveOtherItemState = (params: ResolveOtherItemStateParams) => {
  return dispatchOtherItemResolver(params, OTHER_ITEM_RESOLVERS, resolveFallbackOtherItemState);
};

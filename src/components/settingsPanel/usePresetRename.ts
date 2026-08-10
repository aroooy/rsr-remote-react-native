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
 * Preset rename feature, encapsulated as a hook.
 *
 * Owns all custom-preset rename state and behavior (extracted verbatim from
 * SettingsPanel). It also exposes getPresetLabel and supportsPresetRename
 * because the main preset list relies on them, so the whole rename concern
 * lives here. Render the returned `modalState` with <PresetRenameModal>.
 *
 * Rename is HERO12/HERO13 only (BLE 0xF1/0x64) and targets user_defined
 * presets; the camera can only rename the active preset, so openRename loads
 * the preset first when needed.
 */
import { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { goProBle } from '../../ble/GoProBLEManager';
import { getCustomPresetNameValidationError } from '../../ble/presetRenameValidation';
import { getPresetDisplayName } from '../../constants/GoProMetadata';
import { getPresetLabelFromIconId } from '../../constants/PresetIconMap';
import { isHero12Or13Model } from '../../cameraModels/shared/modelNoHelpers';
import type { GoProPreset, GoProPresetGroupData } from '../../ble/PresetProtobuf';
import type { CameraModelKey } from '../../constants/ResolutionAspectMap';

export type GetPresetLabel = (
  presetId: number,
  customName: string | null,
  iconId: number | undefined,
) => string;

export interface PresetRenameModalState {
  renameTargetId: number | null;
  renameTargetPreset: GoProPreset | null;
  renameInput: string;
  setRenameInput: (s: string) => void;
  renameSaving: boolean;
  renameIconId: number | undefined;
  setRenameIconId: (id: number) => void;
  showMoreIcons: boolean;
  setShowMoreIcons: (v: boolean) => void;
  isRenameKeyboardVisible: boolean;
  closeRenameModal: () => void;
  submitRename: () => Promise<void>;
  getPresetLabel: GetPresetLabel;
}

export interface UsePresetRenameResult {
  supportsPresetRename: boolean;
  getPresetLabel: GetPresetLabel;
  openRename: (preset: {
    id: number;
    userDefined: boolean;
    customName: string | null;
    iconId?: number;
  }) => Promise<void>;
  modalState: PresetRenameModalState;
}

export const usePresetRename = (params: {
  presets: GoProPresetGroupData[];
  currentModelNo: number | null;
  currentPresetId: number | undefined;
  cameraModel: CameraModelKey;
}): UsePresetRenameResult => {
  const { presets, currentModelNo, currentPresetId, cameraModel } = params;
  const { t } = useTranslation();

  const [renameTargetId, setRenameTargetId] = useState<number | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);
  const [renameIconId, setRenameIconId] = useState<number | undefined>(undefined);
  const [showMoreIcons, setShowMoreIcons] = useState(false);
  const [isRenameKeyboardVisible, setIsRenameKeyboardVisible] = useState(false);

  const renameTargetPreset = useMemo(() => {
    if (renameTargetId === null) return null;
    for (const group of presets) {
      for (const p of group.presets) {
        if (p.id === renameTargetId) return p;
      }
    }
    return null;
  }, [renameTargetId, presets]);

  // HERO11 and earlier models do not support RequestCustomPresetUpdate
  const supportsPresetRename = useMemo(() => isHero12Or13Model(currentModelNo), [currentModelNo]);

  const getPresetLabel: GetPresetLabel = (presetId, customName, iconId) => {
    if (supportsPresetRename && customName) return customName;

    const defaultLabel = getPresetDisplayName(presetId, cameraModel);
    if (defaultLabel === `Preset ${presetId}`) {
      return getPresetLabelFromIconId(iconId) ?? defaultLabel;
    }

    return defaultLabel;
  };

  const openRename = async (preset: {
    id: number;
    userDefined: boolean;
    customName: string | null;
    iconId?: number;
  }) => {
    // Do nothing for factory presets (prioritizing visual cleanliness over discoverability)
    if (!preset.userDefined) return;
    if (!supportsPresetRename) return;

    // Renaming is only possible for the active preset, so load it first if not active
    if (currentPresetId !== preset.id) {
      try {
        await goProBle.loadPreset(preset.id);
        // Wait briefly for the camera to switch presets
        await new Promise((r) => setTimeout(r, 350));
      } catch {
        // Open the modal even if preset load fails (user can retry)
      }
    }

    setRenameInput(getPresetLabel(preset.id, preset.customName, preset.iconId));
    setRenameIconId(undefined); // undefined = do not change (respect current icon)
    setShowMoreIcons(false);
    setRenameTargetId(preset.id);
  };

  const closeRenameModal = () => {
    if (renameSaving) return;
    setRenameTargetId(null);
    setRenameInput('');
    setRenameIconId(undefined);
    setShowMoreIcons(false);
    setIsRenameKeyboardVisible(false);
  };

  useEffect(() => {
    if (renameTargetId === null) {
      setIsRenameKeyboardVisible(false);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsRenameKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsRenameKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [renameTargetId]);

  const submitRename = async () => {
    const name = renameInput.trim();
    const validationError = getCustomPresetNameValidationError(name);
    if (validationError) {
      Alert.alert(t('control.invalidName'), validationError);
      return;
    }
    setRenameSaving(true);
    try {
      const ok = await goProBle.renameActivePreset(name, renameIconId);
      if (ok) {
        setRenameTargetId(null);
        setRenameInput('');
        setRenameIconId(undefined);
        setShowMoreIcons(false);
      } else {
        Alert.alert(t('control.updateFailed'), t('control.updateFailedDesc'));
      }
    } finally {
      setRenameSaving(false);
    }
  };

  return {
    supportsPresetRename,
    getPresetLabel,
    openRename,
    modalState: {
      renameTargetId,
      renameTargetPreset,
      renameInput,
      setRenameInput,
      renameSaving,
      renameIconId,
      setRenameIconId,
      showMoreIcons,
      setShowMoreIcons,
      isRenameKeyboardVisible,
      closeRenameModal,
      submitRename,
      getPresetLabel,
    },
  };
};

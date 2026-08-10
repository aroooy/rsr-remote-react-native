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

import { GoProPresetGroup } from '../../constants/GoProPresetGroup';
import { HERO12_EASY_QUALITY_PRESET_IDS } from '../../constants/presetIds';
import type { ModelDisplayLayoutResolver, ResolveModelDisplayLayoutParams } from '../shared/types';

export const hero12DisplayLayoutResolver: ModelDisplayLayoutResolver = ({
  currentGroupId,
  currentPresetId,
  cameraModel,
  composeDisplayLayout,
  getCameraAdvancedSettingIds,
  easyVideoPresets,
  layouts,
}: ResolveModelDisplayLayoutParams) => {
  if (
    currentGroupId === GoProPresetGroup.VIDEO &&
    currentPresetId !== undefined &&
    easyVideoPresets.has(currentPresetId)
  ) {
    if (HERO12_EASY_QUALITY_PRESET_IDS.has(currentPresetId)) {
      return composeDisplayLayout(
        layouts.hero12EasyQualityVideo,
        getCameraAdvancedSettingIds(cameraModel),
      );
    }
    return composeDisplayLayout(layouts.legacyEasyVideo, getCameraAdvancedSettingIds(cameraModel));
  }

  return undefined;
};

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

import type { ResolveTimelapseLayoutParams, TimelapseLayoutStateResolver } from '../shared/types';

export const hero13TimelapseLayoutStateResolver: TimelapseLayoutStateResolver = ({
  activePreset,
  category,
  isVideoFormat,
  lensAttachment,
  ids,
  hero13MaxLensAttachmentValues,
  hero13MaxTrail2Presets,
}: ResolveTimelapseLayoutParams) => {
  if (
    category === 'trail_like' &&
    activePreset !== undefined &&
    hero13MaxTrail2Presets.has(activePreset)
  ) {
    return {
      videoModeLensId: ids.videoLensHero13,
      lapseBitRateIds: hero13MaxLensAttachmentValues.includes(lensAttachment ?? -1)
        ? [ids.videoBitrate]
        : [],
      windReductionSettingId: ids.windReduction,
    };
  }

  if (category === 'timewarp_like') {
    return {
      videoModeLensId: ids.videoLensHero13,
      quickTimewarpIds: [ids.resolution, ids.fps, ids.videoLensHero13],
      lapseBitRateIds: [ids.videoBitrate],
      windReductionSettingId: ids.windReduction,
    };
  }

  if (category === 'lapse_with_photo' && isVideoFormat) {
    return {
      videoModeLensId: ids.videoLensHero13,
      windReductionSettingId: ids.windReduction,
    };
  }

  return {
    videoModeLensId: ids.videoLensHero13,
    windReductionSettingId: ids.windReduction,
  };
};

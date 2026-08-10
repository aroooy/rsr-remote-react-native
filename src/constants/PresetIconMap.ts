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
 * GoPro EnumPresetIcon -> Ionicons mapping
 *
 * Reference: https://gopro.github.io/OpenGoPro/ble/protocol/protobuf.html#proto-enumpreseticon
 *
 * There are 125+ kinds of EnumPresetIcon, but only commonly used ones are mapped to Ionicons.
 * Unmapped ones return null, which falls back to the group default icon on the caller side.
 *
 * Note: Since Ionicons does not have perfectly matching icons for many items,
 * they are assigned at a "close enough meaning" level. There is room for using custom SVGs in the future.
 */

// The Ionicons name strictly has a type, but we keep it loosely as string here
// (cast as <Ionicons name={name as any} /> on the usage side)
export const PRESET_ICON_TO_IONICON: Record<number, string> = {
  // --- Video ---
  0: 'videocam', // VIDEO
  1: 'walk', // ACTIVITY
  2: 'film-outline', // CINEMATIC
  11: 'videocam-outline', // VIDEO_2

  // --- Photo ---
  3: 'camera', // PHOTO
  4: 'flash', // LIVE_BURST
  5: 'layers', // BURST
  6: 'moon', // PHOTO_NIGHT
  13: 'camera-outline', // PHOTO_2
  14: 'scan', // PANORAMA
  15: 'layers-outline', // BURST_2

  // --- Timelapse ---
  7: 'infinite', // TIMEWARP
  8: 'timer-outline', // TIMELAPSE
  9: 'moon-outline', // NIGHTLAPSE
  16: 'infinite-outline', // TIMEWARP_2
  17: 'timer', // TIMELAPSE_2

  // --- Mode / Style ---
  10: 'snow-outline', // SNAIL (Slo-mo 系)
  18: 'options', // CUSTOM

  // --- Activity icons ---
  19: 'airplane', // AIR
  20: 'bicycle', // BIKE
  21: 'flame', // EPIC
  22: 'home', // INDOOR
  23: 'car-sport', // MOTOR
  24: 'cube', // MOUNTED
  25: 'leaf', // OUTDOOR
  26: 'eye', // POV
  27: 'person', // SELFIE
  28: 'walk-outline', // SKATE
  29: 'snow', // SNOW
  30: 'trail-sign', // TRAIL
  31: 'map', // TRAVEL
  32: 'water', // WATER
  33: 'repeat', // LOOPING
  34: 'star', // STARS
  35: 'flash-outline', // ACTION
  36: 'people', // FOLLOW_CAM
  37: 'water-outline', // SURF
  38: 'business', // CITY
  39: 'pulse', // SHAKY

  // --- Mount / Gear ---
  40: 'body', // CHESTY
  41: 'hardware-chip', // HELMET
  42: 'paw', // BITE

  // --- Profile ---
  43: 'film', // CUSTOM_CINEMATIC
  44: 'mic', // VLOG
  45: 'rocket', // FPV
  46: 'sunny', // HDR
  47: 'image', // LANDSCAPE
  48: 'document-text', // LOG
  49: 'snow-outline', // CUSTOM_SLOMO
  50: 'camera-reverse', // TRIPOD

  // --- MAX ---
  55: 'globe-outline', // MAX_VIDEO
  56: 'aperture', // MAX_PHOTO
  57: 'globe', // MAX_TIMEWARP

  // --- Quality tier ---
  58: 'ellipse-outline', // BASIC
  59: 'flash', // ULTRA_SLO_MO
  60: 'videocam', // STANDARD_ENDURANCE
  61: 'walk', // ACTIVITY_ENDURANCE
  62: 'film-outline', // CINEMATIC_ENDURANCE
  63: 'flash-outline', // SLOMO_ENDURANCE

  // Stationary (Fixed camera)
  64: 'locate', // STATIONARY_1
  65: 'locate', // STATIONARY_2
  66: 'locate', // STATIONARY_3
  67: 'locate', // STATIONARY_4

  // --- Simple mode ---
  70: 'camera', // SIMPLE_SUPER_PHOTO
  71: 'moon', // SIMPLE_NIGHT_PHOTO
  73: 'trophy', // HIGHEST_QUALITY_VIDEO
  74: 'ribbon', // STANDARD_QUALITY_VIDEO
  75: 'ellipse-outline', // BASIC_QUALITY_VIDEO

  // --- Special / Long exposure ---
  76: 'sparkles', // STAR_TRAIL
  77: 'bulb', // LIGHT_PAINTING
  78: 'flashlight', // LIGHT_TRAIL
  79: 'expand', // FULL_FRAME

  // Burst / misc
  102: 'flash-outline', // BURST_SLOMO
  124: 'trophy-outline', // SPORT_POV

  // Timelapse/Nightlapse photo
  1000: 'timer-outline', // TIMELAPSE_PHOTO
  1001: 'moon-outline', // NIGHTLAPSE_PHOTO
};

/**
 * groupId -> Group default icon (fallback when icon ID is not mapped)
 */
export const PRESET_GROUP_DEFAULT_ICON: Record<number, string> = {
  1000: 'videocam', // Video group
  1001: 'camera', // Photo group
  1002: 'timer-outline', // Timelapse group
  2000: 'ellipsis-horizontal', // General
};

export const PRESET_ICON_LABELS: Partial<Record<number, string>> = {
  0: 'Video',
  1: 'Activity',
  2: 'Cinematic',
  3: 'Photo',
  4: 'Live Burst',
  5: 'Burst',
  6: 'Night Photo',
  7: 'TimeWarp',
  8: 'Time Lapse',
  9: 'Night Lapse',
  10: 'Slo-Mo',
  18: 'Custom',
  19: 'Air',
  20: 'Bike',
  21: 'Epic',
  22: 'Indoor',
  23: 'Motor',
  24: 'Mounted',
  25: 'Outdoor',
  26: 'POV',
  27: 'Selfie',
  28: 'Skate',
  29: 'Snow',
  30: 'Trail',
  31: 'Travel',
  32: 'Water',
  33: 'Looping',
  34: 'Stars',
  35: 'Action',
  36: 'Follow Cam',
  37: 'Surf',
  38: 'City',
  39: 'Shaky',
  40: 'Chesty',
  41: 'Helmet',
  42: 'Bite',
  43: 'Cinematic',
  44: 'Vlog',
  45: 'FPV',
  46: 'HDR',
  47: 'Landscape',
  48: 'Log',
  49: 'Slo-Mo',
  50: 'Tripod',
  55: 'Max Video',
  56: 'Max Photo',
  57: 'Max TimeWarp',
  58: 'Basic',
  59: 'Ultra Slo-Mo',
  60: 'Standard',
  61: 'Activity',
  62: 'Cinematic',
  63: 'Slo-Mo',
  64: 'Stationary',
  65: 'Stationary',
  66: 'Stationary',
  67: 'Stationary',
  70: 'Super Photo',
  71: 'Night Photo',
  73: 'Highest Quality',
  74: 'Standard Quality',
  75: 'Basic Quality',
  76: 'Star Trail',
  77: 'Light Painting',
  78: 'Light Trail',
  79: 'Full Frame',
  102: 'Burst Slo-Mo',
  124: 'Sport POV',
  1000: 'Time Lapse Photo',
  1001: 'Night Lapse Photo',
};

export function getPresetLabelFromIconId(iconId: number | undefined): string | undefined {
  if (iconId === undefined) return undefined;
  return PRESET_ICON_LABELS[iconId];
}

export function getPresetIoniconName(
  iconId: number | undefined,
  groupId: number | undefined,
): string {
  if (iconId !== undefined) {
    const name = PRESET_ICON_TO_IONICON[iconId];
    if (name) return name;
  }
  if (groupId !== undefined) {
    const fallback = PRESET_GROUP_DEFAULT_ICON[groupId];
    if (fallback) return fallback;
  }
  return 'ellipse-outline';
}

// ---------------------------------------------------------------------------
// Icon picker curation
// A curated set of icons selectable in the Rename modal, expandable with a "More" button.
// Which icon_id the camera actually accepts depends on the camera (according to Open GoPro spec,
// "The range of acceptable custom icon ID's can be found in the initial
// NotifyPresetStatus response", but since we don't know it beforehand, we list commonly used IDs
// by default, and if preset update fails, we inform the user by checking the result of ResponseGeneric).
// ---------------------------------------------------------------------------

export type PresetIconChoice = {
  id: number; // EnumPresetIcon value
  ionicon: string;
  label: string; // tooltip / accessibility
};

/** Curated icons shown initially (representative icons across groups) */
export const PRIMARY_ICON_CHOICES: PresetIconChoice[] = [
  { id: 18, ionicon: 'options', label: 'Custom' },
  { id: 0, ionicon: 'videocam', label: 'Video' },
  { id: 2, ionicon: 'film-outline', label: 'Cinematic' },
  { id: 1, ionicon: 'walk', label: 'Activity' },
  { id: 3, ionicon: 'camera', label: 'Photo' },
  { id: 5, ionicon: 'layers', label: 'Burst' },
  { id: 6, ionicon: 'moon', label: 'Night Photo' },
  { id: 7, ionicon: 'infinite', label: 'TimeWarp' },
  { id: 8, ionicon: 'timer-outline', label: 'Time Lapse' },
  { id: 46, ionicon: 'sunny', label: 'HDR' },
  { id: 44, ionicon: 'mic', label: 'Vlog' },
  { id: 10, ionicon: 'flash', label: 'Slo-Mo' },
];

/** Extended icons shown when clicking "More" */
export const EXTENDED_ICON_CHOICES: PresetIconChoice[] = [
  { id: 20, ionicon: 'bicycle', label: 'Bike' },
  { id: 23, ionicon: 'car-sport', label: 'Motor' },
  { id: 26, ionicon: 'eye', label: 'POV' },
  { id: 27, ionicon: 'person', label: 'Selfie' },
  { id: 37, ionicon: 'water-outline', label: 'Surf' },
  { id: 29, ionicon: 'snow', label: 'Snow' },
  { id: 32, ionicon: 'water', label: 'Water' },
  { id: 25, ionicon: 'leaf', label: 'Outdoor' },
  { id: 38, ionicon: 'business', label: 'City' },
  { id: 31, ionicon: 'map', label: 'Travel' },
  { id: 19, ionicon: 'airplane', label: 'Air' },
  { id: 45, ionicon: 'rocket', label: 'FPV' },
  { id: 34, ionicon: 'star', label: 'Stars' },
  { id: 76, ionicon: 'sparkles', label: 'Star Trail' },
  { id: 77, ionicon: 'bulb', label: 'Light Paint' },
  { id: 50, ionicon: 'camera-reverse', label: 'Tripod' },
  { id: 33, ionicon: 'repeat', label: 'Looping' },
  { id: 9, ionicon: 'moon-outline', label: 'Night Lapse' },
];

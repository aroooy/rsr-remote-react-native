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

import { GoProSettingId } from '../GoProSettingIds';
import type { SettingMetadata } from './types';

// Migrate major setting items from legacy C# GoProAttribute.cs
export const GOPRO_SETTINGS_METADATA: { [settingId: number]: SettingMetadata } = {
  [GoProSettingId.RESOLUTION]: {
    name: 'Resolution',
    values: {
      1: '4K',
      4: '2.7K',
      6: '2.7K 4:3',
      7: '1440',
      9: '1080',
      12: '720',
      18: 'Max4K 8:7',
      24: '5.3K',
      100: '5.3K',
      101: '5.3K 4:3',
      102: '4K 8:7',
      103: '5.3K 8:7',
      107: '5.3K 8:7',
      108: '4K 8:7',
      109: '4K 9:16',
      110: '1080 9:16',
      111: '2.7K 4:3',
      35: '5.3K 21:9',
      36: '4K 21:9',
      37: '4K 1:1',
      38: '900',
      112: '4K 4:3',
      113: '5.3K 4:3',
      // Hero12 specific values
      26: '5.3K 8:7',
      28: '4K 8:7',
      29: '4K 9:16',
      30: '1080 9:16',
      104: '2.7K',
      105: '2.7K 4:3',
      106: '1080',
    },
  },
  [GoProSettingId.FPS]: {
    name: 'FPS',
    values: {
      0: '240 fps',
      1: '120 fps',
      2: '100 fps',
      5: '60 fps',
      6: '50 fps',
      8: '30 fps',
      9: '25 fps',
      10: '24 fps',
      13: '200 fps',
      15: '400 fps',
      16: '360 fps',
      17: '300 fps',
    },
  },
  [GoProSettingId.AUTO_OFF]: {
    name: 'Auto Off',
    values: {
      0: 'Never',
      1: '1 Min',
      4: '5 Min',
      6: '15 Min',
      7: '30 Min',
      11: '8 Sec',
      12: '30 Sec',
    },
  },
  [GoProSettingId.VIDEO_TIMELAPSE_RATE]: {
    name: 'Video Timelapse Rate',
    values: {
      10: '60 Min',
      9: '30 Min',
      8: '5 Min',
      7: '2 Min',
      6: '60 Sec',
      5: '30 Sec',
      4: '10 Sec',
      3: '5 Sec',
      2: '2 Sec',
      1: '1 Sec',
      0: '0.5 Sec',
      11: '3 Sec', // HERO9 backward compatibility value
    },
  },
  [GoProSettingId.PHOTO_TIMELAPSE_RATE]: {
    name: 'Photo Timelapse Rate',
    values: {
      110: '0.5 Sec',
      109: '1 Sec',
      108: '2 Sec',
      11: '3 Sec',
      107: '5 Sec',
      106: '10 Sec',
      105: '30 Sec',
      104: '60 Sec',
      103: '2 Min',
      102: '5 Min',
      101: '30 Min',
      100: '60 Min',
      // MAX-specific: Transmitted/received as raw seconds value (4-byte int)
      // From legacy app MAX/ValueNameSettings.cs TimelapsePhotoIntervalSource
      0: '0.5 Sec',
      1: '1 Sec',
      2: '2 Sec',
      5: '5 Sec',
      10: '10 Sec',
      30: '30 Sec',
      60: '60 Sec',
    },
  },
  [GoProSettingId.NIGHTLAPSE_RATE]: {
    // NightlapseVideoInterval and NightlapsePhotoInterval share the same BLE ID 32.
    // Values 120/300/1800/3600 are defined in HERO13 ValueNameSettings.cs.
    name: 'Nightlapse Rate',
    values: {
      3600: '60 Min',
      1800: '30 Min',
      300: '5 Min',
      120: '2 Min',
      100: '60 Sec',
      30: '30 Sec',
      20: '20 Sec',
      15: '15 Sec',
      10: '10 Sec',
      5: '5 Sec',
      4: '4 Sec',
      3601: 'Auto',
    },
  },
  [GoProSettingId.MODE_PRESET_GROUP]: {
    name: 'Mode', // Active Preset Group
    values: {
      1000: 'Video',
      1001: 'Photo',
      1002: 'Timelapse',
    },
  },
  [GoProSettingId.MODE_PRESET]: {
    name: 'Preset', // Active Preset
    values: {
      // Video
      0: 'Standard',
      1: 'Activity',
      2: 'Cinematic',
      3: 'Slo-Mo',
      4: 'Ultra Slo-Mo',
      5: 'Basic',
      196608: '360 Video',
      // HERO11 Extended Battery (EB) preset (HERO11-specific)
      524288: 'Standard[EB]',
      524289: 'Activity[EB]',
      524290: 'Cinematic[EB]',
      524291: 'Slo-Mo[EB]',
      589824: 'Tripod 4K',
      589825: 'Tripod 5K',
      // HERO11 Longest Battery (LB) preset (HERO11-specific)
      589826: 'Cinematic[LB]',
      589827: 'Slo-Mo[LB]',
      655360: 'Easy Video',
      655361: 'Longest Battery',
      655362: 'Highest Quality',
      720896: 'Easy EB Video',
      917504: 'Easy LB Video',
      983040: 'Max Video 2.0',
      1245184: 'Easy Max Video',
      1441792: 'Easy Max Video 2.0',
      2359296: 'Macro Video',
      2555904: 'Easy Macro Video',
      // Photo
      65536: 'Photo',
      65537: 'LiveBurst',
      65538: 'Burst',
      65539: 'Night Photo',
      262144: '360 Photo',
      786432: 'Easy Photo',
      786433: 'Easy Night Photo',
      786434: 'Easy Burst Photo',
      1048576: 'Max Photo 2.0',
      1310720: 'Easy Max Photo',
      1507328: 'Easy Max Photo 2.0',
      2424832: 'Macro Photo',
      2424835: 'Macro Night Photo',
      2621440: 'Easy Macro Photo',
      2621441: 'Easy Macro Night Photo',
      // Timelapse
      131072: 'TimeWarp',
      131073: 'TimeLapse',
      131074: 'NightLapse',
      131075: 'Star Trails',
      131076: 'Light Painting',
      131077: 'Vehicle Lights',
      327680: '360 TimeWarp',
      327681: '360 TimeLapse',
      851968: 'Easy TimeWarp',
      851969: 'Easy Star Trails',
      851970: 'Easy Light Painting',
      851971: 'Easy Vehicle Lights',
      1114112: 'Max TimeWarp 2.0',
      1114113: 'Max Star Trails 2.0',
      1114114: 'Max Light Painting 2.0',
      1114115: 'Max Vehicle Lights 2.0',
      1376256: 'Easy Max TimeWarp',
      1572864: 'Easy Max TimeWarp 2.0',
      1572865: 'Easy Max Star Trails 2.0',
      1572866: 'Easy Max Light Painting 2.0',
      1572867: 'Easy Max Vehicle Lights 2.0',
      2490368: 'Macro TimeLapse',
      2490369: 'Macro NightLapse',
      2686976: 'Easy Macro TimeLapse',
      2686977: 'Easy Macro NightLapse',
      // Anamorphic (HERO13 Pro Anamorphic Lens)
      2883584: 'Anamorphic Video',
      2949120: 'Anamorphic SuperPhoto',
      2949123: 'Anamorphic NightPhoto',
      3014656: 'Anamorphic TimeWarp',
      // Anamorphic (HERO13 Easy Anamorphic Lens) — verified on device
      3080192: 'Easy Anamorphic Video',
      3145728: 'Easy Anamorphic SuperPhoto',
      3145729: 'Easy Anamorphic NightPhoto',
      3211264: 'Easy Anamorphic TimeWarp',
    },
  },
  [GoProSettingId.LOOPING_INTERVAL]: {
    name: 'Looping Interval',
    values: {
      1: '5 Min',
      2: '20 Min',
      3: '60 Min',
      4: '120 Min',
    },
  },
  [GoProSettingId.VIDEO_LENS]: {
    name: 'Video Lens',
    values: {
      0: 'Wide',
      2: 'Narrow',
      3: 'Superview',
      4: 'Linear',
      6: 'Narrow',
      7: 'Max SuperView',
      8: 'Linear + Horizon Leveling',
      9: 'HyperView',
      10: 'Linear + Horizon Lock',
      11: 'Max HyperView',
      12: 'Ultra SuperView',
      13: 'Ultra Wide',
      14: 'Ultra Linear',
      104: 'Ultra HyperView',
    },
  },
  // HERO13-specific VideoLens (ID: 229, 0xE5)
  // Used in Timelapse Video / Timewarp / StarTrails / NightlapseVideo.
  // Legacy app HERO13/FullControlPanelViewModel.cs: GetSetVideoLensCommand override -> 0x03, 0xE5, 0x01, value
  // Value meaning uses the same scheme as VIDEO_LENS (121).
  [GoProSettingId.VIDEO_LENS_HERO13]: {
    name: 'Lens',
    values: {
      0: 'Wide',
      2: 'Narrow',
      3: 'Superview',
      4: 'Linear',
      6: 'Narrow',
      7: 'Max SuperView',
      8: 'Linear + Horizon Leveling',
      9: 'HyperView',
      10: 'Linear + Horizon Lock',
      11: 'Max HyperView',
      12: 'Ultra SuperView',
      13: 'Ultra Wide',
      14: 'Ultra Linear',
      104: 'Ultra HyperView',
    },
  },
  [GoProSettingId.PHOTO_LENS]: {
    name: 'Photo Lens',
    values: {
      0: 'Wide (12MP)',
      10: 'Linear (12MP)',
      27: 'Wide (23MP)',
      28: 'Linear (23MP)',
      31: 'Wide (27MP)',
      32: 'Linear (27MP)',
      38: 'Linear (13MP)',
      39: 'Wide (13MP)',
      40: 'Ultra Wide (13MP)',
      41: 'Ultra Wide (12MP)',
      44: 'Ultra Linear (13MP)',
      19: 'Narrow',
      20: 'Wide', // MAX Photo Lens: Wide (0x14)
      100: 'Max SuperView',
      101: 'Wide',
      102: 'Linear',
      22: 'Wide',
      23: 'Linear',
      24: 'Narrow',
      25: 'Max SuperView',
    },
  },
  [GoProSettingId.TIME_LAPSE_LENS]: {
    name: 'Time Lapse Lens',
    values: {
      19: 'Narrow',
      31: 'Wide (27MP)',
      32: 'Linear (27MP)',
      100: 'Max SuperView',
      101: 'Wide',
      102: 'Linear',
    },
  },
  [GoProSettingId.PHOTO_OUTPUT]: {
    name: 'Photo Output',
    values: {
      0: 'Standard',
      1: 'RAW',
      2: 'HDR',
      3: 'SuperPhoto',
    },
  },
  [GoProSettingId.ANTI_FLICKER]: {
    name: 'Anti-Flicker',
    values: {
      0: 'NTSC',
      1: 'PAL',
      2: '60Hz',
      3: '50Hz',
    },
  },
  [GoProSettingId.HYPERSMOOTH]: {
    name: 'HyperSmooth',
    values: {
      0: 'Off',
      1: 'On',
      2: 'High',
      3: 'Boost',
      4: 'Auto Boost',
      100: 'Standard',
    },
  },
  [GoProSettingId.HYPERSMOOTH_MAX]: {
    // HERO09 Max Video: BLE 0x94=148, value=0/1 verified
    // HERO10 Max Video: BLE 0x94=148, value=0/100 (Standard=100 is ON state) verified
    name: 'Max HyperSmooth',
    values: { 0: 'Off', 1: 'On', 100: 'On' }, // Hero09=1, Hero10=100
    isToggleButton: true,
  },
  [GoProSettingId.COLOR]: {
    name: 'Color',
    values: {
      100: 'Vibrant',
      101: 'Natural', // HERO13 new scheme (HDR mode, etc.)
      102: 'Flat', // HERO13 new scheme
      2: 'Natural', // Legacy scheme (HERO12 / HERO13 Standard)
      1: 'Flat', // Legacy scheme
      0: 'GoPro', // MAX-specific scheme (legacy DB MAX/ValueNameSettings.cs: Value=0, Name='GoPro')
    },
  },
  [GoProSettingId.SHARPNESS]: {
    name: 'Sharpness',
    values: {
      0: 'High',
      1: 'Medium',
      2: 'Low',
    },
  },
  [GoProSettingId.EV_COMP]: {
    name: 'EV Comp',
    values: {
      0: '+2.0',
      1: '+1.5',
      2: '+1.0',
      3: '+0.5',
      4: '0.0',
      5: '-0.5',
      6: '-1.0',
      7: '-1.5',
      8: '-2.0',
    },
  },
  [GoProSettingId.WB]: {
    name: 'White Balance',
    values: {
      3: '6500K',
      7: '6000K',
      2: '5500K',
      12: '5000K',
      11: '4500K',
      0: 'Auto',
      4: 'Native',
      5: '4000K',
      10: '3200K',
      9: '2800K',
      8: '2300K',
    },
  },
  [GoProSettingId.VIDEO_ISO_MIN]: {
    name: 'ISO Min',
    values: {
      0: '6400',
      3: '3200',
      1: '1600',
      4: '800',
      2: '400',
      7: '200',
      8: '100',
      9: 'Auto',
    },
  },
  [GoProSettingId.VIDEO_ISO_MAX]: {
    name: 'ISO Max',
    values: {
      0: '6400',
      3: '3200',
      1: '1600',
      4: '800',
      2: '400',
      7: '200',
      8: '100',
      9: 'Auto',
    },
  },
  [GoProSettingId.VIDEO_SHUTTER]: {
    name: 'Shutter',
    values: {
      67: '1/8640',
      56: '1/7680',
      66: '1/7200',
      51: '1/6400',
      55: '1/5760',
      50: '1/4800',
      65: '1/4320',
      31: '1/3840',
      64: '1/3600',
      30: '1/3200',
      54: '1/2880',
      49: '1/2400',
      63: '1/2160',
      24: '1/1920',
      62: '1/1800',
      29: '1/1600',
      53: '1/1440',
      48: '1/1200',
      61: '1/1080',
      23: '1/960',
      60: '1/900',
      28: '1/800',
      27: '1/720',
      47: '1/600',
      59: '1/540',
      22: '1/480',
      58: '1/450',
      21: '1/400',
      20: '1/360',
      46: '1/300',
      18: '1/240',
      17: '1/200',
      15: '1/180',
      45: '1/150',
      13: '1/120',
      12: '1/100',
      10: '1/90',
      44: '1/75',
      8: '1/60',
      7: '1/50',
      52: '1/45',
      6: '1/48',
      5: '1/30',
      4: '1/25',
      43: '1/6144',
      42: '1/4608',
      34: '1/3072',
      41: '1/2304',
      33: '1/1536',
      40: '1/1152',
      32: '1/768',
      39: '1/576',
      25: '1/384',
      38: '1/288',
      16: '1/192',
      37: '1/144',
      11: '1/96',
      36: '1/72',
      35: '1/36',
      3: '1/24',
      0: 'Auto',
    },
  },
  [GoProSettingId.PHOTO_SHUTTER]: {
    name: 'Photo Shutter',
    values: {
      0: 'Auto',
      1: '1/125',
      2: '1/250',
      3: '1/500',
      4: '1/1000',
      5: '1/2000',
    },
  },
  [GoProSettingId.NIGHT_PHOTO_SHUTTER]: {
    // Reference: ProTuneRemote_Latest HERO09 ValueNameSettings (Value=1, Name='2s')
    // Value 1 is not defined in the local DB of HERO10-13, but since it is included in the actual device capabilities,
    // we provide a label to ensure correct fallback display.
    name: 'Night Photo Shutter',
    values: {
      0: 'Auto',
      1: '2s',
      2: '5s',
      3: '10s',
      4: '15s',
      5: '20s',
      6: '30s',
    },
  },
  [GoProSettingId.NIGHTLAPSE_PHOTO_SHUTTER]: {
    name: 'Nightlapse Shutter',
    values: {
      0: 'Auto',
      1: '2s',
      2: '5s',
      3: '10s',
      4: '15s',
      5: '20s',
      6: '30s',
    },
  },
  // -- Virtual ID (BLE ID = 31): UI-only ID since the value set differs per preset --
  // Based on legacy app ValueNameSettings.cs (HERO13)
  [GoProSettingId.STAR_TRAIL_SHUTTER]: {
    name: 'Star Trail Shutter',
    values: {
      6: '30s',
      3: '10s',
      2: '5s',
      1: '2s',
      8: '1s',
      7: '0.5s',
    },
  },
  [GoProSettingId.LIGHT_PAINTING_SHUTTER]: {
    name: 'Light Painting Shutter',
    values: {
      1: '2s',
      8: '1s',
      7: '0.5s',
    },
  },
  [GoProSettingId.VEHICLE_LIGHTS_SHUTTER]: {
    name: 'Vehicle Lights Shutter',
    values: {
      6: '30s',
      3: '10s',
      2: '5s',
      1: '2s',
      8: '1s',
      7: '0.5s',
    },
  },
  // Virtual ID: Timelapse Video-specific shutter (BLE ID = 145, same value set as VIDEO_SHUTTER)
  [GoProSettingId.TIMELAPSE_VIDEO_SHUTTER]: {
    name: 'Shutter',
    values: {
      67: '1/8640',
      56: '1/7680',
      66: '1/7200',
      51: '1/6400',
      55: '1/5760',
      50: '1/4800',
      65: '1/4320',
      31: '1/3840',
      64: '1/3600',
      30: '1/3200',
      54: '1/2880',
      49: '1/2400',
      63: '1/2160',
      24: '1/1920',
      62: '1/1800',
      29: '1/1600',
      53: '1/1440',
      48: '1/1200',
      61: '1/1080',
      23: '1/960',
      60: '1/900',
      28: '1/800',
      27: '1/720',
      47: '1/600',
      59: '1/540',
      22: '1/480',
      58: '1/450',
      21: '1/400',
      20: '1/360',
      46: '1/300',
      18: '1/240',
      17: '1/200',
      15: '1/180',
      45: '1/150',
      13: '1/120',
      12: '1/100',
      10: '1/90',
      44: '1/75',
      8: '1/60',
      7: '1/50',
      52: '1/45',
      6: '1/48',
      5: '1/30',
      4: '1/25',
      3: '1/24',
      0: 'Auto',
    },
  },
  [GoProSettingId.PHOTO_ISO_MIN]: {
    name: 'Photo ISO Min',
    values: {
      3: '100',
      2: '200',
      1: '400',
      0: '800',
      4: '1600',
      5: '3200',
    },
  },
  [GoProSettingId.PHOTO_ISO_MAX]: {
    name: 'Photo ISO Max',
    values: {
      3: '100',
      2: '200',
      1: '400',
      0: '800',
      4: '1600',
      5: '3200',
    },
  },
  [GoProSettingId.MULTI_SHOT_ISO_MIN]: {
    // BurstISO (Burst / TL Photo): 0=800, 1=400, 2=200, 3=100, 4=1600, 5=3200
    // NightlapseISO:               0=800, 1=400, 2=200, 3=100 (only 0-3 returned in capability query)
    // Shares the same BLE ID 76. Values 4/5 are returned by the camera only during Burst / TL Photo.
    name: 'ISO Min',
    values: {
      5: '3200',
      4: '1600',
      0: '800',
      1: '400',
      2: '200',
      3: '100',
    },
  },
  [GoProSettingId.MULTI_SHOT_ISO_MAX]: {
    // BurstISO (Burst / TL Photo): 0=800, 1=400, 2=200, 3=100, 4=1600, 5=3200
    // NightlapseISO:               0=800, 1=400, 2=200, 3=100 (only 0-3 returned in capability query)
    name: 'ISO Max',
    values: {
      5: '3200',
      4: '1600',
      0: '800',
      1: '400',
      2: '200',
      3: '100',
    },
  },
  [GoProSettingId.TIMELAPSE_PHOTO_OUTPUT]: {
    name: 'Photo Output',
    values: {
      0: 'Standard',
      1: 'RAW',
    },
  },
  [GoProSettingId.TEN_BIT_COLOR]: {
    // or 114 depending on specific HERO11/12
    name: '10-Bit Color',
    values: {
      0: '8-Bit',
      1: '10-Bit',
    },
  },
  [GoProSettingId.TEN_BIT_COLOR_ALT]: {
    name: '10-Bit Color',
    values: {
      0: '8-Bit',
      1: '10-Bit',
    },
  },
  [GoProSettingId.TEN_BIT_COLOR_HERO11]: {
    // HERO11/HERO11 Mini-specific (BLE ID 0xAE = 174)
    name: '10-Bit Color',
    values: {
      0: 'Off',
      1: 'On',
    },
    isBool: true,
  },
  [GoProSettingId.VIDEO_DURATION]: {
    name: 'Video Duration',
    values: {
      1: '15 Sec',
      2: '30 Sec',
      3: '1 Min',
      4: '5 Min',
      5: '15 Min',
      6: '30 Min',
      7: '1 Hour',
      8: '2 Hours',
      9: '3 Hours',
      10: '5 Sec',
      100: 'No Limit',
    },
  },
  [GoProSettingId.HINDSIGHT]: {
    name: 'HindSight',
    values: {
      2: '15 Sec',
      3: '30 Sec',
      4: 'Off',
    },
  },
  [GoProSettingId.PHOTO_INTERVAL]: {
    name: 'Photo Interval',
    values: {
      0: 'Off',
      2: '0.5 Sec',
      3: '1 Sec',
      4: '2 Sec',
      5: '5 Sec',
      6: '10 Sec',
      7: '30 Sec',
      8: '60 Sec',
      9: '120 Sec',
      10: '3 Sec',
    },
  },
  [GoProSettingId.PHOTO_INTERVAL_DURATION]: {
    name: 'Photo Interval Duration',
    values: {
      0: 'Off',
      1: '15 Sec',
      2: '30 Sec',
      3: '1 Min',
      4: '5 Min',
      5: '15 Min',
      6: '30 Min',
      7: '1 Hour',
      8: '2 Hours',
      9: '3 Hours',
    },
  },
  [GoProSettingId.CONTROL_MODE]: {
    name: 'Control Mode',
    values: {
      0: 'Easy',
      1: 'Pro',
    },
  },
  [GoProSettingId.VIDEO_BITRATE]: {
    name: 'Video Bit Rate',
    values: {
      0: 'Standard',
      1: 'High',
    },
  },
  [GoProSettingId.VIDEO_BITRATE_HERO11]: {
    name: 'Video Bit Rate',
    values: {
      1: 'High',
      100: 'Standard', // Hero10/11/HeroMini11
    },
  },
  [GoProSettingId.VIDEO_BITRATE_HERO09]: {
    name: 'Video Bit Rate',
    values: {
      1: 'High',
      0: 'Standard',
    },
  },
  [GoProSettingId.BIT_DEPTH]: {
    name: 'Bit Depth',
    values: {
      0: '8-Bit',
      2: '10-Bit',
    },
  },
  [GoProSettingId.VIDEO_PROFILE]: {
    // Video Profile for HERO12/13
    name: 'Video Profile',
    values: {
      0: 'Standard',
      1: 'HDR',
      2: 'GP-Log',
      3: 'GP-Log',
      101: 'HLG', // 旧スキーム (capability: [0,1,2,101])
      // Hero 13 新スキーム値
      100: 'Standard',
      102: 'GP-Log',
      200: 'HLG',
    },
  },
  [GoProSettingId.HLG_HDR]: {
    // HLG HDR (BLE ID 0xC7) Hero13 専用
    name: 'HLG HDR',
    isBool: true,
    values: {
      1: 'On', // ネイティブHLGガンマカーブ使用
      0: 'Off', // カメラ内HDR処理
    },
  },
  [GoProSettingId.TIMEWARP_SPEED]: {
    name: 'Speed',
    values: {
      10: 'Auto',
      7: '2x',
      8: '5x',
      9: '10x',
      0: '15x',
      1: '30x',
    },
  },
  [GoProSettingId.SPEED_RAMP]: {
    name: 'Speed Ramp',
    values: {
      100: 'Real Speed',
      101: 'Half Speed',
    },
  },
  [GoProSettingId.LAPSE_MODE]: {
    name: 'Lapse Mode',
    values: {
      0: 'TimeWarp',
      1: 'Star Trails',
      2: 'Light Painting',
      3: 'Vehicle Lights',
      4: 'Max TimeWarp',
      5: 'Max Star Trails',
      6: 'Max Light Painting',
      7: 'Max Vehicle Lights',
      8: 'Time Lapse Video',
      9: 'Night Lapse Video',
    },
  },
  [GoProSettingId.MAX_LENS_MOD_HERO13]: {
    name: 'Lens Attachment',
    values: {
      0: 'None',
      1: 'Max Lens 1.0',
      2: 'Max Lens 2.0',
      3: 'Max Lens 2.5',
      4: 'Macro',
      5: 'Anamorphic',
      6: 'ND 4',
      7: 'ND 8',
      8: 'ND 16',
      9: 'ND 32',
      10: 'Standard Lens',
      100: 'Auto Detect',
    },
  },
  [GoProSettingId.FRAMING]: {
    name: 'Framing',
    values: {
      // Hero12 v1 values
      0: 'Widescreen',
      1: 'Vertical',
      2: 'Full Frame',
      // Hero13 v2 values
      100: 'Traditional 4:3',
      101: 'Widescreen 16:9',
      103: 'Full Frame 8:7',
      104: 'Vertical 9:16',
      105: 'Ultra Widescreen 21:9',
      106: 'Full Frame 1:1',
    },
  },
  [GoProSettingId.VIDEO_FRAMING]: {
    name: 'Video Framing',
    values: {
      0: '4:3',
      1: '16:9',
      3: '8:7',
      4: '9:16',
      5: '21:9',
      6: '1:1',
    },
  },
  [GoProSettingId.PHOTO_MODE]: {
    name: 'Photo Mode',
    values: {
      0: 'SuperPhoto',
      1: 'Night Photo',
      2: 'Burst',
    },
  },
  [GoProSettingId.MAX_LENS_MOD]: {
    name: 'Max Lens Mod',
    values: {
      0: 'Off',
      1: 'On',
    },
    isBool: true,
  },
  [GoProSettingId.SCHEDULED_CAPTURE]: {
    name: 'Scheduled Capture',
    values: {
      0: 'Off',
      1: 'On',
    },
  },
  [GoProSettingId.CAPTURE_DELAY]: {
    name: 'Timer',
    values: {
      0: 'Off',
      1: '3 Sec',
      2: '10 Sec',
    },
  },
  [GoProSettingId.VIDEO_CLIPS]: {
    // Clips (BLE ID 0x6B = 107) — GoPro MAX Standard Video-specific
    // From legacy app MAX/UIElementSettings.cs V_Clips (Sort=0) / MAX/ValueNameSettings.cs
    name: 'Clips',
    values: {
      0: 'Off',
      1: '15 sec',
      2: '30 sec',
    },
  },
  [GoProSettingId.WIND_REDUCTION]: {
    // HERO13-specific: BLE ID 0xD6=214. Other models (HERO09-12/HERO11 Mini/MAX) use MAX_WIND_REDUCTION (149).
    name: 'Wind Reduction',
    values: {
      2: 'Auto',
      4: 'On',
      0: 'Off',
    },
  },
  [GoProSettingId.MAX_WIND_REDUCTION]: {
    // HERO09-12/HERO11 Mini/MAX: BLE ID 0x95=149 (legacy app BaseFullControlPanelViewModel 0x95)
    // MAX is 1=On (other models are 4=On)
    name: 'Wind Reduction',
    values: {
      2: 'Auto',
      4: 'On', // Hero09-12/HeroMini11
      1: 'On', // Max (旧DB Max/ValueNameSettings.cs: Value=1, Name='On')
      0: 'Off',
    },
  },
  [GoProSettingId.DENOISE]: {
    name: 'Denoise',
    values: {
      2: 'High',
      1: 'Medium',
      0: 'Low',
    },
  },
  [GoProSettingId.RAW_AUDIO]: {
    // RAW Audio (BLE ID 0x8B = 139)
    // Common to all models. Verified from legacy app BaseFullControlPanelViewModel line 9781 & 6698.
    name: 'RAW Audio',
    values: {
      2: 'High',
      1: 'Medium',
      0: 'Low',
      3: 'Off',
    },
  },
  [GoProSettingId.MAX_AUDIO_MODE]: {
    // BLE ID 0x89 = 137, MAX-specific.
    // Standard Video: Microphone direction (0=Stereo / 1=Front / 2=Back / 3=Match Lens)
    // 360 Video:      360 Audio (5=360+Stereo / 0=Stereo)
    // Legacy app UIElementSettings: Standard=V_RAWAudio(0x8B), 360=V_360RAWAudio(0x89)
    // Legacy app ValueNameSettings Audio360: Value=5 '360+Stereo' / Value=0 'Stereo'
    name: 'Microphone',
    values: {
      0: 'Stereo',
      1: 'Front',
      2: 'Back',
      3: 'Match Lens',
      5: '360 + Stereo',
    },
  },
  [GoProSettingId.AUDIO_TUNING]: {
    // Audio Tuning (BLE ID 0xCB = 203)
    // HERO13-specific (Standard / Activity / MacroVideo only; MaxVideo2.0 is not supported).
    // Verified from legacy app HERO13/FullControlPanelViewModel line 11964, ValueNameSettings line 275 & 276.
    name: 'Audio Tuning',
    values: {
      1: 'Voice',
      0: 'Standard',
    },
  },
  [GoProSettingId.MEDIA_MOD_MIC]: {
    // Media Mod Audio Source (BLE ID 0xA4 = 164)
    // From legacy app Database/Hero*/ValueNameSettings.cs. HERO13 also supports Front+Back (4).
    // Display condition: statusId 102 (mediaModMicStatus) === 2 (Media Mod mic only is connected)
    name: 'Media Mod Mic',
    values: {
      100: 'Camera Mics',
      1: 'Front',
      2: 'Back',
      4: 'Front + Back',
    },
  },
  [GoProSettingId.BURST_RATE]: {
    // HERO13 verified on device (ID=147 / 0x93)
    // HERO09 verified on device: value 11=30/10s, 14=25/1s are HERO09-specific
    name: 'Burst Rate',
    values: {
      9: 'Auto',
      0: '3/1s',
      1: '5/1s',
      2: '10/1s',
      4: '10/3s',
      5: '30/1s',
      7: '30/3s',
      8: '30/6s',
      11: '30/10s', // Hero09 固有
      12: '60/6s',
      13: '60/10s',
      14: '25/1s', // Hero09 固有
    },
  },
  [GoProSettingId.MAX_LENS_MOD_ENABLE]: {
    name: 'Max Lens Enable',
    values: {
      0: 'Off',
      1: 'On',
    },
    isBool: true,
  },
  [GoProSettingId.STAR_TRAILS_LENGTH]: {
    name: 'Star Trails Length',
    values: {
      1: 'Short',
      2: 'Long',
      3: 'Max',
    },
  },
  [GoProSettingId.MULTI_SHOT_DURATION]: {
    name: 'Multi Shot Duration',
    values: {
      1: '15 Sec',
      2: '30 Sec',
      3: '1 Min',
      4: '5 Min',
      5: '15 Min',
      6: '30 Min',
      7: '1 Hour',
      8: '2 Hours',
      9: '3 Hours',
      100: 'No Limit',
    },
  },
  [GoProSettingId.MULTI_SHOT_FRAMING]: {
    name: 'Multi Shot Framing',
    values: {
      0: '4:3',
      1: '16:9',
      3: '8:7',
      4: '9:16',
    },
  },
  [GoProSettingId.MULTI_SHOT_LENS]: {
    name: 'Lens',
    values: {
      19: 'Narrow',
      31: 'Wide',
      32: 'Linear',
      // Backward compatibility (legacy values for HERO9/10/11)
      101: 'Wide',
      102: 'Linear',
    },
  },
  [GoProSettingId.MULTI_SHOT_ASPECT_RATIO]: {
    name: 'Multi Shot Aspect Ratio',
    values: {
      0: '4:3',
      1: '16:9',
      3: '8:7',
      4: '9:16',
    },
  },
  [GoProSettingId.SYSTEM_VIDEO_MODE]: {
    // System Video Mode (ID=180 / 0xB4): Supported on HERO11/12/13 only
    // Legacy app Database/Hero11-13/ValueNameSettings.cs: 0=Highest Quality, 101=Extended Battery, 102=Longest Battery
    name: 'System Video Mode',
    values: {
      0: 'Highest Quality',
      101: 'Extended Battery',
      102: 'Longest Battery',
    },
  },
  [GoProSettingId.EASY_VIDEO_QUALITY]: {
    // Quality (Easy Video only, ID=201 / 0xC9) * HERO13 confirmed on device
    name: 'Quality',
    values: {
      0: 'Highest',
      1: 'Standard',
      2: 'Basic',
    },
  },
  [GoProSettingId.HORIZONTAL_LEVELING]: {
    // HorizontalLeveling (ID=165 / 0xA5): MaxVideo2_0 / MaxTimewarp2_0 / EasyMaxTimeWarp2_0
    // From legacy app HERO13/ValueNameSettings.cs: 0=Off, 1=On
    name: 'Horizontal Leveling',
    values: { 0: 'Off', 1: 'On' },
    isToggleButton: true,
  },
  [GoProSettingId.HORIZONTAL_LOCK]: {
    // HorizontalLock (ID=166 / 0xA6): MaxPhoto2_0 / MacroPhoto / MacroNightPhoto / EasyMaxPhoto / EasyMaxPhoto2_0
    // From legacy app HERO13/ValueNameSettings.cs: 0=Off, 1=On
    name: 'Horizontal Lock',
    values: { 0: 'Off', 1: 'On' },
    isToggleButton: true,
  },
  [GoProSettingId.MEDIA_FORMAT]: {
    name: 'Media Format',
    values: {
      13: 'Time Lapse Video',
      20: 'Time Lapse Photo',
      21: 'Night Lapse Photo',
      26: 'Night Lapse Video',
    },
  },
  [GoProSettingId.GPS]: {
    name: 'GPS',
    values: {
      0: 'Off',
      1: 'On',
    },
    isBool: true,
  },
  [GoProSettingId.LCD_BRIGHTNESS]: {
    name: 'LCD Brightness',
    values: {
      10: '10%',
      15: '15%',
      20: '20%',
      25: '25%',
      30: '30%',
      35: '35%',
      40: '40%',
      45: '45%',
      50: '50%',
      55: '55%',
      60: '60%',
      65: '65%',
      70: '70%',
      75: '75%',
      80: '80%',
      85: '85%',
      90: '90%',
      95: '95%',
      100: '100%',
    },
    sliderConfig: {
      min: 10,
      max: 100,
      step: 5,
      formatValue: (v: number) => `${v}%`,
    },
  },
  [GoProSettingId.LED]: {
    name: 'LED',
    values: {
      3: 'All On',
      4: 'All Off',
      5: 'Front Off Only',
    },
  },
  [GoProSettingId.WIRELESS_BAND]: {
    name: 'Wireless Band',
    // NOTE: This setting controls the Wi-Fi AP band for the next Wi-Fi session.
    // The change takes effect only after the camera's Wi-Fi AP is restarted.
    // Some camera firmware/regions may not persist this setting across reboots.
    values: {
      0: '2.4 GHz',
      1: '5 GHz',
    },
  },
  [GoProSettingId.BEEP_VOLUME]: {
    name: 'Beep Volume',
    values: {
      0: 'Mute',
      70: 'Low',
      85: 'Medium',
      100: 'High',
    },
  },
  [GoProSettingId.SCREEN_SAVER]: {
    name: 'Screen Saver',
    values: {
      0: 'Never',
      1: '1 Min',
      2: '2 Min',
      3: '3 Min',
      4: '5 Min',
    },
  },
  [GoProSettingId.SCREEN_SAVER_FRONT]: {
    name: 'Screen Saver (Front)',
    values: {
      0: 'Never',
      1: 'Match Rear Screen',
      2: '1 Min',
      3: '2 Min',
      4: '3 Min',
      5: '5 Min',
    },
  },
  [GoProSettingId.FRONT_LCD_MODE]: {
    name: 'Front Display',
    values: {
      0: 'Screen Off',
      1: 'Status Only',
      2: 'Actual View',
      3: 'Full Screen',
    },
  },
  [GoProSettingId.QUICK_CAPTURE]: {
    name: 'Quick Capture',
    values: {
      1: 'On',
      0: 'Off',
    },
  },
  [GoProSettingId.DEFAULT_PRESET]: {
    name: 'Default Preset',
    values: {
      200: 'Last Used',
      100: 'Last Used Video',
      101: 'Last Used Photo',
      102: 'Last Used Time Lapse',
    },
  },
  [GoProSettingId.DEFAULT_PRESET_MAX]: {
    // Default Preset (BLE ID 0x7F = 127, 4-byte) — Max 専用
    // 旧DB: Database/Max/ValueNameSettings.cs DefaultPresetSource
    name: 'Default Preset',
    values: {
      7: 'Last Used',
      0: 'HERO Video',
      1: 'HERO Photo',
      2: 'HERO Time Lapse',
      3: '360 Video',
      4: '360 Photo',
      5: '360 Time Lapse',
    },
  },
  [GoProSettingId.SCREEN_SAVER_REAR]: {
    // Rear Screen Saver (BLE ID 0x9F = 159) — HERO09/10/11/12-specific
    // Legacy DB: Database/Hero09/ValueNameSettings.cs ScreenSaverRearSource
    name: 'Screen Saver',
    values: {
      1: '1 Min',
      2: '2 Min',
      3: '3 Min',
      4: '5 Min',
      0: 'Never',
    },
  },
  [GoProSettingId.SCREEN_SAVER_MAX]: {
    // Rear Screen Saver (BLE ID 0x33 = 51) — MAX-specific
    // Legacy DB: Database/Max/ValueNameSettings.cs ScreenSaverSource
    name: 'Screen Saver',
    values: {
      1: '1 Min',
      2: '2 Min',
      3: '3 Min',
      0: 'Never',
    },
  },
  [GoProSettingId.LANGUAGE]: {
    name: 'Language',
    values: {
      // HERO13 verified on device (BLE ID 0x54 = 84)
      // Legacy DB: ValueNameSettings.cs Hero13/LanguageSource
      0: 'English',
      1: 'Chinese',
      2: 'German',
      3: 'Italian',
      4: 'Spanish',
      5: 'Japanese',
      6: 'French',
      7: 'Korean',
      8: 'Portuguese',
      9: 'Russian',
      10: 'Swedish',
      11: 'Chinese (Traditional)',
    },
  },
  [GoProSettingId.VOICE_LANGUAGE]: {
    name: 'Voice Language',
    values: {
      // HERO13 verified on device (BLE ID 0xDF = 223)
      // Legacy DB: ValueNameSettings.cs Hero13/VoiceLanguageSource
      0: 'English (US)',
      1: 'English (UK)',
      2: 'English (AUS)',
      3: 'German',
      4: 'French',
      5: 'Italian',
      6: 'Spanish',
      7: 'Spanish (NA)',
      8: 'Chinese',
      9: 'Japanese',
      10: 'Korean',
      11: 'Portuguese',
      12: 'Russian',
      13: 'English (IND)',
      14: 'Swedish',
    },
  },

  [GoProSettingId.VOICE_LANGUAGE_LEGACY]: {
    name: 'Voice Language',
    values: {
      // For HERO11/12/HERO11 Mini (BLE ID 0x55 = 85)
      // Legacy DB: ValueNameSettings.cs BaseFullControlPanelViewModel common
      0: 'English (US)',
      1: 'English (UK)',
      2: 'English (AUS)',
      3: 'German',
      4: 'French',
      5: 'Italian',
      6: 'Spanish',
      7: 'Spanish (NA)',
      8: 'Chinese',
      9: 'Japanese',
      10: 'Korean',
      11: 'Portuguese',
      12: 'Russian',
      13: 'English (IND)',
      14: 'Swedish',
    },
  },

  [GoProSettingId.VOICE_CONTROL]: {
    name: 'Voice Control',
    values: { 0: 'Off', 1: 'On' },
    isBool: true,
  },
  [GoProSettingId.BEEPS]: {
    // BLE ID 0x57 = 87 — For HERO09/10/11/12/HERO11 Mini/MAX. HERO13 uses BEEP_VOLUME (216)
    // HERO11 verified on device: 40=Low, 70=Medium, 100=High (Beep On/Off is managed in a separate ID)
    name: 'Beep Volume',
    values: {
      0: 'Mute',
      40: 'Low',
      70: 'Medium',
      100: 'High',
    },
  },

  [GoProSettingId.ENABLE_BEEP]: {
    // BLE ID 0xDD = 221 — HERO13-specific: Beep sound itself On/Off
    name: 'Enable Beep',
    values: { 0: 'Off', 1: 'On' },
    isBool: true,
  },
  [GoProSettingId.SCREEN_LOCK]: {
    // BLE ID 0x67 = 103 — Common to all models: Touch screen lock to prevent accidental taps
    // ON=6 / OFF=3: Verified from camera-side BLE notifications
    name: 'Screen Lock',
    values: { 3: 'Off', 6: 'On' },
    isBool: true,
    boolOnValue: 6,
    boolOffValue: 3,
  },
  [GoProSettingId.ORIENTATION]: {
    // BLE ID 0x70 = 112 — Common to all models: Screen orientation settings (Orientation)
    // 'All' value differs by model: HERO12/13/HERO11 Mini = 100, HERO09/MAX = 0
    // HERO13 also has fixed direction values 101-104 (verified from actual device BLE logs)
    name: 'Orientation',
    values: {
      5: 'Landscape',
      100: 'All',
      101: 'Upright',
      102: 'Upside Down',
      103: 'Left',
      104: 'Right',
      255: 'Locked',
    },
  },

  // ---- Hero13 Dashboard Override Controls (0xCD–0xD4) ----
  [GoProSettingId.DASHBOARD_OVERRIDE]: {
    name: 'Override Dashboard',
    values: { 0: 'Off', 1: 'On' },
    isBool: true,
  },
  [GoProSettingId.DASHBOARD_VOICE_CONTROL]: {
    name: 'Voice Control',
    values: { 0: 'Off', 1: 'On' },
    isBool: true,
  },
  [GoProSettingId.DASHBOARD_SCREEN_SAVER]: {
    name: 'Screen Saver',
    values: { 0: 'Off', 1: 'On' },
    isBool: true,
  },
  [GoProSettingId.DASHBOARD_BEEPS]: {
    name: 'Beeps',
    values: { 0: 'Off', 1: 'On' },
    isBool: true,
  },
  [GoProSettingId.DASHBOARD_ORIENTATION]: {
    name: 'Orientation',
    values: { 0: 'All', 1: 'Upright', 2: 'Upside Down', 3: 'Left', 4: 'Right' },
  },
  [GoProSettingId.DASHBOARD_FRONT_DISPLAY]: {
    name: 'Front Display',
    values: { 0: 'Screen Off', 1: 'Status Only', 2: 'Actual View', 3: 'Full Screen' },
  },
  [GoProSettingId.DASHBOARD_SCREEN_LOCK]: {
    name: 'Screen Lock',
    values: { 0: 'Off', 1: 'On' },
    isBool: true,
  },
  [GoProSettingId.DASHBOARD_LED]: {
    name: 'LED',
    values: { 0: 'Off', 1: 'On' },
    isBool: true,
  },

  // -- Newly added settings --

  [GoProSettingId.MEDIA_MOD]: {
    // Media Mod type (BLE ID 0xA9 = 169) — HERO09 to 13
    // Legacy app Database/Hero*/ValueNameSettings.cs: SettingNames.Mods
    name: 'Media Mod',
    values: {
      1: 'Standard Mic',
      2: 'Standard Mic +',
      3: 'Powered Mic',
      4: 'Powered Mic +',
      5: 'Line In',
    },
  },

  [GoProSettingId.VIDEO_PERFORMANCE_MODE]: {
    // Video Performance Mode (BLE ID 0xAD = 173) — HERO10-specific
    // Legacy app Constans/Hero10/VideoPerformanceMode.cs: 0=Max, 1=ExtBat, 2=Tripod
    // Legacy app ValueNameSettings.cs: 0=Maximum, 1=EB, 2=Tripod
    name: 'Video Performance',
    values: {
      0: 'Maximum',
      1: 'Extended Battery',
      2: 'Tripod/Stationary',
    },
  },

  [GoProSettingId.VIDEO_COMPRESSION]: {
    // Video Compression (BLE ID 0x6A = 106) — MAX/HERO09/HERO10
    // Legacy app ValueNameSettings.cs: 1=HEVC, 2=H.264+HEVC (MAX is 0=H.264+HEVC, 1=HEVC)
    name: 'Video Compression',
    values: {
      0: 'H.264 + HEVC', // Max のみ 0=H.264+HEVC
      1: 'HEVC',
      2: 'H.264 + HEVC', // Hero09/10 は 2=H.264+HEVC
    },
  },

  [GoProSettingId.LENS_ATTACHMENT]: {
    // Lens Attachment (BLE ID 0xD9 = 217) — HERO13-specific
    // Legacy app Database/Hero13/ValueNameSettings.cs
    name: 'Lens Attachment',
    values: {
      2: 'Max Lens 2.0',
      3: 'Max Lens 2.5',
      4: 'Macro',
      5: 'Anamorphic', // Val:5 — verified on device
      6: 'ND 4',
      7: 'ND 8',
      8: 'ND 16',
      9: 'ND 32',
      10: 'Standard Lens',
      100: 'Auto Detect',
    },
  },

  [GoProSettingId.QUICK_CAPTURE_DEFAULT]: {
    // Quick Capture Default Mode (BLE ID 0x8D = 141, 4-byte) — MAX-specific
    // Legacy DB: Database/Max/ValueNameSettings.cs: 2=Last Used, 0=HERO, 1=360
    name: 'Quick Capture Default',
    values: {
      2: 'Last Used',
      0: 'HERO',
      1: '360',
    },
  },

  [GoProSettingId.FOCUS_PEAKING]: {
    // Focus Peaking (BLE ID 0xC8 = 200) — HERO13 Macro preset-specific
    // Legacy DB: Database/Hero13/ValueNameSettings.cs
    name: 'Focus Peaking',
    values: {
      0: 'Off',
      1: 'Auto',
      2: 'Blue',
      3: 'Yellow',
      4: 'Red',
    },
  },
  [GoProSettingId.MAX_LENS_MODE]: {
    name: 'Lens Mode',
    values: {
      0: 'Single',
      1: 'Dual',
    },
    isToggleButton: true,
  },
};

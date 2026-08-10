# 設定メタデータ フォールバックポリシー対応表

GoProカメラはBLE通信を通じて「現在選択可能な設定値のリスト (Capabilities)」を報告しますが、機種や設定項目によってはこの報告が不正確であったり、完全に空配列となる場合があります。

本ドキュメントでは、各設定項目 (`GoProSettingId`) に対する Capability の取扱方針（Policy）を分類し、どの項目がどのポリシーに属するかを明文化します。

## ポリシーの定義

| ポリシー名 | 説明 |
|:---|:---|
| **`dynamicOnly`** | カメラからの Capability 応答を完全に信頼してそのまま利用する。空配列が返ってきた場合は選択不可（表示なし）として扱う。 |
| **`staticWhenEmpty`** | カメラからの Capability が空配列だった場合のみ、アプリ内にハードコードされた静的リストを使用する。値が含まれていればそれを信用する。 |
| **`staticAlways`** | カメラからの Capability 応答の内容に関わらず、常にアプリ内にハードコードされた静的リストを使用する。カメラ側のバグで不正確なリストが返る場合などに適用される。 |
| **`dynamicWithStaticOrderAndLabelFallback`** | (将来検討用) カメラからの動的応答を正（Truth）としつつ、静的定義は「表示順」と「ラベル名」の解決にのみ使用する。未知の値が来た場合も除外せず表示する。 |
| **`dynamicWithStaticSupersetCheck`** | カメラからの動的応答に静的フルセットを合成して表示する。既知の静的値は常に候補に残し、動的応答にしかない値は末尾に保持する。 |

## 各設定項目の所属ポリシー (2026-05)

### `staticAlways` (常に静的リストを使用)

**全機種共通:**
- `NIGHTLAPSE_PHOTO_SHUTTER` (Nightlapse Video時にAutoのみが返るバグを回避)
- 仮想ID群 (`STAR_TRAIL_SHUTTER`, `LIGHT_PAINTING_SHUTTER`, `VEHICLE_LIGHTS_SHUTTER`, `TIMELAPSE_VIDEO_SHUTTER`)
- `BIT_DEPTH`
- `TEN_BIT_COLOR_HERO11`
- `VIDEO_BITRATE` / `VIDEO_BITRATE_HERO11` / `VIDEO_BITRATE_HERO09`
- `QUICK_CAPTURE_DEFAULT`
- `DEFAULT_PRESET_MAX`
- `SCREEN_SAVER_MAX` / `SCREEN_SAVER_REAR`
- `LED`
- `ORIENTATION`
- `VIDEO_COMPRESSION`
- `ANTI_FLICKER`
- `HYPERSMOOTH_MAX`

**Max 専用 (Model Override):**
*※Max は ProTune 系設定の多くで現在値1つしか Capability を返さないため、特別に `staticAlways` が大量適用される*
- `VIDEO_SHUTTER`, `PHOTO_SHUTTER`
- `EV_COMP`, `WB`
- `VIDEO_ISO_MIN`, `VIDEO_ISO_MAX`, `PHOTO_ISO_MIN`, `PHOTO_ISO_MAX`
- `SHARPNESS`, `COLOR`
- `RAW_AUDIO`, `MAX_AUDIO_MODE`
- `MAX_WIND_REDUCTION`
- `CAPTURE_DELAY`
- `TIMEWARP_SPEED`
- `VIDEO_TIMELAPSE_RATE`, `PHOTO_TIMELAPSE_RATE`
- `RESOLUTION`, `VIDEO_LENS`, `PHOTO_LENS`, `HYPERSMOOTH`
- `MAX_LENS_MODE`, `MAX_LENS_DIRECTION`
- `VIDEO_CLIPS`

---

### `staticWhenEmpty` (空配列時のみ静的リストを使用)

**全機種共通:**
- `DASHBOARD_OVERRIDE` および サブ設定項目 (`DASHBOARD_VOICE_CONTROL`, `DASHBOARD_SCREEN_SAVER` 等)
- `CAMERA_ADVANCED_SETTING_IDS` に含まれる設定全般
- `MEDIA_FORMAT`, `LAPSE_MODE`
- `PHOTO_SHUTTER` (Max以外), `NIGHT_PHOTO_SHUTTER`
- `PHOTO_ISO_MIN` (Max以外), `PHOTO_ISO_MAX` (Max以外)
- `MULTI_SHOT_ISO_MIN`, `MULTI_SHOT_ISO_MAX`
- `TIMELAPSE_PHOTO_OUTPUT`
- `TIME_LAPSE_LENS` (Raw選択時に空になる現象の回避)
- `EASY_VIDEO_QUALITY`
- `LANGUAGE`, `VOICE_LANGUAGE`, `VOICE_LANGUAGE_LEGACY`
- `HORIZONTAL_LEVELING`, `HORIZONTAL_LOCK`
- HLG_HDR
- `AUTO_OFF` (HeroMini11以外)

---

### `dynamicWithStaticSupersetCheck`

**機種限定:**
- `hero13` の `VIDEO_DURATION`

---

### `dynamicOnly` (上記以外すべて)

基本設定群（例: `RESOLUTION` (Max以外), `FPS`, `VIDEO_LENS` (Max以外) など）は原則として `dynamicOnly` となり、カメラからの動的応答をそのまま使用してフィルタリングを行います。

*(※ 一部、UI側 (`SettingsPanel.tsx`) で動的にリストをさらに絞り込んだり、フォールバックリストを生成する例外が存在します。例: Easy Video 時の FPS など)*

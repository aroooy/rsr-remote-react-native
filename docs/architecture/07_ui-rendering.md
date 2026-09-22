# UI 構造とレンダリング

## 対象ファイル
- [src/components/SettingsPanel.tsx](../../src/components/SettingsPanel.tsx) — メインUI facade・オーケストレーション
- [src/components/settingsPanel](../../src/components/settingsPanel) — UIサブコンポーネントおよび表示状態解決ヘルパー
- [App.js](../../App.js)

## 画面遷移

```
App.js
 ├─ HomeScreen        — デバイスリスト・スキャン・接続
 ├─ ControlScreen     — SettingsPanel を全画面表示
 └─ CustomPresetsScreen — カスタムプリセット管理画面
```

`react-navigation` の `NativeStackNavigator` で管理。
接続成功時に `Control` へ遷移、切断時に `Home` へ戻る。
`CustomPresetsScreen` は `SettingsPanel` の「My Presets」ボタンから push 遷移する。

## Home 画面 (App.js)

### デバイスリスト
- **既知デバイス** (KnownDeviceRepository): 過去に接続したデバイス。ONLINE/OFFLINE/CONNECTED 状態表示。
- **発見デバイス** (BLEスキャン): `isGoProBleName()` (`/^gopro [0-9]+$/i`) でフィルタ。
- 両者をマージして一覧表示。既知 + 新規発見を統合。

### 操作
- タップ: 接続開始 (スキャン停止 → 1秒delay → `connectToDevice()`)
- 長押し: 既知デバイスの削除確認ダイアログ
- 初回マウント時に 10 秒間のサイレントスキャン実行

## SettingsPanel 構造

`SettingsPanel.tsx` は現在、巨大な一枚岩のファイルではなく、UI orchestration と状態バインディングを担う facade です。各種 UI セクション・設定行・モーダルは `src/components/settingsPanel/` 配下のサブコンポーネントに分離されています。

SettingsPanel は上から下に以下のセクションで構成される:

```
┌───────────────────────────────────────┐
│ ヘッダー行                             │
│ "Camera Settings"  [Live Preview] [Visible Items] [⏻] │
├───────────────────────────────────────┤
│ モードセレクター (PresetGroupGrid)    │
│ [Video] [Photo] [Timelapse]            │
│ プリセットチップ (横スクロール)          │
├───────────────────────────────────────┤
│ ResolutionFramingSection              │
│  - Framing セレクター (16:9/9:16/4:3/8:7)│
│  - Resolution セレクター (5.3K/4K/2.7K)│
├───────────────────────────────────────┤
│ Primary Setting (PrimarySettingRow)   │
│ 横スクロール、ラベルチップ              │
├───────────────────────────────────────┤
│ SettingsSectionGroup (Shooting/Camera)│
│ OtherSettingRow (ISO, WB, EV, GPS 等) │
│ SpecialRowView (Easy / Special Row)   │
├───────────────────────────────────────┤
│ Dashboard Controls (Hero13のみ)        │
│ Override スイッチ + サブ設定            │
├───────────────────────────────────────┤
│ ShutterButtonRow (最下部固定)         │
│ シャッターボタン / 録画時間表示          │
└───────────────────────────────────────┘
```

## 録画中 (Encoding) のUIロック制御

Zustand ストアの `isEncoding` ステート（ステータスID 10 を監視）に連携してUIの動的ロックを行う:
- 録画処理が始まると、設定に関連する全コンポーネントの親Viewに対して `pointerEvents="none"` および `opacity: 0.5` を付与し、意図せぬ設定変更をハードウェアレベルでブロック。
- 画面最下部に固定配置されたシャッター関連のUI (`ShutterButtonRow`) のみがアクティブとなり、録画時間（ステータスID 13 で更新）を表示する。

## レンダリングタイプとサブコンポーネント分割

`SettingsPanel.tsx` から抽出されたサブコンポーネントおよび helper モジュールの一覧:

| モジュール / サブコンポーネント | 役割・表示要素 |
|---|---|
| `settingsPanel/PrimarySettingRow.tsx` | 上部トグルボタン行（FPS, Lens, Profile 等）の描画 |
| `settingsPanel/ResolutionFramingSection.tsx` | Quick Settings 上部の Resolution および Framing (アスペクト比) セレクター行 |
| `settingsPanel/OtherSettingRow.tsx` | Shooting / Camera Settings 内の各 1 行描画 (モーダル起動 / Switch / スライダー) |
| `settingsPanel/SpecialRowView.tsx` | Easy モードおよび Easy TimeWarp などの特殊合成行の描画 |
| `settingsPanel/SettingsSectionGroup.tsx` | セクションごとのグループ外枠カード描画 |
| `settingsPanel/ShutterButtonRow.tsx` | 画面最下部の録画開始/停止ボタンおよび録画タイマー表示 |
| `settingsPanel/PresetGroupGrid.tsx` | Video / Photo / Timelapse モード切り替えボタンおよびプリセットチップ横スライド |
| `settingsPanel/SettingOptionModal.tsx` | 設定値を一覧選択するボトムシート/ダイアログモーダル |
| `settingsPanel/VisibilityControlModal.tsx` | アクションシート項目の表示/非表示を切り替える設定モーダル |
| `settingsPanel/PresetRenameModal.tsx` | ユーザー定義プリセットの名前・アイコンを変更するリネームモーダル |
| `settingsPanel/TimePickerModal.tsx` | Scheduled Capture 用の時刻選択ピッカーモーダル |
| `settingsPanel/framingSelector.ts` | Framing row の表示可否と option 解決 |
| `settingsPanel/resolutionSelector.ts` | Resolution row の表示可否と値候補解決 |
| `settingsPanel/otherItemState.ts` | 各 setting row の kind / disabled 状態解決 |
| `settingsPanel/specialRows.ts` | Easy / special row descriptor の解決 |

`SettingsPanel.tsx` 側には「Zustand ストアから状態を読む」「各サブコンポーネントに Props を渡して配置する」オーケストレーションの責務のみが残されている。

## モーダル (4種)

### 1. 値選択モーダル (`SettingOptionModal.tsx`)
- 設定タップで表示
- `FlatList` で capability に含まれる値のみ一覧
- 値タップで `goProBle.setSetting()` 呼び出し → モーダル閉じる
- オーバーレイタップで閉じる (Pressable)

### 2. Visible Items モーダル (`VisibilityControlModal.tsx`)
- ヘッダーの "Visible Items" ボタンから表示
- Shooting Settings / Camera Settings の 2 セクション
- 各設定の Switch で表示/非表示を切り替え
- SQLite (`SettingVisibilityRepository`) で永続化
- デバイス×プリセットごとに独立管理

### 3. Scheduled Capture 時刻ピッカー (`TimePickerModal.tsx`)
- Scheduled Capture の Switch が ON のとき時刻表示をタップで表示
- Hour (0-23) × Minute (0-55, 5分刻み) の 2 列 ScrollView
- 選択で `goProBle.setScheduledTime(hour, minute)` 呼び出し

### 4. プリセットリネームモーダル (`PresetRenameModal.tsx`)
- ユーザー定義プリセット (`userDefined === true`) の長押しで表示 (HERO12/13/MAX2 対応)
- プリセット名 (`customName`, 最大 16 文字) とアイコン (`iconId`) を変更
- `goProBle.renameActivePreset(name, iconId)` で protobuf (0xF1) 変更要求を送信

## Capability オンデマンド取得

未取得の capability はタップ時に初めて BLE フェッチする:

```
ユーザーがドロップダウンタップ
  → selectableValues が空?
    → goProBle.fetchCapabilityForSetting(settingId)
    → 1.5秒スロットル (連打防止)
    → 取得完了後に再タップで開く
```

### Prefetch
`useEffect` でレイアウト変更時に表示対象の capability を 150ms 後に prefetch する。

- key は `displayLayout` 全体ではなく setting ID シグネチャ (`capabilityPrefetchKey`) に依存させる
- `capabilitiesRef` を使い `capabilities` を `useEffect` の依存配列から除外し、prefetch ループを防ぐ
- `VIDEO_BITRATE` / `BIT_DEPTH` はプリセット切替で値域が変わりやすいため、cache 済みでも force refetch 対象に含める

### pendingSettings 優先の現在値解決

プリセット関連 UI はカメラ通知待ちの間も最終意図を表示するため、`settings` 単独ではなく以下の優先順で現在値を解決する。

```ts
const currentGroupId = pendingSettings[MODE_PRESET_GROUP] ?? settings[MODE_PRESET_GROUP];
const currentPresetId = pendingSettings[MODE_PRESET] ?? settings[MODE_PRESET];
```

これにより、MVVM 的に `settings` を直接書き換えずとも preset chip, quick settings, resolver 分岐が先回りで安定する。

### CameraStatusBar の busy 表示

ヘッダ下の `CameraStatusBar` は以下を表示する。

- `On Camera`: `cameraControlStatus === 'camera'`
- `Busy`: `selectIsShortTermBusy(state)`
- `Syncing`: `pendingSettings` が 1 件以上あるとき

`Syncing` は preset/group 切替や設定反映待ちの可視化として使い、全画面ブロックの代替ではない。

## 設定セクション分離

| セクション | 設定ID群 | 意味 |
|-----------|---------|------|
| Shooting Settings | レイアウトの `prioritizedAdvancedSettingIds` から `CAMERA_ADVANCED_SETTING_IDS` を除外 | 撮影関連 |
| Camera Settings | `CAMERA_ADVANCED_SETTING_IDS` (13項目: Auto Off, LED, GPS, LCD Brightness 等) | デバイス設定 |

## Dashboard Controls (現在は Hero13 専用分岐)

- 現在の実装では `cameraModel === 'hero13'` のときのみ セクション表示
- `DASHBOARD_OVERRIDE` (ID 205) が ON (`=== 1`) のときのみサブ設定を表示
- サブ設定 (ID 206-212): `DASHBOARD_SUB_SETTING_IDS.map(renderOtherItem)` で描画

## 自動スクロール

- プリセットチップ行: アクティブプリセットの位置に自動スクロール
- Primary Settings トグル行: 選択中の値の位置に自動スクロール
- `onLayout` でアイテム位置を計測、`scrollTo()` で移動

## プリセットチップ

**対象ファイル**: [src/components/SettingsPanel.tsx](../../src/components/SettingsPanel.tsx)

各チップは `[Ionicon] [ラベル]` の横並びで描画する:

- **アイコン**: `getPresetIoniconName(preset.iconId, groupId)` で Ionicons 名を解決 (参照: `src/constants/PresetIconMap.ts`)
  - サイズ 17、`marginRight: 6`
  - 色はチップの文字色と同じ (`isActive` で強調)
- **ラベル**:
  - `userDefined === true` の場合 → `customName` を優先表示
  - それ以外 → `PRESET_TITLES[titleId]` を表示

### Long-press → リネーム

- **発火条件**: `userDefined === true` かつ 対応機種 (HERO12/HERO13/MAX2)
- **UX フロー**:
  1. 非アクティブなプリセットを長押し → `loadPreset()` 発行 → 350ms 待機 → モーダル表示
  2. モーダル: `TextInput (maxLength=16)` + 文字数カウンタ + アイコンピッカーグリッド
  3. アイコンピッカー: 44×44 セル、`PRIMARY_ICON_CHOICES` (12) 表示、`(+) More` で `EXTENDED_ICON_CHOICES` (18) を追加表示
  4. Save → `goProBle.renameActivePreset(name, iconId)`
- **トリガー**: `onLongPress`, `delayLongPress={450}`
- **対応不可のカメラ**: `onLongPress` を `undefined` にしてハンドリング無効化 (HERO11 以下では長押ししても何も起きない)

## Framing (アスペクト比) セレクタ

**対象ファイル**: [src/components/SettingsPanel.tsx](../../src/components/SettingsPanel.tsx), [src/components/settingsPanel/framingSelector.ts](../../src/components/settingsPanel/framingSelector.ts)

対応モデルでのみ Quick Settings 上部に表示される 4 ボタン (16:9 / 9:16 / 4:3 / 8:7)。

**表示条件**:
- 対応モデル: Hero11 / Hero11 Mini / Hero12 / Hero13
- 表示コンテキスト: Video、または Timelapse 系のうち photo ではないプリセット
- 非表示: Photo、Timelapse Photo、resolver 未実装のモデル (Hero9 / Hero10 など)

**UX**: resolver が有効なコンテキストでは 4 ボタンを **常時表示** し、capability の有無では出し分けない。

**内部実装**: SettingsPanel は facade の `layoutExternalControls.showsFramingSelector` で表示可否を決め、その後 `resolveFramingSelector()` を呼んで shared dispatcher と per-model resolver で option と送信 setting を切り替える (詳細: [docs/guides/01_model-specific-logic.md](../guides/01_model-specific-logic.md))。

| 機種 | 使用 BLE Setting |
|------|-----------------|
| Hero11 / Hero11 Mini | `VIDEO_FRAMING (232)` / `MULTI_SHOT_FRAMING (233)` を resolver 経由で扱う |
| Hero13 | `VIDEO_FRAMING (232)` を直接送信 |
| Hero12 | FRAMING API 非対応のため `RESOLUTION (2)` 値を **remap** して送信 |

機種別 RESOLUTION 完全マップは [src/constants/ResolutionAspectMap.ts](../../src/constants/ResolutionAspectMap.ts) に集約。

## CustomPresetsScreen

**対象ファイル**: [src/screens/CustomPresetsScreen.tsx](../../src/screens/CustomPresetsScreen.tsx)

### 概要
カメラの現在設定をスナップショットして保存する「カスタムプリセット」の管理画面。
`SettingsPanel` の「My Presets」ボタンから push 遷移する。

### 機能
- **一覧**: SQLiteの `custom_presets` テーブルから取得、`sortOrder` 順に表示
- **グループバッジ**: Video / Photo / Timelapse を色分けで表示
- **並び替え**: [▲][▼] ボタンで隣接項目と `sortOrder` をスワップし、`updateSortOrders()` で一括記録
- **削除**: [🗑] ボタンで確認ダイアログ → `deleteCustomPreset()` 
- **復元**: [Apply] ボタン → `includeSystemSettings` Switch を含む確認モーダル → `goProBle.applyCustomPreset()` 呼び出し
- **新規保存**: ネビゲーションヘッダに「+ Save Current」ボタン (`useLayoutEffect`)

### applyCustomPreset() の動作
`GoProBLEManager.applyCustomPreset(settingsMap, includeSystemSettings)` の内部フロー:

1. **ソート**: `RESTORE_PRIORITY_ORDER` に従い適用順序を決定 (MODE_PRESET → VIDEO_PROFILE → RESOLUTION → FPS → ...)
2. **MODE_PRESET_GROUP スキップ**: MODE_PRESET を送信すれば自動変更されるため不要
3. **同一値スキップ**: `useGoProStore.getState().settings[id]` をループ内で毎回取得し、現在値と目標値が同じなら BLE 送信をスキップ
4. **復元後 capability 再取得**: 全設定送信完了後、400ms 待機して `getQuickCapabilitySettingIds()` で capability を一括再取得

> **重要**: ストアのスナップショットは関数先頭ではなくループ内で毎回取得する。MODE_PRESET 送信後に
> カメラから届く BLE 通知で設定値が更新された場合に、その後の設定の同一値判定に正しく反映するため。

## 設定変更確認フロー（Pending Confirmation）

設定変更が GoPro カメラに反映されなかった場合に、アプリ表示とカメラの実際の状態がズレる問題を防ぐための仕組みです。
BLE 書き込み後にカメラからの通知で値を確認し、不一致またはタイムアウト時はユーザーにトーストで通知します。

### フロー

1. ユーザーが設定を変更
2. `setSetting()` → BLE write → `pendingSettings[id] = 期待値` + 5秒タイマー開始
3. UI は期待値を即時表示 + スピナー表示
4. カメラが通知を返す
   - **期待値と一致** → pending クリア、スピナー消える（正常終了）
   - **期待値と異なる値** → store はカメラの実際値に更新、pending は維持（中間状態として保留）
   - **5秒タイムアウト** → 最終状態を確認し、期待値でなければ pending クリア + トースト表示

**重要**: BLE 通知には変更前の値や中間状態が混ざることがあるため、通知 1 回の不一致を即失敗とは扱わず、タイムアウト時に最終判定を行います。通知の先頭バイトが `0x92` の場合のみ、Pendingの成功判定に使用します。

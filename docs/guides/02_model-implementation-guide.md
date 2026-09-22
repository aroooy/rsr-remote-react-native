# 11. 機種別設定実装ガイド

機種固有の撮影設定（ProTune 項目・UI レイアウト・BLE ID オーバーライド等）を
新アプリに実装するための調査手順と実装パターンを示す。

> 2026-05 更新:
> 新規実装は `SettingsPanel.tsx` や `GoProSettingIds.ts` に直接分岐を足すのではなく、まず facade/resolver のどこに置くべきかを判断する。現在の基本形は `facade -> shared dispatcher -> per-model resolver`。

## 現在の実装配置ルール

### UI 側の入口

- `src/components/SettingsPanel.tsx`: UI オーケストレーションと状態バインディング
- `src/components/settingsPanel/*.tsx`: UI サブコンポーネント (`PrimarySettingRow`, `OtherSettingRow`, `SpecialRowView` 等)
- `src/components/settingsPanel/*.ts`: UI helper facade (`framingSelector`, `resolutionSelector` 等)

### 定数 / レイアウト側の入口

- `src/constants/GoProSettingIds.ts`: setting ID、base layout、group builder facade
- `src/constants/displayLayoutResolver.ts`, `videoLayoutResolver.ts`: full-layout resolver facade
- `src/constants/photoLayoutState.ts`, `timelapseLayoutState.ts`: state resolver facade
- `src/constants/Timeouts.ts`: タイムアウト・デバウンス定数

### 実体の置き場所

- `src/cameraModels/shared/modelManifest.ts`: カメラモデルマニフェスト・全モデル統合登録
- `src/cameraModels/shared/*.ts`: dispatcher, shared helper, shared types
- `src/cameraModels/<model>/*.ts`: per-model resolver

### facade 境界の推奨

おすすめは次の線引きです。

1. facade には公開 API、shared fallback、最終合成だけを残す
2. model 名や preset family を見る条件分岐は resolver へ寄せる
3. shared な配列組み立てが大きい場合は state resolver を返す
4. 機種ごとに返すレイアウト全体が違う場合は full-layout resolver にする
5. UI は共通描画で済むなら descriptor resolver にする

---

## 調査フェーズ

### Step 1: 現行レイアウト resolver を読む

**調査パス**:
- `src/constants/GoProSettingIds.ts`
- `src/constants/displayLayoutResolver.ts`
- `src/cameraModels/<機種>/layout.ts`

各プリセット / モデル条件ごとに、どの設定が quick / advanced / hidden として扱われているかを確認する。

| フィールド | 意味 |
|---|---|
| `SettingElement` | 論理 ID (GoProSettingNo 体系) |
| `BLEHeader` | BLE 書き込みコマンド先頭 2 バイト |
| `Sort` | 表示順。**負値 (-99 〜 -96) は強制非表示** |
| `QuickSettings` | true = Quick チップ相当; false = アクションシート相当 |

```
例: Standard Video (presetId=0) 行
  V_Clips (Sort=0, BLE: 0x03, 0x6B)   → 最優先で action sheet に表示
  V_Resolution (Sort=-99)              → 非表示 (表示しない)
```

**重要**: 現行実装では「表示するか」「選択肢を出すか」が別レイヤーで管理される。
- 表示面: `getDisplayLayout()` と model resolver
- 選択肢面: `filterSelectableValues()` / `resolveOtherItemState()`
- capability 補完: `settingFallbackPolicies.ts`

### Step 2: BLE ID を特定する

**調査パス**:
- `src/constants/GoProSettingIds.ts`
- `src/constants/settingIdTranslation.ts`
- `src/ble/GoProBLEManager.ts`

- `GoProSettingIds.ts` … 論理 ID / BLE ID の基準定義
- `settingIdTranslation.ts` … 互換 ID や機種差の吸収ポイント
- `GoProBLEManager.ts` … 実際の送信 packet 形式と機種別 override

書き込みコマンド形式:
- 1-byte 設定: `[0x03, <BLEID>, 0x01, value]`
- 4-byte int 設定: `[0x06, <BLEID>, 0x04, b3, b2, b1, b0]`

### Step 3: Converter を読む

**調査パス**:
- `src/components/settingsPanel/selectableValues.ts`
- `src/components/settingsPanel/primaryItemValues.ts`
- `src/components/settingsPanel/otherItemState.ts`
- `src/constants/settingFallbackPolicies.ts`

現行実装では「ある設定の値によって別の設定の選択肢を絞る」ロジックは上記に分散している。

| Converter 名のパターン | 意味 |
|---|---|
| `ActiveXxxConverter` | 設定 Xxx の有効値リストを返す |
| `VisibleOfXxxConverter` | 設定 Xxx の表示可否を返す |

現アプリでの対応箇所:
- `settingsPanel/selectableValues.ts` … `ActiveXxx` 相当
- `GoProSettingIds.ts` の facade + layout resolver … `VisibleOf` 相当

### Step 3.5: BLE capability の返し方を確認する（新機種追加時・設定タップ後に非活性になるバグが出たとき）

**問題パターン**: 設定がリストに表示されるが、タップしてもモーダルが開かない（または選択肢が 1 つで変更不可）。

**原因の切り分け**:

| `capabilities[id]` の内容 | 原因 | 対処 |
|---|---|---|
| `[]`（空） | BLE が capability を全く送らない | `getOrderedSettingValues` の「capability 空フォールバック」セクションに追加（パターン D） |
| `[currentValue]`（現在値のみ） | BLE が現在値のみを返す（Max 等で多発） | `getOrderedSettingValues` に機種限定 always-static チェックを追加（パターン E） |
| `[val1, val2, ...]`（全リスト） | 正常。表示されない場合は `preferred` 順序や表示フィルタを確認 | |

**確認方法**: `getOrderedSettingValues` に `console.log(settingId, values)` を追加して実機確認。

**注意点**: `FORCE_VISIBLE_STATIC_FALLBACK_IDS`（SettingsPanel.tsx）は **Quick 設定の強制表示**にのみ効果がある。Advanced 設定の表示には `defaultVisibleAdvancedSettingIds` が `[]` のため実質的に無効。Advanced 設定の visibility は `isSettingAvailable(id)` = `settings[id] !== undefined || hasCapability(id)` で制御される。

### Step 4: プリセット ID を確認する

**調査パス**:
- `src/constants/presetIds.ts`
- `src/constants/hero13PresetIds.ts`
- `src/constants/GoProSettingIds.ts` の `fallbackPresetsByModel`

プリセット ID (int) と対応するプリセット名・グループ ID のマッピングを確認する。
また `MaxLensModEnable` など条件付きで表示が変わるプリセットにも注意。

---

## 実装パターン

### パターン A: 機種固有の BLE ID（ID オーバーライド）

他機種と **同じ設定** だが **BLE ID だけ異なる** 場合。

```ts
// GoProSettingIds.ts に専用 ID を追加
HYPERSMOOTH_MAX: 148,       // BLE ID 0x94: Max 専用 HyperSmooth
MAX_WIND_REDUCTION: 149,    // BLE ID 0x95: Max 専用 Wind Reduction (Hero13 は 214=0xD6)

// GoProBLEManager.ts の setSetting で Max ブランチに追加
if (bleSetting === GoProSettingId.WIND_REDUCTION) {
  bleSetting = GoProSettingId.MAX_WIND_REDUCTION;  // 214 → 149
}

// GoProBLEManager.ts の受信通知ハンドラでも同期を追加
if (changedIds.includes(GoProSettingId.MAX_WIND_REDUCTION)) {
  // settings[149] → settings[214] に同期して UI に反映
  useGoProStore.getState().updateSettings(GoProSettingId.WIND_REDUCTION, val);
}
```

現アプリ実装済み例:
- `HYPERSMOOTH_MAX` (148) … 通常の `HYPERSMOOTH` (135) の Max 版
- `MAX_WIND_REDUCTION` (149) … 通常の `WIND_REDUCTION` (214=Hero13専用) の Max 版
- `HORIZONTAL_LEVELING_HERO11` (150) … Hero11/HeroMini11 版
- `HORIZONTAL_LOCK_HERO11` (151) … 同上

**⚠️ BLE ID オーバーライドが必要な設定を見落とす典型パターン**:
Hero13 で新規追加した設定 (BLE ID が大きい番号) を「全機種共通」として実装してしまう。
旧アプリでは各機種の `FullControlPanelViewModel` で BLE ID をオーバーライドしているが、
新アプリは GoProSettingId の値を BLE ID として直接使うため、**Hero13 用 ID を全モデルに送ってしまう**。

→ **Step 2 で必ず「旧アプリの BaseFullControlPanelViewModel.cs の GetSetXxx メソッドが
各機種 ViewModel でオーバーライドされていないか」を確認すること。**

#### Hero11 / HeroMini11 の Horizontal Lock で追加確認が必要な点

Hero11 系の `Horizontal Lock` は、BLE ID 差し替えだけでは不十分。

| 観点 | Hero12/13 系 | Hero11 / HeroMini11 |
|---|---|---|
| 論理 ID | 166 | 166 |
| 実通信 ID | 166 | 151 |
| On 値 | 1 | 2 |
| Max Photo での UI 配置 | Quick / Advanced のどちらもありうる | **Quick Settings に出るケースあり** |

このため、Hero11 系 `Horizontal Lock` を実装・修正する際は以下をセットで確認する。

1. `GoProBLEManager.setSetting()` の `166 -> 151` 送信差し替え
2. async 通知の `151 -> 166` ミラー
3. `MODEL_VALUE_OVERRIDES` の `2 => On`
4. `GOPRO_BOOL_VALUES_MODEL_OVERRIDE` の `onValue=2`
5. `GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE` の `[2, 0]`

**今回の実例**: 1〜4 だけ直っていて 5 が抜けると、Quick Settings 側だけ `1/0` を候補に使い、
`0x97` へ `1` を送って `Invalid Parameter (0x02)` になる。旧アプリは Hero11 の
`GetSetHorizontalLockToggleCommand()` で `0x97` に `2/0` を送っているため、旧実装との突合が有効。

#### Hero11 と HeroMini11 で Trail Length を同一扱いしない

Trail Length は旧アプリ上では Hero11 / HeroMini11 ともに `0x83` (`ID=131`) 書き込みだったが、
現行の HeroMini11 実機ではこの前提がそのまま通らない。

| 観点 | Hero11 | HeroMini11 | Hero12/13 |
|---|---|---|---|
| 論理 ID | 179 | 179 | 179 |
| 旧アプリ書き込み ID | 131 | 131 | 179 |
| 現アプリで使う書き込み ID | 131 | 179 | 179 |
| 実機で確認できた挙動 | 131 前提を維持 | `131 -> 0x02 Invalid Parameter`、現在値は `179` で返る | 179 |

この差異は「Hero11 系」というまとめ方だけでは落ちる。Trail Length を実装・修正する際は、少なくとも以下を確認する。

1. `GoProBLEManager.setSetting()` で Hero11 と HeroMini11 を別分岐にする
2. Hero11 のみ `131 -> 179` ミラーで pending を解消する
3. HeroMini11 は `179` を正規 ID として扱い、旧アプリ由来の `131` 固定 remap を入れない

**今回の実例**: 旧アプリ parity に合わせて HeroMini11 でも `179 -> 131` を送ると、
Trail Length タップ時に `Setting 131 (0x83) write FAILED: code=0x02` が発生した。
`0x92` / query 側では `ID=179` に現在値が返っていたため、Mini11 は 179 を正準として扱う必要がある。

### パターン B: 機種固有の設定 ID（完全新規）

他機種には存在しない設定。

```ts
// 1. GoProSettingIds.ts に追加
VIDEO_CLIPS: 107,  // BLE ID 0x6B, 1-byte, Max専用

// 2. GoProMetadata.ts に表示名と値ラベルを追加
[GoProSettingId.VIDEO_CLIPS]: {
  name: 'Clips',
  values: { 0: 'Off', 1: '15 sec', 2: '30 sec' },
},

// 3. SETTING_VALUE_ORDER に追加
[GoProSettingId.VIDEO_CLIPS]: [0, 1, 2],

// 4. SettingsPanel.tsx の getFilteredSelectableValues に
//    カメラが capability を返さない場合の静的フォールバックを追加
else if (id === GoProSettingId.VIDEO_CLIPS) vals = [0, 1, 2];

// 5. GoProSettingIds.ts の機種専用レイアウトに追加
GoProSettingId.VIDEO_CLIPS,  // MAX_CAMERA_STANDARD_VIDEO_LAYOUT の先頭
```

### パターン C: 機種専用レイアウト（アクションシートの項目セット差替）

機種によって表示する設定の **セット自体** が大きく異なる場合。

```ts
// GoProSettingIds.ts に専用レイアウト定数を追加
const MAX_CAMERA_STANDARD_VIDEO_LAYOUT: GoProDisplayLayout = { ... };
const MAX_CAMERA_360_VIDEO_LAYOUT: GoProDisplayLayout = { ... };

// facade から resolver に委譲
const resolved = resolveModelDisplayLayout({ ... });
if (resolved) return resolved;
```

per-model の分岐本体は `src/cameraModels/<model>/layout.ts` か、より狭い責務の `videoLayout.ts` / `photoLayout.ts` / `timelapseLayout.ts` に置く。`GoProSettingIds.ts` に直接 `if (cameraModel === ...)` を積み増さない。

**注意**: 機種専用レイアウトで使うシステム設定は機種に合ったものだけを含める。
例: Max は `SCREEN_SAVER_MAX` (51) を使い、`SCREEN_SAVER` (219/Hero13) や
`BEEP_VOLUME` (216/Hero13)、`CONTROL_MODE` (175/Hero11-13) は除外する。

### パターン D: 設定値フィルタ（Converter 相当）

カメラから返ってくる capability を **上書き** して有効値を絞る場合。

```ts
// SettingsPanel.tsx の getFilteredSelectableValues 内 Max ブランチ
if (id === GoProSettingId.RESOLUTION) {
  vals = vals.filter(v => is360 ? (v === 21 || v === 22) : (v === 7 || v === 9));
}
```

### パターン E: 機種固有の「常時静的リスト」（BLE が現在値のみを返す設定）

**問題**: Max の BLE は ProTune 設定（Shutter / EV Comp / WB / ISO / Sharpness / Color / RAW Audio / Wind Reduction）に対して「現在値のみ」を capability として返す。そのため `getOrderedSettingValues` が 1 値しか返せず、タップしてもモーダルが事実上非活性になる。

**他機種との違い**: Hero11/12/13 は全 capability リストを BLE で返すため動的フィルタが機能する。この問題は **Max 固有** であり、グローバルな always-static にすると Hero11/12/13 の動的フィルタ（解像度×FPS の組み合わせ制限等）が壊れる。

**対処法**: `getOrderedSettingValues` に `modelKey === 'max'` 限定の always-static チェックを追加する。

```ts
// GoProMetadata.ts の getOrderedSettingValues 先頭付近（preferred チェックの直後）に追加
if (modelKey === 'max' && (
  settingId === GoProSettingId.VIDEO_SHUTTER ||
  settingId === GoProSettingId.EV_COMP ||
  settingId === GoProSettingId.WB ||
  settingId === GoProSettingId.VIDEO_ISO_MIN ||
  settingId === GoProSettingId.VIDEO_ISO_MAX ||
  settingId === GoProSettingId.SHARPNESS ||
  settingId === GoProSettingId.COLOR ||
  settingId === GoProSettingId.RAW_AUDIO ||
  settingId === GoProSettingId.WIND_REDUCTION
)) {
  const modelOverride = GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE[settingId]?.['max'];
  return modelOverride ? [...modelOverride] : [...preferred];
}
```

**VIDEO_SHUTTER の値セット**: Max は最大 60fps のため、高速シャッター（1/480 より速い値）は動画用途で不要。`GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE` に Max 専用値セットを追加する。

```ts
[GoProSettingId.VIDEO_SHUTTER]: {
  max: [22, 21, 20, 46, 18, 17, 15, 45, 13, 12, 10, 44, 8, 7, 6, 52, 5, 4, 3, 0],
  //   1/480 ... Auto  ← 1/480 以下の範囲に限定
},
```

**調査手順（新機種で同症状が発生したとき）**:
1. 問題の設定をタップ → モーダルが開かない or 選択肢が 1 つだけ
2. `getOrderedSettingValues` に `console.log(values)` を追加して capability の内容を確認
3. `values` が `[currentValue]`（1 件）なら BLE が現在値のみを返している → パターン E を適用
4. `values` が `[]` なら capability 未送信 → パターン D の `vals.length === 0` フォールバックを追加
5. 旧アプリ `ValueNameSettings.cs` で機種固有の有効値を確認してから値セットを決定

**注意**: タイムラプスのサブモードによる ISO 設定の細分化も同じ問題が起きる。
- Timelapse Video モード: `VIDEO_ISO_MIN` / `VIDEO_ISO_MAX` を使用 → パターン E で対処済み
- Timelapse Photo モード: `MULTI_SHOT_ISO_MIN` / `MULTI_SHOT_ISO_MAX` を使用 → `getOrderedSettingValues` の「capability 空フォールバック」セクションで対処済み
- Photo モード: `PHOTO_ISO_MIN` / `PHOTO_ISO_MAX` → 同上で対処済み

### パターン F: Hero11 Easy モードの専用 UI 合成

**対象**: Hero11 の Easy Video / Easy Photo / Easy TimeWarp

**問題**: Hero11 の Easy 系プリセットは、旧アプリでは通常の Pro 系レイアウトとは別の最小 UI を持つ。一方、新アプリ側で generic layout と capability だけに寄せると、以下の問題が出る。

- capability が空で返って quick セクションごと消える
- 実機で変えられる項目が 2 個程度しかないのに、汎用 UI では余計な設定が見えてしまう
- 設定というより preset 切替で表現すべき項目を、通常 setting として扱ってしまう

**対処方針**: Hero11 Easy 系は、`GoProSettingIds.ts` では最小レイアウトだけを返し、preset 固有の操作は `settingsPanel/specialRows.ts` facade と per-model resolver から専用 row descriptor を合成する。

実装原則:

1. `getDisplayLayout()` で Hero11 対象 preset だけを generic Easy layout から分岐する
2. レイアウト側には capability に依存しやすい最小 quick setting だけ残す
3. preset 固有トグルは `settingsPanel/specialRows.ts` + per-model resolver で descriptor を返し、`SettingsPanel.tsx` の generic renderer で合成する
4. 静的フォールバックは対象 setting のみに限定し、他モードへ波及させない
5. preset 切替で表現する項目は `setSetting()` ではなく `loadPreset()` を使う

#### Hero11 Easy モード実装マップ

| プリセット | presetId | レイアウトに残す項目 | 合成 UI | 機種固有フォールバック / 制約 |
|---|---:|---|---|---|
| Easy Video | `655360`, `720896`, `917504` | `VIDEO_LENS` | Speed row | `FPS` が空なら Anti-Flicker に応じて `[5,8,10]` / `[6,9,10]` |
| Easy Photo | `786432`, `786433` | `PHOTO_LENS`, `CAPTURE_DELAY` | Night Mode row | `PHOTO_LENS` が空なら `[101,102]`、Night Mode は `loadPreset(786432/786433)` |
| Easy TimeWarp | `851968` | `VIDEO_LENS` | Speed Ramp row | `VIDEO_LENS` は `Wide(0)` / `Linear(4)` のみに制限、`SPEED_RAMP` は `100/101` |

#### 実装位置

- レイアウト分岐: `src/constants/GoProSettingIds.ts`, `src/constants/displayLayoutResolver.ts`
- 専用 UI 合成: `src/components/settingsPanel/specialRows.ts`
- 値ラベル: `src/constants/GoProMetadata.ts`

#### Hero11 Easy Photo の補足

旧アプリ上の「Night Mode」は独立 setting ではなく、`Easy Photo (786432)` と `Easy Night Photo (786433)` の preset 切替で表現されていた。
そのため新アプリでも専用 row は `handleLoadPreset()` を呼び、`setSetting()` では実装しない。

#### Hero11 Easy TimeWarp の補足

実機ログでは以下の 2 設定だけが UI 対象として安定して確認できた。

- `VIDEO_LENS (121)`: `0=Wide`, `4=Linear`
- `SPEED_RAMP (155)`: `100=Real Speed`, `101=Half Speed`

この preset は `EASY_TIMELAPSE_PRESET_IDS` 全体と同じ空レイアウトに入れると何も表示されないため、Hero11 の `851968` だけは別分岐で `VIDEO_LENS` を残し、`Speed Ramp` は synthetic row として表示する。

また generic の Framing row は Easy TimeWarp では不要かつ挙動が紛らわしいため、`renderFramingSelector()` 側で Hero11 の `851968` では非表示にする。

#### 判断基準

次に Easy 系の機種固有 UI を追加する場合は、まず以下を確認する。

1. 旧アプリの `UIElementSettings.cs` で Quick 設定が最小セットになっているか
2. 実機 BLE ログで capability 空返却または preset push 依存の挙動があるか
3. その項目が「setting write」か「preset switch」か
4. 汎用レイアウトに押し込むより、Hero11 Easy 専用 row に切り出した方が影響範囲を狭くできるか

この条件を満たすなら、**レイアウト最小化 + special row facade での専用 UI 合成** を標準パターンとして採用する。

---

## Max 実装まとめ（作業ログ）

### 実装済み (コミット一覧)

| コミット | 内容 |
|---|---|
| `1945c95` | Lens Mode 位置変更・PowerPano 名称・Photo Lens 修正 |
| `05c2955` | Max TimeWarp FPS 非表示・Horizontal Lock 表示 |
| `8569382` | 360/Timelapse RESOLUTION・Video Lens・FPS 表示修正 |
| `3e19961` | Max Timelapse の PHOTO OUTPUT (ID=126) を完全非表示 |
| `b353a62` | Max 360 Timelapse (327681) の MEDIA FORMAT 表示・FPS 非表示 |
| `41c1832` | IAP 購入判定 (`/^MAX/i` → `/MAX/i`) バグ修正 |
| `cdfcc31` | 360 Audio 追加・Microphone ラベル・Wind Reduction BLE ID・MAX_AUDIO_MODE 全体修正 |
| *(現在)* | Max Standard Video: MaxHyperSmooth・Horizontal Leveling の退行修正 |

### Max プリセット ID 対応表

| presetId | プリセット名 | グループ |
|---|---|---|
| 0 | Standard (HERO Video) | VIDEO |
| 196608 | 360 Video (MaxVideo) | VIDEO |
| 65536 | HERO Photo | PHOTO |
| 65537 | LiveBurst (PowerPano) | PHOTO |
| 262144 | 360 Photo (MaxPhoto) | PHOTO |
| 131072 | HERO Timewarp | TIMELAPSE |
| 131073 | HERO Timelapse | TIMELAPSE |
| 327680 | 360 Timewarp | TIMELAPSE |
| 327681 | 360 Timelapse | TIMELAPSE |

### Max 固有 BLE ID 対応表

| 設定名 | 論理 ID (GoProSettingId) | BLE ID | 型 | 備考 |
|---|---|---|---|---|
| VIDEO_CLIPS | 107 | 0x6B | 1-byte | Max 専用新規設定 |
| HYPERSMOOTH_MAX | 148 | 0x94 | 1-byte | 通常 HYPERSMOOTH (135) のオーバーライド |
| MAX_WIND_REDUCTION | 149 | 0x95 | 1-byte | 通常 WIND_REDUCTION (214=Hero13) のオーバーライド |
| HORIZONTAL_LEVELING (Max 360) | 150 | 0x96 | 1-byte | |
| HORIZONTAL_LOCK (Max Single) | 151 | 0x97 | 1-byte | |
| MAX_AUDIO_MODE | 137 | 0x89 | 1-byte | Standard Video: Microphone (0=Stereo/1=Front/2=Back/3=Match Lens)<br>360 Video: 360 Audio (5=360+Stereo/0=Stereo)<br>同一 BLE ID でプリセットにより有効値が異なる |
| SCREEN_SAVER_MAX | 51 | 0x33 | 1-byte | |
| DEFAULT_PRESET_MAX | 127 | 0x7F | 4-byte | |
| QUICK_CAPTURE_DEFAULT | 141 | 0x8D | 4-byte | |
| VIDEO_BITRATE (Max 版) | 124 (HERO11 共通) | 0x7C | 1-byte | |
| ANTI_FLICKER (Max 値体系) | 134 | 0x86 | 1-byte | 値: 0=60Hz/1=50Hz |

### Max でのシステム設定

Max が対応するシステム設定（`MAX_CAMERA_SYSTEM_SETTINGS` 定数）:
`ANTI_FLICKER` / `AUTO_OFF` / `LCD_BRIGHTNESS` / `SCREEN_SAVER_MAX` /
`LED` / `BEEPS` / `GPS` / `LANGUAGE` / `VOICE_CONTROL` /
`ORIENTATION` / `SCREEN_LOCK` / `QUICK_CAPTURE` / `DEFAULT_PRESET_MAX` /
`VIDEO_COMPRESSION` / `QUICK_CAPTURE_DEFAULT`

Max で **使わない** Hero 系 ID:
`SCREEN_SAVER` (219, Hero13) / `SCREEN_SAVER_FRONT` (158) /
`BEEP_VOLUME` (216, Hero13) / `VOICE_LANGUAGE` (223, Hero13) /
`CONTROL_MODE` (175, Hero11-13) / `SYSTEM_VIDEO_MODE` (180, Hero11) /
`MAX_LENS_MOD_HERO13` (189) / `MAX_LENS_MOD_ENABLE` (190) /
`HINDSIGHT` (167) / `DENOISE` (198) / `VIDEO_DURATION` (156) /
`SCHEDULED_CAPTURE` (168) / `CAPTURE_DELAY` (105)

---

## Hero9 調査・実装の手順書

### 調査開始時に読むべきファイル

```
src/constants/GoProSettingIds.ts
src/constants/displayLayoutResolver.ts
src/cameraModels/hero09/ または shared resolver
src/components/settingsPanel/selectableValues.ts
```

### 確認すべき調査項目

1. **プリセット ID 一覧**
   - `UIPresetRepository.cs` で Hero9 の全プリセット ID と名前を確認
   - Pro モード / Easy モードの分岐があるか

2. **各プリセットの設定項目**
   - `UIElementSettings.cs` で各プリセット × 設定の Sort 値と BLEHeader を全列挙
   - 現アプリの `STANDARD_VIDEO_LAYOUT` / `getPhotoLayout` / `getTimelapseLayout` と差分を比較

3. **Hero9 固有の BLE ID**
   - HyperSmooth (Hero9 は最大 On=1/Off=0 のみ?)
   - BitRate (VIDEO_BITRATE_HERO11=124 を使うか、別 ID か)
   - StarTrails / LightPainting / VehicleLights はあるか

4. **Converter の状態制御**
   - `ActiveHyperSmoothConverter` … Resolution × FPS × VideoLens の組合せ制限
   - `ActiveFrameRateConverter` … Resolution × AntiFlicker → FPS
   - `ActiveResolutionConverter` … FPS → Resolution
   - `ActiveVideoLensConverter` … Resolution × FPS → VideoLens

5. **スペックの違い**
   - 最大解像度・FPS の組み合わせ
   - HyperSmooth の対応レベル (On/Off/High/Standard?)
   - 4K 60fps 対応可否

### 現アプリでの Hero9 実装状況（調査前の推定）

Hero9 は `fallbackPresetsByModel.hero09` で:
```ts
[GoProPresetGroup.VIDEO]: [0, 1, 2, 3],         // Standard/Activity/Cinematic/SloMo
[GoProPresetGroup.PHOTO]: [65536, 65537, 65538, 65539], // Photo/LiveBurst/Burst/NightPhoto
[GoProPresetGroup.TIMELAPSE]: [131072, 131073, 131074], // Timewarp/Timelapse/Nightlapse
```

Hero9 は現行レイアウト resolver と capability フィルタで動作する。
以下の点が Hero9 で正しく動作しているかを実機と docs を照合する:
- Video: RESOLUTION / FPS / VIDEO_LENS / HYPERSMOOTH の組み合わせ
- Photo: PHOTO_OUTPUT (ID=125) の表示
- Timelapse: NIGHTLAPSE_RATE の表示 (ID=32)

### 調査後の実装手順

1. 差分リストを作成 (旧アプリ UIElementSettings ↔ 現アプリレイアウト)
2. 不足項目を GoProSettingIds.ts のレイアウトに追加 OR フィルタ修正
3. 新規 ID があれば GoProSettingId・GoProMetadata に追記
4. `getFilteredSelectableValues` に Hero9 固有フォールバックを追加
5. エラーチェック → ビルド → 実機確認
6. コミット

---

## 実装漏れが発生する根本原因と再発防止策

### なぜ「全て移植して」と依頼しても漏れが発生するのか

#### 原因 1: 旧アプリと新アプリの設計思想の違い

| 旧アプリ (C# WPF) | 新アプリ (React Native) |
|---|---|
| 機種ごとに `FullControlPanelViewModel` を継承して個別実装 | 全機種を単一コードで処理し、機種判定を所々に挿入 |
| BLE ID は `GetSetXxx` メソッドをオーバーライドして変更 | GoProSettingId の値を BLE ID として直接使用 |
| 設定値の変換は各機種の `Converter` クラスが担当 | `getFilteredSelectableValues` と `GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE` |

**結果**: 旧アプリで「機種固有クラスに隠れているオーバーライド」は調査しないと見えない。

#### 原因 2: BLE ID に「最新機種 = Hero13 の ID」を使いがちな実装バイアス

新アプリの `GoProSettingId` 定数は数値が BLE ID そのものであることが多い。
Hero13 が最後に追加されたモデルのため、**Hero13 の BLE ID = 最新 = グローバル** という誤解が生じやすい。

例:
- `WIND_REDUCTION: 214` → Hero13 専用 (BLE 0xD6)。Max は 0x95 (149) が正しい。
- `COLOR: 116` の値 `100=Vibrant, 101=Natural, 102=Flat` → Hero13 新スキーム。Max は `0=GoPro, 1=Flat`。

#### 原因 3: 「表示できた」≠「正しく動作している」

BLE 受信値がローカル settings に格納されるため UI には表示される。
しかし **書き込み時に間違った BLE ID を送る** ため設定変更が反映されない。
この無音の失敗はテストで気づきにくい。

---

### 再発防止チェックリスト（新機種追加・設定追加時）

新しい機種や設定を追加するたびに以下を確認する。

#### ✅ BLE ID チェック（パターン A の漏れ防止）

```
現行確認パス:
src/constants/GoProSettingIds.ts
src/constants/settingIdTranslation.ts
src/ble/GoProBLEManager.ts
```

1. `GoProSettingIds.ts` の ID 定義を確認する
2. `settingIdTranslation.ts` や `GoProBLEManager.ts` に機種別 override がないか確認する
3. override が必要なら modelNo ベースで狭く追加する

```
確認コマンド (サブエージェント活用推奨):
"override GetSetWindReductionCommand" を全 ViewModel で検索する
```

#### ✅ 「同一 BLE ID・プリセット別有効値」チェック（MAX_AUDIO_MODE 類似パターンの漏れ防止）

```
現行確認パス:
src/components/settingsPanel/selectableValues.ts
src/constants/settingFallbackPolicies.ts
src/cameraModels/<機種>/
```

同じ BLE ID でも **プリセットによって有効値が異なる** ケースがある。

例: Max BLE 0x89 (137)
- `Preset.Standard` → `V_RAWAudio`(1029, 0x8B) で RAW Audio ← **別 ID**
- `Preset.MaxVideo` → `V_360RAWAudio`(1035, 0x89) で 360 Audio (5/0)
- ※ 新アプリで Standard Video に Microphone(0/1/2/3) として追加したのは FW 更新による拡張

チェック方法:
1. 現行レイアウトで対象 setting がどの preset/group で出るか確認する
2. 実機 capability と `getOrderedSettingValues()` の返り値を確認する
3. 有効値が異なる場合 → `filterSelectableValues()` か model-specific resolver に追加する

#### ✅ 設定値チェック（パターン E / GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE の漏れ防止）

```
現行確認パス:
src/constants/GoProMetadata.ts
src/constants/metadata/
src/constants/settingFallbackPolicies.ts
```

1. 対象設定の値ラベルを現行 metadata / overrides で確認
2. **値番号が機種間で異なる場合** → `GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE` に追加
3. **値の名前が同じでも番号が異なることに注意**（例: Wind Reduction "On" = 1 for Max, 4 for Hero11-13）

#### ✅ 設定値ラベルチェック（GoProMetadata.ts の漏れ防止）

値番号を `GOPRO_SETTINGS_METADATA` の `values` に追加し忘れると、
その番号の値を受信したとき「Unknown (N)」と表示される。

1. `values` に全機種で使われる全番号を定義する
2. 機種固有の値番号（Max 専用 `0: 'GoPro'` など）も忘れずに追加

#### ✅ レイアウト定数の分割・新規作成時の quickSettingIds 漏れ防止

既存レイアウト定数を **分割・コピーして新しい定数を作る** とき（パターン C）、
`quickSettingIds` への追加漏れが生じやすい。

**典型的な退行パターン**:
- 元の `MAX_VIDEO_LAYOUT.quickSettingIds` = `[RESOLUTION, FPS, VIDEO_LENS, HYPERSMOOTH, HORIZONTAL_LEVELING]`
- 新しい `MAX_CAMERA_STANDARD_VIDEO_LAYOUT.quickSettingIds` = `[RESOLUTION, FPS, VIDEO_LENS]` ← **漏れ**

**`isForcedQuickId` のロジックは `quickSettingIds` が起点**:
`primaryKeys` は `displayLayout.quickSettingIds` を起点にフィルタするため、
`isForcedQuickId` が `true` を返しても `quickSettingIds` に含まれていなければ表示されない。

```
チェック手順:
1. 新レイアウト定数の quickSettingIds を、分割元の quickSettingIds と照合する
2. 分割元に含まれていた全 ID が新定数に入っているか（又は意図的に除外したか）を確認する
3. isForcedQuickId の Max ブランチで処理している全 ID（HYPERSMOOTH, HORIZONTAL_LEVELING 等）が
   quickSettingIds に含まれているかをダブルチェックする
```

現在 Max Standard Video の `quickSettingIds` に含まれるべき ID:
`RESOLUTION` / `FPS` / `VIDEO_LENS` / `HYPERSMOOTH` / `HORIZONTAL_LEVELING`

360 Video では `HYPERSMOOTH` / `HORIZONTAL_LEVELING` / `VIDEO_LENS` は **意図的に除外**（360 モードで非表示が正しい）。

---

#### ✅ capability 挙動チェック（パターン E の漏れ防止）

1. 設定をタップしてモーダルが開くか確認
2. 開かない場合: `getOrderedSettingValues` に `console.log(settingId, values)` を追加
3. `values` が `[現在値のみ]` → `modelKey === 'max'` の always-static チェックに追加が必要

#### ✅ 機種専用 ID の BLE 固有 ID 対応表（Max 固有 BLE ID 対応表）のアップデート

本ドキュメントの「Max 固有 BLE ID 対応表」を常に最新化する。
新しい Max 専用 ID を追加したら必ずここに記録する。

---

### Max 固有 BLE ID の調査手順（機種追加時の標準フロー）

以下を順に実行することで実装漏れを防ぐ:

```
Step A: UIElementSettings.cs で対象プリセットの全エントリ列挙
Step B: BLEHeader (0x03, ??) の ?? が GoProSettingId 定数と一致するか確認
        → 一致しない場合: パターン A の BLE ID オーバーライドが必要
Step C: ValueNameSettings.cs で全値番号を確認
        → 他機種と番号が違う場合: GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE 追加
        → GoProMetadata.ts の values に未定義番号がある場合: ラベルを追加
Step D: FullControlPanelViewModel.cs の GetSetXxx オーバーライドを確認
        → オーバーライドがある場合: GoProBLEManager.ts のオーバーライドに追加
Step E: 実機確認（設定をタップして変更できるか・値が反映されるか）
```

---

## 関連ファイル早見表

| ファイル | 役割 |
|---|---|
| `src/constants/GoProSettingIds.ts` | BLE 設定 ID 定義・レイアウト定義・プリセット分類 |
| `src/constants/GoProMetadata.ts` | 設定名・値ラベル・表示順 |
| `src/components/SettingsPanel.tsx` | UI レンダリング・capability フィルタ |
| `src/ble/GoProBLEManager.ts` | BLE 書き込みコマンド・ID オーバーライド |
| `src/constants/ResolutionAspectMap.ts` | 解像度ラベルの機種別マッピング |

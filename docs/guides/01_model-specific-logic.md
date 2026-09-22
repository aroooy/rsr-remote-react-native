# 機種別分岐の全箇所

## 概要

本アプリは **Capability-Driven** 設計により、ほとんどの設定は機種を問わず動作する。
ただし現行コードでは「分岐をなくす」のではなく、「分岐の置き場所を限定する」方針を採っている。

> 2026-05 更新:
> 以前この doc で `SettingsPanel.tsx` や `GoProSettingIds.ts` に直接あると説明していた model-specific ロジックの多くは、現在は `src/components/settingsPanel/*.ts`、`src/constants/*Resolver.ts` / `*LayoutState.ts`、`src/cameraModels/shared/*.ts`、`src/cameraModels/<model>/*.ts` に分離されている。
> 以降の旧説明は「公開入口としての facade」を指すものとして読むこと。

## 現在の分岐の置き場所

### 安定した facade

- `src/components/SettingsPanel.tsx`
- `src/constants/GoProSettingIds.ts`
- `src/constants/GoProMetadata.ts`
- `src/constants/settingConstraints.ts`

これらには既存 call site から見た公開入口と、shared な組み立て処理だけを残す。

### model-specific 実装の実体

- `src/cameraModels/shared/modelManifest.ts`: 全機種のメタデータ・機能フラグ・レイアウト resolver の集中登録マニフェスト
- `src/cameraModels/shared/*.ts`: dispatcher, shared types, ベースプリセット ID 解決ヘルパー (`displayPreset.ts`)
- `src/cameraModels/<model>/*.ts`: per-model resolver (機種固有レイアウト・制約実装)
- `src/components/settingsPanel/*.tsx`: UI サブコンポーネント (モジュール分割) および helper facade (`framingSelector.ts`, `resolutionSelector.ts` 等)
- `src/constants/displayLayoutResolver.ts`, `videoLayoutResolver.ts`, `photoLayoutState.ts`, `timelapseLayoutState.ts`: 各種レイアウト resolver facade

### facade に残す責務の推奨境界

facade に残すのは次の 4 つまでを推奨する。

1. 既存の公開 API と import 面を壊さない入口
2. 全機種共通の配列組み立てや rendering 順序
3. model resolver の戻り値を最終形に合成する処理
4. default fallback のみで完結する shared ルール

逆に、以下は facade から外へ寄せるのを推奨する。

1. `cameraModel === ...` や preset family ごとの例外
2. 機種固有の setting ID 差し替え、quick/advanced 項目差分
3. Easy / special row のような model 固有 UI descriptor
4. capability の穴埋めや layout override のうち、特定モデルだけに閉じるもの

判断に迷う場合の目安:

- 返す layout 全体がモデルごとに変わるなら full-layout resolver
- shared な配列組み立ては保ちつつ、部品の選択だけ変わるなら state resolver
- UI の描画形式は共通で、選択肢や placement だけ変わるなら descriptor resolver

## 1. modelNo の取得と Feature Flags

**ファイル**: `src/ble/GoProBLEManager.ts` / `src/constants/hardwareFeatureFlags.ts`

```typescript
// hardwareInfo.modelName のみで判定 (BLEアドバタイズ名は使わない)
const hwInfo = await this.fetchHardwareInfo();
const modelUpper = hwInfo.modelName.toUpperCase();
const confirmedModel: CameraModelKey = /* ... */;
store.setCameraModel(confirmedModel);
```

> **重要**: BLE アドバタイズ名 (`discover.name`) はユーザー変更可能のため判定に使用しない。

### Hardware Feature Flags
アプリ内の UI レンダリングや機能制御では、`cameraModel === 'hero13'` のような文字列比較や `isHero13Model(modelNo)` 等の直接判定を極力避け、`src/constants/hardwareFeatureFlags.ts` に定義された機能フラグ（Capability Policy）を使用します。

```typescript
const features = getHardwareFeaturesByModelNo(currentModelNo);
if (features.hasMaxLensMod) { ... }
if (features.supports10Bit) { ... }
```

> **重要**: BLE アドバタイズ名 (`discover.name`) はユーザー変更可能のため判定に使用しない。
> Hero13 実装時に "GoPro 13" (HERO13 を含まない) で判定失敗した実績あり。

## 分岐箇所一覧

### 2. Dashboard Controls セクション表示

**ファイル**: `src/components/SettingsPanel.tsx`

現行実装では `isHero13Model(currentModelNo)` の明示分岐で表示を切り替えます。
DASHBOARD_OVERRIDE が ON のときのみサブ設定 (ID 206-212) が表示されます。

### 3. 値ラベルと静的フォールバックのオーバーライド

**ファイル**: `src/constants/GoProMetadata.ts`, `src/constants/settingFallbackPolicies.ts`

機種間で同じ Setting ID の同じ値番号が **異なる意味** を持つケースがあるため、機種別に値ラベルと静的並び順を解決する仕組みを用意しています:

#### (a) MODEL_VALUE_OVERRIDES
機種によって**同じ Setting ID の同じ値番号が異なる意味・ラベルを持つ**場合に使用します。

```typescript
export const MODEL_VALUE_OVERRIDES: ModelValueOverrides = {
  hero09: {
    [GoProSettingId.VIDEO_BITRATE_HERO11]: { 0: 'Standard' }, // 他機種は value=100
  },
  // ...
};
```

#### (b) GOPRO_SETTING_STATIC_FALLBACKS_MODEL_OVERRIDE
特定機種のみ能力クエリが返らない、あるいは特殊な制約がある場合に、静的な値リストや並び順をオーバーライドします。

#### 統一エントリポイント
`getSettingValueNameForModel()` がオーバーライドとベース定義を統合してラベルを解決し、`settingFallbackPolicies.ts` が能力クエリ結果とフォールバックリストを統合します。

### 4. レイアウト選択と LayoutBuilder / Resolver

**ファイル**: `src/constants/GoProSettingIds.ts`

`GoProSettingIds.ts` は現在、設定 ID 定数と static base layout、および group ごとの builder facade を持つ。
runtime の model-specific 分岐は次のように整理している。

- `getDisplayLayout()` の top-level override: `src/constants/displayLayoutResolver.ts`
- `getVideoLayout()` の full-layout override: `src/constants/videoLayoutResolver.ts`
- `getPhotoLayout()` の model-specific state: `src/constants/photoLayoutState.ts`
- `getTimelapseLayout()` の model-specific state: `src/constants/timelapseLayoutState.ts`

`LayoutBuilder` は引き続き static な base layout 定数を宣言する用途で使うが、runtime 分岐を受け持つ場所ではない。

#### カスタムプリセットのベース表示プリセット ID 解決 (Custom Preset Base ID Resolution)

- カスタムプリセット (`userDefined === true`) は大きな ID 値（65536 等）を持ち、そのままでは `LAPSE_WITH_PHOTO_PRESETS` などの判定用ホワイトリストに含まれないため、正しいレイアウト選択や UI 制御が行えない。
- そのため、本アプリでは以下のフローでカスタムプリセットのベース表示プリセット ID (`basePresetId`) を解決して UI とレイアウトを制御する。
  1. **Protobuf デコード**: カメラが返すプリセット status の Protobuf フィールド 2 (`basePresetId`, 実際は `EnumFlatMode` 値) をデコードする。
  2. **ID の正規化**: デコードされた `basePresetId` を `normalizeBaseDisplayPresetId` で正規化（UI が期待する `PRESET_VIRTUAL_LOOPING` などの canonical preset ID に変換）する。
  3. **静的推論フォールバック**: `basePresetId` が未取得またはキャッシュされていない場合、`resolveBaseDisplayPresetId` がプリセットグループ ID と設定値（タイムラプスの `MEDIA_FORMAT` (128)、ビデオの `LOOPING_INTERVAL` (6)、フォトの `NIGHT_PHOTO_SHUTTER` (19) / `BURST_RATE` (147) 等）からベース ID を確定的に求める。
  4. **永続キャッシュとストアでの維持**: 解決した `basePresetId` は SQLite の `preset_meta_cache` テーブルの `basePresetId` 列にキャッシュされる。また、プッシュ通知 (`0xF3` push) で設定情報が一部省略された場合も、`GoProStore.ts` でマージして維持する。
  5. **UI / レイアウトへの適用**: `SettingsPanel.tsx` および `getDisplayLayout()` などのレイアウト解決部では、この解決された `basePresetId` を `currentPresetId` (displayPresetId) として用いることで、すべての機種でカスタムプリセットをベースプリセットのレイアウトで正しく駆動する。

#### カスタムプリセットと Looping プリセットの解決

- Hero09 などの Loop ベースカスタムプリセットは、ベース表示プリセット ID (`PRESET_VIRTUAL_LOOPING`) に解決されるため、`src/cameraModels/shared/loopingPresetLayout.ts` にて機種を問わず共通の Looping レイアウトとして扱われる。
- 判定は `currentPresetId` が `PRESET_VIRTUAL_LOOPING` であるか、または `activePreset.settings` に `LOOPING_INTERVAL` が含まれるかどうかで行う（従来の `iconId=33` による判定は廃止）。
- これにより、レイアウト判定ロジックがシンプルになり、各機種の videoLayout resolver (Hero09, Hero10, Hero11) が `resolveLoopingPresetLayout` を介して一貫して Looping プリセットを解決できる。


### 4. アスペクト比セレクタ (Framing) / 解像度セレクタ

**ファイル**: `src/components/SettingsPanel.tsx` — `renderFramingSelector()`, `renderResolutionSelector()`

#### 表示位置

```
プリセットチップ
  ↓ [📹 Video] [📷 Photo]  ← MEDIA_FORMAT（Timelapse/Nightlapse のみ）
  ↓ [16:9] [9:16] [4:3] [8:7]  ← アスペクト比（対応機種の Video / Timelapse Video 系で表示）
  ↓ [5.3K] [4K] [2.7K] ...     ← 解像度（Capability に応じて常時表示）
  ↓ Primary Settings (FPS / Lens / ...)
```

RESOLUTION・FRAMING 系は `quickSettingIds` から除外し、専用セレクタとして独立表示する。

framing selector を持つのは Hero11 / Hero11 Mini / Hero12 / Hero13 のみ。Hero9 / Hero10 では resolver 未実装のため `layoutExternalControls.showsFramingSelector` が `false` になり、不要な `MULTI_SHOT_FRAMING (233)` request を出さない。

#### モード別 Setting ID と対象機種

| モード | アスペクト比 Setting ID | 解像度 Setting ID | Hero13 | Hero12 |
|------|------|------|------|------|
| Video | `VIDEO_FRAMING (232)` | `RESOLUTION (2)` | ✅ | ✅ (RESOLUTION remap) |
| Photo | `FRAMING (193)` | — (capability なし) | ✅ | ✅ |
| TL Video / Nightlapse Video / Trail / Timewarp | `MULTI_SHOT_FRAMING (233)` | `RESOLUTION (2)` | ✅ | ✅ |
| TL Photo フォーマット | — (**非表示**) | — | — | — |

> **⚠️ VIDEO_FRAMING と MULTI_SHOT_FRAMING の使い分け (Hero13)**
>
> GoPro のファームウェアは **ビデオモード** と **タイムラプス/ナイトラプス系モード** で
> アスペクト比の格納に**別の Setting ID** を使用する:
>
> - `VIDEO_FRAMING (232)` … Video グループのプリセット専用
> - `MULTI_SHOT_FRAMING (233)` … Timelapse/Nightlapse/Trail/Timewarp など全 TIMELAPSE グループ共通
>
> ナイトラプスビデオに切り替えた際にアスペクト比が「4:3」に見えるのは、  
> カメラが正しい値を `settings[233]` に持っているのに UI が `settings[232]`（ビデオモード時の古い値）を  
> 参照していたため。実際にタップして変更すると `setSetting` で楽観的更新されて正しく見える。
>
> **修正済み実装**: `renderFramingSelector()` では `isTimelapseVideoLike` の場合は  
> `GoProSettingId.MULTI_SHOT_FRAMING (233)` を読み書きするよう分岐している:
>
> ```typescript
> const framingSettingId = isTimelapseVideoLike
>   ? GoProSettingId.MULTI_SHOT_FRAMING   // 233
>   : GoProSettingId.VIDEO_FRAMING;        // 232
> const currentValue = settings[framingSettingId];
> // ...
> handleChangeValue(framingSettingId, value);
> ```
>
> また `GoProBLEManager.ts` では MODE_PRESET / MODE_PRESET_GROUP 変化時に  
> 両 ID の現在値をカメラから再クエリしてストアを更新している:
>
> ```typescript
> await this.sendQuery([0x02, 0x12, GoProSettingId.VIDEO_FRAMING]);      // 232
> await this.sendQuery([0x02, 0x12, GoProSettingId.MULTI_SHOT_FRAMING]); // 233
> await this.sendQuery([0x02, 0x12, GoProSettingId.MEDIA_FORMAT]);        // 128
> ```
>
> **旧アプリとの違い**: Xamarin 版旧アプリでは `AspectRatio` は `RESOLUTION (2)` の値から  
> 導出されており、FRAMING 系 Setting ID を直接扱っていなかった。  
> Open API の `VIDEO_FRAMING` / `MULTI_SHOT_FRAMING` は Xamarin 版が登場した後に追加された  
> API であるため、旧アプリの参考実装には存在しない。

#### Hero13 VIDEO_FRAMING — プリセット種別ごとのアスペクト制限

`VIDEO_FRAMING` capability には反映されないため、プリセット/プロファイル状態からハードコードで制御する。

| 状況 | 非活性ボタン | 判定方法 |
|------|------------|--------|
| Hero13 Max Lens Video (Max Video 2.0 / Easy Max Video 2.0, `LENS_ATTACHMENT`=2 or 3) | 8:7 を表示せず 1:1 を表示 | `currentPresetId === MAX_VIDEO_2_0 \|\| HERO13_EASY_MAXLENS2_PRESET_IDS.has(currentPresetId)` かつ `LENS_ATTACHMENT ∈ {2,3}` |
| Video + LOG/HDR プロファイル | 9:16, 4:3 | `LOG_HDR_PROFILE_VALUES.has(profileValue)` |
| Trail 系 (Star Trails / Light Painting / Vehicle Lights) | 9:16, 4:3 | `classifyTimelapsePreset() === 'trail_like'` |
| Timelapse Video / Nightlapse Video | 9:16, 4:3 | `isTimelapseVideo`（lapse_with_photo かつ Video フォーマット）|
| Timewarp 系 (TimeWarp / MaxTimeWarp 2.0 等) | 4:3 のみ | `classifyTimelapsePreset() === 'timewarp_like'` |

```typescript
// renderFramingSelector() — Hero13 VIDEO_FRAMING 分岐の骨格
const isLogOrHdr = LOG_HDR_PROFILE_VALUES.has(profileValue);
const tlCategory = isTimelapseGroup ? classifyTimelapsePreset(currentPresetId) : null;
const isTrailLike    = tlCategory === 'trail_like';
const isTimewarpLike = tlCategory === 'timewarp_like';
const isHero13MaxLensVideoPreset =
  isVideoGroup &&
  (currentPresetId === GoProVideoPreset.MAX_VIDEO_2_0 || HERO13_EASY_MAXLENS2_PRESET_IDS.has(currentPresetId)) &&
  (lensAttachment === 2 || lensAttachment === 3);

const hero13AspectOptions = isHero13MaxLensVideoPreset
  ? [16:9, 9:16, 4:3, 1:1]
  : [16:9, 9:16, 4:3, 8:7];

const restrict9_16and4_3 = (isLogOrHdr || isTrailLike || isTimelapseVideo)
  && (aspect === '9:16' || aspect === '4:3');
const restrict4_3only = isTimewarpLike && aspect === '4:3';
const isAvailable = !restrict9_16and4_3 && !restrict4_3only;
```

> **Timelapse Photo のアスペクト比セレクタは非表示**  
> 旧アプリ (UIElementSettings.cs) で TL Photo に `MULTI_SHOT_FRAMING` エントリが存在しないため、
> `renderFramingSelector()` 冒頭で `isTimelapsePhoto` の場合は `return null` してボタン全体を非表示する。
>
> ```typescript
> // renderFramingSelector() 冒頭
> if (isTimelapsePhoto) return null;
> // Timelapse Photo フォーマット: アスペクト比はビデオ専用のため非表示
> ```

#### Photo / Timelapse レイアウトの旧DB準拠修正履歴

旧アプリ (UIElementSettings.cs ・ BaseFullControlPanelViewModel.cs) を勧察して判明した
主要差分と対府を記録する。

| 項目 | 変更前 | 変更後 (旧DB準拠) | コミット |
|------|------|------|------|
| LiveBurst SS | なし | `VIDEO_SHUTTER (145)` | `3f8363f` |
| Burst / EasyBurst `EV_COMP` | 常時表示 | **非表示** (旧DBになし) | `3f8363f` |
| MaxPhoto2_0 `PHOTO_OUTPUT` | 常時表示 | **非表示** (旧DBでコメントアウト) | `3f8363f` |
| `PHOTO_INTERVAL_DURATION` | 表示 | **除去** (旧DBになし) | `3f8363f` |
| `FRAMING (193)` in Photo quick/advanced | 常時表示 | **除去** (旧DBになし) | `3f8363f` |
| TL Photo アスペクト比 UI | 表示 | **非表示** (`isTimelapsePhoto` で null 返却) | `c6f1732` |
| TL Video SS (`VIDEO_SHUTTER`) | 常時表示 | **除去** (旧DBに TL_VideoShutter なし) | `c6f1732` |
| TL `HYPERSMOOTH` | 常時表示 | **除去** (旧DBに TL用エントリなし) | `c6f1732` |
| TL `STAR_TRAILS_LENGTH` | quick・ advanced両方 | **advancedのみ** (Trail系) | `c6f1732` |
| TL `BIT_DEPTH`/`VIDEO_BITRATE` | 常時表示 | **TL Video のみ** | `c6f1732` |
| TL インターバル (3種) | 常時並列表示 | **カテゴリビデオ/フォーマットで 1 種のみ** | `c6f1732` |
| `PHOTO_LAYOUT_BASE` | 静的共通ベース配列 | **廃止** (動的生成に統一) | `3f8363f` | Hero12 RESOLUTION remap によるアスペクト変更

**機種**: Hero12 のみ (VIDEO_FRAMING API 非対応)

**アルゴリズム** (`ResolutionAspectMap.ts` の `findResolutionForAspect`):

1. 現在の RESOLUTION と同 family (例: `5.3K`) 内で target aspect を持つ capability 値を探す
2. 無ければ family 優先順 (5.3K → 4K → 2.7K → 1080) で capability 内を探索
3. それでも無ければスキーム (new/legacy) を自動判定してカノニカルな値を送信
   (`getHero12FallbackResolution`)
   - 例: new-scheme 時は `4:3` → `105 (2.7K 4:3)`, legacy 時は `111 (2.7K 4:3)`

> **Hero12 の Max Lens 制限**:
> `MAX_LENS_MOD_HERO13 (189)` の値に応じてアスペクト選択肢を絞る:
> - 1 (Max Lens 1.0): 16:9 と 4:3 のみ
> - 2 (Max Lens 2.0): 16:9, 4:3, 9:16
> - その他: 全4アスペクト

#### フォトグループの FRAMING (ID: 193) 値体系

| 値 | Hero13 意味 | Hero12 意味 |
|----|------------|------------|
| 0  | Traditional 4:3 | Widescreen (16:9) |
| 1  | Widescreen 16:9 | Vertical (9:16) |
| 2  | Full Frame (8:7 相当) | Full Frame (4:3 相当) |
| 100 | Traditional 4:3 (Hero13 v2 値) | — |
| 101 | Widescreen 16:9 (Hero13 v2 値) | — |
| 103 | Full Frame 8:7 (Hero13 v2 値) | — |
| 104 | Vertical 9:16 (Hero13 v2 値) | — |
| 105 | Ultra Widescreen 21:9 (Hero13 v2 値) | — |
| 106 | Full Frame 1:1 (Hero13 v2 値) | — |

> **Hero12 の値 0/1/2 は Hero13 の 0/1/2 と意味が異なる点に注意。**
> `renderFramingSelector()` のフォト分岐で機種別に選択肢配列を定義しているため
> ロジックの混在はないが、`FRAMING` メタデータを参照するコードを追加する際は注意。

#### MEDIA_FORMAT トグルの位置 (Timelapse/Nightlapse)

`MEDIA_FORMAT (128)` は Video↔Photo で下位の全設定（FPS・Lens・ISO 等）が入れ替わる
"親玉" 設定のため、プリセットチップ直下（アスペクト比・解像度セレクタより上）に固定表示する。

```tsx
// renderModeSelector() 内
{currentGroupId === GoProPresetGroup.TIMELAPSE &&
  currentPresetId !== undefined &&
  LAPSE_WITH_PHOTO_PRESETS.has(currentPresetId) &&
  renderPrimaryItem(GoProSettingId.MEDIA_FORMAT)}
```

> **quickSettingIds には含めない**: `getTimelapseLayout()` の `quickSettingIds` から
> `MEDIA_FORMAT` を除外し、UI 側で明示的に先頭固定表示している。
> これにより `primaryKeys` の並び順変更の影響を受けない。

> **新モデル追加時**: Timelapse Video/Photo の切替が同じ MEDIA_FORMAT (128) を使い、
> かつ `LAPSE_WITH_PHOTO_PRESETS` に該当プリセット ID が登録されていれば自動で表示される。
> 新モデルで Timelapse 系プリセット ID が異なる場合は `LAPSE_WITH_PHOTO_PRESETS` への
> 追記のみで対応可能。

> **過去のデグレ教訓 (コミット `cc0892e` → `4b4fc37`)**:
> 「capability に含まれないアスペクトはボタンを非活性化」という実装を一度入れたが、
> Hero13 の `VIDEO_FRAMING` capability は **preset に紐づく** ため、preset 切替直後
> は前 preset の capability が残り、本来有効なボタンが非活性化される事故が発生した。
> 結論: **capability ベースの一般ガードはアスペクト比 UI では使わない**。

## Capability で暗黙的に解決される機種差

以下はコード上の分岐無しで、capability query の結果により自動的に機種対応される:

| 設定 | Hero13 capability | Hero12 capability | 効果 |
|------|------------------|------------------|------|
| Video Framing (232) | [0,1,3,4] | なし (空) | `renderFramingSelector` が機種別分岐 (上記 §4) |
| Framing (193) | 100/101/103/104/105/106 | 0/1/2 | capability に含まれる値のみボタン表示 |
| Resolution (2) | 21:9/1:1 含む | 含まない | Hero12 では選択肢が少ない |
| FPS (3) | 400/360/300 含む | 含まない | 同上 |
| Video Lens (121) | Ultra系 含む | 含まない | 同上 |

## 新しいモデルを追加する手順

1. **GoProBLEManager.ts**: `modelName` のマッチルールを追加
   ```typescript
   modelUpper.includes('HERO11') ? 'hero11' :
   ```

2. **`ResolutionAspectMap.ts`**: `CameraModelKey` 型にモデルを追加
   ```typescript
   export type CameraModelKey = 'hero13' | 'hero12' | 'heromi11' | 'hero11' | 'hero10' | 'hero09' | 'max' | 'unknown';
   ```
   `GoProStore.ts` は `CameraModelKey` を直接参照しているため、ここだけ変更すれば全ファイルに型が伝播する。

3. **GoProMetadata.ts**: 必要に応じて値オーバーライドテーブルを追加
   ```typescript
   export const HERO11_VALUE_OVERRIDES = { ... };
   ```

4. **GoProMetadata.ts**: `getSettingValueNameForModel()` にオーバーライド参照を追加

5. **GoProSettingIds.ts**: モデル固有の Setting ID や レイアウトがあれば追加

6. **settingConstraints.ts**: `heroXXConstraint()` を追記し `switch` に case を加える (後述)

7. **SettingsPanel.tsx**: モデル限定の UI セクションがあれば条件付きレンダリング追加

> 多くの設定は capability-driven で自動対応されるため、
> 値ラベルの追加と `HERO_XX_VALUE_OVERRIDES` のみで済むケースが多い。

### レイアウト定義の方針 — ValueNameSettings.cs 準拠ルール

新機種のレイアウト (`prioritizedAdvancedSettingIds` / `defaultVisibleAdvancedSettingIds`) を
定義する際は、以下の 2 段階で決定する。

#### Step 1: 表示する設定の特定

旧アプリの **`Database/HeroXX/ValueNameSettings.cs`** を正規定義として使用する。
このファイルに `SourceName` として登録されている設定のみを Advanced Items に含める。

```
# 調査コマンド例 (HeroXX を対象機種に置換)
grep 'SourceName = SettingNames\.' Database/HeroXX/ValueNameSettings.cs \
  | sed 's/.*SettingNames\.\([^ ]*\) + .*/\1/' | sort -u
```

得られた SettingName と BLE Setting ID の対応は `SettingNames.cs` および
`FullControlPanelViewModel.cs` の `Header ==` 分岐で確認する。

> **注意**: `ValueNameSettings.cs` に登録がない設定でも、ユーザーに有用な場合は
> 意図的に追加してよい（例: `WIRELESS_BAND (178)` はどの機種の DB にも定義がないが
> 2.4GHz/5GHz 切替のため全モードに含めている）。その場合はコード内コメントで
> 「旧 DB 外・意図的追加」と明記すること。

#### Step 2: トグルボタン化済みの項目を除外する

以下の設定はトグルボタン（`quickSettingIds` または専用セレクタ）として UI 上部に
常時表示されるため、Advanced Items への重複掲載は冗長になる。

| 設定カテゴリ | 表示手段 | Advanced から除外すべき ID |
|------------|--------|--------------------------|
| 解像度 | `renderResolutionSelector()` | `RESOLUTION (2)` |
| アスペクト比 (Video) | `renderFramingSelector()` → `VIDEO_FRAMING (232)` ボタン | `VIDEO_FRAMING (232)` |
| アスペクト比 (Photo) | `renderFramingSelector()` → `FRAMING (193)` ボタン | `FRAMING (193)` |
| アスペクト比 (TL Photo) | 非表示 (TL Photo はアスペクト比なし) | `MULTI_SHOT_FRAMING (233)` |
| FPS | `quickSettingIds` に含まれトグルボタン表示 | `FPS (3)` |
| Lens (Video) | `quickSettingIds` に含まれトグルボタン表示 | `VIDEO_LENS (121)` |
| Lens (Photo/TL) | `quickSettingIds` に含まれトグルボタン表示 | `PHOTO_LENS (122)`, `TIME_LAPSE_LENS (123)` |
| Video Profile | `quickSettingIds` に含まれトグルボタン表示 | `VIDEO_PROFILE (184)` |
| HyperSmooth | `quickSettingIds` に含まれトグルボタン表示 | `HYPERSMOOTH (135)` |
| MEDIA_FORMAT | `renderModeSelector()` で先頭固定表示 | `MEDIA_FORMAT (128)` |

> **背景 (FRAMING 除去の教訓)**:
> `STANDARD_VIDEO_LAYOUT` に `FRAMING (193)` が混入していた。Photo のアスペクト比を
> Video の Advanced に表示していた不具合で、VideoFraming トグルボタンとの二重制御を
> 引き起こす可能性があった。コミット `915bb99` で除去済み。
>
> 旧アプリ `UIElementSettings.cs` の Video セクションにも `FRAMING` エントリは存在
> しない。新機種を追加するときも同様に Video レイアウトへの混入を避けること。

#### 実装チェックリスト

新機種の `getXxxLayout()` を定義したら以下を確認する:

- [ ] `prioritizedAdvancedSettingIds` の各 ID が ValueNameSettings.cs に存在するか
      (または「旧 DB 外・意図的追加」コメントがあるか)
- [ ] `quickSettingIds` に含まれる ID が advanced にも重複していないか
- [ ] `renderFramingSelector()` / `renderResolutionSelector()` が表示する ID が
      `prioritizedAdvancedSettingIds` に含まれていないか
- [ ] `MEDIA_FORMAT`, `LAPSE_MODE` が quick/advanced に含まれていないか
      (専用 renderModeSelector() で表示するため)

---

## 静的制約システム (Setting Constraints)

### 概要

GoPro の BLE Capability API は「この設定の **選択肢リスト**」を返すが、
「このプロファイルでは **操作そのものを無効化** すべき」という判定は返さない。
旧 C# アプリ (Xamarin) では UI Converter でハードコードしていた制約を、
新アプリでは `src/constants/settingConstraints.ts` の純粋関数として移植する。

### 設計方針

- **対象**: `renderOtherItem()` で表示される Advanced Settings パネルの行のみ
  - アクションシート（Visible Items モーダル）には **影響しない**（従来通り全項目を表示）
  - Primary Settings（上部トグルバー: Resolution / FPS / Lens）は対象外
- **処理場所**: `SettingsPanel.tsx` の `renderOtherItem()` 先頭で `getSettingConstraint()` を呼び出す
- **副作用なし**: `getSettingConstraint()` は純粋関数。BLE 送信・store 更新は一切行わない

### 戻り値と UI への反映

| 戻り値 | UI 表現 |
|--------|---------|
| `'ok'` | 通常表示・操作可 |
| `'disabled'` | opacity 0.4 + タップ/スワイプ無効 (`disabled={true}` or `pointerEvents="none"`) |
| `'na'` | 値欄に `"N/A"` 表示 (textMuted色) + タップ無効 |

### Hero13 制約ルール一覧

参照した旧アプリ Converter: `EnableVideoShutterSpeedConverter`, `EnableVideoISO`,
`EnableEVConverter`, `NAColorConverter`, `EnableColorConverter`,
`EnableVideo10BitConverter`, `EnableVideoDurationConverter`

| 設定 | 発動条件 | 戻り値 | 理由 |
|------|---------|--------|------|
| VIDEO_SHUTTER (145) | Video グループ + Profile=HDR(101) or HLG(200) | `disabled` | HDR/HLGはカメラがシャッター自動制御 |
| VIDEO_ISO_MIN (102) | 同上 | `disabled` | 同上 |
| VIDEO_ISO_MAX (13) | 同上 | `disabled` | 同上 |
| EV_COMP (118) | Video グループ + Standard preset + Profile=HDR(101) or HLG(200) | `disabled` | HDR/HLGでは露出補正無効 |
| COLOR (116) | Profile=LOG(102) | `na` | LOG記録時はポストグレードが前提でカメラ内カラー無意味 |
| TEN_BIT_COLOR (143), TEN_BIT_COLOR_ALT (114), BIT_DEPTH (183) | Video グループ + [(Standard preset + LOG/HLG) or Activity preset] | `disabled` | LOG/HLGはSDKで10bit強制ON; Activityは10bit非対応 |
| VIDEO_DURATION (156) | Video グループ + Activity preset | `disabled` | Activityはビデオ時間制限を持たない |

### Hero12 制約ルール一覧

参照した旧アプリ Converter: Hero12 フォルダの同名 Converter 群

| 設定 | 発動条件 | 戻り値 | Hero13 との差分 |
|------|---------|--------|----------------|
| VIDEO_SHUTTER (145) | Video グループ + Profile=HDR(1) | `disabled` | HLGはHero12に存在しない |
| VIDEO_ISO_MIN (102) | 同上 | `disabled` | 同上 |
| VIDEO_ISO_MAX (13) | 同上 | `disabled` | 同上 |
| EV_COMP (118) | Video グループ + Standard preset + Profile=HDR(1) **or LOG(2)** | `disabled` | Hero13はLOGでEVが有効だが**Hero12はLOG時もdisabled** |
| COLOR (116) | Video グループ + Standard preset + Profile=LOG(2) | `na` | Hero13はpresetを問わずLOGでna; **Hero12はStandard限定** |

### 新モデル追加手順 (制約システム)

```typescript
// settingConstraints.ts に追記するだけ
function hero11Constraint(id: number, s: SettingsSnapshot): ConstraintState {
  const profile = s[GoProSettingId.VIDEO_PROFILE];
  // Hero11 固有のプロファイル値を調査して定義する
  const H11_PROFILE_HDR = 1; // 暫定 — 要実機確認
  // ...
  return 'ok';
}

export function getSettingConstraint(...): ConstraintState {
  switch (currentModelNo) {
    case GOPRO_MODEL_NUMBERS.HERO13: return hero13Constraint(settingId, settings);
    case 'hero12': return hero12Constraint(settingId, settings);
    case 'hero11': return hero11Constraint(settingId, settings); // ← 追加
    default:       return 'ok';
  }
}
```

> **調査チェックリスト (新モデル追加時)**:
> 1. `Converters/HeroXX/Enable*.cs` — `return false` になる条件を `disabled` ルールへ
> 2. `Converters/HeroXX/NA*.cs` — `return true` になる条件を `na` ルールへ
> 3. VIDEO_PROFILE の値体系を確認 (`0/1/2` か `100/101/102/200` か)
> 4. Standard/Activity の preset ID を確認 (現状は Hero12/13 共に `0` / `1`)
> 5. Hero12/13 との差分のみを書く（同じルールは共通定数として抽出可）

### 移植しないもの (旧アプリ → 新アプリ)

| 旧 Converter | 移植不要な理由 |
|-------------|-------------|
| `Visible*` 系全般 | `getDisplayLayout()` + Protobuf プリセットリストで代替済み |
| `Active*` 系全般 | Capability ベースのトグルチップ選択状態が代替 |
| `NAPhotoSSConverter`, `NAPhotoISOConverter` | PHOTO_OUTPUT 変更時に Capability が自動更新される見込み (Phase 5 として実機検証後に判断) |
| `NAPhotoEVConverter` | 同上 |
| `VisibleOfVideoResolution/FrameRate*` | `getDisplayLayout()` が担当 |
| `EnableOverrideDashboardConverter` | `isDashboardExpanded` の UI 状態で既に制御済み |

---

## 旧機種 (Hero09〜Hero11 / HeroMini11 / Max) 対応ガイド

> **注意**: 以下は Hero12/13 のみが実装済みの現状で、将来 Hero09〜11/Mini11/Max を追加対応する際に必要な情報をまとめたもの。

### 対象機種と旧アプリDB参照先

| 機種 | DB フォルダ | ViewModel |
|------|------------|-----------|
| Hero09 | `ProTuneRemote/Database/Hero09/` | Hero09/FullControlPanelViewModel.cs |
| Hero10 | `ProTuneRemote/Database/Hero10/` | Hero10/FullControlPanelViewModel.cs |
| Hero11 | `ProTuneRemote/Database/Hero11/` | Hero11/FullControlPanelViewModel.cs |
| HeroMini11 | `ProTuneRemote/Database/HeroMini11/` | HeroMini11/FullControlPanelViewModel.cs |
| Max | `ProTuneRemote/Database/Max/` | Max/FullControlPanelViewModel.cs |

### 機種検出方法

BLE アドバタイズ名ではなく **接続後に取得できる `modelName` 文字列** で判定する。  
現状 `GoProBLEManager.ts` の `parseCameraInfo()` で返す `modelName` は機種名全体  
（例: `"GoPro Hero13 Black"`）なので `toUpperCase().includes()` でマッチする。

```typescript
// 旧機種追加時の判定パターン例
const m = modelName.toUpperCase();
if      (m.includes('HERO13'))   return 'hero13';
else if (m.includes('HERO12'))   return 'hero12';
else if (m.includes('HERO11'))   return 'hero11';   // ← 将来追加
else if (m.includes('MINI'))     return 'heromi11'; // ← HeroMini11
else if (m.includes('HERO10'))   return 'hero10';   // ← 将来追加
else if (m.includes('HERO9'))    return 'hero9';    // ← 将来追加
else if (m.includes('MAX'))      return 'max';      // ← 将来追加
else                             return 'unknown';
```

> **はまりポイント①**: `HERO11` と `HERO MINI` は文字列が重なるケースがある。  
> `MINI` を先にチェックするか、`INCLUDES('HERO11') && !m.includes('MINI')` にする。

---

### BLE 設定値体系: 機種別差異まとめ

#### VIDEO_ISO_MIN (ID:102) / VIDEO_ISO_MAX (ID:13) — **全機種共通**

```
0=6400, 3=3200, 1=1600, 4=800, 2=400, 7=200, 8=100
```

Hero09〜Hero13 / Max すべて同一。GoProMetadata.ts のベース定義変更不要。

#### BURST_ISO_MIN (ID:76) / BURST_ISO_MAX (ID:37) — **全機種共通**

```
5=3200, 4=1600, 0=800, 1=400, 2=200, 3=100
```

Hero09〜Max 全機種同一。現状実装で対応済み（BurstISO に 1600/3200 追加済み: commit `2807c76`）。

#### LiveBurst ISO (BLE ID: 102/13) — **Hero09〜Mini11 のみ存在**

```
0=6400, 3=3200, 1=1600, 4=800, 2=400, 7=200, 8=100  (VideoISO と同一値体系)
```

- `Header == 102` → `VideoISOMin = args.Data[0]` + `LiveBurstISOMin = args.Data[0]` として **同一 BLE ID を共有**
- Hero12/13 には LiveBurst モード自体が存在しない
- **対応時の注意**: `settingConstraints.ts` でモード判定のみ追加。値テーブルは VIDEO_ISO と共通なのでメタデータ変更不要

#### NIGHTLAPSE_ISO_MIN (ID:76 共有) / NIGHTLAPSE_ISO_MAX (ID:37 共有) — **全機種共通**

```
0=800, 1=400, 2=200, 3=100
```

BurstISO と同一 BLE ID を共有（Capability クエリで返る値域が0-3 のみ → 現状実装で正しく処理済み）。

#### VIDEO_TIMELAPSE_RATE (ID:5) — **全機種共通の整数インデックス値**

```
0=0.5s, 1=1s, 2=2s, 3=5s, 4=10s, 5=30s, 6=60s, 7=2min, 8=5min, 9=30min, 10=60min
```

**Hero09〜Hero13 / (Max を除く) 全機種で同一**。GoProMetadata.ts の実装（値0-10）はそのまま使用可。  
> **はまりポイント②**: `NIGHTLAPSE_RATE` (ID:32) は**絶対秒数値**（100/300/1800/3600 等）で値体系が全く異なる。`VIDEO_TIMELAPSE_RATE` の整数インデックス値と混同しないこと。

#### NIGHTLAPSE_PHOTO_SHUTTER (ID:31) — **Hero09 のみ "2s" 追加値あり**

| 値 | Hero09 | Hero10〜Hero13/Mini11 |
|----|--------|----------------------|
| 6 | 30s | 30s |
| 5 | 20s | 20s |
| 4 | 15s | 15s |
| 3 | 10s | 10s |
| 2 | 5s | 5s |
| **1** | **2s** | **なし** |
| 0 | Auto | Auto |

Hero09 対応時は GoProMetadata.ts の `NIGHTLAPSE_PHOTO_SHUTTER` 値テーブルに `1: '2s'` を追加し、`GOPRO_SETTING_VALUE_ORDER` にも `1` を挿入する必要がある。

---

### GoPro Max 固有設定

#### 4-byte BE 設定 ID

| BLE ID (10進/16進) | 設定名 | 実装状況 |
|-------------------|--------|---------|
| 30 / 0x1E | TimelapsePhotoInterval | `FOUR_BYTE_INT_SETTINGS` / `FOUR_BYTE_CAP_IDS` に追加済み |
| 127 / 0x7F | DefaultPreset | 同上 |
| 141 / 0x8D | QuickCaptureDefault | 同上 |

Max の VideoISO は Hero09-13 と同一値体系 (0=6400, 3=3200, 1=1600, 4=800, 2=400, 7=200, 8=100)。

#### VideoProfile なし

Max、Hero09-11、HeroMini11 には `VideoProfile` 設定が存在しない（Hero12+ で追加）。  
制約ロジックで `VideoProfile` を参照する場合は機種チェックを先に行うこと。

#### IDの使い回しと名前の衝突 (BLE ID Collision)

GoPro Max では物理レンズ切り替えに **ID 143 (0x8F)** を使用しますが、この ID は後継機種 (Hero11等) で **10-Bit Color** として完全に別の用途に再利用（使い回し）されています。

これまでの実装では、「同じIDで値の意味が変わるケース」は `getSettingValueNameForModel` で吸収していましたが、「同じIDで設定名そのものが変わるケース」は想定されていませんでした。
今回の Max の Lens Direction の移植によりこの衝突が発覚したため、設定名解決メソッド `getSettingName` にも機種判定用の `cameraModel` 引数を導入し、ID 衝突を正しく解決するアーキテクチャに拡張されました。

```typescript
// GoProMetadata.ts
export const getSettingName = (id: number, modelKey?: CameraModelKey): string => {
  if (modelKey === 'max' && id === GoProSettingId.MAX_LENS_DIRECTION) return 'Lens Direction'; // ID: 143
  return GOPRO_SETTINGS_METADATA[id]?.name || `Unknown (${id})`; // 通常時は '10-Bit Color'
};
```
これにより、値の名前解決と設定の名前解決の双方が機種を意識する統一された設計となっています。

#### getSettingName mediaFormat 拡張

その後、`presetId` と `mediaFormat` 引数も追加された。これは **同一 Setting ID でプリセットのフォーマット（Video/Photo）によって表示名が変わるケース** に対応するため。

```typescript
export const getSettingName = (
  id: number,
  modelKey?: CameraModelKey,
  presetId?: number,
  mediaFormat?: number
): string;
```

**具体的なケース — Nightlapse Video の Duration ラベル:**  
`MULTI_SHOT_DURATION (ID=157)` は Photo 系では "Multi Shot Duration" だが、  
Nightlapse Video (mediaFormat=26) では "Video Duration" と表示すべき。  
全機種共通で `mediaFormat === 26` のときに "Video Duration" を返す。  
機種による分岐は不要（全機種で Nightlapse Video = ID=157 が確認済みのため）。

```typescript
// GoProMetadata.ts (getSettingName 内)
if (id === GoProSettingId.MULTI_SHOT_DURATION) {
  const cat = classifyTimelapsePreset(presetId);
  if (cat === 'lapse_with_photo' && mediaFormat === 26 /* Nightlapse Video */) return 'Video Duration';
}
```

> **重要**: `getSettingName` を呼び出す箇所は **すべて** `cameraModel`, `currentPresetId`,  
> `settings[GoProSettingId.MEDIA_FORMAT]` を渡すこと。  
> Visible Items アクションシートなど「文脈が分かりにくい」箇所でパラメータ省略すると  
> ラベルとカメラコントロール画面のラベルが食い違うバグになる。

---

### ValueNameSettings.cs の重複定義について

Hero10/11/HeroMini11/Hero12 の `ValueNameSettings.cs` には、同じ SourceName の `valueNames.Add(...)` が2回以上出現するケースがある（DBブロックを別機種からコピーペーストした痕跡）。  
これはアプリ側で `Set<number>` に追加するため**実害なし**。Capability レスポンスを `Set` で保持している限り重複値は自動的に排除される（`PacketParser.ts` 実装済み）。

---

### 新機種追加チェックリスト（BLE 値体系）

旧機種追加時に確認すべき項目：

- [ ] **VIDEO_TIMELAPSE_RATE** — 整数インデックス 0-10 と一致するか確認（全機種共通の可能性高）
- [ ] **NIGHTLAPSE_RATE** — 絶対秒数値体系 (100/300/1800/3600 等) と一致するか確認
- [ ] **NIGHTLAPSE_PHOTO_SHUTTER** — `Value=1 (2s)` が存在するか（Hero09 のみ存在）
- [ ] **新規 4-byte BE 設定** — `FullControlPanelViewModel.cs` の `bhead = new byte[] { 0x06, XX, 0x04 }` を全検索し、新 ID があれば `FOUR_BYTE_INT_SETTINGS` と `FOUR_BYTE_CAP_IDS` に追加
- [ ] **VideoProfile 値体系** — `0/1/2` か `0/1/2/101` か（Hero12: 0/1/2、Hero13: 0/1/2/101、Hero09-11: 設定なし）
- [ ] **LiveBurstISO** — Hero09-11 対応時のみ。BLE ID 102/13 が VideoISO と共有であることを確認
- [ ] **機種名文字列** — BLE アドバタイズからの `modelName` フォーマットを実機で確認

---

## タイムラプスモードのレンズ Setting ID — 機種別詳細

### 背景

GoPro は「タイムラプスビデオ」と「タイムラプスフォト」でレンズを管理する **Setting ID が異なる**。
さらに Hero13 では Video/Timewarp/TrailLapse 系のレンズ ID が Hero12 以前と異なる。

### Setting ID 対応表

| モード | Hero13 Lens ID | Hero12 以前 Lens ID | 備考 |
|--------|---------------|---------------------|------|
| Timelapse Video | **VIDEO_LENS_HERO13 (229, 0xE5)** | VIDEO_LENS (121, 0x79) | — |
| Nightlapse Video | **VIDEO_LENS_HERO13 (229)** | VIDEO_LENS (121) | — |
| Timewarp / MaxTimewarp | **VIDEO_LENS_HERO13 (229)** | VIDEO_LENS (121) | — |
| Star Trails / Light Painting / Vehicle Lights | **VIDEO_LENS_HERO13 (229)** | VIDEO_LENS (121) | trail_like カテゴリ |
| Timelapse Photo | TIME_LAPSE_LENS (123, 0x7B) | TIME_LAPSE_LENS (123) | **全機種共通** |
| Nightlapse Photo | TIME_LAPSE_LENS (123) | TIME_LAPSE_LENS (123) | **全機種共通** |
| 通常 Video | VIDEO_LENS_HERO13 (229) | VIDEO_LENS (121) | タイムラプスではないが同ルール |
| Photo | PHOTO_LENS_HERO13 (230, 0xE6) | PHOTO_LENS (122, 0x7A) | 将来対応用に ID のみ定義済み |

> **TIME_LAPSE_LENS (123) の正式名称**  
> 旧アプリのC#ソースでは `"multi shot digital lenses"` と呼ばれる。  
> Photo系マルチショット全般（タイムラプスフォト/ナイトラプスフォト/連写など）で共通のID。

### 実装箇所

#### GoProSettingIds.ts — 定数定義

```typescript
VIDEO_LENS: 121,               // Hero12 以前 Video/Timewarp/Trail 系
PHOTO_LENS: 122,               // Hero12 以前 Photo 系
TIME_LAPSE_LENS: 123,          // 全機種: Timelapse Photo / Nightlapse Photo (multi shot digital lenses)
VIDEO_LENS_HERO13: 229,        // Hero13 Video / Timelapse Video / Timewarp / TrailLapse 系
PHOTO_LENS_HERO13: 230,        // Hero13 Photo 系 (将来対応用)
```

#### GoProSettingIds.ts — getTimelapseLayout()

```typescript
const videoModeLensId = isHero13Model(modelNo)
  ? GoProSettingId.VIDEO_LENS_HERO13   // 229
  : GoProSettingId.VIDEO_LENS;         // 121

// lapse_with_photo (Timelapse/Nightlapse) — isVideoFormat 判定
if (isVideoFormat) {
  quickSettingIds.push(GoProSettingId.FPS, videoModeLensId);
} else {
  quickSettingIds.push(GoProSettingId.TIME_LAPSE_LENS, GoProSettingId.TIMELAPSE_PHOTO_OUTPUT);
}

// trail_like (Star Trails 等)
quickSettingIds.push(GoProSettingId.FPS, videoModeLensId, GoProSettingId.STAR_TRAILS_LENGTH);

// timewarp_like (TimeWarp 等)
quickSettingIds.push(GoProSettingId.FPS, videoModeLensId);
```

#### GoProBLEManager.ts — MODE_PRESET 変化時の再クエリ

プリセット切替後に VIDEO_LENS_HERO13 (229) の現在値をカメラから再取得する:

```typescript
await this.sendQuery([0x02, 0x12, GoProSettingId.VIDEO_LENS_HERO13]).catch(() => {});
```

Hero12 以前では 229 番のクエリに対してカメラが応答しないため、`.catch(() => {})` でサイレントに無視される。

### 旧アプリの実装根拠

- **Hero13** `FullControlPanelViewModel.cs`: `GetSetVideoLensCommand` を override  
  → `0x03, 0xE5, 0x01, value` (0xE5 = 229)
- **Hero12/11 以前**: `BaseFullControlPanelViewModel.cs` の base class をそのまま使用  
  → `0x03, 0x79, 0x01, value` (0x79 = 121)

### 新機種追加時の対応手順

新しい GoPro モデルで Timelapse Video レンズの Setting ID が変更になった場合:

1. `GoProSettingIds.ts` に新定数を追加（例: `VIDEO_LENS_HERO14: 250`）
2. `getTimelapseLayout()` の `videoModeLensId` 分岐に新モデルを追加
3. `CAPABILITY_REFRESH_DEPENDENCIES` の全依存リストに新 ID を追加
4. `GoProMetadata.ts` に値マップとソート順を追加（VIDEO_LENS と同一スキームの場合はコピーでよい）
5. `GoProBLEManager.ts` の MODE_PRESET 変化時再クエリに新 ID を追加


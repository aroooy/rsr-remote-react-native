# 04. 設定メタデータと値マッピング

## 対象ファイル
- `src/constants/GoProSettingIds.ts`
- `src/constants/GoProMetadata.ts`
- `src/constants/metadata/*.ts`
- `src/constants/metadataOverrides/*.ts`
- `src/constants/settingFallbackPolicies.ts`
- `src/constants/settingFirmwareOverlays.ts`
- `src/constants/settingIdTranslation.ts`
- `src/constants/hardwareFeatureFlags.ts`

---

## 新アーキテクチャ (Phase 4-6 導入)

GoPro カメラは機種ごとに返す値や振る舞いが大きく異なるため、文字列ベースの分岐 (`modelKey === 'max'`) を避け、宣言的な制御構造（**Capability Policy**, **Firmware Overlays**, **Hardware Feature Flags**）を導入しています。

### 1. Semantic ID 変換 (`settingIdTranslation.ts`)
BLE ID（例えば `143`）は、世代によって全く異なる機能に再利用されることがあります（Hero11 では 10-Bit Color、Max では Lens Direction）。これを防ぐため、メタデータ検索の直前に `resolveSemanticSettingId()` を通し、ユニークな定数に解決します。

### 2. Capability Policy (`settingFallbackPolicies.ts`)
カメラから送られてくる利用可能値リスト (Capability) が不完全な場合への対処方針を各設定ごとに宣言します。
- `dynamicOnly`: カメラからの通知を100%信用する。空の場合は表示しない。
- `staticWhenEmpty`: 空配列が返った場合のみ、アプリ内の静的リスト (`GOPRO_SETTING_VALUE_ORDER`) を信用する。
- `staticAlways`: カメラの通知に関わらず、常にアプリ内の静的リストを使用する（カメラのバグ回避用）。
- `dynamicWithStaticOrderAndLabelFallback`: 動的応答を正とするが、未知の値が来ても弾かず、静的リストを「並び順」と「ラベル解決」にのみ使う。
- `dynamicWithStaticSupersetCheck`: 動的応答に静的フルセットを合成して表示する（現時点では `hero13` の `VIDEO_DURATION` のみ）。

### 3. Firmware Overlays (`settingFirmwareOverlays.ts`)
同じモデル名でもファームウェアバージョンによって設定値が変わる場合（例: `H24.01.01.12.00` 以降で新機能追加）、このオーバーレイ定義を使ってメタデータや並び順に動的パッチを当てます。

#### 使いどころ

- 同一モデル内で firmware によって値セット・表示名・並び順が変わる場合 → `FirmwareOverlay`
- モデル全体で共通する差分 → `MODEL_VALUE_OVERRIDES` / `GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE` / `settingFallbackPolicies.ts`
- UI 表示条件だけの差分 → `hardwareFeatureFlags.ts`、`LayoutBuilder`、または layout facade/resolver

`FirmwareOverlay` はあくまで「同モデル・別 firmware」の薄い差分レイヤです。`hero13` 全体に恒常的に適用したいルールを、firmware overlay で表現してはいけません。

#### firmwareVersion の出所

firmwareVersion は BLE 接続後の Hardware Info 応答 (`0x3C`) から取得した生文字列をそのまま使用します。

- 取得: `GoProBLEManager.parseHardwareInfo()`
- 状態保持: `GoProStore.hardwareInfo.firmwareVersion`
- 永続化: `known_devices.firmwareVersion`

この値はアプリ内で正規化せず、GoPro が返した書式をそのまま扱います。
現在確認できている書式例:

- `H22.01.01.10.00`
- `H23.01.02.00.70`
- `H24.01.01.12.00`

#### バージョン比較ルール

- 比較は `versionUtils.compareVersions()` に集約する
- GoPro firmware の `H24.01.01.12.00` 形式と通常の dotted version の両方を扱える
- `settingFirmwareOverlays.ts` の overlay 配列は上から順に評価し、**最初にマッチしたものを採用**する
- 条件が重なる overlay を置く場合は、より具体的な条件を先に並べる

#### overlay で吸収できる差分

- `addedValues`: 新 firmware で増えた値 ID とラベル
- `removedValues`: 新 firmware で使えなくなった値 ID
- `overrideLabels`: 同じ値 ID だが表示名だけ変わる場合
- `overrideOrder`: 並び順だけ変わる場合
- `capabilityPolicy`: firmware によって capability の返し方自体が変わる場合

#### 実装例

たとえば Hero13 の新 firmware `H24.01.02.10.70` 以降で `VIDEO_DURATION` に `4 Hours` が追加される場合は、`settingFirmwareOverlays.ts` に以下のような差分を追加する:

```ts
[GoProSettingId.VIDEO_DURATION]: {
	hero13: [
		{
			operator: '>=',
			version: 'H24.01.02.10.70',
			addedValues: {
				11: '4 Hours',
			},
			overrideOrder: [11, 9, 8, 7, 6, 5, 4, 3, 2, 1, 100],
		},
	],
}
```

この例では「Hero13 全体のルール」は変えず、`H24.01.02.10.70` 以降の差分だけを firmware overlay で吸収している。

### 4. Hardware Feature Flags (`hardwareFeatureFlags.ts`)
`hasMaxLensMod`, `supports10Bit`, `hasFrontLcd` 等の能力フラグをハードウェア別に定義。UI 表示分岐に文字列比較（`modelKey === 'heromi11'` 等）を使わず、このフラグを使用します。

### 5. Display Layout: Base Layout + Facade / Resolver
設定画面の「どの項目をどの順で表示するか」は `GoProDisplayLayout` オブジェクトで管理します。

- 静的な base layout 定数の組み立て: `GoProSettingIds.ts` の `LayoutBuilder`
- runtime の top-level override 解決: `displayLayoutResolver.ts`
- Video の full-layout override 解決: `videoLayoutResolver.ts`
- Photo / Timelapse の model-specific state 解決: `photoLayoutState.ts`, `timelapseLayoutState.ts`
- per-model 実装: `src/cameraModels/<model>/*.ts`

`GoProSettingIds.ts` は stable facade として残し、巨大な `if (cameraModel === ...)` を増やさない。shared な配列組み立てが多い場合は state resolver、機種ごとに返す layout 自体が大きく異なる場合は full-layout resolver を使う。

---

## 設定ID 定数 (`GoProSettingIds.ts`)

`GoProSettingId` オブジェクトに全設定の論理 Setting ID を定数化。

### 主要カテゴリ

| カテゴリ | 設定例 | ID範囲 |
|---------|--------|--------|
| 撮影設定 | RESOLUTION(2), FPS(3), VIDEO_ISO_MAX(13) | 2-192 |
| レンズ | VIDEO_LENS(121), PHOTO_LENS(122), TL_LENS(123) | 121-123 |
| プロファイル | VIDEO_PROFILE(184), BIT_DEPTH(183), TEN_BIT_COLOR(143) | 143-184 |
| システム | GPS(83), LCD_BRIGHTNESS(88), LED(91) | 83-223 |
| モード/プリセット | MODE_PRESET_GROUP(92), MODE_PRESET(93) | 92-93 |
| Dashboard (Hero13) | DASHBOARD_OVERRIDE(205)〜DASHBOARD_LED(212) | 205-212 |

### 仮想 Setting ID 方式

BLE 実体 ID が同一でも UI 上の値セットが異なるケース（例: Star Trails のシャッターと Nightlapse のシャッター）に対応するため、**仮想 ID** (例: `10031`) を使用します。
- **BLE 送信**: `GoProBLEManager.ts` の `setSetting()` で実体 ID (例: `31`) に変換。
- **BLE 受信**: `PacketParser.ts` で実体 ID の通知を受けた際、仮想 ID にも同じ値を同期。

---

## 表示値のオーバーライド (`GoProMetadata.ts`)

### `MODEL_VALUE_OVERRIDES`
同一BLE IDの同一値でも機種によって表示名が異なる場合に使用します（例: Maxの `VIDEO_BITRATE` の 0 は "Low" だが他機種は "Standard"）。
**絶対に `GOPRO_SETTINGS_METADATA` の base values に機種依存ラベルを追加してはいけません。**

### 機種専用レイアウトとフォールバック
- 機種によって表示する設定セットが異なる場合 → まず base layout を `LayoutBuilder` で定義し、runtime 差分は layout facade/resolver で派生。
- 表示ラベルが異なる → `MODEL_VALUE_OVERRIDES`。
- 特定機種でのみリストを上書き・絞り込む → `GOPRO_SETTING_STATIC_FALLBACKS_MODEL_OVERRIDE` または `GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE` を使用。

### override 定義の配置

`GoProMetadata.ts` は公開 API と解決ロジックの facade とし、共有ベース定義は `src/constants/metadata/*.ts`、機種固有の override 群は `src/constants/metadataOverrides/*.ts` に分離する。

- `metadata/types.ts`: `SettingMetadata` / `SliderConfig` など共有型
- `metadata/baseSettingMetadata.ts`: 全モデル共通のベース metadata 本体
- `metadata/baseValueOrder.ts`: モデル共通の静的な基本並び順
- `metadataOverrides/*.ts`: モデル固有 override と preset 名差分

- `MODEL_VALUE_OVERRIDES`
- `GOPRO_BOOL_VALUES_MODEL_OVERRIDE`
- `GOPRO_SETTING_STATIC_FALLBACKS_MODEL_OVERRIDE`
- `GOPRO_SETTING_VALUE_ORDER_MODEL_OVERRIDE`
- `PRESET_NAME_OVERRIDES`

新しい機種固有差分を追加する場合は、まず対応する model file に追記し、`GoProMetadata.ts` 側の facade API は可能な限り変更しない。

## 新規機種・設定の追加手順チェックリスト

1. `GoProSettingIds.ts` に ID 定数を追加（マジックナンバー禁止。コメントに BLE ID hex, 対象機種を記載）。
2. `GoProMetadata.ts` の `GOPRO_SETTINGS_METADATA` に基本ラベルを追加。
3. `GoProSettingIds.ts` の Layout 定数（必要なら `LayoutBuilder` 利用）で base の表示位置を定義。
4. runtime に model/preset 分岐が必要なら `src/constants/*Resolver.ts` または `*LayoutState.ts` を追加し、実体は `src/cameraModels/<model>/...` に置く。
5. `settingFallbackPolicies.ts` に Capability Policy を定義。
6. `GoProBLEManager.ts` で BLE 送受信の ID オーバーライド要否を確認。
7. モデル固有の表示ラベル差分があれば `MODEL_VALUE_OVERRIDES` に追加。
8. 旧アプリの `UIElementSettings.cs` 等と突合し、BLE ID / Value ID / UI ID の取り違えがないか再確認（**もっとも多いバグ原因です**）。
9. model-specific 抽出後は `npx tsc --noEmit` を必ず実行し、必要なら `git diff --check` まで確認する。

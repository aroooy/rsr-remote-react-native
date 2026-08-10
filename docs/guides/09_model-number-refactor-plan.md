# 09. modelNo ベース機種判定への移行計画

## 背景

GoPro 実機は BLE Hardware Info (`0x3C`) で `modelNo` を返す。アプリはこの値を取得・永続化しているため、接続中カメラの機種識別は `modelNo` を source of truth として扱う。

一方、旧実装では `hero13`、`hero12`、`max` のようなアプリ内部リテラル (`CameraModelKey`) が、接続時判定・設定制約・UI レイアウト・metadata 補正に広く使われていた。この内部キーはアプリ内では便利だが、GoPro が返す外部識別子ではない。機種判定の根拠として残すと、実機情報とアプリ内表現の二重管理がバグ源になる。

この移行の目的は、**処理判定の根拠を `modelNo` に統一し、ソースコード上では `51` や `65` の直値ではなく名前付き定数を参照する** ことである。

## 原則

1. 機種判定の source of truth は `hardwareInfo.modelNo` とする。
2. modelNo 比較には `GOPRO_MODEL_NUMBERS.*` を使い、直値を書かない。
3. 新規コードで `cameraModel === 'hero13'` のような内部リテラル判定を追加しない。
4. `CameraModelKey` は移行期間の互換層としてのみ扱う。
5. 調査メモや未確定情報は runtime constants に書かない。

## 現在の主要ファイル

- `src/constants/GoProModelNumbers.ts`: modelNo の名前付き定数と表示名。
- `src/cameraModels/shared/modelNoHelpers.ts`: modelNo predicate。
- `src/cameraModels/shared/modelNumber.ts`: `CameraModelKey` 互換変換層。
- `src/store/GoProStore.ts`: `hardwareInfo.modelNo` を derived selector `useCurrentModelNo()` で公開。
- `src/ble/GoProBLEManager.ts`: 接続時の機種確定と BLE ID 補正。

## フェーズ

### Phase 1: 定数・predicate 基盤

- `GOPRO_MODEL_NUMBERS` に確定 modelNo を定義する。
- `isHero13Model()`、`isHero12Or13Model()`、`isHero11FamilyModel()`、`isMaxModel()` などを `modelNoHelpers.ts` に集約する。
- helper の引数は `modelNo: number | null | undefined` に統一する。

### Phase 2: 接続時判定

- 接続時は `fetchHardwareInfo()` の `modelNo` で機種を確定する。
- `modelName.includes('HERO13')` のような文字列一致は使わない。
- 互換が必要な場合のみ `modelNo -> CameraModelKey` の変換層を使う。

### Phase 3: 末端条件分岐

- UI、metadata、BLE 補正、capability policy の `cameraModel` 文字列判定を modelNo predicate へ置換する。
- family 判定は helper 化し、各ファイルで条件式を複製しない。

### Phase 4: 宣言データ構造

- `Set<CameraModelKey>` や `Record<CameraModelKey, ...>` を `GoProModelNumber` / `number` keyed table へ移す。
- `settingConstraints.ts`、`hardwareFeatureFlags.ts`、`metadataOverrides` は modelNo keyed table を基本形とする。

### Phase 5: store 整理

- `currentModelNo` を独立 state として二重管理しない。
- `useCurrentModelNo()` は `hardwareInfo?.modelNo ?? null` を返す derived selector とする。
- `setHardwareInfo()` が modelNo 更新の唯一の入口になるようにする。

### Phase 6: 残存 literal 棚卸し

以下で残存箇所を確認する。

```bash
rg "cameraModel ===|model === '|includes\('hero|\['hero|return 'hero|modelKey === '" src
```

残してよいもの:

- `modelNumber.ts` の `CameraModelKey` 互換変換層。
- `ResolutionAspectMap.ts` の旧 `CameraModelKey` API 境界。

削るべきもの:

- BLE ID 補正、UI 表示条件、capability policy、metadata 補正に残る内部リテラル判定。

## 受け入れ条件

1. 接続時の機種確定が `modelNo` ベースで行われる。
2. 処理判定に `cameraModel === 'hero13'` のような新規内部リテラル比較がない。
3. modelNo 直値比較がなく、`GOPRO_MODEL_NUMBERS.*` を参照している。
4. `currentModelNo` の二重管理がない。
5. `npx tsc --noEmit` が通る。
6. 代表実機で接続・設定表示・BLE 書き込み補正が退行していない。
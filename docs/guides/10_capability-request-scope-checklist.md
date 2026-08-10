# Capability 要求スコープ監査メモ

作成日: 2026-05-30  
ステータス: 後続工程で横断対応予定

## 背景

Capability (`0x32`) は「現在の機種・モード・プリセット・依存設定に対して有効な値候補」を表すが、アプリ側の要求対象 (`settingIds`) が広すぎると、以下の問題が発生する。

- 現在の機種では存在しない setting ID を問い合わせて `PARTIAL MISS` が常態化する
- 現在のプリセットでは使わない setting の Capability をキャッシュキーにぶら下げてしまい、不要な cache miss が増える
- UI に出していない setting の Capability を取りに行き、実機ログ上のノイズが増える
- 機種別 ID と汎用 ID が混在している setting 群で、誤った候補が selectable values に混ざる

今回の Hero09 Loop custom preset の事象はその典型例だった。

- cache key には `R` / `F` / `L` / `H` を含める必要があった
- `fetchCapabilitiesByIds()` には model support filter が必要だった
- `VIDEO_LENS_HERO13 (229)` が [src/constants/settingConstraints.ts](../../src/constants/settingConstraints.ts) の allowlist に未登録だったため、Hero09 でも問い合わせ対象に残っていた

## この問題を 1 件の個別不具合として扱わない理由

本質課題は「現在のコンテキストに対する Capability 要求対象の絞り込みが、複数レイヤーに分散している」点にある。

主な関与レイヤー:

- [src/constants/GoProSettingIds.ts](../../src/constants/GoProSettingIds.ts)
  - `CAPABILITY_REFRESH_TRIGGER_IDS`
  - `CAPABILITY_REFRESH_DEPENDENCIES`
  - `getDisplayAwareCapabilitySettingIds()`
- [src/constants/settingConstraints.ts](../../src/constants/settingConstraints.ts)
  - `MODEL_SUPPORTED_SETTINGS`
  - `MODEL_UNSUPPORTED_SETTINGS`
  - `isSettingModelSupported()`
- [src/ble/GoProBLEManager.ts](../../src/ble/GoProBLEManager.ts)
  - `getCapabilityCacheKey()`
  - `fetchCapabilitiesByIds()`
  - preset / setting change 時の refresh orchestration
- [src/components/SettingsPanel.tsx](../../src/components/SettingsPanel.tsx)
  - 現在の display layout と selectable values の利用側
- [src/cameraModels/<model>/videoLayout.ts](../../src/cameraModels)
  - preset / mode に応じて quick settings と advanced settings を変える resolver

そのため、今後も別 setting 群や別機種で同種の取りこぼしが残っている可能性はある、という認識で正しい。

## 今回確認できた既知の漏れパターン

### 1. 機種専用 setting ID が model support table に未登録

例:

- `VIDEO_BITRATE (182)` は Hero12/13 only として登録済みだった
- `VIDEO_LENS_HERO13 (229)` は未登録だったため、Hero09 でも共通 setting 扱いされた

このパターンでは、`fetchCapabilitiesByIds()` に filter を入れても、support table 自体が不完全なら漏れる。

### 2. cache key に依存 setting が足りない

例:

- Loop preset 時の Lens 候補は Resolution / FPS / HyperSmooth に依存する
- これらの一部が `X` 扱いのままだと、異なるコンテキストが同一 cache key に潰れてしまう

### 3. refresh dependencies が広すぎる

`CAPABILITY_REFRESH_DEPENDENCIES` は refresh 起点としては有効だが、機種別・preset別の最終問い合わせ対象としては広すぎる場合がある。

### 4. layout と capability request がずれる

ある setting が UI 上は advanced にしか出ない、または特定 preset でのみ出る場合でも、capability request 側が旧来の quick settings 前提のままだと不要問い合わせが残る。

### 5. 静的フォールバックと動的 capability の責務が曖昧

`staticAlways` / `staticWhenEmpty` の設定は、そもそも dynamic capability を問い合わせる意味が薄いケースがある。個別 setting ごとに「取得はするが表示には使わない」状態が残っていないか監査が必要。

## 今後の監査観点

### A. setting ID の model support 宣言を棚卸しする

特に以下は優先度が高い。

- Hero13 専用 ID 群
- Hero11 / Hero12 以降で追加された派生 ID 群
- `*_HERO13`, `*_MAX`, `*_REAR`, `*_DEFAULT` のような命名を持つ setting

チェック方法:

1. [src/constants/GoProSettingIds.ts](../../src/constants/GoProSettingIds.ts) から機種専用に見える ID を列挙する
2. [src/constants/settingConstraints.ts](../../src/constants/settingConstraints.ts) に対応する allowlist / denylist があるか確認する
3. 未登録なら「全機種共通」扱いになっていないか確認する

### B. cache key の依存項目を setting 群ごとに見直す

確認ポイント:

- Lens 候補が Resolution / FPS / HyperSmooth / LensAttachment に依存する機種はないか
- Photo / Video / Lapse で別 ID を持つ setting が cache key 上で混線していないか
- preset 固有レイアウトで表示 setting が減る場合に、key だけ過剰に広くなっていないか

### C. Capability refresh 対象の生成ルールを再確認する

理想的な順序は以下。

1. 現在の display layout から「実際に UI が使う setting」を集める
2. そこへ依存 setting を加える
3. 現在機種で未対応の ID を落とす
4. 必要なら preset / mode 条件で追加の prune を行う

現状はこの責務が複数箇所に散っているため、あとで一括整理する価値がある。

### 現状の request 経路 (Phase 1 audit)

2026-05-30 時点で、Capability request の主な起点は以下に分散している。

#### 1. 接続直後の boot 完了時

- 実装箇所: [src/ble/GoProBLEManager.ts](../../src/ble/GoProBLEManager.ts)
- 経路:
  - `connectToDevice()`
  - boot 完了タイマー後に `getQuickCapabilitySettingIds()` を評価
  - それまで `cacheKey === null` で deferred されていた ID (`deferredCapabilityIds`) を合流
  - `fetchCapabilitiesByIds([...quickIds, ...deferredIds])`

特徴:

- 接続直後の最初の Capability request を担う
- `cacheKey` が確定する前に積まれた ID をまとめて消化するため、過去の request 意図が混ざりやすい

#### 2. short-term busy 復帰時

- 実装箇所: [src/ble/GoProBLEManager.ts](../../src/ble/GoProBLEManager.ts)
- 経路:
  - constructor 内の store subscribe
  - `selectIsShortTermBusy(prev) -> false` を検知
  - `getQuickCapabilitySettingIds()` と `deferredCapabilityIds` を再度合流
  - `fetchCapabilitiesByIds([...quickIds, ...deferredIds])`

特徴:

- モード切替・プリセット切替などの過渡状態から復帰した後の最終 refresh
- boot 完了経路と request 組み立てがほぼ重複している

#### 3. SettingsPanel 側の prefetch

- 実装箇所: [src/components/SettingsPanel.tsx](../../src/components/SettingsPanel.tsx)
- 経路:
  - `capabilityPrefetchIds`
  - `displayLayout.quickSettingIds`
  - `displayLayout.defaultVisibleAdvancedSettingIds`
  - 追加の静的対象 (`VIDEO_BITRATE_HERO11`, `VIDEO_BITRATE_HERO09`, `VIDEO_DURATION`, `MULTI_SHOT_DURATION`, `HYPERSMOOTH_MAX`)
  - `useEffect()` から `fetchCapabilityForSetting(id)` を個別発火

特徴:

- UI 表示都合に最も近い request 経路
- `VIDEO_BITRATE` / `BIT_DEPTH` は force refetch される
- BLE 層の bulk refresh と別経路のため、同じ setting が別ロジックで要求されうる

#### 4. 設定変更通知後の dependency refresh

- 実装箇所: [src/ble/GoProBLEManager.ts](../../src/ble/GoProBLEManager.ts)
- 経路:
  - SETTINGS notify (`0x92`) 由来の `changedIds`
  - `CAPABILITY_REFRESH_TRIGGER_IDS` に含まれる ID を検知
  - `CAPABILITY_REFRESH_DEPENDENCIES[id]` を `pendingDebouncedCapabilityIds` へ蓄積
  - debounce 後に `fetchCapabilitiesByIds(idsToRefresh)`

特徴:

- 最も広い dependency 定義を使う経路
- trigger/dependency テーブルは facade 側にあり、現在の preset/group/layout 文脈を直接は見ていない

#### 5. fetchAllCapabilities の全件寄り refresh

- 実装箇所: [src/ble/GoProBLEManager.ts](../../src/ble/GoProBLEManager.ts)
- 経路:
  - `getQuickCapabilitySettingIds()`
  - `Object.keys(GOPRO_SETTINGS_METADATA)`
  - `Object.keys(store.settings)`
  - `Object.keys(store.capabilities)`
  - 上記の union を `fetchCapabilitiesByIds()` へ渡す

特徴:

- 最も広い集合を作る経路
- 「監査・復旧用の全件取得」に近いが、実際には `fetchCapabilitiesByIds()` の prune に依存している

#### 6. カスタムプリセット適用後の post-preset refresh

- 実装箇所: [src/ble/GoProBLEManager.ts](../../src/ble/GoProBLEManager.ts)
- 経路:
  - `applyCustomPreset()` の最後
  - 待機後に `getQuickCapabilitySettingIds()` を再評価
  - `fetchCapabilitiesByIds(finalRefreshIds)`

特徴:

- preset 復元後に最小集合で整合させる経路
- 現在は quick settings のみを対象にしている

#### 7. preset/group 変化後の state query

- 実装箇所: [src/ble/GoProBLEManager.ts](../../src/ble/GoProBLEManager.ts)
- 経路:
  - `schedulePresetStateQueries()`
  - `VIDEO_FRAMING`, `MULTI_SHOT_FRAMING`, `MEDIA_FORMAT`, `VIDEO_LENS_HERO13` に対して `0x12` query

注意:

- これは `0x32` Capability request ではなく現在値 query
- ただし capability refresh と目的が近く、同じ「必要 setting をどう選ぶか」という問題に巻き込まれる

### Phase 1 で見えた構造的な問題

#### 1. request 集合の組み立て責務が重複している

- BLE 層に `getQuickCapabilitySettingIds()` がある
- UI 層に `capabilityPrefetchIds` がある
- facade 側に `getDisplayAwareCapabilitySettingIds()` がある

しかし、これらは同じ集合を返していない。

#### 2. helper が「主経路の唯一の truth」になっていない

- [src/constants/GoProSettingIds.ts](../../src/constants/GoProSettingIds.ts) の `getDisplayAwareCapabilitySettingIds()` は存在する
- しかし 2026-05-30 時点では、主な request 経路はこれを中心には組み立てていない

そのため、facade 側の helper を直しても実際の request が揃わない可能性がある。

#### 3. 表示都合の request と dependency 解決の request が混ざっている

- `displayLayout.quickSettingIds` / `defaultVisibleAdvancedSettingIds` は UI 寄り
- `CAPABILITY_REFRESH_DEPENDENCIES` は dependency 解決寄り
- `fetchAllCapabilities()` は監査・復旧寄り

これらが同じ `fetchCapabilitiesByIds()` に流れ込むため、最終 prune の責務が重くなっている。

#### 4. group/preset 文脈の prune が後段に寄っている

現在は [src/ble/GoProBLEManager.ts](../../src/ble/GoProBLEManager.ts) の `filterCapabilityIdsForCurrentContext()` が

- model support
- `MODE_PRESET` / `MODE_PRESET_GROUP` の除外
- `VIDEO_FRAMING` / `MULTI_SHOT_FRAMING` の group-aware prune

を担っている。

これは今回の不具合を止めるには有効だったが、本来は request 集合を作る時点で揃っている方が見通しは良い。

### Phase 2 で整理すべき責務境界

次段では、display layout をそのまま Capability source of truth にするのではなく、display layout の上位にある共通 setting plan を 1 箇所に持つ必要がある。

最低限、plan には以下の責務を持たせる。

1. 現在コンテキストで意味を持つ setting 群を 1 箇所で定義する
2. その setting 群を UI 用の quick / advanced / default visible へ投影する
3. 同じ setting 群を dynamic Capability request 用の対象集合へ投影する
4. 必要なら cache key 専用の依存 setting を別属性で持つ

重要なのは、「UI から Capability を拾う」のではなく、「UI と Capability が同じ plan を参照する」形にすること。

たとえば、quick から advanced へ移すだけの UI 変更であれば、setting 自体の意味や dynamic Capability 要否は変わらない。共通 plan があれば、表示位置の変更だけで済み、Capability 側の重複メンテを避けられる。

逆に、非表示でも dependency として必要な setting はあるため、plan は display layout より豊かである必要がある。少なくとも次の投影先を分ける。

- UI projection: `quickSettingIds`, `prioritizedAdvancedSettingIds`, `defaultVisibleAdvancedSettingIds`
- Capability projection: `defaultCapabilityPrefetchIds`, `dependencyCapabilityIds`
- Cache key projection: `cacheKeyDependencyIds`

この構造にしておけば、接続直後・UI prefetch・dependency refresh・post-preset refresh は、同じ plan から用途別 projection を使い分けるだけで済む。

着手順は以下とする。

1. facade に共通 setting plan helper を追加する
2. まず SettingsPanel の prefetch をその helper 参照に切り替える
3. 次に BLE 側の boot / busy / post-preset refresh を同じ helper に寄せる
4. 最後に dependency refresh と cache key dependency を同じ plan の別 projection へ寄せる

### Phase 2 進捗メモ

2026-05-30 時点で、以下までは着手済み。

1. [src/constants/GoProSettingIds.ts](../../src/constants/GoProSettingIds.ts) に `getDisplaySettingPlan()` を追加し、display layout の上位にある共通 plan を導入
2. [src/components/SettingsPanel.tsx](../../src/components/SettingsPanel.tsx) の capability prefetch を `defaultCapabilityPrefetchIds` 参照へ切り替え
3. [src/ble/GoProBLEManager.ts](../../src/ble/GoProBLEManager.ts) の boot 完了時 / short-term busy 復帰時 / post-preset refresh の既定集合を同 plan 参照へ切り替え
4. `CAPABILITY_REFRESH_DEPENDENCIES` の適用経路を `getCapabilityDependencyRefreshIds()` 経由へ寄せ、dependency refresh の許容集合を plan 側へ移動
5. layout 外 control (`MEDIA_FORMAT`, framing 系, resolution selector) を `layoutExternalControls` として plan に取り込み、SettingsPanel 側の表示条件も同じ判断軸へ寄せた
6. cache key 専用 dependency を `cacheKeyProjection` として plan に分離し、[src/ble/GoProBLEManager.ts](../../src/ble/GoProBLEManager.ts) の cache key 組み立ても同 projection 参照へ切り替えた
7. layout 外 control の naming を `layoutExternalControls` として facade 側へ寄せ、`showsMediaFormatPrimary` / `showsFramingSelector` / `showsResolutionSelector` を SettingsPanel から直接判定しない形に整理した
8. `fullRefreshBaseIds` を plan に追加し、通常の full refresh は `fetchAllCapabilities()` がこの projection を参照する形に整理した
9. metadata 全件 + store key 全件の broad union は `recoverAllCapabilities()` に分離し、通常経路と監査・復旧経路を分けた
10. special row の visible-row projection は model-owned な projection dispatcher を [src/constants/GoProSettingIds.ts](../../src/constants/GoProSettingIds.ts) の `getDisplaySettingPlan()` から参照する形に整理し、BLE の cache key も plan の `specialRowsProjection` を使うようにした

現時点で残っている主課題は以下。

1. `recoverAllCapabilities()` の呼び出し契機は、まだ全画面・全操作で統一できていない

### Capability cache 化の残課題

1. `recoverAllCapabilities()` は API と運用ルールは定義済みだが、実際の debug 導線 / repair 導線が未確定
  - 2026-05-30 時点では [src/ble/GoProBLEManager.ts](../../src/ble/GoProBLEManager.ts) に定義があるだけで、常用の呼び出し元はまだない
  - `cache_integrity_check` / `manual_debug_audit` / `capability_state_repair` をどの画面・どの操作から呼ぶかを固定する必要がある
2. persisted capability cache は key 文字列をそのまま保存しており、key 構造変更時の migration / cleanup 方針がまだ弱い
  - 現在の DB は [src/device/CapabilityCacheRepository.ts](../../src/device/CapabilityCacheRepository.ts) の `capability_cache_v1` に camera ごとの JSON を保存している
  - cache key に新しい suffix や dependency を追加した場合、旧 key 群は読み捨てられるだけで、世代管理や不要 entry の整理は行っていない
  - key 構造の変更を今後も続けるなら、schema version・cache generation・lazy cleanup のどれで運用するかを決める必要がある
3. Hero09-13 の preset 切り替えに対する cache hit / miss 妥当性確認はまだ監査途中
  - 期待値は「変わるべき preset family / dependency だけで key が変わる」こと
  - 特に special row を持つ easy preset と、layout は同じでも capability 候補だけ変わる preset を分けて確認する必要がある

### `recoverAllCapabilities()` の運用ルール

`recoverAllCapabilities()` は通常経路では使わず、recovery / audit 文脈に限定する。

許容する理由:

1. `cache_integrity_check`
  - cache key や persisted capability の整合性を検証したいとき
  - 例: `PARTIAL MISS` が current context と矛盾して見えるとき
2. `manual_debug_audit`
  - 開発中に broad union の要求対象を意図的に観測したいとき
  - 例: 新機種・新プリセットで support table や metadata 漏れを疑うとき
3. `capability_state_repair`
  - plan-based refresh では capability state が回復しないと判断できたとき
  - 例: 既知の current context に戻っても selectable values が復元しないとき

通常経路で使わない場面:

1. 接続直後の初期 refresh
2. short-term busy 復帰後の通常 refresh
3. preset 切り替え直後の整合 refresh
4. dependency refresh の通常再取得

これらは `fetchAllCapabilities()` またはそれより狭い plan projection で扱う。

### D. preset 切り替え時の要求対象を監査する

特に custom preset は、ベース preset により使える setting が大きく変わる。

> [!NOTE]
> **対応済み (2026-06)**: コミット `0056932` にて、カスタムプリセットの `basePresetId` (EnumFlatMode) を Protobuf および SQLite キャッシュ (`basePresetId` カラム)・GoProStore マージ処理で一貫して保持する仕組みを導入。UI およびレイアウト解決 (`getDisplayLayout` 等) は解決されたベース表示プリセット ID (`displayPresetId`) で駆動するように統一された。

確認・対応状況:

- **active preset 判定に使っている `preset.settings` が partial push 後も保持されるか**:
  - `GoProStore.ts` および `PresetMetaCacheRepository.ts` でのマージ時に、既存の `settings` に加えて `basePresetId` も引き継がれ、partial push 時の欠落を防いでいる。
- **preset icon fallback だけで判定している箇所が残っていないか**:
  - 従来の `iconId === 33` などのアイコン決め打ち判定は廃止され、`basePresetId` および設定項目 (`LOOPING_INTERVAL`) の有無による判定に完全移行した。
- **Loop 系のように同一 video mode 内でも UI layout が切り替わるケースで、capability request が追随しているか**:
  - `resolveLoopingPresetLayout` に `currentPresetId` (解決済みのベースプリセット ID) が正しく渡され、Looping レイアウトかどうかが正しく判定される。これに伴い capability request やキャッシュキー生成 (`cacheKeyProjection` 経由) も解決されたベースプリセット ID で一貫して処理されるため、request 追随性が担保されている。

## 実機ログでのチェック観点

### 期待する状態

- resolution / fps / lens / hypersmooth を変えたとき、cache key が変わるべき場合だけ変わる
- `PARTIAL MISS` が出ても、その ID が本当に現在機種・現在 preset で必要な setting に限られる
- unsupported setting ID が繰り返し miss に出ない

### 警戒すべきログ

```text
[BLE Cache] PARTIAL MISS! Key: ... Missing: ... IDs: 229
```

この種のログが出たら、まず以下を切り分ける。

1. その ID は現在機種で本当に存在するか
2. その ID は現在の UI layout が実際に使うか
3. その ID は cache key の依存項目に含めるべきか、単に request 対象から外すべきか

## 将来の一括対応で実施したい項目

### 優先度高

1. `GoProSettingId` 全体に対する model support 監査
2. `CAPABILITY_REFRESH_DEPENDENCIES` と実 UI 利用 setting の突合
3. Hero09-13 の video preset ごとの cache key 妥当性確認

### 優先度中

1. 「UI が使わない Capability を要求していないか」のロギングを一時的に追加
2. partial miss の ID を setting 名つきで集計できるデバッグ補助を追加
3. model / mode / preset ごとの capability request integration test 追加を検討

### 優先度低

1. `CAPABILITY_REFRESH_DEPENDENCIES` を model-aware に再編する
2. `getDisplayAwareCapabilitySettingIds()` と refresh dependency 解決を 1 箇所に集約する

## 実装時の原則

- 個別の `SettingsPanel.tsx` 条件分岐で塞がず、まず resolver / metadata / capability orchestration の責務境界で直す
- 「表示に必要な setting」と「問い合わせに必要な setting」を分けて考える
- cache key の不足と unsupported ID の混入は別問題として扱う
- 実機ログで `PARTIAL MISS` が消えたことだけで完了にせず、selectable values が実機と一致することも確認する

## 関連ファイル

- [src/ble/GoProBLEManager.ts](../../src/ble/GoProBLEManager.ts)
- [src/constants/GoProSettingIds.ts](../../src/constants/GoProSettingIds.ts)
- [src/constants/settingConstraints.ts](../../src/constants/settingConstraints.ts)
- [src/constants/settingFallbackPolicies.ts](../../src/constants/settingFallbackPolicies.ts)
- [src/components/SettingsPanel.tsx](../../src/components/SettingsPanel.tsx)
- [src/cameraModels/shared/loopingPresetLayout.ts](../../src/cameraModels/shared/loopingPresetLayout.ts)
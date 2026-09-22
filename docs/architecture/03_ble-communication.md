# BLE 通信仕様

## 対象ファイル
- [src/ble/GoProBLEManager.ts](../../src/ble/GoProBLEManager.ts) — 通信オーケストレーション
- [src/ble/bleCommandPackets.ts](../../src/ble/bleCommandPackets.ts) — バイナリパケット構築
- [src/ble/bleResponseCodec.ts](../../src/ble/bleResponseCodec.ts) — 応答・通知パケットデコード
- [src/ble/bleErrorHandler.ts](../../src/ble/bleErrorHandler.ts) — エラー分類・ログ記録・自動復旧
- [src/ble/capabilityManager.ts](../../src/ble/capabilityManager.ts) — ケーパビリティ評価・比較・キー射影
- [src/ble/capabilityPlanning.ts](../../src/ble/capabilityPlanning.ts) — ケーパビリティ再取得計画生成
- [src/ble/commandQueueRules.ts](../../src/ble/commandQueueRules.ts) — コマンドキューゲーティング・判定純粋関数
- [src/ble/CommandQueue.ts](../../src/ble/CommandQueue.ts) — コマンド実行キュー
- [src/ble/PacketParser.ts](../../src/ble/PacketParser.ts) — 低レイヤーヘッダ解析・再組立
- [src/ble/PresetProtobuf.ts](../../src/ble/PresetProtobuf.ts) — Protobuf 手書き enc/dec
- [src/device/CapabilityCacheRepository.ts](../../src/device/CapabilityCacheRepository.ts) — ケーパビリティキャッシュの SQLite 永続化
- [src/constants/Timeouts.ts](../../src/constants/Timeouts.ts) — 通信タイマー・デバウンス定数

## GoPro BLE サービス / キャラクタリスティック

GoPro は単一の GATT サービス内に 6 つのキャラクタリスティックを公開する。

| UUID 名 | GoPro 略称 | 方向 | 用途 |
|---------|-----------|------|------|
| GP-0072 | CMD_SEND | Write | コマンド送信 (電源OFF, KeepAlive 等) |
| GP-0073 | CMD_NOTIFY | Notify | コマンド応答 (HardwareInfo 等) |
| GP-0074 | SETTINGS_SEND | Write | 設定値書き込み |
| GP-0075 | SETTINGS_NOTIFY | Notify | 設定変更通知 (現在は未使用) |
| GP-0076 | QUERY_SEND | Write | クエリ送信 (全設定/capability/status) |
| GP-0077 | QUERY_NOTIFY | Notify | クエリ応答 + プッシュ通知 |

## 接続フロー

```
1. BLE接続 (Android: 3回リトライ、bleErrorHandler がエラーを分類)
2. MTU拡張 (Android限定: 512バイト要求)
3. GATT安定待機 (Timeouts.GATT_STABILIZE_MS delay)
4. サービスディスカバリ
5. Notify購読 (QUERY/CMD/SETTINGS各notify)
6. HardwareInfo取得 (コマンド 0x3C via bleCommandPackets)
7. 永続キャッシュ復元
   a. KnownDevice から HardwareInfo を hydrate
   b. PresetMetaCache / CapabilityCache を SQLite から store へ復元
8. modelNo ベースで cameraModel を確定 (manifest 参照)
9. KeepAlive開始 (Timeouts.KEEP_ALIVE_INTERVAL_MS 間隔: [0x01, 0x00])
10. Boot window 開始 (Timeouts.BOOT_WINDOW_MS)
  a. `isBooting = true` の間は capability cache key を生成しない
  b. capability 要求は `deferredCapabilityIds` に退避する
11. Bootstrap:
  a. allSettingsQuery ([0x01, 0x12]) — 全設定値取得
  b. settings/status refresh ([0x01, 0x52], [0x01, 0x53])
  c. presetStatus (Protobuf) — プリセット一覧取得
12. Boot window 終了後、quick setting 用 capability と deferred 要求をまとめて flush (capabilityManager 経由)
```

## パケットフォーマット

GoPro BLE は可変長パケットをヘッダ付きで分割送信する。

### ヘッダ解析ルール

| 条件 | 区分 | ペイロード長の取り方 |
|------|------|---------------------|
| `firstByte < 0x20` | 1バイトヘッダ | `firstByte` そのもの |
| `firstByte & 0x20` | 13ビットヘッダ | `((firstByte & 0x0F) << 8) \| bytes[1]` |
| `firstByte & 0x40` | 16ビットヘッダ | `(bytes[1] << 8) \| bytes[2]` |
| `firstByte & 0x80` | Continuation | 先頭バイトスキップしてバッファに追加 |

### 再組立バッファ

Notify は 2 つの独立バッファで再組立する:

| バッファ | 対象 | 関数 |
|---------|------|------|
| `receiveBuffer` / `expectedLength` | QUERY_NOTIFY | `parseGoProPacket()` |
| `cmdReceiveBuffer` / `cmdExpectedLength` | CMD_NOTIFY | `parseCmdPacket()` |

## TLV 解析 (processQueryResponse)

完成パケットのペイロードは先頭バイトで種別を判別する:

| 先頭バイト | 種別 | 処理 |
|-----------|------|------|
| `0x12`, `0x52`, `0x92` | Settings Response | TLV → `batchUpdateSettings()` |
| `0x32` | Capabilities Response | TLV → Set重複排除 → `batchUpdateCapabilities()` |
| `0x13`, `0x53`, `0x93` | Status Response | statusId → 個別処理 |
| `0xA8` | Scheduled Capture | hour + encodedMinute → `setScheduledTime()` |
| `0xF5`, `0xF2` | Protobuf Preset Response | `decodeNotifyPresetStatus()` |
| `0xF3` | Protobuf Preset Push | 同上 (プッシュ通知) |
| `0xF1`, `0xE4` | Protobuf CustomPresetUpdate Response (CMD_NOTIFY) | `decodeResponseGeneric()` |

### TLV フォーマット (Settings / Capabilities)
```
[settingId] [valueLength] [value bytes...]
```
- 1 byte → そのまま値
- 2 bytes → BigEndian 16bit
- 4 bytes → BigEndian 32bit

### Status で監視している ID

| Status ID | フィールド | 用途 |
|-----------|----------|------|
| 2 | battery | バッテリーレベル |
| 8 | busy | カメラビジーフラグ |
| 96 | presetGroupId | 現在のプリセットグループ |
| 97 | presetId | 現在のプリセット |

## 主要 BLE コマンド一覧

### 設定書き込み (SETTINGS_SEND)
```
[0x03, settingId, 0x01, value]                       — 1バイト値 (ほとんどの設定)
[0x06, settingId, 0x04, b3, b2, b1, b0]              — 4バイト Big-Endian 整数
```

**4 バイト整数で送る必要がある設定** (`FOUR_BYTE_INT_SETTINGS` in [src/ble/GoProBLEManager.ts](../../src/ble/GoProBLEManager.ts)):

| ID | 定数 | 意味 |
|----|------|------|
| 30 | `PHOTO_TIMELAPSE_RATE` | Photo Timelapse Interval (秒, int) |
| 31 | `NIGHTLAPSE_PHOTO_SHUTTER` | Nightlapse Shutter (enum 0/1/2/3/4/5/6 だが 4 バイトで送る) |
| 32 | `NIGHTLAPSE_RATE` | Nightlapse Interval (秒, int) |

> 旧アプリ `BaseFullControlPanelViewModel.cs` の `GetSetNightlapsePhotoShutterCommand` 等を
> 参照。値が 1 バイトに収まる enum (0〜6) であっても、カメラは 4 バイトでの受信を要求する。
> 1 バイトで送るとカメラから ACK が返らずサイレントに無視される。

新しい機種で別の 4 バイト送信設定が見つかった場合は、上記 Set にその ID を追加する。

### Scheduled Capture 設定 (SETTINGS_SEND)
```
[0x06, 0xA8, 0x04, hourHH, hourHL, minuteHH, minuteHL]
```
- hour: 2バイト BigEndian
- minute: `計算値 = min * 60 + sec` を2バイト BigEndian

### 設定クエリ (QUERY_SEND)
```
[0x01, 0x12]    — 全設定値クエリ
[0x01, 0x13]    — 全ステータスクエリ
[0x02, 0x32, settingId]    — 個別 capability クエリ
[0x02, 0x52, settingId]    — 個別設定値クエリ (Notify購読)
[0x02, 0x62, settingId]    — 個別 capability Notify 購読
```

### AP パスワード取得 (特定の Characteristics へ直打ち)
Wi-FiのSSIDおよびパスワードは、上記QUERY_SENDではなく「Wi-Fi APサービス Characteristic」(`b5f90003-aa8d-11e3-9046-0002a5d5c51b`) に対し直読み(Read)を実行することでプレーンテキストとして取得できる。

### コマンド (CMD_SEND)
```
[0x01, 0x00]    — KeepAlive
[0x01, 0x05]    — 電源OFF
[0x01, 0x17]    — Wi-Fi AP 有効化 (ストリーミング・Wi-Fi接続用)
[0x01, 0x3C]    — HardwareInfo 要求
```

### プリセット操作 (CMD_SEND)
```
[0x04, 0x3E, 0x02, 0x03, selectId]    — モード切替 (PresetGroup)
[0x06, 0x40, 0x04, b3, b2, b1, b0]    — プリセット読込 (4バイトBE)
```

## HardwareInfo パース

コマンド `0x3C` の応答フォーマット:
```
[0x3C, 0x00, modelNoLen, ...modelNo, modelNameLen, ...modelName,
 boardTypeLen, ...boardType, fwLen, ...fw, snLen, ...sn,
 ssidLen, ...ssid, macLen, ...mac]
```

`modelNo` がカメラモデル判定の正。`modelName` は capability cache key と表示用途に使う。

## Capability 取得・キャッシュ

### cache key

Capability cache は以下の複合キーで管理する:

```
${modelName}_${firmware}_P${preset}_MF${mediaFormat}_FR${framing}_R${res}_F${fps}_L${lens}_H${hyperSmooth}_SR${specialRowsKey}
```

- `preset`, `mediaFormat`, `framing`, `res`, `fps`, `lens`, `hyperSmooth` は `pendingSettings` を優先して読む
- `mediaFormat/framing/lens/hyperSmooth` は `getDisplaySettingPlan()` の `cacheKeyProjection` に従って採用し、現在の UI / capability 依存と無関係な設定で key が増殖しないようにする
- `specialRowsKey` は visible な special row の組み合わせを plan から射影して取り込む
- `preset` 未確定、`selectIsShortTermBusy(state) === true`、`isBooting === true` の間は `null` を返し、取得自体を延期する

### fetchCapabilitiesByIds()

`GoProBLEManager.fetchCapabilitiesByIds()` は次の順序で動く:

1. key が作れない間は settingId を `deferredCapabilityIds` に積む
2. cache hit 分は即座に live `capabilities` へ復元する
3. miss 分だけを `capabilityQueuePromise` で直列化して `0x32` query する
4. request 時点の cache key を setting ID ごとに pending queue へ積み、対応する `0x32` 応答が届いた時点で **応答済み ID だけ** `mergeCapabilityCacheEntry()` に反映する
5. SQLite への保存は `CapabilityCacheRepository` 側の debounce / queue に委ねる

### deferred flush

- `shortTermBusy -> ready` 遷移時: quick setting IDs と `deferredCapabilityIds` を union して再取得
- boot 3秒タイマー満了時: quick setting IDs と `deferredCapabilityIds` を union して再取得

### モジュール別の責務分離

- `bleCommandPackets.ts`: コマンド・クエリ・設定書き込み用のバイナリバイト列構築を純粋関数として担当。
- `bleResponseCodec.ts`: 受信データのヘッダ解析 (`PacketParser.ts` 経由) から TLV / Protobuf ペイロードのデコード (`parseQueryResponse`, `parseCmdResponse`) を担当。
- `capabilityManager.ts`: キャッシュキーの構築 (`buildCapabilityCacheKey`)、キャッシュヒット/ミス判定、差分マージ、および live capabilities の比較・評価純粋ロジックを担当。
- `capabilityPlanning.ts`: プリセット変更や設定更新に伴うケーパビリティ再取得対象設定 ID のプラン生成を担当。
- `bleErrorHandler.ts`: BLE 通信エラー (GATT エラー、接続切れ、タイムアウト等) の統一分類・ログ記録・リトライやユーザーダイアログ連携などの統合復旧ハンドリングを担当。
- `GoProBLEManager.ts`: 通信シーケンスのオーケストレーション、Zustand ストアとの接続、および `CommandQueue` との連携を担当。

## Capability 自動リフレッシュ

設定変更時、依存する他の設定の capability が変わることがある。

```
CAPABILITY_REFRESH_DEPENDENCIES:
  MODE_PRESET_GROUP → [全レイアウト対象ID]
  MODE_PRESET       → [全レイアウト対象ID]
  VIDEO_PROFILE     → [RESOLUTION, FPS, ...]
  BIT_DEPTH         → [RESOLUTION, FPS, ...]
  VIDEO_LENS        → [RESOLUTION, FPS, ...]
  PHOTO_LENS        → [PHOTO_OUTPUT, ...]
  VIDEO_FRAMING     → [RESOLUTION, FPS, ...]
```

- 設定通知で trigger ID が変化すると `pendingDebouncedCapabilityIds` に依存 ID を積み、300ms デバウンス後に `fetchCapabilitiesByIds()` を呼ぶ
- `fetchAllCapabilities()` だけは `capabilityRefreshPromise` により多重起動を抑制する

## プリセット遷移ガード

- `loadPreset()` / `loadPresetGroup()` は `latestPresetLoadRequestId` を使い、キュー待機中に古くなった要求を `shouldSkip` で破棄する
- BLE write 後は `settings` を即時更新せず、`pendingSettings` のみセットしてカメラ通知で確定させる
- `SettingsPanel` は `pendingSettings[MODE_PRESET(_GROUP)] ?? settings[...]` で現在値を解決するため、MVVM 的な単方向フローを維持できる

## プリセット Protobuf

`PresetProtobuf.ts` は protobufjs を使わず手書きで Protobuf をエンコード/デコードする。

### 型定義
- `GoProPresetGroup`: `{ groupId, presets[] }`
- `GoProPreset`: `{ id, titleId, titleNumber, basePresetId, userDefined, isModified, isFixed, isVisible, customName, iconId, settings[] }`
- `GoProPresetSetting`: `{ id, value, isCaption }`

### 関数
| 関数 | 用途 | 送信チャンネル |
|------|------|---------------|
| `encodeRequestGetPresetStatus()` | プリセット一覧取得 | **Query (GP-0076)** — Feature 0xF5 |
| `encodeRequestCustomPresetUpdate({ titleId, customName, iconId })` | アクティブカスタムプリセットの名前/アイコン変更 | **Command (GP-0072)** — Feature 0xF1 |
| `decodeNotifyPresetStatus(data)` | 応答 → `GoProPresetGroup[]` | — |
| `decodeResponseGeneric(data)` | `{ result }` を返却 (1=SUCCESS) | — |

> **重要**: Protobuf コマンドは Feature ID ごとに使う BLE チャンネルが異なる。
> - `0xF5` 系 → Query characteristic (`QUERY_SEND` / `QUERY_NOTIFY`)
> - `0xF1` 系 → **Command characteristic** (`CMD_SEND` / `CMD_NOTIFY`)
>
> 誤ったチャンネルに書き込むと応答が一切返らずタイムアウトする (Open GoPro 仕様、
> 各コマンドページに UUID が明記されている)。

### プリセット再取得トリガー
設定変更通知で `PRESET_REFRESH_TRIGGER_IDS` に含まれるIDが変化すると、
500ms デバウンスの後にプリセット一覧を再取得する。

### カスタムプリセット 名称/アイコン変更 (Update Custom Preset)

Open GoPro `RequestCustomPresetUpdate` (Feature 0xF1 / Action 0x64, Response 0xE4)。

| 制約 | 内容 |
|------|------|
| 対応機種 | **HERO12 / HERO13 / MAX 2** のみ (HERO11 以下は非対応) |
| 対象プリセット | 「現在アクティブ」かつ `userDefined = true` のものに限る |
| 名前文字数 | 1〜16 文字 |
| 名前文字種 | 英/仏/伊/独/西/葡/瑞/露 (Open GoPro 仕様上の制限)。日本語等は拒否される可能性大 |
| 名前を設定するには | `titleId = 94` (`PRESET_TITLE_USER_DEFINED_CUSTOM_NAME`) + `customName` |
| 名前を工場名に戻すには | `titleId = 94 以外` |
| アイコンのみ変更 | `iconId` のみ送信 (名前は据え置き) |
| 受け付ける iconId | Open GoPro 仕様上 "camera が返した Preset の iconId 範囲内" とされるが事前取得不可。実装では `PRIMARY_ICON_CHOICES` + `EXTENDED_ICON_CHOICES` を決め打ちで提示し、失敗時は `ResponseGeneric.result` で判定する |

BLE 層のエントリポイント:

```ts
await goProBle.renameActivePreset(name, iconId);
// returns boolean (true = RESULT_SUCCESS)
```

内部挙動:
1. 非アクティブなプリセットを対象にする場合、UI 側が先に `loadPreset()` → 350ms 待機
2. `encodeRequestCustomPresetUpdate` で Protobuf payload 生成
3. `[0xF1, 0x64, ...payload]` を **CMD_SEND** に書き込み
4. `CMD_NOTIFY` で `[0xF1, 0xE4, ...ResponseGeneric]` を受信 → `result` を resolve
5. タイムアウト 4 秒

### EnumPresetIcon → Ionicons マッピング

`src/constants/PresetIconMap.ts` に以下を集約:

- `PRESET_ICON_TO_IONICON`: 70+ 種類の代表的アイコンを Ionicons 名へマッピング。
  未マッピングは `PRESET_GROUP_DEFAULT_ICON[groupId]` にフォールバック。
- `PRIMARY_ICON_CHOICES`: Rename モーダルの初期表示 (12種、Custom/Video/Photo/Timelapse 代表)
- `EXTENDED_ICON_CHOICES`: "More (+)" で拡張表示される 18種 (Activity/Mount 系含む)

将来 SVG 等で厳密なビジュアル再現に移行する余地はあるが、`react-native-svg` 非導入を維持するため現状は Ionicons で代替。


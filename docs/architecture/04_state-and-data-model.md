# 状態管理とデータモデル

## 対象ファイル
- [src/store/GoProStore.ts](../../src/store/GoProStore.ts)
- [src/types/KnownDevice.ts](../../src/types/KnownDevice.ts)
- [src/device/CapabilityCacheRepository.ts](../../src/device/CapabilityCacheRepository.ts)
- [src/device/PresetMetaCacheRepository.ts](../../src/device/PresetMetaCacheRepository.ts)

## Zustand ストア (GoProStore)

アプリ全体の状態を管理する単一ストア。BLE 通知、UI の optimistic state、SQLite 復元結果をここへ集約する。

### 主要ステートフィールド

| フィールド | 型 | 説明 |
|-----------|---|------|
| `connectionStatus` | `'disconnected' \| 'scanning' \| 'connected'` | BLE 接続状態 |
| `wifiStatus` | `'disconnected' \| 'connecting' \| 'connected'` | Wi-Fi 接続状態 |
| `activeScreen` | `'home' \| 'control'` | 現在画面 |
| `connectedDeviceId` | `string \| null` | 接続中カメラの BLE ID |
| `isEncoding` | `boolean` | Status 10 |
| `captureDelayActive` | `boolean` | Status 101 |
| `recordingTimeSec` | `number` | Status 13 |
| `isReady` | `boolean` | Status 82 |
| `systemBusy` | `boolean` | Status 8 |
| `cameraControlStatus` | `'idle' \| 'camera' \| 'external' \| 'cofSetup'` | Status 114 |
| `pendingSettings` | `Record<number, number>` | カメラ通知待ちの期待値 |
| `settings` | `Record<number, number>` | 現在値 |
| `capabilities` | `Record<number, number[]>` | live capability 値 |
| `isRefreshingCapabilities` | `boolean` | capability 取得中表示 |
| `capabilityCache` | `Record<string, Record<number, number[]>>` | request 単位で永続化する capability cache |
| `capabilityCacheKey` | `string \| null` | 旧方式互換で保持している state。現在は cache 保存の authoritative source ではない |
| `presets` | `GoProPresetGroupData[]` | Protobuf プリセット一覧 |
| `hardwareInfo` | `HardwareInfo \| null` | 0x3C 由来のハードウェア情報 |
| `cameraModel` | `CameraModelKey` | `modelNo` から導出した互換キー |
| `scheduledTime` | `{ hour: number; minute: number } \| null` | Scheduled Capture 時刻 |
| `toastMessage` | `string \| null` | 軽量 UI 通知 |

### 主要アクション

| アクション | 用途 |
|-----------|------|
| `batchUpdateSettings(entries)` | TLV settings 応答を 1 回の `set()` で反映 |
| `batchUpdateCapabilities(entries)` | live capabilities のみを更新 |
| `mergeCapabilityCacheEntry(cacheKey, entries)` | request に紐づく capability cache を明示更新 |
| `setPendingSetting(id, expectedValue)` / `clearPendingSetting(id)` | optimistic UI と確認待ち管理 |
| `setCapabilityCache(cache)` | SQLite から復元した capability cache を store へ投入 |
| `setPresets(groups)` | customName / iconId を保持しながらプリセット一覧更新 |
| `beginDisconnect()` / `clearConnectedCameraState()` | 切断フェーズを 2 段階で進める |

### パフォーマンス設計

- BLE の TLV 応答は `batchUpdateSettings()` / `batchUpdateCapabilities()` で一括反映する
- UI 側は `useShallow` と selector を使い、無関係な更新による再レンダリングを抑える
- `pendingSettings` を別スライスで持ち、実値 (`settings`) を汚さずに optimistic UI を構成する

## HardwareInfo 型

```typescript
interface HardwareInfo {
  modelNo: number;
  modelName: string;
  boardType: number;
  firmwareVersion: string;
  serialNumber: string;
  ssid: string;
  macAddress: string;
}
```

`cameraModel` は `modelNo` から導出する。`modelName` は表示と capability cache key に使うが、モデル判定の正ではない。

## KnownDevice 型

`KnownDevice` は BLE ID ごとに最後に取得したハードウェア情報を保持する SQLite 行モデル。
次回接続時、`HardwareInfo` を先に hydrate して UI と model resolver を早めに安定させるために使う。

## 永続化 (expo-sqlite)

### KnownDeviceRepository
- テーブル: `known_devices`
- 用途: 接続済みカメラの `modelNo`, `modelName`, `firmwareVersion` などを保存し、再接続時の早期 hydrate に使う

### SettingVisibilityRepository
- テーブル: `setting_visibility`
- 複合キー: `(camera_id, preset_id, setting_id)`
- 用途: デバイス × プリセットごとの表示/非表示を記憶する

### CustomPresetRepository
- テーブル: `custom_presets`
- 用途: ユーザー定義のスナップショット保存

### PresetMetaCacheRepository
- テーブル: `preset_meta_cache`
- 用途: Protobuf push で省略されることがある `customName` / `iconId` およびデコード・解決された `basePresetId` を永続化する
- 接続時に load して `presets` へ先行復元し、push 後も `setPresets()` の merge で欠落を防ぐ

### CapabilityCacheRepository
- テーブル: `capability_cache_v1`
- キー: `cameraId`
- 値: `Record<cacheKey, Record<settingId, number[]>>` を JSON として保存
- 保存は repository 側で debounced + queued。`GoProBLEManager` は capability response 到着時に request 単位の cache entry を更新し、その結果を `saveCapabilityCache()` に渡す

## setPresets のマージ動作

カメラからの `0xF3` push では `customName`, `iconId`, `basePresetId` などの設定情報が一部省略されることがある。
そのため `setPresets()` は単純上書きではなく、既存 `presets` に残っているメタ情報を引き継ぐ。

- `customName` が空なら既存値を維持
- `iconId === 0` なら既存値を優先（既存値があればそれを保持する）
- `basePresetId` も既存値から引き継ぎ、さらに `normalizeBaseDisplayPresetId` で正規化（またはグループ・設定値から `resolveBaseDisplayPresetId` で解決）した値をセットする。

これにより、rename 後や再接続後でもプリセット名・アイコンが安定して表示される。

## capability cache の責務分離

現在の設計では、capability cache は request / response 対応付けと DB 永続化を分離している。

- `PacketParser` は `0x32` 応答を live `capabilities` に反映し、同じ batch を `GoProBLEManager` が再利用できる形で返す
- `batchUpdateCapabilities()` は live state だけを更新し、自動で SQLite 保存しない
- request 時点の cache key と requested IDs は `GoProBLEManager` が保持し、対応する capability response 到着時に `mergeCapabilityCacheEntry()` で反映する
- SQLite への debounce / queue / 世代管理は `CapabilityCacheRepository` が担当する

この分離により、非同期応答が別プリセットの cache key に誤保存される事故を防ぐ。

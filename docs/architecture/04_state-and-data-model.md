# 状態管理とデータモデル

## 対象ファイル
- [src/store/GoProStore.ts](../../src/store/GoProStore.ts) — 統一エクスポート・結合ストア定義
- [src/store/storeTypes.ts](../../src/store/storeTypes.ts) — ストア共通型定義
- [src/store/slices/connectionSlice.ts](../../src/store/slices/connectionSlice.ts) — BLE/Wi-Fi 接続状態・ハードウェア情報 Slice
- [src/store/slices/cameraStateSlice.ts](../../src/store/slices/cameraStateSlice.ts) — カメラ設定・Capabilities・ステータス・Pending状態 Slice
- [src/store/slices/presetSlice.ts](../../src/store/slices/presetSlice.ts) — プリセット一覧・カスタムプリセット・ベースプリセット ID Slice
- [src/store/slices/uiSettingsSlice.ts](../../src/store/slices/uiSettingsSlice.ts) — アクティブ画面・表示項目・トースト通知 Slice
- [src/types/KnownDevice.ts](../../src/types/KnownDevice.ts)
- [src/device/CapabilityCacheRepository.ts](../../src/device/CapabilityCacheRepository.ts)
- [src/device/PresetMetaCacheRepository.ts](../../src/device/PresetMetaCacheRepository.ts)

## Zustand ストア (GoProStore) と Slice パターン

アプリ全体の状態を管理するグローバルストア。単一ファイル化による保守性低下を防ぐため、機能ドメインごとに 4 つの Slice に分割され、`GoProStore.ts` で結合してエクスポートしている。

### マルチデバイス構造 (`CameraSpecificState`)

本アプリのストアは単一カメラの状態だけでなく、複数のカメラを切り替えて操作できる **マルチデバイス構造** を採用している。

- **アプリ共通状態 (トップレベル)**: `connectionStatus`, `bluetoothState`, `activeScreen`, `connectedDeviceId`, `theme`, `appLanguage`, `purchasedProducts` 等
- **カメラ固有状態 (`cameraStates[deviceId]: CameraSpecificState`)**: `settings`, `capabilities`, `presets`, `hardwareInfo`, `wifiStatus`, `isEncoding`, `toastMessage`, `scheduledTime` 等

カメラとの通信応答 (BLE Notify / Status / Settings) は、接続中の `connectedDeviceId` に紐づく `CameraSpecificState` を更新する。

### Slice 構成と役割

| Slice | ファイル | 役割・主な状態 |
|-------|---------|---------------|
| `ConnectionSlice` | `slices/connectionSlice.ts` | `connectionStatus`, `bluetoothState`, `activeScreen`, `connectedDeviceId`, `deviceConnectionStatuses` 等の接続・遷移制御 |
| `CameraStateSlice` | `slices/cameraStateSlice.ts` | `cameraStates` (マルチデバイス状態マップ: `settings`, `capabilities`, `presets`, `hardwareInfo`, `wifiStatus`, `isEncoding`, `toastMessage` 等) およびステータス更新 |
| `PresetSlice` | `slices/presetSlice.ts` | プリセットメタ情報 (`customName`, `iconId`, `basePresetId`) の永続化・SQLite キャッシュマージ処理 |
| `UiSettingsSlice` | `slices/uiSettingsSlice.ts` | アプリレベルの UI 設定 (`theme`, `appLanguage`, `columnCount`, `bypassCapabilityCache`), デバッグログフラグ (`debugLogBle*`), IAP状態 (`purchasedProducts`) |

### 主要ステートフィールド

| フィールド | 格納場所 / Slice | 型 | 説明 |
|-----------|-----------------|---|------|
| `connectionStatus` | トップレベル / Connection | `'disconnected' \| 'scanning' \| 'connected'` | BLE 接続状態 |
| `activeScreen` | トップレベル / Connection | `'home' \| 'control'` | 現在表示画面 |
| `connectedDeviceId` | トップレベル / Connection | `string \| null` | 接続中カメラの BLE ID |
| `theme` | トップレベル / UiSettings | `AppTheme` | アプリ表示テーマ |
| `appLanguage` | トップレベル / UiSettings | `AppLocale` | UI 表示言語 |
| `purchasedProducts` | トップレベル / UiSettings | `string[]` | In-App Purchase 購入済みアイテム |
| `wifiStatus` | `CameraSpecificState` / CameraState | `'disconnected' \| 'connecting' \| 'connected'` | Wi-Fi 接続状態 |
| `hardwareInfo` | `CameraSpecificState` / CameraState | `HardwareInfo \| null` | 0x3C 由来のハードウェア情報 |
| `settings` | `CameraSpecificState` / CameraState | `Record<number, number>` | 現在の設定値マップ |
| `pendingSettings` | `CameraSpecificState` / CameraState | `Record<number, number>` | カメラ通知待ちの期待値マップ |
| `capabilities` | `CameraSpecificState` / CameraState | `Record<number, number[]>` | live capability 値マップ |
| `capabilityCache` | `CameraSpecificState` / CameraState | `Record<string, Record<number, number[]>>` | request 単位で永続化する capability cache |
| `presets` | `CameraSpecificState` / CameraState | `GoProPresetGroupData[]` | Protobuf プリセット一覧 |
| `isEncoding` | `CameraSpecificState` / CameraState | `boolean` | Status 10 (録画中フラグ) |
| `captureDelayActive` | `CameraSpecificState` / CameraState | `boolean` | Status 101 |
| `recordingTimeSec` | `CameraSpecificState` / CameraState | `number` | Status 13 (録画経過秒数) |
| `isReady` | `CameraSpecificState` / CameraState | `boolean` | Status 82 |
| `systemBusy` | `CameraSpecificState` / CameraState | `boolean` | Status 8 |
| `cameraControlStatus` | `CameraSpecificState` / CameraState | `'idle' \| 'camera' \| 'external' \| 'cofSetup'` | Status 114 |
| `scheduledTime` | `CameraSpecificState` / CameraState | `{ hour: number; minute: number } \| null` | Scheduled Capture 時刻 |
| `toastMessage` | `CameraSpecificState` / CameraState | `string \| null` | カメラ固有の UI トースト通知 |

> **注記 (`cameraModel`)**:
> ストア直下には `cameraModel` フィールドは存在しません。`hardwareInfo.modelNo` から `resolveCameraModelKeyFromModelNo()` または selector ヘルパー (`useCurrentModelNo()`) を介して都度導出されます。

### 主要アクション

| アクション | Slice | 用途 |
|-----------|-------|------|
| `batchUpdateSettings(entries)` | CameraState | TLV settings 応答を 1 回の `set()` で反映 |
| `batchUpdateCapabilities(entries)` | CameraState | live capabilities のみを更新 |
| `mergeCapabilityCacheEntry(cacheKey, entries)` | CameraState | request に紐づく capability cache を明示更新 |
| `setPendingSetting(id, expectedValue)` / `clearPendingSetting(id)` | CameraState | optimistic UI と確認待ち管理 |
| `setCapabilityCache(cache)` | CameraState | SQLite から復元した capability cache を store へ投入 |
| `setPresets(groups)` | Preset | customName / iconId を保持しながらプリセット一覧更新 |
| `beginDisconnect()` / `clearConnectedCameraState()` | Connection | 切断フェーズを 2 段階で進める |

### パフォーマンス設計

- BLE の TLV 応答は `batchUpdateSettings()` / `batchUpdateCapabilities()` で一括反映する
- UI 側は `useShallow` と Slice 別 selector を使い、無関係な更新による再レンダリングを抑える
- `pendingSettings` を別領域で持ち、実値 (`settings`) を汚さずに optimistic UI を構成する

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

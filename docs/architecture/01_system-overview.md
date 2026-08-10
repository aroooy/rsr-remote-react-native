# アーキテクチャ全体像

## 概要

GoPro カメラを BLE (Bluetooth Low Energy) で遠隔操作する React Native / Expo アプリ。
旧 Xamarin.Forms C# アプリ (ProTuneRemote) からの移行として開発。
現行コードは Hero09 / Hero10 / Hero11 / Hero11 Mini / Hero12 / Hero13 / Max 系の差分を吸収する前提で、共通 facade と model-specific resolver の分離を進めている。

## 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|----------|
| フレームワーク | Expo | ~54.0 |
| 基盤 | React / React Native | 19.1 / 0.81.5 |
| BLE 通信 | react-native-ble-plx | ^3.5.1 |
| Wi-Fi 連携 | react-native-wifi-reborn | * |
| ストリーミング再生 | react-native-vlc-media-player | * |
| 状態管理 | Zustand | ^5.0.12 |
| ローカル DB | expo-sqlite | ~16.0.10 |
| ナビゲーション | @react-navigation | ^7.x |
| ビルド | expo-dev-client | ~6.0.20 |

> Protobuf ライブラリは未使用。プリセット情報の encode/decode は手書き実装 (`PresetProtobuf.ts`)。

## レイヤー構成

```
┌─────────────────────────────────────────────┐
│  UI Layer                                   │
│  App.js          — ナビゲーション             │
│  SettingsPanel   — 設定UIの安定 facade        │
│  PreviewPlayer   — ライブプレビューモーダル   │
├─────────────────────────────────────────────┤
│  State Layer                                │
│  GoProStore      — Zustand グローバルストア   │
├─────────────────────────────────────────────┤
│  Facade / Resolver Layer                    │
│  settingsPanel/*  — UI helper facade         │
│  *LayoutResolver  — runtime override 解決    │
│  cameraModels/*   — 機種別 resolver 実体      │
├─────────────────────────────────────────────┤
│  Constants Layer                            │
│  GoProSettingIds  — 設定ID定数, base layout   │
│  GoProMetadata    — 値名マッピング, ソート順  │
├─────────────────────────────────────────────┤
│  Network & BLE Layer                        │
│  GoProBLEManager  — BLE接続/通信/コマンド    │
│  GoProWiFiManager — Wi-Fi接続/UDPストリーム管理 │
│  PacketParser     — TLVパケット再組立・解析  │
│  PresetProtobuf   — Protobuf enc/dec        │
├─────────────────────────────────────────────┤
│  Persistence Layer                          │
│  KnownDeviceRepository         — 既知デバイスDB │
│  SettingVisibilityRepository   — 表示設定DB    │
└─────────────────────────────────────────────┘
```

## データフロー

```
BLE Notify → PacketParser (TLV/Protobuf解析) → GoProStore (Zustand) → SettingsPanel (React)
                                                                          │
                                                                          ↓ ユーザー操作
                                                              GoProBLEManager.setSetting()
                                                                          │
                                                                          ↓
                                                                BLE Write → カメラ
```

### 設定値の読み取りフロー

1. 接続完了後 `GoProBLEManager` が Bootstrap クエリを送信
2. カメラからの BLE Notify を `PacketParser.processQueryResponse()` が TLV 解析
3. 設定値 (`settings`) と利用可能値 (`capabilities`) を `GoProStore` にバッチ更新
4. `SettingsPanel` が Zustand の `useShallow` セレクタで差分レンダリング

### 設定値の書き込みフロー

1. ユーザーがモーダルで値を選択
2. `goProBle.setSetting(settingId, value)` で BLE 書き込み
3. カメラが設定変更通知を BLE Notify で返す
4. 「読み取りフロー」と同じ経路で UI 更新

## ファイル構成

```
src/
  ble/
    GoProBLEManager.ts        — BLE通信シングルトン (~450行)
    PacketParser.ts           — パケット再組立・TLV解析 (~220行)
    PresetProtobuf.ts         — Protobuf手書き enc/dec (~260行)
  components/
    SettingsPanel.tsx          — メインUIと orchestration
    PreviewPlayer.tsx          — ライブプレビュー(VLC)再生モーダル
    settingsPanel/
      framingSelector.ts       — framing row facade
      resolutionSelector.ts    — resolution row facade
      otherItemState.ts        — renderOtherItem state facade
      specialRows.ts           — Easy / special row facade
  constants/
    GoProSettingIds.ts         — 設定ID・base layout・group builder facade
    GoProMetadata.ts           — メタデータ・値名マッピング facade
    displayLayoutResolver.ts   — top-level layout override facade
    videoLayoutResolver.ts     — video layout override facade
    photoLayoutState.ts        — photo layout state facade
    timelapseLayoutState.ts    — timelapse layout state facade
    PresetIconMap.ts           — EnumPresetIcon → Ionicons マッピング / アイコン候補セット
    ResolutionAspectMap.ts     — 機種別 RESOLUTION 完全マップ / アスペクト比 remap
  cameraModels/
    shared/                    — dispatcher / shared types / helper constants, displayPreset.ts (ベースプリセットID解決ヘルパー)
    hero09/ ... max/           — 機種別 resolver 実装
  device/
    GoProDeviceFilter.ts       — BLE名フィルタ (~6行)
    KnownDeviceRepository.ts   — 既知デバイスDB CRUD (~85行)
    SettingVisibilityRepository.ts — 表示設定DB CRUD (~75行)
    PresetMetaCacheRepository.ts   — プリセットメタ永続キャッシュ CRUD
    CapabilityCacheRepository.ts   — ケーパビリティキャッシュ永続化
    CustomPresetRepository.ts      — カスタムプリセットスナップショット保存
  network/
    GoProWiFiManager.ts        — Wi-Fi AP管理およびストリーミング要求 (~110行)
  store/
    GoProStore.ts              — Zustand ストア定義 (~95行)
  types/
    KnownDevice.ts             — デバイス・HardwareInfo 型定義 (~35行)
App.js                         — エントリポイント・ナビゲーション (~290行)
```

## 画面構成

| 画面 | ファイル | 説明 |
|------|---------|------|
| Home | `App.js` 内 `HomeScreen` | デバイスリスト (既知 + スキャン結果)、接続操作 |
| Control | `App.js` 内 `ControlScreen` → `SettingsPanel` | カメラ設定・操作パネル |

## 設計原則

### Capability-Driven UI
カメラが BLE で返す capability (利用可能値一覧) をそのまま UI の表示制御に使用する。
メタデータには全モデルの全値ラベルを統合定義しておき、capability query の結果で自動フィルタされる。
→ 新モデル追加時、値ラベルの追加のみで多くの設定が動作する。

### Stable Facade + Model Resolver
既存の公開入口はできるだけ維持し、機種固有差分だけを facade の背後へ寄せる。

- `SettingsPanel.tsx` は orchestration と generic rendering を維持する
- `GoProSettingIds.ts` は setting ID・base layout・group builder を維持する
- `GoProMetadata.ts` / `settingConstraints.ts` などは公開 API の facade を維持する
- 実際の機種差分は `src/cameraModels/<model>/...` と `src/cameraModels/shared/...` に集約する

runtime に model 名比較が必要な場合も、まず facade から shared dispatcher へ渡し、per-model resolver で閉じる方針を優先する。

### LayoutBuilder の位置づけ
`LayoutBuilder` は静的な base layout 定数を組み立てる用途で引き続き使う。
一方、どの preset / model でどの layout を返すかという runtime 分岐は、`GoProSettingIds.ts` 単体に積み増さず resolver facade に切り出す。

### パフォーマンス最適化
- BLE パケットの TLV 一括パースと `batchUpdateSettings()` で不要な再レンダリングを抑制
- `useShallow` セレクタによる浅い比較
- request 単位 capability queue と SQLite capability cache による再取得抑制

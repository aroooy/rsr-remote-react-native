# 開発環境とビルド (共通)

プラットフォーム固有のリリースビルド手順は別ファイルに分離:

- **Android (Google Play 提出用)**: [07a_build-android.md](07a_build-android.md)
- **iOS (App Store 提出用)**: [07b_build-ios.md](07b_build-ios.md)

本ファイルは両プラットフォーム共通の事項をまとめる。

## 前提条件

- Node.js (v18 以上推奨)
- Android Studio (Android 開発時)
- Xcode (iOS 開発時)
- 物理デバイス (BLE はエミュレータ非対応)

## セットアップ

```bash
cd /path/to/rsr-remote-react-native
npm install
```

## 開発サーバー起動

```bash
npx expo start --dev-client
```

- `--dev-client` フラグが必須。expo-dev-client を使用した Development Build で動作する。
- Expo Go では BLE ネイティブモジュール (`react-native-ble-plx`) が動作しない。

## 開発ビルド (動作確認用)

### Android

```bash
npx expo run:android
```

### iOS (シミュレータ or USB 実機、Debug 構成)

```bash
npx expo run:ios
# USB 実機を指定する場合:
npx expo run:ios --device "<端末名>"
```

> Release 構成で USB 実機に入れたい場合は [07b_build-ios.md](07b_build-ios.md)
> の「方法 C」を参照。

## 本番リリースビルド

ストア提出用のビルド手順は長いためプラットフォーム別に分離している:

| 対象 | ドキュメント |
|------|------------|
| Google Play (AAB) | [07a_build-android.md](07a_build-android.md) |
| App Store (IPA) | [07b_build-ios.md](07b_build-ios.md) |

## 主要な npm スクリプト

| コマンド | 説明 |
|---------|------|
| `npm start` | `expo start` |
| `npm run android` | `expo run:android` |
| `npm run ios` | `expo run:ios` |

## 依存パッケージ

| パッケージ | バージョン | 用途 |
|-----------|----------|------|
| expo | ~54.0 | フレームワーク |
| react / react-native | 19.1 / 0.81.5 | 基盤 |
| react-native-ble-plx | ^3.5.1 | BLE通信 |
| zustand | ^5.0.12 | 状態管理 |
| expo-sqlite | ~16.0.10 | ローカルDB (既知デバイス・表示設定) |
| @react-navigation/* | ^7.x | 画面遷移 |
| expo-dev-client | ~6.0.20 | 開発ビルド用クライアント |
| typescript | ~5.9.2 | 型チェック |

> **protobufjs は不使用**。プリセット Protobuf は `src/ble/PresetProtobuf.ts` で手書き実装。

## プロジェクト構成

```
rsr-remote-react-native/
  App.js                    — エントリポイント・ナビゲーション
  app.json                  — Expo 設定
  eas.json                  — EAS Build 設定
  package.json              — 依存管理
  tsconfig.json             — TypeScript 設定
  index.js                  — registerRootComponent
  android/                  — Android ネイティブコード (prebuild 生成、gitignore)
  ios/                      — iOS ネイティブコード (prebuild 生成、gitignore)
  build-config/             — プラットフォーム別ビルド設定 (署名等)
    android/                — keystore.properties / credentials.json.example 等
    ios/                    — ExportOptions.plist
  plugins/                  — Expo Config Plugins (署名注入など)
  src/
    ble/                    — BLE通信層
    components/             — UIコンポーネント
    constants/              — 定数・メタデータ
    device/                 — デバイス管理・DB
    store/                  — Zustand ストア
    types/                  — TypeScript 型定義
  docs/
    porting-strategy/       — 機種対応戦略ドキュメント
    technical/              — 技術引継ぎドキュメント (本ドキュメント群)
```

> 本プロジェクトは元々 `ExpoTest` というプロトタイプ名称で開発を開始し、その後 `rsr-remote-react-native`
> （アプリ名: `RS-R Remote`, `slug`: `rsr-remote`）へ正式リネーム・クリーンアップされました。

## デバッグ

### BLE 通信のログ

`GoProBLEManager.ts` にログが埋め込まれている:

```
[BLE] HardwareInfo modelName: HERO13 Black / modelNo: 73
[BLE] cameraModel confirmed: hero13
```

### パケット解析のデバッグ

`PacketParser.ts` の `processQueryResponse()` 内で TLV 解析結果を確認:
- `0x12` 応答: 全設定値のダンプ
- `0x32` 応答: capability 値一覧

### 実機テストの注意点

- BLE 接続は 1 台のみ同時接続可能
- Android は MTU 拡張 (512バイト) を要求する (自動)
- KeepAlive (15秒間隔) が途切れるとカメラが接続を切断する
- 設定変更後の capability リフレッシュに 0.5-1 秒程度かかる場合がある

## 現行実装の参照先

旧 Xamarin アプリはワークツリーから削除済み。新設定や新機種を調査するときは、まず現行の TypeScript 実装と docs を参照する。

| ファイル | 用途 |
|---------|------|
| `src/constants/GoProMetadata.ts` | 値 → 名前マッピング |
| `src/constants/GoProSettingIds.ts` | setting ID / レイアウト定義 / preset 定数 |
| `src/constants/displayLayoutResolver.ts` | モデル別レイアウト分岐入口 |
| `src/cameraModels/<model>/layout.ts` | モデル固有の表示差分 |
| `src/components/settingsPanel/*.ts` | selectable / visible / primary item のランタイム制御 |
| `src/ble/GoProBLEManager.ts` | BLE コマンドと preset / capability orchestration |

> 実装手順の詳細は [docs/porting-strategy/gopro-setting-porting-rules.md](../porting-strategy/gopro-setting-porting-rules.md) を参照。

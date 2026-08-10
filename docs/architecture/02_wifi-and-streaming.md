# Wi-Fi 連携とライブストリーミング

## 対象ファイル
- [src/network/GoProWiFiManager.ts](../../src/network/GoProWiFiManager.ts)
- [src/components/PreviewPlayer.tsx](../../src/components/PreviewPlayer.tsx)
- [src/store/GoProStore.ts](../../src/store/GoProStore.ts)

## 概要

GoProのライブプレビュー映像は、Wi-Fiネットワークを介して `udp://@:8554` で送信される MPEG-TS 形式のストリームです。この映像を受信・表示するためには、BLEでカメラ側のWi-Fiを有効化し、スマートフォンをカメラのWi-Fi APへ接続し、ストリーム開始要求をHTTPで送信するという一連の連携フローが必要です。

## Wi-Fi 接続ロジック (`GoProWiFiManager`)

Wi-Fi接続管理は `react-native-wifi-reborn` を使用して行われます。

### 1. 動作要件・権限要件
Android 10以上におけるWi-Fi接続の自動化には「正確な位置情報権限 (`ACCESS_FINE_LOCATION`)」が必須とされています。さらにスマートフォン自体のGPS設定がONになっている必要があります。（OFFの場合、OSレベルで周囲のWi-Fiネットワークをスキャンできずにタイムアウトします）

### 2. プロビジョニングフロー
1. **AP有効化**: BLEでカメラへ `[0x01, 0x17]` (CMD_SEND) を送信し、Wi-Fiアンテナを起動させます。
2. **待機**: カメラがSSIDのブロードキャストを開始するまで5秒間待機します。
3. **認証情報取得**: BLEの「Wi-Fi APサービス Characteristic (`b5f90003...`)」からSSIDとパスワードの平文を直読みします。
4. **ネットワーク接続**: 得られたSSIDとパスワードを用いて、`WifiManager.connectToProtectedSSID()` でAndroid/iOS端末のWi-Fi接続を自動で確立させます。

### 3. 明示的な切断 (Android特有のライフサイクル保護)
プレビュー画面を閉じる際は、必ず `WifiManager.disconnect()` を実行してOSの `WifiNetworkSpecifier` を破棄します。これを行わないと、OSが前回の一時接続情報をリセットできず、次回の接続（2回目のプレビュー時など）に際して深刻な `Connection timeout` が発生するAndroid側の既知の不具合を回避しています。

## プレビュープレイヤー (`PreviewPlayer`)

ライブ映像のデコードとUI表示は `react-native-vlc-media-player` (VLC) を採用し、全画面の `Modal` として実装されています。

### VLCの採用理由
iOSの標準 `AVPlayer` 等は HLS には対応していますが、GoProが使用する生のUDPストリーム (`MPEG-TS`) を直接受信・再生する機能を持ちません。そのため、幅広いプロトコルにネイティブレベルで対応している `libvlc` エンジンを内蔵した本パッケージを使用しています。

### 低遅延化チューニング (Low Latency)
VLCのデフォルト設定では「映像の中断防止」を優先しパケットを長時間バッファリングするため、最大で2〜3秒の表示遅延が発生します。
これをリアルタイム要件に合わせるため、マウント時に以下の `initOptions` にて VLC Native エンジンへの直書き引数を渡しています。

```javascript
initOptions: [
  '--network-caching=150',     // ネットワークキャッシュを極小の150msに設定
  '--clock-synchronization=0', // オーディオ等の同期を無効化
  '--drop-late-frames',        // 遅れたフレームは破棄しリアルタイム性を優先
  '--skip-frames'              // 描画処理が追いつかないパケットも破棄
]
```

### レンダリングと破棄の安全機構
VLCは裏側で強力なC言語のデコードスレッドを回しているため、Reactのライフサイクルに合わせて急激にコンポーネントをUnmountさせると `IllegalStateException: can't get VLCObject instance` などのクラッシュが発生します。
これを防ぐため、以下の安全な2段階の終了手順 (`handleClose`) を実装しています。

1. **論理破棄**: `setIsPlaying(false)` を呼び出して `VLCPlayer` コンポーネントのみをDOMから消去し、裏で `stopPreviewStream`（HTTP GET: `/gopro/camera/stream/stop`）をリクエストします。
2. **タイムアウト＆完全破棄**: `libvlc` のCスレッドが安全にメモリを解放するまでの猶予として400ms待機したのちに、初めて親の `Modal` そのものを `onClose()` で閉じます。

また、`App.js` の再描画によって `PreviewPlayer` が不意に破壊されてしまうことを防ぐため、同機能の呼び出し元となる `ControlScreen` コンポーネントは関数外部のグローバルスコープへと隔離されています。

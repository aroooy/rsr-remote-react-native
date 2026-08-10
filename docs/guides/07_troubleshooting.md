# トラブルシューティング: 切断時 Fabric クラッシュ

作成日: 2026-05-10  
最終更新: (2段階リセット修正)  
ステータス: 継続対応中

---

## 症状

GoPro との BLE 接続が切れた瞬間にアプリがクラッシュし、以下のエラーが Android logcat に出力された。

```
E unknown:SurfaceMountingManager: java.lang.IllegalStateException:
  addViewAt: cannot insert view [1706] into parent [1750]:
  View already has a parent: [1750]  Parent: ReactViewGroup View: ReactViewGroup
```

スタックトレース（核心部）:

```
SurfaceMountingManager.addViewAt(SurfaceMountingManager.java:384)
IntBufferBatchMountItem.execute(IntBufferBatchMountItem.kt:111)
MountItemDispatcher.dispatchMountItems(MountItemDispatcher.kt:221)
FabricUIManager$DispatchUIFrameCallback.doFrameGuarded(FabricUIManager.java:1484)
ReactClippingViewManager.addView(ReactClippingViewManager.kt:36)
```

---

## 原因

**主因: Expo SDK のバージョン不整合**

インストールされていたバージョンが Expo SDK 54 の推奨バージョンと一致していなかった。

| パッケージ | インストール済み | 推奨バージョン |
|---|---|---|
| `expo` | 54.0.33 | ~54.0.34 |
| `expo-dev-client` | 6.0.20 | ~6.0.21 |

`SurfaceMountingManager`（React Native Fabric の内部コンポーネント）に既知のバグがあり、
ナビゲーションによる画面アンマウントと BLE 切断による state 更新が同時に発生した際に
`addViewAt` でクラッシュしていた。これはパッチリリースで修正済みのバグだった。

---

## 解決手順

### 1. バージョン整合確認・修正

```bash
npx expo install --check
```

`? Fix dependencies? › (Y/n)` → Y を入力すると自動更新される。

```
expo@54.0.33 → 54.0.34
expo-dev-client@6.0.20 → 6.0.21
```

### 2. リビルド

```bash
npx expo run:android --device
```

---

## 再発防止策

### 定期的なバージョン整合確認

SDK のマイナーアップデート後や `npm install` 後は必ず以下を実行する:

```bash
npx expo install --check
```

このコマンドは Expo SDK のメタデータと照合し、推奨バージョンと異なるパッケージを一覧表示する。
パッチバージョンのずれでもクラッシュの原因になりうるため、常に推奨バージョンに揃えること。

### コードレベルの防御的改善（本コミットで適用）

根本原因はライブラリのバグだったが、あわせて以下のコード改善を適用した。

#### `GoProStore.ts` / `GoProBLEManager.ts`: 切断時 state 更新を1回の `set()` に集約

**変更前**: 切断時に6回の個別 `set()` を呼び出していた

```ts
store.setConnectedDeviceId(null);
store.setConnectionStatus('disconnected');
store.setActiveScreen('home');
store.setCameraModel('unknown');
store.setHardwareInfo(null);
// pendingSettings は別途クリアされていなかった
```

**変更後**: `beginDisconnect()` + `clearConnectedCameraState()` の2段階に分離

```ts
// GoProBLEManager.ts: Phase 1 のみ実行
useGoProStore.getState().beginDisconnect();

// GoProStore.ts
beginDisconnect: () => set({
  connectedDeviceId: null,
  connectionStatus: 'disconnected',
}),
// Phase 2 は App.js の InteractionManager.runAfterInteractions() 内で呼ばれる
clearConnectedCameraState: () => set({
  activeScreen: 'home',
  cameraModel: 'unknown',
  hardwareInfo: null,
  pendingSettings: {},
}),
```

```js
// App.js: connectionStatus 変更を検知したら
// Phase 1: ナビゲーションリセット
navigationRef.reset({ index: 0, routes: [{ name: 'Home' }] });
// Phase 2: ナビゲーション完了後に残りをリセット
InteractionManager.runAfterInteractions(() => {
  useGoProStore.getState().clearConnectedCameraState();
});
```

**効果**: ナビゲーション遷移（`navigationRef.reset`）と CameraSettingsScreen の大規模再レンダリングが
同一フレームで Fabric に流れ込まなくなり、`addViewAt` 競合クラッシュを根本的に回避。
`InteractionManager.runAfterInteractions` はすべてのアニメーション完了後に実行されるため、
遷移先 (Home) に到達してから `cameraModel` 等をリセットする安全なタイミングが保証される。

#### `CameraSettingsScreen.tsx`: `ActivityIndicator` を条件分岐から opacity 切り替えに変更

**変更前**: `{isPending && <ActivityIndicator />}` — マウント/アンマウントが都度発生

**変更後**: `<ActivityIndicator style={{ opacity: isPending ? 1 : 0 }} />` — 常時描画して表示/非表示は opacity で制御

**効果**: 画面アンマウント中に Fabric が `ActivityIndicator` の追加/削除命令を処理することによる
ビュー階層の不整合リスクを回避。`position: 'absolute'` のスライダー行スピナーは影響がないため変更なし。

---

## 調査時の注意事項

類似のクラッシュが発生した場合のチェックリスト:

1. `npx expo install --check` でバージョン整合を確認する（**最初に行う**）
2. バージョンに問題がなければ、`app.json` で `"newArchEnabled": false` に設定して Fabric を無効化し、再現するか確認する
   - 再現しない → Fabric / ライブラリの相性問題
   - 再現する → コード側のバグを深掘りする
3. logcat の `SurfaceMountingManager` / `MountItemDispatcher` のログで INSERT/REMOVE の操作シーケンスを確認する

---

## 関連情報

- エラー発生箇所: `ReactClippingViewManager.addView` → `SurfaceMountingManager.addViewAt`
- 影響コンポーネント: `CameraSettingsScreen`（設定画面）
- トリガー条件: 設定画面を表示中に GoPro との BLE 接続が切断される

---

## 未解決の課題: リアルタイム設定依存制御（Shutter → EV Comp 等）

### 課題
Shutterを「Auto」に変更した直後、カメラからのBLE応答を待たずに即座に EV Comp を活性化（タップ可能）させたいが、現状は pending 状態（カメラ応答前）では `settingConstraints.ts` の制約判定が古い値を使ってしまうため、画面を再読み込みするまで反映されない。

### 原因
1. `settingConstraints.ts` に VIDEO_SHUTTER → EV_COMP の依存が未定義（Shutter 値のチェックがない）。
2. pending 中は `settings` が更新されないため、制約判定が古い値を参照する。

### 今後の実装方針案
1. `SettingsPanel.tsx`（旧 `CameraSettingsScreen`）で、`settings`（確認済み）と `pendingSettings`（送信中）をマージした `effectiveSettings` を導入し、それを制約判定に渡す。
2. `settingConstraints.ts` に「Shutter が手動値（Auto=0 以外）の場合は EV Comp を非活性にする」ルールを追加する。
   - ※ Photo プリセットでは `PHOTO_SHUTTER` 等も同様に確認が必要。

---

## メンテナンスメモ: `npm audit` 棚卸し（2026-05-23）

### 結果概要

- `npm audit --json` 時点で **17件**（High 2件 / Moderate 15件）。
- 主因は `expo@54` 系の開発・ビルドツールチェーンで、`madge` 導入自体が主因ではない。
- High は以下の2系統。
  - `fast-uri` → `expo-build-properties` → `ajv` 配下
  - `@xmldom/xmldom` → `expo` / `@expo/config-plugins` / `xcode` / `plist` 配下

### 判断

- 現時点では **緊急修正は不要**。本番アプリのランタイムより、開発時・ビルド時の依存に偏っている。
- ただし High が含まれるため、完全放置ではなく **次回 Expo SDK 更新時の解消対象** として扱う。
- `npm audit fix` / `npm audit fix --force` は Expo SDK の整合性を崩す可能性があるため、**その場では実行しない**。

### 推奨アクション

1. Expo SDK 更新作業の前後で `npm audit --json` を再実行する。
2. `expo` / `expo-dev-client` のメジャー更新タイミングで再評価する。
3. High のみ先に下げたい場合でも、transitive dependency の override は別ブランチで検証する。

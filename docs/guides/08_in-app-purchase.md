# 10. In-App Purchase (IAP)

ProTune 設定の機種単位アンロック機能を `react-native-iap` 経由で提供する。
旧 Xamarin 版と **同一の商品 ID / パッケージ名** を維持し、既存ユーザが
復元 (Restore) 操作で追加課金なしにアンロックを引き継げるようにしている。

## 主要ファイル

| ファイル | 役割 |
|---------|------|
| `src/iap/IAPManager.ts` | IAP 初期化・購入・復元・リスナ管理 (react-native-iap ラッパ) |
| `src/iap/IAPProducts.ts` | 商品 ID 定義、機種名→商品 ID のマッピング |
| `src/device/PurchaseRepository.ts` | 購入済み商品 ID のローカル永続化 (expo-sqlite) |
| `app.json` | `android.package = jp.co.rs_r.rsrremote` (旧アプリ継承) |

## 商品 ID 一覧 (旧アプリと同一)

```ts
'gopro_hero09_protune'
'gopro_hero10_protune'
'gopro_hero11_protune'
'gopro_hero11_mini_protune'
'gopro_hero12_protune'
'gopro_hero13_protune'
'gopro_max_protune'
```

いずれも **非消費型 (non-consumable)** として Google Play Console /
App Store Connect 側に登録されている想定。

## 機種→商品マッピング

`HardwareInfo.modelName` (BLE コマンド `0x3C` レスポンス) を正規表現で突き合わせ:

| modelName 例 | 商品 ID |
|---|---|
| HERO13 Black | gopro_hero13_protune |
| HERO12 Black | gopro_hero12_protune |
| HERO11 Black Mini | gopro_hero11_mini_protune |
| HERO11 Black | gopro_hero11_protune |
| HERO10 Black | gopro_hero10_protune |
| HERO9 Black | gopro_hero09_protune |
| MAX | gopro_max_protune |

## ライブラリバージョン

- `react-native-iap`: **v15 系**
- v15 で API 形式が大きく変更されており、旧 API との互換性がない点に注意。

### v15 での主な API 変更 (実装時に詰まった点)

| 処理 | v10 系 (旧) | v15 系 (現) |
|------|-----------|-----------|
| 商品取得 | `getProducts({ skus })` | `fetchProducts({ skus, type: 'in-app' })` |
| 購入要求 | `requestPurchase({ skus })` / `{ sku }` | `requestPurchase({ request: { android: { skus }, ios: { sku } }, type: 'in-app' })` |
| Android acknowledge | `acknowledgePurchaseAndroid({ token })` を個別呼び出し | `finishTransaction({ purchase, isConsumable: false })` が内部で acknowledge を実行 (個別呼び出しは非推奨) |

v15 で `requestPurchase` を旧形式で呼ぶと以下のエラーが出る:

```
Error: Missing purchase request configuration
```

これは `request` プロパティが無いと内部で投げるエラー。

## 初期化フロー

```
App起動
  └─ initIAP(onSuccess)
      ├─ initPurchaseTable()                  // SQLite テーブル作成
      ├─ rniap.initConnection()               // ストア接続
      ├─ fetchProducts({ skus, type: 'in-app' }) // 価格キャッシュ
      ├─ purchaseUpdatedListener 登録         // 購入完了通知
      └─ purchaseErrorListener 登録           // エラー通知
```

react-native-iap が import 失敗 (Expo Go / 未バンドル) した場合は
`rniap = null` となりすべての呼び出しが no-op。UI ロック解除機能は
開発時でも触れる状態を保つ。

## 購入フロー

1. UI が `purchaseProduct(productId)` を呼ぶ
2. 2 段階確認ダイアログ ("Purchase?" → 押下)
3. `rniap.requestPurchase({ request: { android: { skus: [id] }, ios: { sku: id } }, type: 'in-app' })`
4. OS の購入 UI が表示される
5. 成功時: `purchaseUpdatedListener` が発火
   - `productId` と `purchaseToken` が揃っていれば
     `finishTransaction({ purchase, isConsumable: false })`
     (Android では内部で acknowledge 実行、iOS では consume ではなく finish 扱い)
   - `savePurchase(productId)` で SQLite に永続化
   - `onPurchaseSuccess(productId)` で UI 側 store 更新
6. キャンセル時: `E_USER_CANCELLED` は無害扱い (ダイアログ非表示)

> **react-native-iap v15 の注意点**:
> v15 でレシート系プロパティは統一され、旧 `transactionReceipt` は廃止。
> 代わりに `purchaseToken` (iOS は JWS、Android は purchaseToken) を使う。
> また Android では acknowledge を 3 日以内に行わないと自動返金されるため、
> `finishTransaction` をリスナ内で必ず呼ぶこと。

## 復元フロー

1. UI が `restorePurchases()` を呼ぶ
2. **iOS のみ**: `rniap.syncIOS()` を先に実行
   (StoreKit2 entitlement のロードを促す。これを省くと
   `getAvailablePurchases()` が空配列を返すケースがある)
3. `rniap.getAvailablePurchases({ onlyIncludeActiveItemsIOS: true,
   alsoPublishToEventListenerIOS: false })` でストア側レシート取得
4. **取得結果が 1 件以上の場合のみ** SQLite をクリア → 商品 ID を再保存
5. 各商品 ID について `onPurchaseSuccess` を呼び UI 反映

> **設計意図と「0 件なら DB を消さない」ルール**:
>
> Restore は本来「ストアが正解、ローカルは複製」という思想で、
> ストアから取得した完全リストでローカル DB を全置換する設計が一般的。
> これにより返金/取り消しされた entitlement がローカルから消える。
>
> しかし StoreKit2 (特に Sandbox) は購入直後でも `currentEntitlements` が
> 一時的に空を返すことがあり、無条件で `clearPurchases()` を実行すると
> 直前の正規購入記録までローカルから消滅し、アプリ再起動後に
> entitlement が失われる事故が発生する (本プロジェクトで実測済)。
>
> そのため本実装では:
> - **store が 0 件を返した場合は DB を一切触らない** (= ローカル維持)
> - 1 件以上返した場合のみ全置換し、取り消し済み商品の整合を取る
>
> 副作用として「全商品が返金された」エッジケースの自動同期はできなくなるが、
> 個人開発レベルでは許容。必要なら手動で「アプリ再インストール」を案内する。

## ロック UI との連動

`GoProStore` の `purchasedProducts: string[]` が購入状態のソース。
`settingsPanel` 等は以下のように判定:

- 接続中カメラの機種 → `getProductIdForModel(modelName)`
- `purchasedProducts.includes(productId)` で ProTune 拡張機能の表示可否を決定

## パッケージ / ストア設定

- **Android パッケージ**: `jp.co.rs_r.rsrremote`
  (旧 Xamarin 版と同一 — [app.json](../../app.json))
- **iOS Bundle ID**: `app.json` の `ios.bundleIdentifier` に合わせる
- Google Play Console / App Store Connect 側でも **商品 ID を旧アプリ登録名と同一** で再登録する
  (新規作成になるが既存レシートは同一 ID で復元可能)

## ビルド時の注意

- Expo Go では IAP 機能は動作しない (`rniap = null` 扱い)
- 動作確認は **Development Build** または **Release Build (AAB/IPA)** 必須
- Google Play: 内部テスターとして登録した Google アカウントでインストールすると
  テスト購入フローが走る (実課金なし)
- Apple: Sandbox アカウントで同様

## トラブルシュート

### `Missing purchase request configuration`
→ `requestPurchase` の引数が v15 形式になっていない。
`{ request: { android|ios: {...} }, type: 'in-app' }` の形に修正する。

### `E_IAP_NOT_AVAILABLE` / 商品取得が空
→ Google Play Console 側で商品が "Active" になっていない、もしくは
ビルド signing が対応プロジェクトと一致していない可能性。

### 購入直後に反映されない
→ `purchaseUpdatedListener` が登録されていない/アプリプロセスが
初期化前に落ちた等。`initIAP()` が確実に呼ばれているか確認。

### 復元しても商品が戻らない
→ 旧アプリと **同じ Google / Apple アカウント** でサインインしているか、
また商品 ID が完全一致しているかを確認。パッケージ名は
`jp.co.rs_r.rsrremote` で旧版と一致している必要がある。

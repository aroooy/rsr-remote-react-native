# ストア提出前のユーザー残作業チェックリスト

最終更新: 2026-06-13

コード側の提出ブロッカー（フェーズ0）と信頼性改善（フェーズ1）は対応済みです。
このドキュメントは、**アカウント・公開物・ストア管理画面の操作が必要なため、開発者本人にしかできない残作業**をまとめたものです。
上から順に対応すれば提出可能な状態になります。

## 1. プライバシーポリシー / 利用規約の実URL差し替え（必須・最優先）

アプリ内の設定画面（このアプリについて）からリンクされる URL は、現在プレースホルダです。

- [ ] プライバシーポリシーのページを公開する（自社サイト等）
- [ ] 利用規約のページを公開する
- [ ] `src/constants/AppLinks.ts` の `PRIVACY_POLICY_URL` / `TERMS_OF_USE_URL`（`example.com` のまま）を実URLに差し替える
- [ ] **Google Play Console** のストア掲載情報にも同じプライバシーポリシー URL を登録する
      （Play の User Data ポリシーは「アプリ内」と「ストア掲載」の両方を要求します）
- [ ] **App Store Connect** のアプリ情報にもプライバシーポリシー URL を登録する

ポリシー本文には少なくとも以下の利用実態を記載してください:

- 位置情報（精密）: BLE スキャンと Wi-Fi 接続のために OS が要求するもの。外部送信なし
- Bluetooth / Wi-Fi: GoPro カメラとの通信のみに使用
- 購入情報: アプリ内課金の購入状態を端末内 SQLite に保存。外部サーバーへの送信なし
- アカウント登録・トラッキング・広告: なし

## 2. クラッシュ監視（Sentry 等）の導入（強く推奨）

BLE アプリは端末・OS 依存の不具合が出やすいのに、現状リリース後の観測手段がありません。

- [ ] Sentry（または Firebase Crashlytics）のアカウントを作成する
- [ ] プロジェクトを作成し DSN を取得する
- [ ] DSN を開発担当（または AI エージェント）に渡して組み込みを依頼する
      （`@sentry/react-native` の導入、EAS ビルドでのソースマップアップロード設定まで含む）

## 3. eas.json の submit 設定（提出に必須）

`eas.json` の `submit.production` が空のままです。

- [ ] **iOS**: App Store Connect でアプリを作成し、`ascAppId`（数字のApp ID）と `appleTeamId` を設定する
- [ ] **Android**: Google Cloud でサービスアカウントを作成し、Play Console に招待、
      JSON キーのパスを `serviceAccountKeyPath` に設定する（リポジトリにはコミットしない。`.gitignore` 済みの `credentials.json` 等を利用）
- [ ] `eas submit --platform ios` / `eas submit --platform android` が通ることを確認する

Android の署名は `build-config/android/README.md` の既存手順を参照してください。

## 4. ストアの申告フォーム入力（必須）

### Google Play — Data Safety（データセーフティ）

- [ ] 位置情報（おおよそ/正確）: 「収集」扱いになるか確認の上申告
      （BLE スキャン要件のための取得で、端末外への送信はなし → 「収集していない」または「収集するが共有しない・端末内処理」で整理）
- [ ] 購入履歴: 端末内保存のみ・共有なし
- [ ] データの暗号化・削除リクエストの項目を実態に合わせて回答

### App Store Connect — App Privacy

- [ ] 「データを収集しない」(Data Not Collected) で申告できるか確認
      （外部送信がないため原則該当。Sentry を導入した場合はクラッシュデータ＝診断データの申告が必要になる点に注意）

### 権限の利用目的申告（Play Console）

- [ ] ACCESS_FINE_LOCATION の利用目的を「近接デバイス（BLE/Wi-Fi）検出のため」として申告する
- [ ] **Foreground Service（フォアグラウンド サービス）**の申告を行う（Android 14 / Target SDK 34以上で必須）
      - 対象権限: `FOREGROUND_SERVICE_CONNECTED_DEVICE`
      - 該当するタスクの選択: **「外部デバイスへの継続的なデータ転送」(Continuous data transfer to/from an external device)** を選択してください（※「その他」ではなくこちらが適切です）。
      - 利用目的の説明（例）:
        - 日本語: 「本アプリは外部のGoProカメラとBluetoothで通信し、コントロールやステータス同期を行うためのアプリです。ユーザーがアプリを閉じた状態でも、録画中のステータス（経過時間、バッテリー、SDカード残量）の受信および更新を継続し、予期せぬ接続切断が発生した際に即座にユーザーへ通知を行えるよう、フォアグラウンドサービスによるバックグラウンド処理と常時通知の表示が必須となります。」
        - 英語: "This app communicates with an external GoPro camera via Bluetooth for control and status synchronization. To continuously receive and update recording status (elapsed time, battery, SD card) and immediately notify the user of unexpected disconnections even when the app is closed, background processing and ongoing notification via a foreground service are required."
      - ユーザー体験を示す動画（デモ動画）へのリンクを用意してフォームに添付する（審査用に用意したデモ動画で可）



## 5. 審査用資料の準備（強く推奨）

審査員は GoPro 実機を持っていません。実機がないと主要機能を確認できないため、リジェクト防止に以下を用意します。

- [ ] 接続〜設定変更〜録画開始/停止までの**デモ動画**（YouTube 限定公開等の URL）
- [ ] レビューノート（App Store Connect の「App Review に関する情報」/ Play の「アプリのアクセス権」メモ）に記載:
  - 本アプリは GoPro カメラ（HERO 9〜13 / MAX）専用のリモコンであること
  - `bluetooth-central` バックグラウンドモードの用途（録画中の接続維持・状態監視）
  - 位置情報権限は OS の BLE スキャン要件であり、位置の記録・送信はしないこと
  - デモ動画の URL

## 6. GoPro 商標まわりの最終確認（リジェクトリスク低減）

アプリ内には商標免責（非提携の明記）を実装済みです。ストア掲載側で以下を確認してください。

- [ ] アプリ名・サブタイトルが「GoPro」で始まらないこと（「RS-R Remote for GoPro」のような *for* 形式は可）
- [ ] ストア説明文の冒頭または末尾に非提携の免責文を入れる
      （例: GoPro、HEROはGoPro, Inc.の商標または登録商標です。本アプリはGoPro, Inc.とは提携していません。）
- [ ] スクリーンショットに GoPro 公式アプリと誤認される表現がないこと
- [ ] Open GoPro API の利用規約（https://gopro.github.io/OpenGoPro/）に目を通し、商用利用条件を確認する

## 7. ストア掲載アセットの準備（必須）

- [ ] スクリーンショット（iPhone / iPad ※supportsTablet=true のため iPad も必要 / Android Phone）
- [ ] アプリ説明文（日本語・英語）
- [ ] Play のフィーチャーグラフィック（1024×500）
- [ ] （任意）専用スプラッシュ画像: 現在 splash は `./assets/splash.png` を使用。

## 8. 提出前の実機確認チェックリスト（推奨）

フェーズ0/1 の変更が実機で意図どおり動くことを確認してください。

- [ ] Bluetooth オフで起動 → ホームにバナーが表示され、「設定を開く」が動作する
- [ ] Bluetooth をオンに戻す → 自動スキャンが開始される
- [ ] 端末の言語を日本語にして初回起動 → 権限ダイアログ（Bluetooth/位置情報/ローカルネットワーク）が日本語で表示される（iOS）
- [ ] 設定 → このアプリについて → 各リンクが開く / オープンソースライセンス画面が表示される
- [ ] リリースビルド（`eas build --profile preview` 等）で BLE 操作時に logcat / Console にデバッグログが出ないこと
- [ ] 購入 → 復元の一連フロー（Sandbox / 内部テスト）が動作すること
- [ ] （Android）コンビニ払い等の保留決済をテスト購入し、決済完了まで機能がアンロックされないこと

## メンテナンス上の注意

- **依存パッケージを追加・更新したら** `npm run generate:licenses` を実行し、
  `src/constants/ossLicenses.json`（アプリ内ライセンス表記の元データ）を再生成してコミットしてください。
- アプリ内に新しいデータ送信（解析・クラッシュレポート等）を追加した場合は、
  プライバシーポリシーと各ストアの申告フォームの更新が必要です。

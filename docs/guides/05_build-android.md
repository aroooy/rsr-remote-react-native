# 本番リリースビルド (Android / Google Play 提出用)

[07_development-guide.md](07_development-guide.md) 共通編の続き。
Android ストア提出用ビルドの手順をここにまとめる。

ストア提出用の **AAB (Android App Bundle)** を作るには 2 通りあります。
どちらも最終成果物は `rsr-remote` keystore で署名された Play 提出可能な AAB です。

## 方法 A: ローカル Gradle 直接ビルド (推奨: 速い・ローカル完結)

前提: `build-config/android/keystore.properties` が配置済み、または app 固有の環境変数が設定済みであること (後述「初回セットアップ」参照)

```bash
# 1. 毎回 prebuild で android/ を再生成 (推奨フロー)
npx expo prebuild --platform android --clean

# 2. version / versionCode を上げる
#    ※ app.json の expo.version および android.versionCode を手動でインクリメント
#    ※ prebuild が app.json の値を android/ 側に反映します

# 3. ビルドを実行
cd android
./gradlew bundleRelease
# 出力: android/app/build/outputs/bundle/release/app-release.aab

# 4. Google Play Console（内部テストトラック等）へのアップロード
#    ※ 必ずプロジェクトのルートディレクトリに戻ってから実行します（android/ ディレクトリ内からは実行できません）
#    ※ この手順には build-config/android/play-service-account-key.json も必要です
cd ..
npx eas-cli submit --platform android --path ./android/app/build/outputs/bundle/release/app-release.aab
```

または prebuild を飛ばす (既存 android/ を使う) 場合:

```bash
cd android
./gradlew clean bundleRelease
```

動作確認だけなら APK も作れます:
```bash
./gradlew assembleRelease
# 出力: android/app/build/outputs/apk/release/app-release.apk
```

## 方法 B: EAS Local Build (versionCode 自動、credentials.json 方式)

```bash
mkdir -p build
npx eas-cli build --platform android --profile production --local --non-interactive \
  --output build/rsr-remote-$(date +%Y%m%d-%H%M%S).aab
# 出力: build/rsr-remote-<timestamp>.aab
```

- `eas.json` の `production` プロファイル: `autoIncrement: true`, `credentialsSource: local`
- `credentials.json` で keystore パスを指定済
- `autoIncrement` により versionCode を自動採番

## Google Play へのアップロード（EAS Submit）設定について

アップロードは `npx eas-cli submit` を使用して自動化されています。

ここで必要になる認証情報は 2 種類です。

- **keystore / release signing key**:
  AAB をビルドするときに使います。`bundleRelease` を成功させるために必要です。
- **Google Service Account JSON key**:
  Google Play Console へアップロードするときに使います。`eas submit` を成功させるために必要です。

つまり、AAB のローカルビルドが成功していても、`eas submit` を使うならサービスアカウント JSON は別途必要です。

- **サービスアカウントの設定**: 
  `eas.json` の `submit.production.android.serviceAccountKeyPath` に設定された Google Cloud サービスアカウントキー（`./build-config/android/play-service-account-key.json`、非コミット対象）を通じて認証とアップロードを行います。
- **ファイル配置**:
  デフォルトでは [rsr-remote-react-native/build-config/android/play-service-account-key.json](../../build-config/android/play-service-account-key.json) に配置します。別の場所に置く場合は [rsr-remote-react-native/eas.json](../../eas.json) の `submit.production.android.serviceAccountKeyPath` を変更してください。
- **ファイルが無い場合の挙動**:
  `eas submit` 実行時に `File ./build-config/android/play-service-account-key.json doesn't exist.` のようなエラーまたは対話プロンプトが出ます。
- **提出トラック**:
  デフォルトで「内部テスト」トラック（`internal`）にアップロードされます。

## 初回セットアップ

署名設定ファイルのテンプレートと詳細な手順は
[`build-config/android/README.md`](../../build-config/android/README.md)
にまとめてある。そちらを参照して以下を用意しておくこと:

- **方法 A 用**: `build-config/android/keystore.properties`
  (テンプレート: [`build-config/android/keystore.properties.example`](../../build-config/android/keystore.properties.example))
- **方法 A / CI 用**: 次の環境変数でも可
  - `RSR_REMOTE_RELEASE_STORE_FILE`
  - `RSR_REMOTE_RELEASE_STORE_PASSWORD`
  - `RSR_REMOTE_RELEASE_KEY_ALIAS`
  - `RSR_REMOTE_RELEASE_KEY_PASSWORD`
- **方法 B 用**: プロジェクトルートに `credentials.json`
  (テンプレート: [`build-config/android/credentials.json.example`](../../build-config/android/credentials.json.example)。
  EAS CLI がルート固定で読むため、この 1 ファイルだけはルート配置)
- **Google Play へアップロードする場合**: `build-config/android/play-service-account-key.json`
  - `eas submit` を使う場合に必要
  - Git 追跡対象外
  - 参照先は [rsr-remote-react-native/eas.json](../../eas.json) の `submit.production.android.serviceAccountKeyPath`

どちらも秘密情報を含むため gitignore されている。
`plugins/withReleaseSigning.js` が prebuild 時に
app 固有の環境変数を優先し、未設定時のみ `build-config/android/keystore.properties` を読み取って
`android/app/build.gradle` へ release signingConfig を自動注入する。確認:

```bash
cd android && ./gradlew :app:signingReport | grep -A 5 "Variant: release"
# → Store: .../rsr-remote.keystore が表示されれば OK
```

## 注意事項

- **keystore のバックアップは必須**。紛失するとストアの同一アプリ更新ができなくなる。
- **`eas submit` には `play-service-account-key.json` が別途必要**。これは keystore の代わりではなく、Google Play API にアップロードするための認証情報。
- **Foreground Service（FGS）申告の事前完了が必要**:
  Android 14 (SDK 34) 以降の仕様に伴い、アプリがフォアグラウンドサービス（`FOREGROUND_SERVICE_CONNECTED_DEVICE`）を使用しているため、Google Play Console の「アプリのコンテンツ」メニューからFGS宣言を完了させておかないと、`eas submit` 時にAPI側でアップロードが弾かれます。（詳細な申告手順は [11_store-submission-user-tasks.md](11_store-submission-user-tasks.md) 参照）
- `assembleRelease` で作る APK は **Play Store アップロード不可** (必ず AAB)。APK は社内配布や手動 install の確認用。
- versionCode は毎回 **上げる必要がある** (同じ数字は Play Console に再アップロードできない)。方法 B を使うと自動。


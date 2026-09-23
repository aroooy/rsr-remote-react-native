# Android Release Build 設定

iOS 側の [build-config/ios/](../ios/) と対になる、Android リリースビルド
(Google Play 提出用 AAB) の署名設定と submit 認証情報をまとめるディレクトリ。

秘密情報を含む実ファイル (`keystore.properties` / `credentials.json` /
`play-service-account-key.json`) は gitignore されており、コミット対象は
テンプレートと手順書のみ。

## ファイル一覧

| ファイル | 役割 | 実体の場所 | コミット対象 |
|---------|------|-----------|------------|
| `keystore.properties.example` | ローカル Gradle 署名用テンプレ | この場所 | ✅ |
| `keystore.properties` | ローカル Gradle 署名用の実ファイル | この場所 (gitignore) | ❌ |
| `credentials.json.example` | EAS Local Build 用テンプレ | この場所 | ✅ |
| `credentials.json` | EAS Local Build 用の実ファイル | **プロジェクトルート** (gitignore) | ❌ |
| `play-service-account-key.json` | EAS Submit / Google Play API 用の実ファイル | この場所 (gitignore) | ❌ |
| `README.md` (本ファイル) | 初回セットアップ手順 | この場所 | ✅ |

> **なぜ `credentials.json` だけプロジェクトルート配置なのか**
> EAS CLI は `credentials.json` を **プロジェクトルート固定**で読む仕様で、
> パス指定の公式オプションがない (v16 時点)。symlink で逃がす案も検討したが、
> EAS 公式ドキュメント・他プロジェクトの慣例と一致させた方が他の開発者が
> 混乱しないため、実ファイルはルートに置き、このディレクトリには
> テンプレートだけを集約している。

## 署名の全体像

両ビルド経路とも、最終的に `rsr-remote.keystore` (旧 Xamarin 版から
引き継いだ同じ keystore) で署名された AAB が出る。

```
方法 A: ローカル Gradle 直接ビルド
  build-config/android/keystore.properties
    └→ plugins/withReleaseSigning.js が prebuild 時に
       android/app/build.gradle へ release signingConfig を注入
    └→ ./gradlew bundleRelease で AAB 出力

方法 B: EAS Local Build (versionCode 自動採番)
  credentials.json (プロジェクトルート固定)
    └→ eas.json の production プロファイル (credentialsSource: local)
    └→ npx eas-cli build --platform android --profile production --local \
         --output build/rsr-remote-<timestamp>.aab
```

## 初回セットアップ

### 方法 A を使う場合 (推奨: 速い・ローカル完結)

1. テンプレートをコピーして実ファイルを作成:
   ```bash
   cp build-config/android/keystore.properties.example \
      build-config/android/keystore.properties
   ```
2. コピーした `keystore.properties` を編集し、自分の keystore パスと
   パスワードを記入する
   または次の環境変数を設定する:
   ```bash
   export RSR_REMOTE_RELEASE_STORE_FILE=/absolute/path/to/your.keystore
   export RSR_REMOTE_RELEASE_STORE_PASSWORD=your-keystore-password
   export RSR_REMOTE_RELEASE_KEY_ALIAS=your-key-alias
   export RSR_REMOTE_RELEASE_KEY_PASSWORD=your-key-password
   ```
   環境変数がある場合は `keystore.properties` より優先される
3. `npx expo prebuild --platform android --clean` で android/ を再生成
   (`plugins/withReleaseSigning.js` が build.gradle に署名設定を自動注入)
4. 確認:
   ```bash
   cd android && ./gradlew :app:signingReport | grep -A 5 "Variant: release"
   ```
   `Store: .../rsr-remote.keystore` が表示されれば OK。
   "Config: debug" のままなら `keystore.properties` が正しく配置されて
   いないか、plugin が読めるパスにないかのいずれか

> **なぜ android/ 配下ではなく build-config/android/ なのか**
> `npx expo prebuild --clean` は android/ を丸ごと作り直すため、
> android 配下に置くと消える。プロジェクト直下の設定ディレクトリに
> 配置して plugin 経由で参照させることで、prebuild を何度流しても
> 設定が消えない構成になっている。

### Google Play へ submit する場合

`npx eas-cli submit --platform android` を使う場合は、keystore とは別に
Google Service Account JSON key も必要。

- デフォルト配置先:
   [build-config/android/play-service-account-key.json](play-service-account-key.json)
- 参照元:
   [rsr-remote-react-native/eas.json](../../eas.json) の
   `submit.production.android.serviceAccountKeyPath`
- 役割:
   - keystore は AAB を署名する
   - service account JSON は Google Play API へ AAB をアップロードする
- ファイルが無い場合:
   `eas submit` 実行時にエラーまたは JSON パス入力の対話プロンプトが出る

### 方法 B を使う場合 (versionCode を自動採番したい時)

1. テンプレートをコピー (**コピー先はプロジェクトルート**、EAS CLI の制約):
   ```bash
   cp build-config/android/credentials.json.example credentials.json
   ```
2. `credentials.json` を編集し、自分の keystore パスとパスワードを記入
3. ビルド (成果物は `build/` 配下に集約):
   ```bash
   mkdir -p build
   npx eas-cli build --platform android --profile production --local --non-interactive \
     --output build/rsr-remote-$(date +%Y%m%d-%H%M%S).aab
   ```

## keystore のバックアップ

`rsr-remote.keystore` を紛失すると、Play Store の同一アプリの
更新ができなくなる (別アプリとして新規登録するしかなくなる)。

- 現在の保管場所: `/Users/hiroaki/.android/keystores/rsr-remote/rsr-remote.keystore`
- パスワード保管: (社内の安全な場所)
- **複数拠点にバックアップを取ること**

## 優先順位

- `RSR_REMOTE_RELEASE_*` 環境変数が設定されていれば、それを使用
- 環境変数が無ければ `build-config/android/keystore.properties` を使用
- どちらも無ければ release build は debug signing へフォールバック

## 環境変数命名

- `RSR_REMOTE_` プレフィックスにより、同じ端末や CI 上で複数アプリを
   ビルドしても環境変数名が衝突しにくい

## 関連ドキュメント

- 実際のビルドコマンドは
  [docs/technical/07a_build-android.md](../../docs/technical/07a_build-android.md)
  を参照
- iOS 側の対応物:
  [build-config/ios/ExportOptions.plist](../ios/ExportOptions.plist)
  (手順は [docs/technical/07b_build-ios.md](../../docs/technical/07b_build-ios.md))

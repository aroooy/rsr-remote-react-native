# 本番リリースビルド (iOS / App Store 提出用)

[07_development-guide.md](07_development-guide.md) 共通編の続き。
iOS ストア提出用ビルドの手順をここにまとめる。

iOS は Apple Developer Program ($99/year) への参加が必要。Bundle ID は旧 Xamarin 版と同じ
`jp.co.rsr.rsrremote` (※ Android の `jp.co.rs_r.rsrremote` とは綴りが異なる)。

署名まわりの秘密情報の扱いは [rsr-remote-react-native/build-config/ios/README.md](../../build-config/ios/README.md) にまとめています。[rsr-remote-react-native/build-config/ios/ExportOptions.plist](../../build-config/ios/ExportOptions.plist) 自体には秘密情報は含まれません。

## 方法 A: EAS Cloud ビルド (推奨)

Mac のローカル Xcode バージョンに依存しない。Apple の最新 Xcode 要件に自動追随。

```bash
# 初回のみ: Apple Developer アカウントで EAS に認証情報を登録
eas credentials
# ビルド (クラウドで .ipa 生成)
eas build --platform ios --profile production
# TestFlight / App Store へ提出
eas submit --platform ios --latest
```

- `eas.json` の production.ios は `resourceClass: m-medium` を指定済
- 課金: EAS Free プランは月 30 ビルドまで。追加は有償プラン

## 方法 B: ローカル Xcode で Archive → Organizer からアップロード

前提: macOS 13.5+ / Xcode 15.3+ (App Store 提出は 2024-04 以降この要件)。
現 Mac (Intel 2018 / macOS 15.7.5) でも **Xcode 26 が動くので提出可能**だが、
初回 Archive に 20〜40 分かかる (2 回目以降は差分で数分)。

**方針**: Archive (時間がかかる・完全 CLI 化可能) までは CLI で実行し、
最後の **Distribute (App Store Connect へアップロード)** だけ Xcode
Organizer の GUI で実行する。CLI スクリプトに閉じ込めたい作業と、
Apple 側の認証ダイアログが必要な作業を自然に分割できる。

### 事前準備 (初回のみ)

Apple Developer Program に加入した Apple ID で Xcode にサインインし、
以下を済ませておく。

1. **Apple Distribution 証明書を keychain に登録**
   - Xcode → **Settings** (⌘,) → **Accounts** タブ
   - Apple ID を選択 → 右下 **Manage Certificates...**
   - 左下 **+** → **Apple Distribution** → 閉じる
   - 実機デバッグ用の Apple Development 証明書とは別物なので、
     方法 C で動いていても Distribution は別途作成が必要
2. **App Store Connect にアプリ登録** (Bundle ID `jp.co.rsr.rsrremote`)
3. **App Store Provisioning Profile** は最初の Distribute 実行時に
   Xcode が自動取得する (手動作成は不要)
4. `app.json` の `expo.version` / `expo.ios.buildNumber` を上げる
   (前回アップロードより大きい値にしないと App Store Connect で弾かれる)

この過程で利用する `.p12` `.mobileprovision` `.p8` `credentials.json` などは Git 追跡対象外として扱い、このリポジトリにはコミットしない。

### 毎回の手順

#### ① CLI で Archive を作成

```bash
cd /path/to/rsr-remote-react-native

# 1. prebuild (app.json 変更がある場合のみ)
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..

# 2. Archive を作成 (.xcarchive 生成、20〜40 分)
#    DEVELOPMENT_TEAM を明示することで、prebuild --clean 後でも
#    Xcode GUI を開かずに Automatic signing が効く
xcodebuild \
  -workspace ios/RSRRemote.xcworkspace \
  -scheme RSRRemote \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath build/RSRRemote.xcarchive \
  DEVELOPMENT_TEAM=7M4D4YV3EN \
  CODE_SIGN_STYLE=Automatic \
  archive
```

#### ② Organizer で archive を開く

CLI 出力の `.xcarchive` は Xcode の既定 Archives フォルダ
(`~/Library/Developer/Xcode/Archives/`) の外にあるため、Organizer を
開いただけでは一覧に現れない。Finder から直接開く:

```bash
open build/RSRRemote.xcarchive
```

これで Xcode が起動し、Organizer に当該 archive が登録・選択された
状態で表示される。

#### ③ GUI で App Store Connect にアップロード

Organizer 上で:

1. 右側 **Distribute App** をクリック
2. **App Store Connect** (青いアイコン) を選択 → **Distribute**
3. **Automatically manage signing** を選択 → **Next**
   - 初回はここで Apple から Provisioning Profile が自動取得される
4. サマリ画面で **Upload** をクリック
5. アップロード完了後、10〜30 分で App Store Connect の
   **TestFlight** または **App Store** タブにビルドが現れる

> Xcode 16 以降、Organizer の配布方式選択 UI が変更され、"Upload / Export"
> の切替が **Custom** 配下に移動した。App Store Connect (青) を選ぶと
> 自動的に Upload になる。`.ipa` をローカル保存したい場合は **Custom**
> → **App Store Connect** → **Export** を選ぶ。

### 完全自動化 (将来的に必要になったら)

`.ipa` をまったく中間ファイルとして残さず、`xcodebuild -exportArchive`
で直接 App Store Connect へアップロードする構成も可能。その場合:

- [`build-config/ios/ExportOptions.plist`](../../build-config/ios/ExportOptions.plist)
  の `destination` を `upload` に変更
- App Store Connect API Key (`.p8`) を発行し、
  `authenticationKeyPath` / `authenticationKeyID` / `authenticationKeyIssuerID`
  を ExportOptions.plist に追加
- `xcodebuild -exportArchive -archivePath build/RSRRemote.xcarchive -exportOptionsPlist build-config/ios/ExportOptions.plist`
  でアップロードまで完走

現状は Distribute を GUI で行う運用なので、ExportOptions.plist は
この「将来の完全 CLI 化」用テンプレートとして残してある。

### トラブルシュート

- **"Signing for 'RSRRemote' requires a development team"**
  → `xcodebuild archive` に `DEVELOPMENT_TEAM=7M4D4YV3EN CODE_SIGN_STYLE=Automatic`
    を渡し忘れている。`prebuild --clean` 直後は project.pbxproj に Team が
    設定されていないため必須
- **Organizer を開いても "No Archives" と表示される**
  → CLI で出力した `build/RSRRemote.xcarchive` は Xcode 既定の
    Archives フォルダ外にあるため一覧に出ない。Finder から
    `open build/RSRRemote.xcarchive` で開けば Organizer に登録される
- **"Upload Symbols Failed" 警告 (React.framework / hermes.framework 等)**
  → RN のプリコンパイル済み xcframework には dSYM が含まれないため
    出る警告。審査・動作には影響なし、そのまま進めて OK
- **"The version number must be higher than..."**
  → `app.json` の `expo.version` / `buildNumber` を上げる
- **"Missing ITSAppUsesNonExemptEncryption"**
  → 既に `app.json` で `false` を設定済。もし警告が出たら Info.plist を確認
- **ローカル Archive が遅すぎる**
  → EAS Cloud (方法 A) に切り替える。Mac のスペックに依存しない

## 方法 C: USB 実機に直接 Release インストール (動作確認用)

TestFlight/App Store を経由せず、開発機 Mac から USB で iPhone に
本番相当 (Release 構成・Hermes bytecode・最適化あり) のバイナリを
直接送り込む方法。デバッグ用途ではないが、リリース前の実機動作確認に最適。

### 前提

- Apple Developer Program に加入した Apple ID で Xcode にログイン済
- Xcode の RSRRemote ターゲットで **Signing & Capabilities → Automatically manage signing** が有効、
  正しい Team が選択済 (初回のみ GUI で設定が必要)
- iPhone の **設定 → プライバシーとセキュリティ → デベロッパモード** を **オン** にして再起動
- iPhone を USB で Mac に接続、「このコンピュータを信頼」を許可

### 手順

```bash
# 1. 接続中の実機を確認 (iOS デバイスと UDID が表示される)
xcrun xctrace list devices 2>&1 | grep -v Simulator

# 2. Release 構成でビルド → 実機にインストール → 起動
#    "Hiro😄" の部分は xctrace list devices で表示された端末名
npx expo run:ios --device "Hiro😄" --configuration Release

# ※ 初回ビルドは 10〜20 分。2 回目以降は差分で数分
# ※ iPhone がロックされていると起動段階で失敗する。その場合は
#    ロック解除後に下記で起動だけ再実行:
xcrun devicectl device process launch \
  --device <UDID> jp.co.rsr.rsrremote
```

### トラブルシュート

- **"developer disk image could not be mounted"**
  → iPhone のデベロッパモードが無効。設定で有効化して再起動
- **"device is locked"**
  → iPhone のロックを解除してから `devicectl ... process launch` で起動
- **"Failed to register bundle identifier"**
  → Xcode の Team が App Store Connect の所属 Team と異なる。GUI で選び直す
- **"The maximum number of apps for free development profiles has been reached"**
  → Personal Team (無料枠) ではなく有料 Developer Program の Team を選択

## 初回セットアップ

1. **Apple Developer Program 加入** (年 $99)
2. **App Store Connect にアプリ登録** (Bundle ID `jp.co.rsr.rsrremote`)
   - 旧 Xamarin 版と同じ Bundle ID を使うなら、旧アプリを削除せずに新バイナリをアップロードすることで既存ユーザへの更新として配信可能
   - 完全新規にする場合は別 Bundle ID にして別アプリ扱い
3. **EAS 利用時**: `eas credentials` で iOS Distribution Certificate と Provisioning Profile を自動生成 (推奨) または手動指定

## 注意事項

- `buildNumber` (app.json `expo.ios.buildNumber`) は毎回 **上げる** (Xcode/EAS 自動インクリメントに任せる場合は `autoIncrement: true`)
- `version` (app.json `expo.version`) は App Store の "バージョン" 表示。公開ルールに従い更新
- iOS 14+ で GoPro Wi-Fi 接続時に Local Network ダイアログが出る → `NSLocalNetworkUsageDescription` を app.json で定義済
- Intel Mac 2018 でもローカル Archive 可能。ただし遅いので EAS Cloud が楽

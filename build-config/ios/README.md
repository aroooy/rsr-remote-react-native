# iOS Signing Secrets

このディレクトリ配下で Git 追跡しているのは [build-config/ios/ExportOptions.plist](../ios/ExportOptions.plist) だけです。
この plist には秘密情報は含まれず、`teamID` や export method のような公開可能な設定だけを保持します。

## Git へ含めないもの

- `.p12`: Apple Distribution 証明書のエクスポート
- `.mobileprovision`: Provisioning Profile
- `.p8`: App Store Connect API Key
- `credentials.json`: EAS credentials export など、秘密情報を含む JSON

これらは [rsr-remote-react-native/.gitignore](../../.gitignore) で除外されています。

## 現在の想定運用

- ローカル Xcode ビルド:
  - Xcode / Keychain に Apple Distribution 証明書を登録
  - Automatic signing で Provisioning Profile を取得
- EAS Build:
  - `eas credentials` で Expo 側に資格情報を登録
- App Store Connect API を使う自動化:
  - `.p8` を CI secret または安全なローカル保管で管理

## 補足

- [build-config/ios/ExportOptions.plist](../ios/ExportOptions.plist) はそのままコミットして問題ありません。
- 署名証明書やプロファイルの実体は、Keychain、Apple Developer Portal、EAS、または CI secret storage 側で管理します。
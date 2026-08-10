# GoPro アプリ 開発・技術ドキュメント

このディレクトリ (`docs/`) には、本プロジェクトに新しく参加した開発者がアプリの仕様や実装方針を理解するための技術ドキュメント（Technical Records）がまとめられています。

> **新規開発者の方へ**: まずは `01_architecture-overview.md` から順にお読みください。このアプリは GoPro の仕様上、非常に多くの複雑な機種分岐や BLE 仕様を吸収していますが、その大半は宣言的な「メタデータ」「機能フラグ」「facade/resolver」によってコードベースから隔離されています。

## architecture/ — 技術引き継ぎドキュメント

現在のソースコードアーキテクチャに基づく「正本」の技術ドキュメントです。

| 番号 | ファイル名 | 内容 |
|:---:|:---|:---|
| **01** | [system-overview.md](architecture/01_system-overview.md) | アーキテクチャ全体像、技術スタック、データフロー、ファイル構成 |
| **02** | [wifi-and-streaming.md](architecture/02_wifi-and-streaming.md) | Wi-Fi 接続と UDP ライブストリーミング |
| **03** | [ble-communication.md](architecture/03_ble-communication.md) | BLE通信仕様、パケットフォーマット、TLV解析、コマンド一覧 |
| **04** | [state-and-data-model.md](architecture/04_state-and-data-model.md) | Zustandストア、型定義、永続化 (expo-sqlite) |
| **05** | [camera-state-control.md](architecture/05_camera-state-control.md) | カメラ状態ベースの画面制御機構、3レーン制御モデル |
| **06** | [settings-metadata.md](architecture/06_settings-metadata.md) | 設定ID定数、メタデータ構造、Capability Policy、Firmware Overlay |
| **07** | [ui-rendering.md](architecture/07_ui-rendering.md) | UI構造、レンダリング分岐、自動スクロール、Pending フロー |

## guides/ — 実装・運用ガイド

| 番号 | ファイル名 | 内容 |
|:---:|:---|:---|
| **01** | [model-specific-logic.md](guides/01_model-specific-logic.md) | 機種別分岐の現在位置、facade/resolver の境界 |
| **02** | [model-implementation-guide.md](guides/02_model-implementation-guide.md) | 新機種追加時の BLE ID 調査手順、実装パターンのカタログ |
| **03** | [capability_policies.md](guides/03_capability_policies.md) | `settingFallbackPolicies.ts` の設計思想と宣言的ポリシー |
| **04** | [development-guide.md](guides/04_development-guide.md) | 開発環境、開発ビルド、デバッグ、旧アプリ参照 |
| **05** | [build-android.md](guides/05_build-android.md) | Android リリースビルド、署名、Play 提出 |
| **06** | [build-ios.md](guides/06_build-ios.md) | iOS リリースビルド、Distribution、USB 実機 Release |
| **07** | [troubleshooting.md](guides/07_troubleshooting.md) | 特有のクラッシュ事象や未解決の既知課題 |
| **08** | [in-app-purchase.md](guides/08_in-app-purchase.md) | IAP、商品ID、購入/復元フロー |
| **09** | [model-number-refactor-plan.md](guides/09_model-number-refactor-plan.md) | modelNo ベース機種判定への移行計画 |
| **10** | [capability-request-scope-checklist.md](guides/10_capability-request-scope-checklist.md) | Capability 要求対象の絞り込み、既知の漏れ方、将来の監査観点 |
| **11** | [store-submission-user-tasks.md](guides/11_store-submission-user-tasks.md) | ストア提出前にユーザー（開発者本人）が行う残作業チェックリスト |

---

*※ 旧 `technical/` 配下の文書は `architecture/` と `guides/` に再編されています。現在の Truth はこの README からリンクされている文書です。*

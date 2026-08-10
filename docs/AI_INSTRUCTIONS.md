# Agent & Copilot Instructions for GoPro Expo App

This file defines the standard operating procedures, commands, boundaries, and coding styles for AI Agents (including VSCode Copilot and autonomous agents) working on this project.

## Commands

*   `npx expo run:android --device`: Android実機でのデバッグビルドと起動。
*   `npx expo run:ios --device`: iOS実機でのデバッグビルドと起動。
*   `npx expo start -c`: キャッシュをクリアして Expo サーバーを起動。
*   `npx expo install --check`: Expo SDK や依存パッケージのバージョン不整合を確認・修正する（ビルドトラブル時の初手）。

---

## Boundaries & Rules

### Always Do (必ずやること)
*   **TypeScript Strict Mode**: 常に型安全を意識し、`any` 型の使用は禁止します。
*   **設定メタデータの遵守**: 新機種の対応や新しい設定項目（Setting ID）を追加する際は、必ず事前に `docs/guides/02_model-implementation-guide.md` および `docs/architecture/06_settings-metadata.md` を参照し、既存の実装パターンに準拠してください。
*   **機種固有実装の分離**: model-specific な実装を追加する際は、まず既存の facade を維持できないかを確認し、実体は `src/cameraModels/<model>/...` に寄せてください。
*   **コンパイルチェック**: model-specific な処理の抽出やリファクタリング後は、最低でも `npx tsc --noEmit` を実行し、型エラーがないか必ず確認してください。

### Ask First (実行前に許可を取ること)
*   **`GOPRO_SETTINGS_METADATA` のベース配列変更**: このファイル内のベース定義を変更すると全機種に影響を与えます。特定の機種向けの表示変更が必要な場合は、ユーザーに「`MODEL_VALUE_OVERRIDES` を使用すべきか」を必ず確認してください。
*   **新規パッケージの追加**: アプリのバンドルサイズや Expo との互換性があるため、新しい npm パッケージを追加する際は事前に提案し、承認を得てください。

### Never Do (絶対にやってはいけないこと)
*   **アドバタイズ名による機種判定**: `discover.name` (例: "GoPro 13") はユーザーがリネーム可能なため、ロジック内の機種判定には絶対に使用しないでください。接続後に取得するハードウェア情報の `modelNo` または `modelName` を使用してください。
*   **文字列での直接の機種判定**: `cameraModel === 'hero13'` のような文字列での直接の判定分岐をコンポーネント内に置くのは避けてください。`hardwareFeatureFlags.ts` からフラグを取得するか、`currentModelNo` をベースにした Resolver (`src/cameraModels/<model>/`) に処理を委譲してください。
*   **手続き的なフォールバックの実装**: UIコンポーネント（例: `SettingsPanel.tsx`）内に、設定値ごとの特殊なフォールバックロジックや `if-else` 分岐を直書きしないでください。複雑な判定は必ず `settingFallbackPolicies.ts` や `hardwareFeatureFlags.ts` などの定数・ポリシー層に寄せてください。
*   **Pending状態の強制解除**: 設定変更をカメラへ送信（BLE Write）した際、カメラからの完了応答通知（先頭バイト `0x92`）を待たずにUIのローディング（Pending）を強制的に解除しないでください。
*   **共通 facade への機種固有実装の直書き**: `SettingsPanel.tsx`、`GoProSettingIds.ts` などの共通入口に、新しい機種固有の `if (modelNo === ...)` を安易に積み増さないでください。まず Resolver への分離を検討してください。
*   **shared 層への model 固有ロジック混入**: `src/cameraModels/shared/*.ts` には dispatcher・型・共有 fallback だけを置き、特定モデルだけの値や分岐を埋め込まないでください。

---

## アーキテクチャ・設計思想

*   **Capability-Driven 設計**:
    GoProカメラから通知される「利用可能な設定値のリスト（Capability）」をシステムの正とします。設定値やUIの構築を行う際は、固定配列を信じるのではなく、必ず `settingFallbackPolicies.ts` の Capability Policy に従い、カメラの実態に合わせてフォールバックやオーバーライドを適用してください。
*   **Stable Facade + Resolver 設計**:
    `SettingsPanel.tsx` や `GoProSettingIds.ts` のような巨大なエントリポイントは、できるだけ安定した facade として維持してください。UI に表示する項目の決定は `getDisplayLayout` 等の Resolver を経由して各モデル専用のロジックに委譲します。
*   **状態管理 (Zustand)**:
    `src/store/GoProStore.ts` を唯一の Source of Truth とします。コンポーネント内で個別にカメラの状態を保持せず、Zustand から Reactively に取得してください。識別子としては `cameraModel` (文字列) より `currentModelNo` (数値) を優先して使用します。

---

## 技術スタック・使用ライブラリ

*   **フレームワーク**: Expo (React Native)
*   **状態管理**: Zustand（Redux や Context API の過度な使用は避けること）
*   **BLE 通信**: `react-native-ble-plx`
*   **動画再生**: `react-native-vlc-media-player`
*   **課金処理**: `react-native-iap` (v15 APIに準拠すること)
*   **永続化**: `expo-sqlite`

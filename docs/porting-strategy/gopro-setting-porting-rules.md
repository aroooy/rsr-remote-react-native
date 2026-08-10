# GoPro 設定移植ルール

## 今回の不具合の結論
- 今回のミスは JavaScript / TypeScript の数値型ミスではなく、**ID の取り違え**。
- 特に次の 3 種類を混同しないこと。
  - **Setting ID**: GoPro BLE に送る設定ID。例: `Video Profile = 184`
  - **UI Element ID**: 旧 Xamarin 側の画面部品ID。例: `V_VideoProfile = 1006`
  - **Value ID**: 各設定の選択値。例: `Standard=0`, `HDR=1`, `Log=2`, `HLG=101`
- `161` は旧定数上で意味が曖昧だったが、実際の送信コードでは `0xB8 (= 184)` が使われていたため、**根拠の薄い定数名より送信バイト列を優先**する。

## 移植時の判定ルール
1. **最優先の真実は送信パケット**
   - 旧 ViewModel / Observer で `SendSetSettings(...)` に渡しているバイト列を確認する。
   - 例: `new byte[] { 0x03, 0xB8, 0x01, value }` → Setting ID は `184`

2. **Query / Response でも相互確認する**
   - Capability Query (`0x32`) や Setting Query (`0x12`) の対象IDに同じ番号が出るか確認する。
   - 「書けるID」と「読めるID」が一致して初めて React 側に採用する。

3. **UI Element ID を Setting ID として使わない**
   - `SettingElements.*` は UI 用の識別子。
   - BLE に送る番号として使ってはいけない。

4. **コメントアウトされた暫定定数を信用しすぎない**
   - `INTERNAL_161` のような曖昧な名前は、送信・受信コードで裏取りできるまで採用しない。

5. **Value ID はモデル差分込みで確認する**
   - HERO12/HERO13 で値集合が違う場合がある。
   - 例: `Video Profile` は HERO13 で `101 = HLG` が追加される。

6. **React 側に入れる前に根拠を 3 点セットで揃える**
   - Setting ID の根拠: 送信コード
   - Value 名称の根拠: `ValueNameSettings.cs`
   - 表示位置の根拠: `UIElementSettings.cs`

## 実装ルール
- マジックナンバーを直接書かず、`src/constants/GoProSettingIds.ts` の定数を使う。
- 新しい設定を追加するときは、まず定数を追加してから metadata / UI / refresh trigger に展開する。
- 1つの設定を追加するときは、最低でも次を同時に確認する。
  - metadata の設定ID
  - 値名マッピング
  - capability refresh 対象かどうか
  - モデル差分の有無

## 追加時チェックリスト
- [ ] 旧実装の `SendSetSettings` で Setting ID を確認した
- [ ] `ValueNameSettings.cs` で値名を確認した
- [ ] `UIElementSettings.cs` で UI 上の出現位置を確認した
- [ ] React 側で Setting ID を定数化した
- [ ] `GoProMetadata.ts` に値名を追加した
- [ ] capability refresh 対象なら trigger に追加した
- [ ] 実機でドロップダウンとカメラ値の同期を確認した

## Hero12 実装時に発覚した追加の教訓

### カメラモデル判定: BLEアドバタイズ名は使えない
- **問題**: 初期実装では BLE アドバタイズ名 (`discover.name`) から機種を判定していた。
  しかしアドバタイズ名はユーザーが自由に変更可能で、"GoPro 13" のような省略形になる場合がある。
  `"GoPro 13".includes("HERO13")` は `false` → 判定失敗。
- **解決**: `fetchHardwareInfo()` で取得する `modelName`（例: "HERO13 Black"）のみを使用する。
  これはファームウェアが返す値でユーザーは変更不可。
- **ルール**: 機種固有ロジックの分岐には必ず `hardwareInfo.modelName` を使用し、
  BLE アドバタイズ名は接続対象の識別のみに使用する。

### 値ラベルのモデル差分: HERO12_VALUE_OVERRIDES パターン
- **問題**: 同じ Setting ID・同じ値番号でも、モデルによって意味が異なることがある。
  例: Resolution (ID 2) の値 `101` は Hero13 では "5.3K" だが Hero12 では別の解像度。
- **解決**: `GoProMetadata.ts` に `HERO12_VALUE_OVERRIDES` テーブルを設けた。
  基本定義は Hero13 ベースで、Hero12 で異なる値のみオーバーライドする。
- **今後のモデル追加時**: `HERO11_VALUE_OVERRIDES` のような同パターンで対応可。

### 意図的除外 Setting の再確認
- Hero12 にのみ存在する `MAX_LENS_MOD_ENABLE (190)` は、Hero13 では `MAX_LENS_MOD (189)` に統合。
  現在は "意図的に除外" としているが、Hero12 対応時に `190` の追加が必要になる可能性がある。
  → capabilities query で 190 が返ってくるかどうかで実機確認要。

## Video Profile の今回の正解
- Setting ID: `184`
- UI Element ID: `1006`
- Value IDs:
  - `0 = Standard`
  - `1 = HDR`
  - `2 = Log`
  - `101 = HLG` (HERO13 系)

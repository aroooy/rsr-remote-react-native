# Camera State Control — 技術リファレンス

**対象**: カメラ状態 (SystemBusy / Encoding / User-on-Camera / Ready) に基づく画面制御機構
**関連計画書**: [docs/implementation-plans/camera-state-control-plan.md](../implementation-plans/camera-state-control-plan.md)

他機種 (Hero9/10/11/11Mini/12) 対応時にも再利用する、制御モデル・API・機種差分の知識を集約する。

---

## 1. Open GoPro 仕様サマリ

### Status ID (BLE / HTTP 共通)

| ID | 名称 | 型 | 意味 | 対応機種 |
|---|---|---|---|---|
| 6 | Overheating | bool | 過熱警告 | 全機種 |
| 8 | Busy | bool | カメラ内部処理中 (プリセット切替/SD書込等) | 全機種 |
| 10 | Encoding | bool | 録画中 | 全機種 |
| 13 | Video Encoding Duration | u32 | 録画経過秒数 | 全機種 |
| 33 | Primary Storage | i32 | -1 Unknown / 0 OK / 1 Full / 2 Removed / 3 Format Error / 4 Busy / 8 Swapped | 全機種 |
| 34 | Remaining Photos | u32 | 残撮影枚数 | Hero9〜13 |
| 35 | Remaining Video Time | u32 | 残録画秒数 | 全機種 |
| 54 | SD Card Remaining | u64 | SD残量 (KB) | 全機種 |
| 60 | Minimum Status Poll Period | u32 | ポーリング最小間隔 (ms) | 全機種 |
| 70 | Internal Battery Percentage | u8 | 電池% | 全機種 |
| 82 | Ready | bool | カメラ起動完了 | 全機種 |
| 85 | Cold | bool | 低温警告 | 全機種 |
| 111 | SD Card Write Speed Error | bool | SD速度不足 | Hero10〜 |
| 114 | Camera Control ID | u8 | 0=Idle / 1=Camera (本体操作中) / 2=External (アプリ保有) / 3=COF Setup | Hero10〜 |
| 117 | SD Card Capacity | u32 | SD総容量 (KB) | Hero11 Mini〜 |

### Setting ID (撮影制御に影響)

| ID | 名称 | 備考 |
|---|---|---|
| 167 | Hindsight | Hero10〜。値 !== 4 (Off) なら常時 Encoding 同等扱い |

### 公式ルール (General Usage / Limitations)

1. SystemBusy=1 または Encoding=1 中は、status query 以外を送信すべきでない
2. Encoding=1 中は設定変更リクエストを**必ず拒否** (Hindsight Active も同様)
3. Camera Control Status が Camera (=1) でも GoPro は BLE を受け付ける場合がある。現実装では UI インジケーター表示に留め、アプリ側の強制ブロックは行わない
4. Keep-Alive は 3秒 (Open GoPro 推奨、本アプリは 15秒で運用中)

## 2. 現行の制御モデル

```
┌─────────────────────────────────────────────┐
│ レーンB: Shooting Locked                    │
│ Status 10=1 または Hindsight Active         │
│ 撮影設定 / preset は reject、system は許可    │
└──────────────────────┬──────────────────────┘
                                  │ else
┌──────────────────────▼──────────────────────┐
│ レーンA: Short-term Busy                    │
│ Status 8=1 または Status 82=0              │
│ queue で待機、obsolete command は skip      │
└─────────────────────────────────────────────┘

User-on-Camera (Status 114=1) は独立レーンではなく、
StatusBar に「On Camera」表示を出すための観測値として扱う。
```

### 意思決定ルール

```ts
function resolveCommandGate(state: GoProState, category: CommandCategory): 'allow' | 'reject' | 'queue' {
  if (isShootingLocked(state) && category !== 'systemSetting'
      && category !== 'shutter' && category !== 'control') return 'reject';          // レーンB
  if (!state.isReady || state.systemBusy) return 'queue';                            // レーンA
  return 'allow';
}
```

## 3. 設定のカテゴリ分類

### SYSTEM_SETTINGS (撮影中も変更可)

| ID | 名称 | 追加判断 |
|---|---|---|
| 59 | Auto Power Down | Hero9〜13 全対応 |
| 88 | LCD Brightness | 全機種 |
| 91 | LED | 全機種 |
| 216 | Beep Volume | Hero13+ (Hero12以前は不存在) |
| 219 | Setup Screen Saver | Hero13+ |
| 223 | Setup Language | Hero13+ |
| 237 | Auto Power On USB | LIT HERO のみ |

**注**: 機種差分あるが「存在しない設定は単に画面に出ない」ので、集合に含めておいて支障なし。

### 撮影設定 (撮影中ロック)

上記以外のすべて + プリセットロード + プリセットグループ切替。

### 動的ロック学習 (dynamicShootingLockedIds)

403応答を受けた ID は接続セッション中メモリに保持。次回以降は事前 reject。
永続化しない理由: カメラファームウェア更新で挙動変化する可能性があるため。

## 4. CommandQueue アーキテクチャ

### 配置
- [src/ble/CommandQueue.ts](../../src/ble/CommandQueue.ts) として独立モジュール
- `GoProBLEManager` インスタンス内で単一 queue を保持

### 直列実行
Promise chain (`this.tail = this.tail.then(...)`) で実装。並列BLE書込は GATT 層の競合リスクがあるため避ける。

### Categoryごとの挙動

| Category | User on Camera | Shooting Locked | Short-term Busy | 通常 |
|---|---|---|---|---|
| `setting` | indicator only | reject | queue/wait | exec |
| `systemSetting` | indicator only | exec | bypass wait | exec |
| `preset` | indicator only | reject | queue/wait | exec |
| `shutter` | indicator only | exec | bypass wait | exec |
| `control` | indicator only | exec | rejectImmediately / best effort | exec |
| `emergency` | indicator only | bypass | bypass | bypass |

### エラーハンドリング

- `BusyRejectedError(reason)` を throw → 呼び出し元で catch → Toast 発火 + 楽観更新 rollback
- 403応答はBLE Responseコードで判定。Header 0xn, Status=3 (Invalid) など
- `shouldSkip()` を持つコマンドは、queue 待機前・待機中・待機後の 3 箇所で obsolete 判定を行い破棄する

### preset 遷移ガード

- `loadPreset()` と `loadPresetGroup()` は `latestPresetLoadRequestId` を共有し、古い要求を skip する
- 外部から連続的に preset/group 切替が来ても、最後の要求だけが queue を通過する設計

## 5. Camera Control Status (claim/release)

### 目的
アプリが書込操作する際、カメラに「外部コントロールが入ります」と宣言することでカメラ本体UIを変更し、本体ボタンが押されたら自動で `camera` 状態に遷移させる仕組み。

### BLE Opcode (実装時確定)
Open GoPro HTTP API には `/gopro/camera/control/set_ui_controller?p=0|1|2|3` があるが、BLE Command Request 側の opcode は公式ドキュメント BLE Command Table を確認する。判明するまでは**接続済み Wi-Fi がある場合は HTTP 経由**で実装する暫定方針。

### パラメータ
| p | 意味 |
|---|---|
| 0 | CAMERA_IDLE |
| 1 | CAMERA_CONTROL (カメラ側のみ設定可) |
| 2 | CAMERA_EXTERNAL_CONTROL ← アプリが発行 |
| 3 | CAMERA_COF_SETUP |

### ライフサイクル
```
Control画面focus ──claim(2)──> [external control mode] ──操作発生──> claim成功:114=2
                                                      └──本体操作発生──> 114=1 (camera)

本体操作中でも BLE 書込はアプリ側で強制停止しない。UI は StatusBar に
`On Camera` を表示し、必要なら上位コンポーネント側で入力抑止を行う。

Control画面blur ──release(0)──> 114=0
```

## 6. UI パターン

### StatusBar (常時表示)
```
[📶BLE] [🔋72%] [💾80%残] [⚠️] [On Camera] [Busy/Syncing] [● REC or ● HS]
```
- `●` は 8pxドット (赤=Encoding, オレンジ=Hindsight Active)
- 経過時間は表示せず、シャッターボタン側に任せる (重複回避)
- `Busy` は `selectIsShortTermBusy`
- `Syncing` は `pendingSettings` が 1 件以上あるときに表示

### 撮影中の設定行

- 撮影設定は `BusyRejectedError('encoding')` で拒否し、toast を出す
- system settings は撮影中でも送信を許可する
- preset/group 切替は `pendingSettings` ベースで UI へ即反映し、確定はカメラ通知で行う

## 7. 機種差分一覧 (新機種追加時のチェック)

### Status 対応表

| Status | Hero9 | Hero10 | Hero11/Mini | Hero12 | Hero13 | MAX2 |
|---|---|---|---|---|---|---|
| 6 Overheating | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8 Busy | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 Encoding | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 13 Video Duration | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 33 Primary Storage | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 82 Ready | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 85 Cold | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 111 SD Write Error | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 114 Camera Control | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 117 SD Capacity | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

**Hero9 の注意**: Status 114 非対応。`cameraControlStatus` は常に `idle` のまま → レーンCは実質発動しない。Hero9ではアプリ側で譲るロジックは効かず、本体操作と同時実行されうるが、GoPro API 仕様として元々非対応なので受容する。

### Setting 167 Hindsight
- Hero9 非対応 → `settings[167]` が undefined
- `selectHindsightActive` は undefined を false と判定するので自動でスキップ

### SYSTEM_SETTINGS 機種差分
- 216/219/223 は Hero13+ のみ。Hero12 以前では設定画面自体に現れないので集合含有のままで支障なし
- 237 は LIT HERO のみ
- Hero9 時代の古い設定が SYSTEM 扱いになるべきものがあれば、機種分岐で追加する

## 8. 実装ファイル配置

### 新規
- `src/ble/CommandQueue.ts` — キューコア
- `src/store/GoProSelectors.ts` — 派生セレクタ関数群
- `src/constants/SystemSettings.ts` — SYSTEM_SETTINGS 集合
- `src/components/CameraStatusBar.tsx` — ヘッダステータスバー
- `src/components/Toast.tsx` — 軽量通知

### 変更
- `src/store/GoProStore.ts` — state 拡張
- `src/ble/PacketParser.ts` — status ID パース拡充
- `src/ble/GoProBLEManager.ts` — register async updates 拡充、enqueue 経由化、claim/release
- `src/components/SettingsPanel.tsx` — カテゴリ別ロック
- `App.js` — focusEffect で claim/release

## 9. 新機種追加手順 (チェックリスト)

1. **対応機種判定**: `hardwareInfo.modelName` や `hardwareInfo.modelNo` を `GoProModelNumbers.ts` 等のモデル定数判定に追加
2. **Status 対応確認**: 7章の表で対応Statusを確認
   - 114非対応なら `cameraControlStatus` 常時 idle で問題なし
   - 111/117 非対応なら `sdWriteSpeedError` / `sdCapacityKB` が 0 のまま → UI は 0 を表示しないガード
3. **Setting 167 対応確認**: 非対応なら自動で `hindsightActive = false`、何もしなくて可
4. **SYSTEM_SETTINGS**: 機種独自のシステム設定があれば `src/constants/SystemSettings.ts` に追加
5. **claim/release 動作確認**: Hero9 等 114 非対応機種では no-op になるだけ。エラーハンドリング済み
6. **検証**: 12章の検証マトリクスを機種別に実行

## 10. トラブルシューティング

### 問題: 設定変更が無反応になる
- CommandQueue が詰まっている可能性 → ログで `CommandQueue.pending.length` を確認
- Shooting Locked 判定や pendingSettings が想定外に残っていないか store の `isEncoding` / `pendingSettings` / `systemBusy` を確認

### 問題: 本体操作後に復帰しない
- Status 114 の通知が来ていない可能性 → `registerForAsyncUpdates` に 114 が含まれているか
- `idle` 復帰後の自動claim が失敗 → BLE opcode が機種で異なる可能性

### 問題: Hindsight 有効でもロックされない
- Setting 167 が fetch されていない可能性 → 接続時 bootstrap で settings を取り込んでいるか確認

## 11. 参考リンク

- [Open GoPro HTTP API](https://gopro.github.io/OpenGoPro/http)
- [Open GoPro BLE Statuses](https://gopro.github.io/OpenGoPro/ble/features/statuses.html)
- [Open GoPro BLE Protocol](https://gopro.github.io/OpenGoPro/ble/protocol.html)
- [Camera Control State Diagram](https://gopro.github.io/OpenGoPro/assets/images/global_behaviors.png)

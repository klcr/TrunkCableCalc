# プロジェクトマイルストーン

## Milestone 1: 低圧幹線ケーブル計算ツール

GitHub Pages で公開する単一 HTML ファイルの Web アプリケーション。
詳細仕様: [`docs/spec-cable-calc.md`](./spec-cable-calc.md)

### Phase 一覧

| Phase | 内容 | 主な成果物 | 仕様書参照 | 状態 |
|-------|------|-----------|-----------|------|
| P1 | 参照データ整備 + ビルド基盤 | `data/` JSON, `scripts/build.js`, `src/index.html` テンプレート | §10 | 完了 |
| P2 | 計算エンジン（子回路） | `runCalc` 実装（設計電流→ケーブル選定→MCCB→保護協調） | §8 | 完了 |
| P3 | UI: 入力フォーム＋結果表示 | 左右ペインレイアウト、連動制御、スライダーUI | §2,3,5,6,7,11 | 完了 |
| P4 | マルチノード配電系統＋登録管理 | 4階層ツリー、変圧器/%Z、CRUD、地絡電流 | §4,9,12,13,18,19,20 | 完了 |
| P5 | Import/Export＋PDF出力 | JSON保存/読込、電-8-1 形式計算書出力 | §14,15 | 未着手 |
| P6 | 検証・デプロイ | 手計算との突合、エッジケース対応、GitHub Pages 公開 | §16 | 未着手 |

### P1: 参照データ整備 + ビルド基盤

- [x] ディレクトリ構成の確定（`data/`, `src/`, `scripts/`, `docs/`）
- [x] 仕様書・マイルストーン文書の作成
- [x] 値確定データの JSON 化（MCCB定格、温度補正、低減率プリセット）
- [x] スキーマ定義（インピーダンス、許容電流）
- [x] ビルドスクリプト `scripts/build.js` の作成
- [x] GitHub Actions デプロイにビルドステップ追加
- [x] インピーダンス実データの転記（技資第103号A）
- [x] 許容電流実データの転記（JCS 0168）
- [x] `src/index.html` テンプレート作成（データプレースホルダー付き）
- [x] ビルド実行確認（`node scripts/build.js` → `index.html` 生成）

### P2: 計算エンジン（子回路）

- [x] 設計電流の算出（kW/kVA/A → A 変換、需要率適用）
- [x] 電動機回路の電流補正（≦50A: ×1.25、>50A: ×1.1）
- [x] ケーブルサイズ自動選定（許容電流→電圧降下→保護協調の3条件走査）
- [x] MCCB定格の自動選定
- [x] 電圧降下計算（精密式: R·cosθ + X·sinθ）
- [x] 許容電圧降下の判定（こう長×供給方式テーブル）
- [x] 保護協調チェック（一般: eA≧AT、電動機: eA≧AT/2.5）

### P3: UI: 入力フォーム＋結果表示

- [x] 左右2ペインレイアウト（左460px固定、独立スクロール）
- [x] 子回路入力フォーム（回路情報・負荷条件・ケーブル条件）
- [x] 連動制御（電気方式↔電圧、回路種別↔効率、配線方式↔温度補正）
- [x] 入力確定タイミング制御（onChange / onBlur の2層管理）
- [x] スライダーポップアップUI
- [x] 選定結果パネル（合否バッジ、詳細表示）
- [x] ヘッダー（ツール名称、操作ボタン群）

### P4: マルチノード配電系統＋登録管理

単一の親子関係から、変圧器→主幹→副幹→負荷回路の **4階層ツリー** へ拡張。
任意の trunk ノード末端を別ツリーの主幹として再帰的に接続可能な設計思想。
変圧器の %Z によるソースインピーダンス計算、および LV 側地絡電流計算を含む。
HV 側（対地静電容量基準）は M2-3 との統合を見据えたデータモデル準備のみ。

#### P4-1: データモデル・ツリー状態管理

- [x] ノードスキーマ定義（transformer / trunk / load の 3 タイプ）
- [x] App ステートにノード配列 `nodes` 導入
- [x] ノード CRUD 関数（genId, addNode, updateNode, removeNode）
- [x] ツリー走査ユーティリティ（getChildren, getParent, getAncestors, getDepth, buildTree）
- [x] 4 階層 depth 制約の実装
- [x] 仕様書更新（§18 配電系統ツリーモデル）

#### P4-2: 負荷回路 CRUD

- [x] 登録ボタンの有効化・バリデーション（幹線名必須、容量>0、結果存在）
- [x] 子回路の登録（nodes に load ノード追加）
- [x] 幹線名による trunk ノード自動作成（同一名 2 件以上で自動生成）
- [x] 子回路の編集（行クリック → フォーム復元 → 「更新」ボタン）
- [x] 子回路の削除（× ボタン、trunk 連動削除）

#### P4-3: ツリー表示・ナビゲーション

- [x] TreeTable コンポーネント（右ペイン下部）
- [x] ノードタイプ別表示（[TR] / [主幹] / └ インデント）
- [x] テーブルカラム（種別、名称、方式/電圧、設計電流、ケーブル、AT、電圧降下、判定、操作）
- [x] 行クリック → ノード選択 → 左ペイン切替（load / trunk / transformer の 3 モード）
- [x] + ボタンで子ノード追加

#### P4-4: 多階層幹線計算（再帰）

- [x] aggregateCurrents: 再帰的ボトムアップ電流集計（trunk の子に trunk を含む場合対応）
- [x] runParentCalc 拡張（or runTrunkCalc 新設）
- [x] calcCumulativeVd: トップダウン累積電圧降下
- [x] calculateAll: 全ノード一括計算（トポロジカルソート → useMemo）
- [x] 電動機判定の再帰的伝播（子孫に 1 つでも電動機があれば hasMotor）

#### P4-5: 変圧器ノード

- [x] data/transformer-ratings.json の拡張（河村カタログ %Z+X/R比、単相油入、モールド追加）
- [x] scripts/build.js に transformer-ratings.json → TR_RATINGS 注入追加
- [x] 仕様書更新（§19 変圧器ノード: 種別追加、%Z/X/R比テーブル差替え、R+jX分解式追加）
- [x] CLAUDE.md 更新（TR_RATINGS 記載更新、IMP_HV/Z_ZERO/WITHSTAND/ELCB 追記）
- [x] calcTransformer 関数: %Z+X/R比 → Rs+jXs ソースインピーダンス分解、定格電流、短絡電流、利用率
- [x] 変圧器編集フォーム（名称、種別、容量、一次/二次電圧、%Z、X/R比、結線方式）
- [x] 電圧継承: secondaryVoltage → 下位ノードの voltage 自動設定

#### P4-6: 短絡電流計算（LV 側 — R+jX ベクトル累積）

- [x] data/short-time-withstand.json 新規作成（K定数テーブル、I²t値）
- [x] scripts/build.js に short-time-withstand.json → WITHSTAND 注入追加
- [x] 仕様書更新（§20 R+jXベクトル累積方式に変更、§20-6 短時間耐電流検証 追加）
- [x] calcFaultCurrents: 変圧器 Rs+jXs を起点に R,X を独立累積、各ノード |Ztotal|→Isc₃ 算出
- [x] checkWithstand: ケーブル I²t 耐量 vs Isc₃²×t 検証
- [x] ResultPanel に利用可能短絡電流 Isc₃ + 熱耐量 OK/NG 表示追加
- [x] TreeTable に Isc₃ 列追加（オプション）

#### P4-7: HV 側データモデル準備

- [x] data/impedance-hv.json 新規作成（6600V CV-3C/CVT インピーダンス）
- [x] data/zero-sequence.json 新規作成（零相比、結線別乗数、地絡計算式）
- [x] data/elcb-specs.json 新規作成（ELCB感度電流・動作時間）
- [x] scripts/build.js に IMP_HV/Z_ZERO/C_CABLE/ELCB 注入追加
- [x] 仕様書更新（§19-5 HVケーブルインピーダンスフィールド追加、§20-7/20-8 将来実装節追加）
- [x] transformer ノードスキーマに hvSystem 予約フィールド追加（cableType, cableSize, totalCableLength_km, capacitance_uF_per_km）
- [x] HV ケーブルインピーダンスの LV 側換算（calcFaultCurrents 内でオプション使用）
- [x] Ig = 3ωCV 計算スタブ（コメントのみ）
- [x] M2-3 統合ポイントの明記

### P5: Import/Export＋PDF出力

- [ ] Export: 全データ＋親幹線設定を JSON ダウンロード
- [ ] Import: JSON ファイル読込、既存データに追記、旧形式互換
- [ ] PDF出力: 電-8-1 様式の電路計算書（A3横、HTML→印刷）
- [ ] 親幹線行の太字・背景色区別
- [ ] フッター注記（計算式、K値、判定基準）

### P6: 検証・デプロイ

- [ ] 手計算との突合テスト（代表的な負荷パターン）
- [ ] エッジケース確認（最大/最小サイズ、全NG、単一回路等）
- [ ] 各ブラウザでの動作確認（Chrome / Edge / Firefox / Safari）
- [ ] オフライン動作確認
- [ ] GitHub Pages デプロイ・公開確認

---

## Milestone 2: 幹線系統図の自動生成

低圧幹線ケーブル計算ツールをベースに、高圧〜低圧を通貫した幹線系統図を自動生成する。

| MS | 内容 | 概要 |
|----|------|------|
| M2-1 | 複数幹線系統の統合管理 | 個別に計算した幹線回路を高圧受変電設備から末端分電盤まで一つの系統としてまとめる |
| M2-2 | 高圧系統のモデリング | 受電点から変圧器二次側までの高圧系統をデータモデル化する |
| M2-3 | 一線地絡電流の計算 | 高圧系統の対地静電容量から一線地絡電流を算出し、系統図上に反映する |
| M2-4 | 系統図描画エンジン | 単線結線図の自動レイアウトと描画エンジンを実装する |
| M2-5 | 系統図出力 | 高圧〜低圧を通貫した幹線系統図を計算結果付きで出力し、設計図書として提出できる品質を目指す |

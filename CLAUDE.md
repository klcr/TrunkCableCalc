# 低圧幹線ケーブル計算ツール — 開発ガイドライン

## プロジェクト概要

低圧幹線のケーブルサイズ選定を自動化する Web アプリケーション。許容電流・電圧降下・保護協調の 3 条件を同時に満たす最小ケーブルサイズと MCCB 定格を即座に決定する。

- **単一 HTML ファイル出力**: ビルドにより `index.html` を生成。ブラウザで開くだけで動作する
- **クライアントサイド完結**: サーバー処理なし。オフラインで動作する
- **GitHub Pages で公開**: GitHub Actions により main ブランチへの push でビルド→自動デプロイ

## アーキテクチャ

### プロジェクト構成

```
TrunkCableCalc/
├── src/
│   └── index.html                    # ソーステンプレート（/* __DATA__ */ マーカー含む）
├── data/
│   ├── impedance-cv.json             # CV インピーダンス [Ω/km]
│   ├── impedance-cvt.json            # CVT インピーダンス [Ω/km]
│   ├── ampacity-rack.json            # 許容電流: ケーブルラック [A]
│   ├── ampacity-conduit.json         # 許容電流: 配管 [A]
│   ├── ampacity-direct.json          # 許容電流: 直埋 [A]
│   ├── ampacity-duct.json            # 許容電流: 管路 [A]
│   ├── temp-correction.json          # 温度補正係数
│   ├── mccb-ratings.json             # MCCB 標準定格 [AT]
│   └── reduction-presets.json        # 多条低減率プリセット
├── scripts/
│   └── build.js                      # ビルドスクリプト（Node.js, 依存なし）
├── docs/
│   ├── spec-cable-calc.md            # 低圧幹線ケーブル計算 詳細仕様書
│   └── milestones.md                 # プロジェクトマイルストーン
├── index.html                        # ← ビルド成果物（.gitignore 対象）
├── CLAUDE.md
├── README.md
└── .github/workflows/deploy.yml
```

### ビルドフロー

```
data/*.json ──→ scripts/build.js ──→ index.html（ルート）
src/index.html ─┘                     ↓
                              GitHub Pages デプロイ
```

- `src/index.html`: ソーステンプレート。`/* __DATA__ */` マーカーの位置に data/ のデータが注入される
- `scripts/build.js`: Node.js 標準ライブラリのみ使用。npm install 不要
- `index.html`（ルート）: ビルド成果物。`.gitignore` 対象。ローカルで `node scripts/build.js` → ブラウザで直接開ける

### index.html 内部構造

```
index.html（ビルド成果物）
├── <style>         — CSS（インラインスタイル中心、グローバルリセットのみ <style>）
├── <div id="root"> — React マウントポイント
├── CDN <script>    — React 18 / ReactDOM / Babel Standalone
└── <script type="text/babel">
    ├── DATA TABLES     — ← data/*.json からビルド時に自動注入
    ├── TREE UTILITIES  — ツリー操作ユーティリティ（genId, getChildren, buildTree 等）
    ├── CALC ENGINE     — 計算ロジック（runCalc, runParentCalc, calcTransformer, calcFaultCurrents）
    ├── COMPONENTS      — UI コンポーネント（Slider, Sec, RC, Badge 等）
    ├── PDF GENERATION  — 計算書 HTML 生成（genPDF）
    └── APP             — メインコンポーネント（App）
```

## 設計文書

| ドキュメント | パス | 内容 |
|-------------|------|------|
| 機能仕様書 | `docs/spec-cable-calc.md` | 低圧幹線ケーブル計算ツールの全 20 セクション仕様。実装時はこの仕様に準拠すること |
| マイルストーン | `docs/milestones.md` | 低圧幹線計算（Phase 1〜6）＋幹線系統図自動生成（M2-1〜5）の進捗管理 |
| UX 設計思想 | `docs/ux-protection-design.md` | 保護設計の可視化に関する UX 設計思想。プロファイルカーブ・遮断容量・地絡電流の情報アーキテクチャ |

- 実装前に仕様書の該当セクションを確認する
- 仕様書とコードの不一致が見つかった場合、仕様書を正とする（コードを修正）
- 仕様変更が必要な場合は、仕様書を先に更新してから実装する

## 参照データ運用ルール

### data/ は唯一のデータソース

`data/` ディレクトリの JSON ファイルが、計算に使用するすべての定数テーブルの原本である。

- **手動コピー禁止**: `index.html` 内のデータを直接編集しない。必ず `data/` の JSON を編集し、`node scripts/build.js` で反映する
- **出典明記**: 各 JSON ファイルに `source` フィールドで出典規格を記載する。第三者が規格原本と突合できること
- **更新フロー**: `data/*.json` を編集 → `node scripts/build.js` → `index.html` が再生成される

### JSON ファイルの共通構造

```json
{
  "source": "出典規格名",
  "note": "補足事項",
  "data": { ... }
}
```

ビルドスクリプトは `data` フィールドのみ抽出して JS 定数に変換する。`source` / `note` はメタデータとして JSON に残り、検証時に参照する。

### データテーブルと変数名の対応

| JSON ファイル | JS 変数名 | 内容 | 出典 |
|--------------|-----------|------|------|
| `impedance-cv.json` | `IMP_CV` | CV インピーダンス [Ω/km]（50Hz / 60Hz） | 技資第 103 号 A |
| `impedance-cvt.json` | `IMP_CVT` | CVT インピーダンス [Ω/km]（50Hz / 60Hz） | 技資第 103 号 A |
| `impedance-hv.json` | `IMP_HV` | 高圧 6600V ケーブルインピーダンス [Ω/km]（CV-3C / CVT、50Hz / 60Hz） | 技資第 103 号 A |
| `ampacity-rack.json` | `A_RACK` | 許容電流: ケーブルラック [A] | JCS 0168 |
| `ampacity-conduit.json` | `A_COND` | 許容電流: 配管 [A] | JCS 0168 |
| `ampacity-direct.json` | `A_DIRECT` | 許容電流: 直埋 [A] | JCS 0168 |
| `ampacity-duct.json` | `A_DUCT` | 許容電流: 管路 [A] | JCS 0168 |
| `temp-correction.json` | `TC` | 温度補正係数（気中 / 地中） | 内線規程 |
| `mccb-ratings.json` | `MCCB_AT` | MCCB 定格電流の選択肢 [A] | JIS C 8201-2-1 |
| `reduction-presets.json` | `RED_PRE` | 多条低減率プリセット | 内線規程 |
| `transformer-ratings.json` | `TR_RATINGS` | 変圧器%Z・X/R比（三相油入/単相油入/モールド） | 河村電器産業 / 三菱電機 / JIS C 4304 / JEC 2200 |
| `cable-capacitance.json` | `C_CABLE` | ケーブル対地静電容量 [μF/km]（将来用） | 技資第 103 号 A |
| `zero-sequence.json` | `Z_ZERO` | 零相インピーダンス推定係数・変圧器結線別乗数 | IEC 60909 / CENELEC CLC/TR 50480 |
| `short-time-withstand.json` | `WITHSTAND` | 短時間耐電流 K 定数・I²t 許容値 | JCS 0168-1:2016 |
| `elcb-specs.json` | `ELCB` | 漏電遮断器の感度電流・動作時間 | JIS C 8201-2-2:2021 |
| `mccb-icu.json` | `MCCB_ICU` | MCCB 遮断容量 [kA]（フレーム別・電圧別・クラス別、M2-3 で整備予定） | JIS C 8201-2-1 / メーカーカタログ |

## 開発の判断基準（優先順）

### 1. 計算の正確さが最優先

- インピーダンス値・許容電流値は技資第 103 号 A / JCS 0168 の公式データをそのまま使う。丸め・近似は行わない
- 電動機回路の 1.25 倍 / 1.1 倍ルール、保護協調の AT/2.5 ルールなど、規格上の分岐条件は省略しない
- 精密式（R·cosθ + X·sinθ）を常に使い、簡略式へのフォールバックは設けない

### 2. 入力から結果までの距離を最短にする

- 選択肢の変更は即時反映（onChange）、数値入力はフォーカスアウトで確定（onBlur）
- 連動制御（電気方式→電圧選択肢、回路種別→効率欄の表示切替など）で不整合な入力状態を作らせない
- 初期値はもっとも一般的な条件（三相 3 線式 200V 60Hz、CVT、ケーブルラック、40℃、低減率 0.70）

### 3. ブラウザだけで完結する

- サーバーサイドの計算処理やデータベースは使わない
- データの永続化は JSON export/import で対応する。localStorage には依存しない
- オフライン環境（現場事務所等）でも使えること

### 4. 計算書として提出できる品質

- PDF 出力は公共建築工事標準仕様書の様式（電-8-1）に準拠
- 計算過程（K 値、Z 値、許容値）が追跡可能な状態で出力

## 計算ロジック

### 子回路（runCalc）

1. 設計電流 `dI` を算出（kW → A 変換、需要率適用）
2. ケーブル電流 `cI` を決定（電動機: ×1.25 / ×1.1、一般: そのまま）
3. ケーブルサイズを小さい方から走査:
   - 許容電流（温度補正・低減率適用後）≧ `cI`
   - 電圧降下 ≦ 許容値
   - 上記を両方満たす最小サイズを選定
4. MCCB 定格を選定（自動 or 手動オーバーライド）
5. 保護協調チェック（一般: `eA ≧ AT`、電動機: `eA ≧ AT/2.5`）
6. 保護協調 NG の場合、ケーブルサイズを 1 段上げて再チェック

### 親幹線（runParentCalc）

1. 子回路の設計電流を電動機 / 一般で分けて合算
2. 親幹線のケーブル電流を決定（電動機含む場合: 電動機分 ×1.25 + 一般分）
3. 以降は子回路と同じ走査ロジック

## 技術スタック

| 項目 | 詳細 |
|------|------|
| React | 18.2.0（CDN: cdnjs.cloudflare.com） |
| Babel Standalone | 7.23.9（JSX → JS 変換、CDN） |
| Node.js | ビルドスクリプト実行用（標準ライブラリのみ、npm 依存なし） |
| フォント | Noto Sans JP / Hiragino Kaku Gothic ProN / Meiryo |
| 印刷用フォント | MS Gothic / Hiragino Kaku Gothic ProN |

## コーディング規約

- **ソースファイル**: アプリケーションコードは `src/index.html` に記述する。データは `data/*.json` に分離
- **変数名**: 計算ロジックでは電気工学の慣例に従う短縮名を許容（`dI`, `eA`, `vdP`, `PF` 等）
- **テーブルデータ**: `data/` JSON が原本。ビルドで自動注入されるため手動コピーしない
- **コメント**: セクション区切りに `/* === SECTION NAME === */` 形式を使用
- **新しいライブラリの追加**: CDN 経由のみ。npm / ビルドツールは使用しない

## ビルドとデプロイ

### ローカルビルド

```bash
node scripts/build.js
```

`data/*.json` + `src/index.html` → ルートに `index.html` を生成。ブラウザで直接開ける。

### デプロイ

- main ブランチへの push で GitHub Actions が自動実行
- `.github/workflows/deploy.yml` により:
  1. `node scripts/build.js` でビルド
  2. 生成された `index.html` を含むリポジトリ全体を GitHub Pages にデプロイ

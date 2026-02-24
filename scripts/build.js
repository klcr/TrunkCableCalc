#!/usr/bin/env node
/**
 * build.js — data/*.json を src/index.html に注入して index.html を生成する
 *
 * 使い方: node scripts/build.js
 * 依存: Node.js 標準ライブラリのみ（npm install 不要）
 *
 * ビルドフロー:
 *   1. data/*.json を読み込み、各ファイルの "data" フィールドを抽出
 *   2. JS 定数宣言（const XXX = ...;）を生成
 *   3. src/index.html 内の /* __DATA__ */ マーカーを置換
 *   4. ルートに index.html を出力
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'index.html');
const DATA_DIR = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'index.html');

/* === JSON ファイル名 → JS 変数名のマッピング === */
const FILE_VAR_MAP = {
  'impedance-cv.json':     'IMP_CV',
  'impedance-cvt.json':    'IMP_CVT',
  'ampacity-rack.json':    'A_RACK',
  'ampacity-conduit.json': 'A_COND',
  'ampacity-direct.json':  'A_DIRECT',
  'ampacity-duct.json':    'A_DUCT',
  'temp-correction.json':  'TC',
  'mccb-ratings.json':     'MCCB_AT',
  'reduction-presets.json': 'RED_PRE'
};

/* === メイン処理 === */
function main() {
  // src/index.html の存在チェック
  if (!fs.existsSync(SRC)) {
    console.error(`[build] src/index.html が見つかりません: ${SRC}`);
    process.exit(1);
  }

  let template = fs.readFileSync(SRC, 'utf8');

  // data/*.json を読み込んで JS 定数宣言を生成
  const lines = [];
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).sort();

  for (const file of files) {
    const varName = FILE_VAR_MAP[file];
    if (!varName) {
      console.warn(`[build] マッピング未定義のファイルをスキップ: ${file}`);
      continue;
    }

    const filePath = path.join(DATA_DIR, file);
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (json.data === undefined) {
      console.warn(`[build] "data" フィールドが存在しません: ${file}`);
      continue;
    }

    const value = JSON.stringify(json.data);
    lines.push(`const ${varName} = ${value};`);
    console.log(`[build] ${file} → ${varName}`);
  }

  const dataBlock = lines.join('\n');

  // マーカー置換
  const marker = '/* __DATA__ */';
  if (!template.includes(marker)) {
    console.error(`[build] マーカー "${marker}" が src/index.html 内に見つかりません`);
    process.exit(1);
  }

  const output = template.replace(marker, dataBlock);

  // 出力
  fs.writeFileSync(OUT, output, 'utf8');
  console.log(`[build] 完了: ${OUT} (${(Buffer.byteLength(output, 'utf8') / 1024).toFixed(1)} KB)`);
}

main();

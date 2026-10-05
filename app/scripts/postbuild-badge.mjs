/**
 * badge bundle 的构建后处理，由 npm run build:badge 自动串在 vite build 之后：
 *
 * 1. 把三张工牌素材拷进 portfolio/badge/assets/。
 *    它们没有被 import（那样会被 Vite lib 模式内联成 base64），而是由
 *    src/badge/main.tsx 在运行时按 URL 拼出来，所以必须显式落盘。
 * 2. 压掉 badge.js 的空白。
 *    Vite lib 模式只重命名标识符、不压空白（实测产物 6.3 万行）。
 *    这份 bundle 是给纯静态页直接 <script> 引的，没有下游打包器兜底。
 */
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '../../portfolio/badge');
const SRC_ASSETS = path.resolve(here, '../src/components/lanyard');
const BUNDLE = path.join(OUT, 'badge.js');

if (!fs.existsSync(BUNDLE)) {
  console.error('✗ 找不到 badge.js，先跑 vite build --config vite.badge.config.ts');
  process.exit(1);
}

// ---- 1. 拷贝素材 ----
const ASSETS = ['card-front.webp', 'card-back.webp', 'lanyard-strap.webp'];
const assetDir = path.join(OUT, 'assets');
fs.mkdirSync(assetDir, { recursive: true });
for (const name of ASSETS) {
  const from = path.join(SRC_ASSETS, name);
  if (!fs.existsSync(from)) {
    console.error(`✗ 缺少素材 ${from}`);
    process.exit(1);
  }
  fs.copyFileSync(from, path.join(assetDir, name));
  console.log(`  素材 → assets/${name}  (${(fs.statSync(from).size / 1024).toFixed(0)} KB)`);
}

// ---- 2. 压缩 ----
const before = fs.statSync(BUNDLE).size;
await esbuild.build({
  entryPoints: [BUNDLE],
  outfile: BUNDLE,
  allowOverwrite: true,
  bundle: false,
  minify: true,
  format: 'esm',
  target: ['es2020'],
  legalComments: 'none',
  charset: 'utf8',
});
const after = fs.statSync(BUNDLE).size;
const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log(`✓ badge.js ${kb(before)} → ${kb(after)}  (压掉 ${(100 - (after / before) * 100).toFixed(0)}%)`);

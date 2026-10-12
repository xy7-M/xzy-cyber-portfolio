#!/usr/bin/env node
/* ============================================================
   公开产物构建 —— 白名单复制
   ------------------------------------------------------------
   用途：EdgeOne Pages（或任何静态托管）的 outputDirectory 指向 dist/。

   背景：本仓库根目录混有大量私有内容（tools/ prompts/ plugins/
   preview-dark/ app/ .workbuddy-ai/ 等），Vercel 侧靠 .vercelignore 隔离；
   而 EdgeOne / 火山引擎 IGA Pages 都没有等价的忽略文件机制，
   若直接把仓库根当产物根，私有内容会全部公开。
   本脚本改为「只复制站点运行真正需要的文件」，产出干净的 dist/。

   用法：
     node tools/build-public.js
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist');

/* ---------- 白名单：仓库根下的相对路径（文件或目录） ---------- */
const INCLUDE = [
  'index.html',
  'css',
  'js',
  'fonts',
  'portfolio/index.html',
  'portfolio/fonts',
  'portfolio/badge/badge.js',
  'portfolio/badge/assets',
  // 主站封面的视频源。
  // scrub 版（12MB）只有作品集页的滚动 seek 用得上，而作品集页的视频
  // 已内联在 portfolio/index.html 里，无需外链 —— 故不复制，省 12MB。
  'portfolio/cyber-rooftop-dolly-6s.mp4'
];

/* ---------- 保险丝：这些绝不允许出现在产物里 ----------
   即使将来有人误把私有目录写进 INCLUDE，这里也会兜住并报错退出。 */
const FORBIDDEN = [
  'tools', 'prompts', 'plugins', 'preview-dark', 'app', 'redirect',
  'node_modules', '.git', '.claude', '.workbuddy', '.workbuddy-ai',
  'README.md', '3D-SKILLS-清单.md', 'LICENSE', 'vercel.json', 'edgeone.json',
  '.gitignore', '.vercelignore',
  'preview-works-before.png', 'preview-works-after.png',
  'preview-works-after-mobile.png', 'preview-works-hoverline-demo.png',
  'gen_images.py', 'gen_video.py'
];

let fileCount = 0;
let totalBytes = 0;
const copied = [];

function walk(src, rel) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(path.join(OUT, rel), { recursive: true });
    for (const name of fs.readdirSync(src)) {
      walk(path.join(src, name), path.join(rel, name));
    }
    return;
  }
  fs.mkdirSync(path.dirname(path.join(OUT, rel)), { recursive: true });
  fs.copyFileSync(src, path.join(OUT, rel));
  fileCount++;
  totalBytes += st.size;
  copied.push(rel.split(path.sep).join('/'));
}

function human(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return n.toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
}

/* 1) 清空并重建产物目录 */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

/* 2) 按白名单复制 */
let missing = 0;
for (const rel of INCLUDE) {
  const src = path.join(ROOT, rel);
  if (!fs.existsSync(src)) {
    console.error('  ! 白名单项不存在，已跳过: ' + rel);
    missing++;
    continue;
  }
  walk(src, rel);
}

/* 3) 保险丝检查 */
const leaked = FORBIDDEN.filter(function (f) {
  return fs.existsSync(path.join(OUT, f));
});

/* 4) 报告 */
console.log('');
console.log('构建产物 -> dist/');
console.log('  文件数 : ' + fileCount);
console.log('  总体积 : ' + human(totalBytes));
console.log('  清单   :');
copied.sort().forEach(function (f) {
  const size = fs.statSync(path.join(OUT, f)).size;
  console.log('    ' + human(size).padStart(8) + '  ' + f);
});

if (missing > 0) {
  console.error('\n! 有 ' + missing + ' 个白名单项缺失（见上）');
  process.exitCode = 1;
}

if (leaked.length > 0) {
  console.error('\nX 私有内容泄漏到产物中: ' + leaked.join(', '));
  process.exitCode = 1;
} else {
  console.log('\nOK 私有内容隔离检查通过（' + FORBIDDEN.length + ' 项均未出现在 dist/）');
}
console.log('');

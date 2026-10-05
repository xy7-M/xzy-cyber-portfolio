/**
 * 把首屏循环视频（cyber-rooftop-dolly-6s.mp4）以 base64 data URL 内联进
 * portfolio/index.html，让单文件预览也能播。scrub 版本仍走相对路径——
 * 部署版有 sibling，scrub 正常；预览里没有，scrub 的 mp4 会 404，所以再加
 * 一道 error 回退到循环版（loop 的 data URL 始终能播，只是没有关键帧、
 * 不能随滚动 scrub；预览里看到的是带 CSS 缩放的第一帧，够用）。
 *
 * 用法：cd app && node scripts/inline-hero-video.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.resolve(here, '../../portfolio/index.html');
const LOOP  = path.resolve(here, '../../portfolio/cyber-rooftop-dolly-6s.mp4');
const sizeKB = (n) => Math.round(n / 1024) + ' KB';

if (!fs.existsSync(LOOP)) {
  console.error('✗ 找不到 ' + LOOP);
  process.exit(1);
}
let html = fs.readFileSync(INDEX, 'utf8');

// 1) 把 VIDEO_LOOP 常量换成 data URL（用 JSON.stringify 安全包一层引号）
const oldConst = "var VIDEO_LOOP  = 'cyber-rooftop-dolly-6s.mp4';";
if (!html.includes(oldConst)) {
  console.error('✗ 找不到 VIDEO_LOOP 常量（已被改过？）');
  process.exit(1);
}
const buf = fs.readFileSync(LOOP);
const dataUrl = 'data:video/mp4;base64,' + buf.toString('base64');
html = html.replace(oldConst, 'var VIDEO_LOOP  = ' + JSON.stringify(dataUrl) + ';');
console.log(`  视频 → data URL  ${sizeKB(buf.length)} → ${sizeKB(dataUrl.length)}`);

// 2) 给 SCRUB 分支加 error 回退：scrub 版 mp4 加载失败就退回循环版
const scrubBranch = '      scrubbing = true;\n      scrubLoop();\n    } else if (reduced) {';
const scrubBranchWithFallback = '      // scrub 版 mp4 加载失败（单文件预览 / 部署里被改路径都会触发）就回退到循环版\n      // 循环版是 data URL 始终能播，只是没有关键帧不能 scrub；CSS 缩放照旧生效\n      video.addEventListener(\'error\', function onScrubErr() {\n        video.removeEventListener(\'error\', onScrubErr);\n        video.src = VIDEO_LOOP;\n        video.loop = true;\n        video.play().catch(function () {});\n        watchSeam();\n      }, { once: true });\n      scrubbing = true;\n      scrubLoop();\n    } else if (reduced) {';
if (!html.includes(scrubBranch)) {
  console.error('✗ 找不到 SCRUB 分支标记（已被改过？）');
  process.exit(1);
}
html = html.replace(scrubBranch, scrubBranchWithFallback);
console.log('  SCRUB 失败 → 回退循环版');

const before = fs.statSync(INDEX).size;
fs.writeFileSync(INDEX, html);
const after = fs.statSync(INDEX).size;
console.log(`✓ index.html  ${sizeKB(before)} → ${sizeKB(after)}`);
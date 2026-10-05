/**
 * 把 portfolio/badge.js 的源代码内联进 portfolio/index.html。
 * 让单文件预览（WorkBuddy static-html 预览 / file:// / 任何静态服）都能拿到 bundle，
 * 不再依赖同目录的 badge.js 404。
 *
 * 用法：cd app && node scripts/standalone-html.mjs
 *   写完直接覆盖 portfolio/index.html。
 *
 * 部署行为变化：
 *   - 多文件版：index.html(38KB) + badge.js(3.7MB) + assets + ... —— 缓存友好，但单文件预览坏
 *   - 自包含版：index.html(~4MB) —— 单文件预览可用，部署体积+1.4MB(gzip)
 * 两种版式互为备援，不写两套文件，按需跑这个脚本即可在两种模式间切换。
 *
 * 运行时策略：
 *   bundle 源码放在 <script type="text/plain"> 里（浏览器当文本加载，不解析为 JS），
 *   真正用的时候再 Blob+import —— 既自包含，又把 JS 解析推迟到 3D 工牌区块靠近视口时。
 *   注意：text/plain 内联意味着 HTML 已经把全部源码吃进内存，没法再"懒下载"，但
 *   JS 解析/编译/WebGL 初始化仍然只在 IntersectionObserver 触发后才发生。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.resolve(here, '../../portfolio/index.html');
const BUNDLE = path.resolve(here, '../../portfolio/badge/badge.js');
const FRONT  = path.resolve(here, '../../portfolio/badge/assets/card-front.webp');
const BACK   = path.resolve(here, '../../portfolio/badge/assets/card-back.webp');
const STRAP  = path.resolve(here, '../../portfolio/badge/assets/lanyard-strap.webp');

if (!fs.existsSync(BUNDLE)) {
  console.error('✗ 找不到 portfolio/badge/badge.js，先跑 npm run build:badge');
  process.exit(1);
}
for (const f of [FRONT, BACK, STRAP]) {
  if (!fs.existsSync(f)) {
    console.error('✗ 缺少素材 ' + f);
    process.exit(1);
  }
}

const html = fs.readFileSync(INDEX, 'utf8');
const bundle = fs.readFileSync(BUNDLE, 'utf8');
const sizeKB = (n) => Math.round(n / 1024) + ' KB';

// 找到 3D 工牌加载段并替换：
//   旧版以 "3D 工牌按需加载" 注释开头（动态 import）；
//   上一轮本脚本已变以 "3D 工牌（自包含内联版）" 注释开头（self-contained）；
//   两种都识别，找到该注释到 loader 闭合 </script> 之间的整段替换掉。
const START_RE = /<!-- =+ 3D 工牌(?:按需加载|（自包含内联版）)/;
const END = '</script>';
const sIdx = html.search(START_RE);
if (sIdx === -1) {
  console.error('✗ 没在 index.html 里找到 3D 工牌加载段（注释标记变了？）');
  process.exit(1);
}
const eIdx = html.lastIndexOf(END);
if (eIdx === -1 || eIdx <= sIdx) {
  console.error('✗ 找不到闭合 </script>');
  process.exit(1);
}
const before = html.slice(0, sIdx);
const after = html.slice(eIdx + END.length);

const toDataUrl = (buf) => `data:image/webp;base64,${buf.toString('base64')}`;
const FRONT_URL = toDataUrl(fs.readFileSync(FRONT));
const BACK_URL  = toDataUrl(fs.readFileSync(BACK));
const STRAP_URL = toDataUrl(fs.readFileSync(STRAP));

const replacement = `<!-- ===================== 3D 工牌（自包含内联版） =====================
     单文件预览（WorkBuddy static-html / file:// / 任何静态服）下 sibling 文件
     会被 404，所以把 3 张 webp 以 data URL 注入宿主，bundle 优先取这个；
     bundle 源码放在 text/plain 脚本里，避免动态 import 的 404，同样不依赖
     sibling 文件。真正用的时候再 Blob+import —— JS 解析推迟到
     IntersectionObserver 触发后（首屏不会同步阻塞）。 -->
<script>
// 宿主先把 3 张素材以 data URL 形式塞进 window.__MXY_BADGE__，
// bundle 启动时会优先用它们，只有它们都没有时才退化到 BADGE_BASE 拉文件。
window.__MXY_BADGE__ = {
  front: ${JSON.stringify(FRONT_URL)},
  back:  ${JSON.stringify(BACK_URL)},
  lanyard: ${JSON.stringify(STRAP_URL)},
};
</script>
<script type="text/plain" id="mxy-badge-bundle">
${bundle}
</script>
<script type="module">
(function () {
  'use strict';
  var stage = document.querySelector('[data-mxy-badge]');
  var src = document.getElementById('mxy-badge-bundle');
  if (!stage || !src) return;

  var started = false;
  function load() {
    if (started) return;
    started = true;
    try {
      var blob = new Blob([src.textContent], { type: 'text/javascript' });
      var url = URL.createObjectURL(blob);
      import(url).catch(function (err) {
        console.warn('[badge] 3D 工牌未能加载：', err && err.message);
      });
    } catch (e) {
      console.warn('[badge] 3D 工牌未能加载：', e && e.message);
    }
  }

  if (!('IntersectionObserver' in window)) { load(); return; }
  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) { load(); io.disconnect(); return; }
    }
  }, { rootMargin: '500px 0px' });
  io.observe(stage);
})();
</script>`;

const next = before + replacement + after;
fs.writeFileSync(INDEX, next);
console.log(`✓ index.html 已自包含化  ${sizeKB(html.length)} → ${sizeKB(next.length)}`);
console.log(`  bundle 源码 ${sizeKB(bundle.length)} 内联在 text/plain 脚本里`);
console.log(`  3 张 webp 素材以 data URL 注入宿主，共 ${sizeKB(FRONT_URL.length + BACK_URL.length + STRAP_URL.length)}`);
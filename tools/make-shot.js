/* 临时预览页生成器：把 index.html 复制一份，注入「强制显示全部 reveal 元素 +
   隐藏动画」的补丁，便于 headless 截图核对。
   用法：node tools/make-shot.js
   产出：tools/.shot-preview.html（临时文件，不参与部署） */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const patch = `
<style id="shot-patch">
  /* 截图补丁：强制所有 reveal / 入场元素为最终可见状态 */
  .reveal, .reveal * { opacity: 1 !important; transform: none !important; }
  * { animation: none !important; transition: none !important; }
</style>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in', 'is-visible', 'visible'); });
  });
</script>
`;

html = html.replace('<head>', '<head>\n<base href="../">');
html = html.replace('</head>', patch + '</head>');
fs.writeFileSync(path.join(__dirname, '.shot-preview.html'), html, 'utf8');
console.log('wrote tools/.shot-preview.html');

/* 字形渲染预览：把 mxy-glyph.js 的路径数据渲成 PNG，用于人工校字
   用法：node tools/render-preview.js
   依赖：项目 app/node_modules 内自带的 sharp（libvips + librsvg） */
const path = require('path');
const sharp = require(path.join(__dirname, '..', 'app', 'node_modules', 'sharp'));
const GLYPHS = require(path.join(__dirname, '..', 'js', 'mxy-glyph.js'));

const E = 220;      // em 框
const PAD = 24;     // 校字图留白
const GAP = 40;
const XL = 144;     // 字间距（与主站一致；略大于字宽才有呼吸，小于 220 才有穿插咬合）
const VB = { x: -14, y: -14, w: XL * 3 + 28, h: 272 };

function nums(d) { return (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number); }

function bbox(paths) {
  let x = Infinity, X = -Infinity, y = Infinity, Y = -Infinity;
  paths.forEach(p => {
    const a = nums(p);
    for (let i = 0; i + 1 < a.length; i += 2) {
      x = Math.min(x, a[i]); X = Math.max(X, a[i]);
      y = Math.min(y, a[i + 1]); Y = Math.max(Y, a[i + 1]);
    }
  });
  return { x, X, y, Y, w: X - x, h: Y - y };
}

function report() {
  console.log('字形外接框（单位: em/220，楷体实际字面约 200 见方）');
  let hMin = Infinity, hMax = -Infinity;
  GLYPHS.forEach(g => {
    const b = bbox(g.paths);
    hMin = Math.min(hMin, b.h); hMax = Math.max(hMax, b.h);
    console.log(
      `  ${g.char}  宽 ${b.w.toFixed(0).padStart(3)}  高 ${b.h.toFixed(0).padStart(3)}` +
      `  x[${b.x.toFixed(0)}..${b.X.toFixed(0)}]  y[${b.y.toFixed(0)}..${b.Y.toFixed(0)}]` +
      `  越界: ${b.h > 200 ? '是（外向舒展）' : '否'}`
    );
  });
  console.log(`  三字高度极差 ${(hMax - hMin).toFixed(0)}（越小越整齐，建议 < 40）\n`);
}

function svgFor(g, i) {
  const defs =
    `<linearGradient id="g${i}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="${g.from}"/>` +
    `<stop offset="46%" stop-color="${g.mid}"/>` +
    `<stop offset="100%" stop-color="${g.to}"/></linearGradient>`;
  return { defs, body: `<g transform="translate(${i * XL},0)"><path fill="url(#g${i})" d="${g.paths.join(' ')}"/></g>` };
}

async function main() {
  report();

  // 1) 单字对照：白字 + 200 见方的正楷字面参考框
  const CELL = E + PAD * 2;
  const W1 = GLYPHS.length * CELL + (GLYPHS.length - 1) * GAP;
  const items = GLYPHS.map((g, i) => {
    const x = i * (CELL + GAP);
    return `<rect x="${x + PAD}" y="${PAD}" width="${E}" height="${E}" ` +
      `fill="none" stroke="#00e5ff" stroke-opacity="0.4" stroke-width="1" stroke-dasharray="4 4"/>` +
      `<g transform="translate(${x + PAD},${PAD})"><path fill="#EAFBFF" d="${g.paths.join(' ')}"/></g>`;
  }).join('');
  await sharp(Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W1}" height="${CELL}" viewBox="0 0 ${W1} ${CELL}">` +
    `<rect width="${W1}" height="${CELL}" fill="#04060d"/>${items}</svg>`
  )).png().toFile(path.join(__dirname, 'glyph-check.png'));
  console.log('wrote glyph-check.png');

  // 2) 完整 lockup：与主站同一套 viewBox，带渐变
  const parts = GLYPHS.map(svgFor);
  const svg2 =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="${Math.round(1280 * VB.h / VB.w)}" ` +
    `viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}">` +
    `<defs>${parts.map(p => p.defs).join('')}</defs>` +
    `<rect x="${VB.x}" y="${VB.y}" width="${VB.w}" height="${VB.h}" fill="#04060d"/>` +
    `${parts.map(p => p.body).join('')}</svg>`;
  await sharp(Buffer.from(svg2)).png().toFile(path.join(__dirname, 'lockup-check.png'));
  console.log('wrote lockup-check.png 1280x' + Math.round(1280 * VB.h / VB.w));

  // 3) 参考图尺度（宽约 622px），检验小尺寸可读性
  await sharp(Buffer.from(svg2)).resize(622).png().toFile(path.join(__dirname, 'lockup-small.png'));
  console.log('wrote lockup-small.png');

  // 4) 三字放大，逐个挑形
  for (let i = 0; i < GLYPHS.length; i++) {
    await sharp(Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="660" height="660" viewBox="0 0 220 220">` +
      `<rect width="220" height="220" fill="#04060d"/>` +
      `<path fill="#EAFBFF" d="${GLYPHS[i].paths.join(' ')}"/></svg>`
    )).png().toFile(path.join(__dirname, 'zoom' + i + '.png'));
  }
  console.log('wrote zoom0..2.png');
}

main().catch(e => { console.error(e); process.exit(1); });

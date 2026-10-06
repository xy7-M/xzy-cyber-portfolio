// 量弹窗平面图实际渲染尺寸，并截图。
// 直接注入 .mxy-badge-modal DOM（复用页面里已有的 .mxy-badge-* 样式），
// 绕开 3D/WebGL 加载，秒出结果。
//
// 用法: node measure_modal.js [url] [outPng] [W] [H] [frontUrl] [backUrl]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const [, , URL = 'http://127.0.0.1:8931/', OUT = 'tools/_read/modal-size.png', WS = '1440', HS = '900',
  FRONT_URL = '', BACK_URL = ''] = process.argv;
const W = parseInt(WS, 10), H = parseInt(HS, 10);

const INJECT = `(async () => {
  const T = ${JSON.stringify({ front: FRONT_URL, back: BACK_URL })};
  const srcs = Array.from(document.images).map(i => i.currentSrc || i.src)
    .filter(s => /\\.webp(\\?|$)/i.test(s));
  const pick = (re) => srcs.find(s => re.test(s)) || null;
  const front = T.front || pick(/front/i);
  const back  = T.back  || pick(/back/i);

  const modal = document.createElement('div');
  modal.className = 'mxy-badge-modal';
  modal.id = '__probe_modal__';
  modal.innerHTML = [
    '<div class="mxy-badge-modal-inner">',
    '  <span class="mxy-badge-modal-corner tl"></span>',
    '  <span class="mxy-badge-modal-corner tr"></span>',
    '  <span class="mxy-badge-modal-corner bl"></span>',
    '  <span class="mxy-badge-modal-corner br"></span>',
    '  <header class="mxy-badge-modal-head">',
    '    <span class="mxy-badge-modal-title mono">IDENTITY BADGE / FLAT SHEET</span>',
    '    <button type="button" class="mxy-badge-modal-close mono">CLOSE</button>',
    '  </header>',
    '  <div class="mxy-badge-modal-sheets">',
    '    <figure class="mxy-badge-sheet"><img data-slot="front" alt="front"><figcaption class="mono">FRONT · 正面</figcaption></figure>',
    '    <figure class="mxy-badge-sheet"><img data-slot="back"  alt="back"><figcaption class="mono">BACK · 背面</figcaption></figure>',
    '  </div>',
    '  <p class="mxy-badge-modal-hint mono">ESC / CLICK OUTSIDE TO CLOSE</p>',
    '</div>'
  ].join('\\n');
  document.body.appendChild(modal);

  const put = (slot, url) => new Promise((res) => {
    const img = modal.querySelector('img[data-slot="' + slot + '"]');
    if (!url) { img.dataset.missing = '1'; return res(false); }
    img.onload = () => res(true);
    img.onerror = () => { img.dataset.missing = '1'; res(false); };
    img.src = url;
  });
  await Promise.all([put('front', front), put('back', back)]);

  // 等布局稳定
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return { front, back };
})()`;

(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'load', timeout: 90000 });

  const src = await page.evaluate(INJECT);
  await page.waitForTimeout(400);

  const m = await page.evaluate(() => {
    const modal = document.getElementById('__probe_modal__');
    if (!modal) return { error: 'modal not injected' };
    const q = (s) => modal.querySelector(s);
    const r = (el) => { const b = el.getBoundingClientRect(); return { w: +b.width.toFixed(1), h: +b.height.toFixed(1), x: +b.x.toFixed(1), y: +b.y.toFixed(1) }; };
    const imgs = Array.from(modal.querySelectorAll('.mxy-badge-sheet img'));
    const cs = getComputedStyle(q('.mxy-badge-modal-inner'));
    const ssh = getComputedStyle(q('.mxy-badge-modal-sheets'));
    return {
      viewport: { w: innerWidth, h: innerHeight },
      inner: r(q('.mxy-badge-modal-inner')),
      sheets: r(q('.mxy-badge-modal-sheets')),
      sheetsMaxH: ssh.maxHeight,
      innerWidthCss: cs.width,
      cards: imgs.map(i => ({
        slot: i.dataset.slot,
        natural: i.naturalWidth + 'x' + i.naturalHeight,
        box: r(i),
        ratio: i.naturalWidth ? +(i.naturalWidth / i.naturalHeight).toFixed(4) : null,
      })),
      overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      sheetsOverflow: (() => {
        const s = q('.mxy-badge-modal-sheets');
        return s.scrollHeight > s.clientHeight + 1;
      })(),
    };
  });

  if (m.error) { console.error('FAIL', m.error, src); await browser.close(); process.exit(1); }

  await page.screenshot({ path: OUT });
  console.log(JSON.stringify(m, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });

// 复现 Lanyard.tsx 里 cardMap 的合成逻辑，导出合成后的图集，用于核对
// 正/反面矩形对齐与方向（尤其是背面——物理回弹让背面很难在场景里截到）。
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'C:/Users/__USER__/OneDrive/Desktop/My Item/自我介绍';
const ATLAS = BASE + '/_tmp_work/atlas.png';
const FRONT = BASE + '/app/src/components/lanyard/card-front.webp';
const BACK = BASE + '/app/src/components/lanyard/card-back.webp';
const OUT = BASE + '/_tmp_work/shots/atlas-composited.png';

const b64 = p => fs.readFileSync(p).toString('base64');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1700, height: 1720 } });
  await page.setContent('<canvas id="c"></canvas>');

  const dataUrl = await page.evaluate(async ([atlas, front, back]) => {
    const load = src => new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'data:image/webp;base64,' + src;
    });
    const loadPng = src => new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'data:image/png;base64,' + src;
    });
    const baseImg = await loadPng(atlas);
    const frontImg = await load(front);
    const backImg = await load(back);

    const W = baseImg.width, H = baseImg.height;
    const c = document.getElementById('c');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.drawImage(baseImg, 0, 0, W, H);

    // 与组件内完全一致的矩形
    const FRONT_UV_RECT = { x: 0.0008, y: 0.0042, w: 0.4981, h: 0.7506 };
    const BACK_UV_RECT = { x: 0.5014, y: 0.0022, w: 0.4986, h: 0.755 };

    const drawFitted = (img, rect) => {
      const rx = rect.x * W, ry = rect.y * H, rw = rect.w * W, rh = rect.h * H;
      ctx.save();
      ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
      ctx.drawImage(img, rx, ry, rw, rh); // fill = 非等比铺满
      ctx.restore();
      return { rx, ry, rw, rh };
    };
    const f = drawFitted(frontImg, FRONT_UV_RECT);
    const b = drawFitted(backImg, BACK_UV_RECT);
    return { url: c.toDataURL('image/png'), W, H, f, b };
  }, [b64(ATLAS), b64(FRONT), b64(BACK)]);

  await browser.close();
  fs.writeFileSync(OUT, Buffer.from(dataUrl.url.split(',')[1], 'base64'));
  console.log('composited atlas ->', OUT);
  console.log('atlas', dataUrl.W, 'x', dataUrl.H);
  console.log('front rect px', JSON.stringify(dataUrl.f));
  console.log('back  rect px', JSON.stringify(dataUrl.b));
})();

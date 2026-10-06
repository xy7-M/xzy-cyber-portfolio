/* 量「四周 vs 中心」的亮度差，并截 before/after 对比图。
   用法: node measure_dark.js <baHtmlPath> <outPng> */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const baPath = path.resolve(process.argv[2]);
  const outPng = path.resolve(process.argv[3]);

  // file:// 下同源策略会把本地图片判为跨域，canvas 一读 getImageData 就被污染。
  // 加这个开关让本地文件互访，只在截图/度量脚本里用，不涉及部署产物。
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1100 }, deviceScaleFactor: 1 });
  await page.goto('file:///' + baPath.replace(/\\/g, '/'));
  await page.waitForTimeout(900);

  const stats = await page.evaluate(async () => {
    const measure = (img) => new Promise((res) => {
      const run = () => {
        const W = img.naturalWidth, H = img.naturalHeight;
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const lum = (x, y, w, h) => {
          const d = ctx.getImageData(x, y, w, h).data;
          let s = 0;
          for (let i = 0; i < d.length; i += 4) s += (d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722);
          return s / (d.length / 4);
        };
        // 四角取 56x56 避开 3px 边框与四角括号，中心取 56x56
        const corners = [
          lum(70, 70, 56, 56), lum(W - 126, 70, 56, 56),
          lum(70, H - 126, 56, 56), lum(W - 126, H - 126, 56, 56),
        ];
        const edge = corners.reduce((a, b) => a + b, 0) / 4;
        // 左右两侧内容带（避开暗角最外圈）
        const sideL = lum(90, H * 0.3, 40, H * 0.4);
        const sideR = lum(W - 130, H * 0.3, 40, H * 0.4);
        const center = lum(W / 2 - 28, H / 2 - 28, 56, 56);
        res({ edge: +edge.toFixed(1), center: +center.toFixed(1),
              ratio: +(edge / center).toFixed(3),
              sides: +((sideL + sideR) / 2).toFixed(1) });
      };
      if (img.complete) run(); else img.onload = run;
    });
    const imgs = [...document.querySelectorAll('img')];
    return Promise.all(imgs.map(measure));
  });

  const labels = ['BEFORE', 'AFTER'];
  stats.forEach((s, i) => {
    console.log(`${labels[i] || i}  四角均值 ${s.edge}  中心 ${s.center}  四周/中心 ${(s.ratio * 100).toFixed(0)}%  左右内容带 ${s.sides}`);
  });

  const el = await page.$('.wrap');
  await el.screenshot({ path: outPng });
  await browser.close();
  console.log('wrote', outPng);
})();

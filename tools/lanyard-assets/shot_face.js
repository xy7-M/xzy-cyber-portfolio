/* 截取 verify-back.html 的离屏渲染结果。
   用法: node shot_face.js <baseUrl> <outDir> */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const base = process.argv[2] || 'http://localhost:5199';
  const outDir = process.argv[3] || 'tools/lanyard-assets/_read/faces';
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  for (const view of ['back', 'front']) {
    const page = await browser.newPage({ viewport: { width: 900, height: 1256 }, deviceScaleFactor: 2 });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(`${base}/verify-back.html?view=${view}`, { waitUntil: 'load', timeout: 60000 });
    try {
      await page.waitForFunction('window.__READY__ === true', { timeout: 30000 });
    } catch {
      console.log(view, 'NOT READY', errs.join(' | '));
    }
    await page.waitForTimeout(600);
    const cv = await page.$('canvas');
    await cv.screenshot({ path: path.join(outDir, `face-${view}.png`) });
    if (errs.length) console.log(view, 'errors:', errs.slice(0, 3).join(' | '));
    await page.close();
  }
  await browser.close();
  console.log('wrote faces ->', outDir);
})();

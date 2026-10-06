// 打开站点、滚到 #card、等物理稳定后截图工牌区域
// 用法: node shot_lanyard.js <url> <outDir>
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const url = process.argv[2] || 'http://localhost:5173';
  const outDir = process.argv[3] || '_tmp_work/shots';
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  const failed = [];
  page.on('requestfailed', r => failed.push(r.url() + ' :: ' + (r.failure() && r.failure().errorText)));
  page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });

  await page.goto(url, { waitUntil: 'load', timeout: 60000 });

  // 滚到工牌区块
  await page.evaluate(() => document.getElementById('card')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await page.waitForTimeout(1500);

  // 等 canvas 出现
  await page.waitForSelector('#card canvas', { timeout: 30000 });
  // 等物理稳定
  await page.waitForTimeout(4000);

  await page.screenshot({ path: `${outDir}/01-section.png` });

  // 只截右侧 3D 区
  const right = await page.$('#card canvas');
  const box = await right.boundingBox();
  if (box) {
    await page.screenshot({
      path: `${outDir}/02-card-rest.png`,
      clip: { x: box.x, y: box.y, width: box.width, height: box.height },
    });
  }

  // 拖动工牌让它翻转，看背面
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.62;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 24; i++) {
    await page.mouse.move(cx + i * 16, cy - i * 3, { steps: 2 });
    await page.waitForTimeout(18);
  }
  await page.mouse.up();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${outDir}/03-card-after-drag.png`, clip: { x: box.x, y: box.y, width: box.width, height: box.height } });

  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${outDir}/04-card-settled.png`, clip: { x: box.x, y: box.y, width: box.width, height: box.height } });

  // 移动端
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await m.goto(url, { waitUntil: 'load', timeout: 60000 });
  await m.evaluate(() => document.getElementById('card')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await m.waitForTimeout(5000);
  await m.screenshot({ path: `${outDir}/05-mobile.png` });

  await browser.close();

  console.log('--- console errors ---');
  console.log(errors.length ? errors.join('\n') : '(none)');
  console.log('--- failed/4xx requests ---');
  console.log(failed.length ? failed.join('\n') : '(none)');
})();

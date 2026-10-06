/* 拖动工牌并在拖动过程中连续截图，用于稳定抓到「背面」帧。
   用法: node drag_scan.js <url> <outDir> */
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const url = process.argv[2] || 'http://localhost:5199';
  const outDir = process.argv[3] || 'tools/lanyard-assets/_read/shots-drag';
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(() => document.getElementById('card')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await page.waitForTimeout(1500);
  await page.waitForSelector('#card canvas', { timeout: 30000 });
  await page.waitForTimeout(4000);

  const canvas = await page.$('#card canvas');
  const box = await canvas.boundingBox();
  const clip = { x: box.x, y: box.y, width: box.width, height: box.height };

  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.6;

  // 抓握点故意偏离卡片质心（偏下），水平拖动即可产生绕竖直轴的力矩。
  await page.mouse.move(cx, cy);
  await page.mouse.down();

  let n = 0;
  for (let round = 0; round < 3; round++) {
    for (let i = 1; i <= 14; i++) {
      const dx = (round % 2 === 0 ? 1 : -1) * i * 14;
      await page.mouse.move(cx + dx, cy - i * 2, { steps: 2 });
      await page.waitForTimeout(28);
    }
    n++;
    await page.screenshot({ path: `${outDir}/drag-${String(n).padStart(2, '0')}.png`, clip });
  }
  await page.mouse.up();
  await page.waitForTimeout(300);
  n++;
  await page.screenshot({ path: `${outDir}/drag-${String(n).padStart(2, '0')}.png`, clip });

  await browser.close();
  console.log('wrote', n, 'frames ->', outDir);
})();

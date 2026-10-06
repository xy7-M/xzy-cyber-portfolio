// 通用工牌局部放大：node zoom_card.js <url> <out> <cxFrac> <cyFrac> <w> <h> <dsf>
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const [, , url = 'http://localhost:4173', out = '_tmp_work/shots/zoom.png',
    cxF = '0.5', cyF = '0.6', wS = '220', hS = '300', dsfS = '4'] = process.argv;
  const w = parseFloat(wS), h = parseFloat(hS), dsf = parseFloat(dsfS);
  fs.mkdirSync(out.replace(/[\\/][^\\/]+$/, ''), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dsf });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(() => document.getElementById('card')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await page.waitForTimeout(1200);
  await page.waitForSelector('#card canvas', { timeout: 30000 });
  await page.waitForTimeout(5000);

  const box = await (await page.$('#card canvas')).boundingBox();
  const cx = box.x + box.width * parseFloat(cxF);
  const cy = box.y + box.height * parseFloat(cyF);
  await page.screenshot({ path: out, clip: { x: cx - w / 2, y: cy - h / 2, width: w, height: h } });
  console.log('saved', out, `${w}x${h} @${dsf}x`);
  await browser.close();
})();

// 验证 portfolio 静态页里的 3D 工牌区块
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:4180/index.html';
  const outDir = process.argv[3] || '_read/shots';
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  const tally = new Map();
  const bump = k => tally.set(k, (tally.get(k) || 0) + 1);
  page.on('console', m => bump(`[${m.type()}] ${m.text().slice(0, 180)}`));
  page.on('pageerror', e => bump('[pageerror] ' + e.message.slice(0, 180)));
  const bad = [];
  page.on('requestfailed', r => bad.push(r.url() + ' :: ' + (r.failure() && r.failure().errorText)));
  page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });

  await page.goto(url, { waitUntil: 'load', timeout: 90000 });

  // 滚到工牌区块触发按需加载
  await page.evaluate(() => document.getElementById('badge')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await page.waitForTimeout(2000);

  // 等 canvas 出现（说明 bundle 已拉下来并挂载）
  let mounted = true;
  try {
    await page.waitForSelector('#badge canvas', { timeout: 45000 });
  } catch { mounted = false; }
  await page.waitForTimeout(5000);

  await page.screenshot({ path: `${outDir}/badge-section.png` });

  const box = await page.$('#badge');
  const b = await box.boundingBox();
  await page.screenshot({ path: `${outDir}/badge-block.png`, clip: b });

  // 拖拽
  const cvs = await page.$('#badge canvas');
  if (cvs) {
    const cb = await cvs.boundingBox();
    const cx = cb.x + cb.width * 0.5, cy = cb.y + cb.height * 0.62;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 20; i++) { await page.mouse.move(cx + i * 14, cy - i * 4, { steps: 2 }); await page.waitForTimeout(18); }
    await page.mouse.up();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${outDir}/badge-dragged.png`, clip: cb });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${outDir}/badge-settled.png`, clip: cb });
  }

  // 移动端
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await m.goto(url, { waitUntil: 'load', timeout: 90000 });
  await m.evaluate(() => document.getElementById('badge')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
  await m.waitForTimeout(9000);
  await m.screenshot({ path: `${outDir}/badge-mobile.png` });

  await browser.close();

  console.log('canvas mounted:', mounted);
  console.log('--- console tally ---');
  if (!tally.size) console.log('(clean)');
  [...tally.entries()].sort((a, b2) => b2[1] - a[1]).forEach(([k, v]) => console.log(`${String(v).padStart(5)}  ${k}`));
  console.log('--- failed / 4xx ---');
  console.log(bad.length ? [...new Set(bad)].join('\n') : '(none)');
})();

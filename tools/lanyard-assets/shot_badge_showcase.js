// 验证「点舞台空白处 → 弹出工牌正反面平面图」
// 用法: node shot_badge_showcase.js [url] [outDir]
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:4181/index.html';
  const outDir = process.argv[3] || '_read/shots';
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  const tally = new Map();
  const bump = k => tally.set(k, (tally.get(k) || 0) + 1);
  page.on('console', m => bump(`[${m.type()}] ${m.text().slice(0, 200)}`));
  page.on('pageerror', e => bump('[pageerror] ' + e.message.slice(0, 200)));

  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.getElementById('badge')?.scrollIntoView({ behavior: 'instant', block: 'center' }));

  let mounted = true;
  try { await page.waitForSelector('#badge canvas', { timeout: 60000 }); } catch { mounted = false; }
  await page.waitForTimeout(6000);

  await page.screenshot({ path: `${outDir}/sc-1-stage.png` });

  const stage = await page.$('.badge-stage');
  const sb = await stage.boundingBox();

  // 1) 点角落空白（离工牌远）→ 应弹出
  await page.mouse.click(sb.x + sb.width * 0.06, sb.y + sb.height * 0.10);
  await page.waitForTimeout(900);
  let opened = await page.$('.mxy-badge-modal');
  await page.screenshot({ path: `${outDir}/sc-2-open.png` });
  console.log('click empty corner → modal open:', !!opened);

  // 2) Esc 关闭
  if (opened) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    console.log('after Escape → modal open:', !!(await page.$('.mxy-badge-modal')));
    await page.screenshot({ path: `${outDir}/sc-3-closed.png` });
  }

  // 3) 重新打开后点遮罩关闭
  await page.mouse.click(sb.x + sb.width * 0.06, sb.y + sb.height * 0.10);
  await page.waitForTimeout(800);
  let reopened = !!(await page.$('.mxy-badge-modal'));
  console.log('reopen:', reopened);
  if (reopened) {
    await page.mouse.click(60, 60); // 遮罩上的一点
    await page.waitForTimeout(600);
    console.log('after backdrop click → modal open:', !!(await page.$('.mxy-badge-modal')));
  }

  // 4) 点工牌本体 → 不应弹出（只应拖拽）
  const cvs = await page.$('#badge canvas');
  const cb = await cvs.boundingBox();
  const cx = cb.x + cb.width * 0.5, cy = cb.y + cb.height * 0.62;
  await page.mouse.click(cx, cy);
  await page.waitForTimeout(800);
  console.log('click ON card → modal open (expect false):', !!(await page.$('.mxy-badge-modal')));
  await page.screenshot({ path: `${outDir}/sc-4-on-card.png` });

  // 5) 关闭按钮
  await page.mouse.click(sb.x + sb.width * 0.06, sb.y + sb.height * 0.10);
  await page.waitForTimeout(800);
  if (await page.$('.mxy-badge-modal')) {
    await page.click('.mxy-badge-modal-close');
    await page.waitForTimeout(600);
    console.log('after CLOSE btn → modal open:', !!(await page.$('.mxy-badge-modal')));
  }

  // 6) 移动端
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await m.goto(url, { waitUntil: 'load', timeout: 120000 });
  await m.evaluate(() => document.getElementById('badge')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await m.waitForTimeout(10000);
  const ms = await m.$('.badge-stage');
  if (ms) {
    const mb = await ms.boundingBox();
    await m.tap ? null : null;
    await m.mouse.click(mb.x + mb.width * 0.5, mb.y + mb.height * 0.06);
    await m.waitForTimeout(1200);
    console.log('mobile → modal open:', !!(await m.$('.mxy-badge-modal')));
    await m.screenshot({ path: `${outDir}/sc-5-mobile.png` });
  }

  await browser.close();
  console.log('canvas mounted:', mounted);
  console.log('--- console tally ---');
  if (!tally.size) console.log('(clean)');
  [...tally.entries()].sort((a, b2) => b2[1] - a[1]).forEach(([k, v]) => console.log(`${String(v).padStart(5)}  ${k}`));
})();

// 线上环境真机验证：走本机 Clash 代理访问 vercel.app（直连会超时）
const { chromium } = require('playwright');
const fs = require('fs');

const PROXY = process.argv[3] || 'http://127.0.0.1:7897';

(async () => {
  const url = process.argv[2] || 'https://xzy-cyber-profile.vercel.app/';
  const outDir = '_read/live';
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ proxy: { server: PROXY } });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  const tally = new Map();
  const bump = k => tally.set(k, (tally.get(k) || 0) + 1);
  page.on('console', m => bump(`[${m.type()}] ${m.text().slice(0, 160)}`));
  page.on('pageerror', e => bump('[pageerror] ' + e.message.slice(0, 160)));
  const bad = [];
  page.on('requestfailed', r => bad.push(r.url().slice(0, 120) + ' :: ' + (r.failure() && r.failure().errorText)));
  page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().slice(0, 120)); });

  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${outDir}/live-hero.png` });

  await page.evaluate(() => document.getElementById('badge')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
  let mounted = true;
  try {
    await page.waitForSelector('#badge canvas', { timeout: 60000 });
  } catch { mounted = false; }
  await page.waitForTimeout(7000);

  const box = await (await page.$('#badge')).boundingBox();
  await page.screenshot({ path: `${outDir}/live-badge.png`, clip: box });

  const state = await page.evaluate(() => {
    const stage = document.querySelector('.badge-stage');
    const hint = document.querySelector('.badge-hint');
    return {
      ready: document.documentElement.classList.contains('mxy-badge-ready'),
      children: [...stage.children].map(c => c.className || c.tagName),
      corners: stage.querySelectorAll('.corner').length,
      hintOpacity: hint ? getComputedStyle(hint).opacity : null,
      canvas: stage.querySelectorAll('canvas').length,
    };
  });

  // 拖拽一次
  const cvs = await page.$('#badge canvas');
  if (cvs) {
    const cb = await cvs.boundingBox();
    const cx = cb.x + cb.width / 2, cy = cb.y + cb.height * 0.62;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 18; i++) { await page.mouse.move(cx + i * 15, cy - i * 3, { steps: 2 }); await page.waitForTimeout(20); }
    await page.mouse.up();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${outDir}/live-dragged.png`, clip: cb });
  }

  await browser.close();

  console.log('canvas mounted:', mounted);
  console.log(JSON.stringify(state, null, 2));
  console.log('--- console ---');
  if (!tally.size) console.log('(clean)');
  [...tally.entries()].forEach(([k, v]) => console.log(`${String(v).padStart(4)}  ${k}`));
  console.log('--- failed / 4xx ---');
  console.log(bad.length ? [...new Set(bad)].join('\n') : '(none)');
})();

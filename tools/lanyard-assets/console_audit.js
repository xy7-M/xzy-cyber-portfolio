// 统计控制台消息（按类型/内容聚合），并报告失败请求
const { chromium } = require('playwright');

(async () => {
  const url = process.argv[2] || 'http://localhost:4173';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const tally = new Map();
  const bump = (k) => tally.set(k, (tally.get(k) || 0) + 1);

  page.on('console', m => bump(`[${m.type()}] ${m.text().slice(0, 160)}`));
  page.on('pageerror', e => bump(`[pageerror] ${e.message.slice(0, 160)}`));
  const failed = [];
  page.on('requestfailed', r => failed.push(`${r.url()} :: ${r.failure() && r.failure().errorText}`));
  page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });

  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(() => document.getElementById('card')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await page.waitForSelector('#card canvas', { timeout: 30000 });
  await page.waitForTimeout(9000);

  await browser.close();

  console.log('=== console tally ===');
  if (!tally.size) console.log('(clean)');
  [...tally.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`${String(v).padStart(5)}  ${k}`));
  console.log('\n=== failed / 4xx ===');
  console.log(failed.length ? [...new Set(failed)].join('\n') : '(none)');
})();

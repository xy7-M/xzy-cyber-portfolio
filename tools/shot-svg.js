/* 把 SVG 设计稿渲染成 PNG 预览，便于肉眼核对。
   用法：node tools/shot-svg.js <input.svg> <output.png> [width] */
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const input = path.resolve(process.argv[2]);
  const output = path.resolve(process.argv[3]);
  const width = parseInt(process.argv[4] || '900', 10);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 1 });
  await page.goto('file:///' + input.replace(/\\/g, '/'));
  const svg = await page.$('svg');
  await svg.screenshot({ path: output });
  await browser.close();
  console.log('wrote', output);
})();

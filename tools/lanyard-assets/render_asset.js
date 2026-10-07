// 把设计稿 HTML 精确光栅化为 PNG
// 用法: node render_asset.js <html> <outPng> <width> <height>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const [htmlPath, outPath, wArg, hArg] = process.argv.slice(2);
  const W = parseInt(wArg, 10);
  const H = parseInt(hArg, 10);

  // 仓库根目录：从本脚本位置向上三级（tools/lanyard-assets/ -> 根）
  const BASE = path.resolve(__dirname, '..', '..');
  const FONT = path.join(BASE, 'app/node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2');
  const fontB64 = fs.readFileSync(FONT).toString('base64');

  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/__GEIST_B64__/g, fontB64);

  const tmp = path.join(path.dirname(outPath), '_render_tmp.html');
  fs.writeFileSync(tmp, html);

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  });
  await page.goto('file:///' + tmp.replace(/\\/g, '/'));
  await page.waitForTimeout(900); // let fonts settle
  await page.evaluate(() => document.fonts.ready);

  const el = await page.$('#target');
  if (el) {
    await el.screenshot({ path: outPath });
  } else {
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: W, height: H } });
  }
  await browser.close();
  fs.unlinkSync(tmp);
  console.log('rendered ->', outPath, `${W}x${H}`);
})();

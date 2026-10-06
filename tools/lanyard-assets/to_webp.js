// PNG -> WebP（浏览器 canvas 编码，避免引入额外依赖）
// 用法: node to_webp.js <in.png> <out.webp> [quality]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const [inP, outP, qArg] = process.argv.slice(2);
  const q = parseFloat(qArg || '0.92');
  const b64 = fs.readFileSync(inP).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');
  const dataUrl = await page.evaluate(async ([b64, q]) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.getElementById('c');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return c.toDataURL('image/webp', q);
  }, [b64, q]);
  await browser.close();
  const out = Buffer.from(dataUrl.split(',')[1], 'base64');
  fs.mkdirSync(path.dirname(outP), { recursive: true });
  fs.writeFileSync(outP, out);
  console.log(`${path.basename(inP)} ${(fs.statSync(inP).size / 1024).toFixed(0)}KB -> ${path.basename(outP)} ${(out.length / 1024).toFixed(0)}KB`);
})();

// 把长图切片以便逐段阅读
// 用法: node slice_image.js <in.png> <outDir> <sliceH>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const [inP, outDir, hArg] = process.argv.slice(2);
  const sliceH = parseInt(hArg || '1000', 10);
  fs.mkdirSync(outDir, { recursive: true });

  const b64 = fs.readFileSync(inP).toString('base64');
  const isJpg = inP.toLowerCase().endsWith('.jpg') || inP.toLowerCase().endsWith('.jpeg');
  const uri = `data:image/${isJpg ? 'jpeg' : 'png'};base64,` + b64;

  const browser = await chromium.launch();
  const probe = await browser.newPage();
  await probe.setContent(`<img id="i" src="${uri}">`);
  const { w, h } = await probe.evaluate(async () => {
    const i = document.getElementById('i');
    await i.decode();
    return { w: i.naturalWidth, h: i.naturalHeight };
  });
  await probe.close();
  console.log('source', w, 'x', h);

  const n = Math.ceil(h / sliceH);
  for (let k = 0; k < n; k++) {
    const y = k * sliceH;
    const hh = Math.min(sliceH, h - y);
    const page = await browser.newPage({ viewport: { width: w, height: hh } });
    await page.setContent(`<body style="margin:0"><img src="${uri}" style="position:absolute;top:${-y}px;left:0;width:${w}px;height:${h}px"></body>`);
    await page.waitForTimeout(400);
    const out = path.join(outDir, `s${String(k).padStart(2, '0')}.png`);
    await page.screenshot({ path: out });
    console.log('saved', out, `(y ${y}..${y + hh})`);
    await page.close();
  }
  await browser.close();
})();

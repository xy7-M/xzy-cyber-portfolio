/* 生成 GOAL 区块 before/after 对比图
   用法：node tools/goal-compare.js <beforePng> <afterPng> <outPng> */
const path = require('path');
const sharp = require(path.resolve(__dirname, '..', 'app', 'node_modules', 'sharp'));

const [before, after, out] = process.argv.slice(2);

(async () => {
  const W = 1418;
  const label = (h) => Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}">` +
    `<rect width="${W}" height="${h}" fill="#0b1020"/></svg>`
  );

  const b = await sharp(before).resize(W).toBuffer();
  const a = await sharp(after).resize(W).toBuffer();
  const bm = await sharp(b).metadata();
  const am = await sharp(a).metadata();

  const GAP = 24;
  const totalH = bm.height + am.height + GAP;
  await sharp({ create: { width: W, height: totalH, channels: 3, background: '#0b1020' } })
    .composite([
      { input: b, top: 0, left: 0 },
      { input: a, top: bm.height + GAP, left: 0 },
    ])
    .png().toFile(out);
  console.log('wrote', out, W + 'x' + totalH);
})().catch(e => { console.error(e); process.exit(1); });

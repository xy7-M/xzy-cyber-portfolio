/* 从整页截图里裁出 GOAL 志向内核区块，用于人工核对
   用法：node tools/crop-goal.js <整页png> <输出png> <y起点> <高度> */
const path = require('path');
const sharp = require(path.join(__dirname, '..', 'app', 'node_modules', 'sharp'));

const [src, out, y, h] = process.argv.slice(2);
sharp(src)
  .extract({ left: 0, top: Number(y) || 0, width: 1440, height: Number(h) || 900 })
  .toFile(out)
  .then(() => console.log('wrote ' + out))
  .catch(e => { console.error(e); process.exit(1); });

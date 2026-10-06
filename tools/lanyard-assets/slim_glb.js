// 把 card.glb 内嵌的 React Bits 原始图集（2.29MB，已被自定义正反面素材完全
// 覆盖）替换成一张 4x4 占位 PNG，几何 / UV / 材质全部不动。
// 用法: node slim_glb.js <in.glb> <out.glb>
const fs = require('fs');
const zlib = require('zlib');

// ---- 生成一张 4x4 的 #0a1120 PNG ----
function tinyPng(r, g, b, size = 4) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  let table = null;
  function crc32(buf) {
    if (!table) {
      table = new Int32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c;
      }
    }
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return c ^ 0xFFFFFFFF;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8bit RGB
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    const off = y * (1 + size * 3);
    raw[off] = 0;
    for (let x = 0; x < size; x++) {
      raw[off + 1 + x * 3] = r; raw[off + 2 + x * 3] = g; raw[off + 3 + x * 3] = b;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const [inP, outP] = process.argv.slice(2);
const buf = fs.readFileSync(inP);

let off = 12, json = null, jsonLen = 0, jsonOff = 0, binOff = null, binLen = 0;
while (off < buf.length) {
  const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
  if (type === 0x4E4F534A) { json = JSON.parse(buf.slice(off + 8, off + 8 + len).toString('utf8')); jsonLen = len; jsonOff = off + 8; }
  if (type === 0x004E4942) { binOff = off + 8; binLen = len; }
  off += 8 + len;
}
const g = json;
const imgIdx = g.images[0].bufferView;
const bv = g.bufferViews[imgIdx];
if (imgIdx !== g.bufferViews.length - 1) throw new Error('image bufferView 不是最后一个，不能安全截断');
if (bv.byteOffset + bv.byteLength !== g.buffers[0].byteLength) throw new Error('image 未延伸到 buffer 末尾');

const geom = buf.slice(binOff, binOff + bv.byteOffset);
const png = tinyPng(0x0a, 0x11, 0x20, 4);

// 4 字节对齐
const padBin = (4 - (png.length % 4)) % 4;
const newBin = Buffer.concat([geom, png, Buffer.alloc(padBin)]);

bv.byteLength = png.length;
g.buffers[0].byteLength = newBin.length;

// ---- 重新写出 GLB ----
let jsonStr = JSON.stringify(g);
while (jsonStr.length % 4 !== 0) jsonStr += ' ';
const jsonBuf = Buffer.from(jsonStr, 'utf8');

const total = 12 + 8 + jsonBuf.length + 8 + newBin.length;
const out = Buffer.alloc(total);
out.writeUInt32LE(0x46546C67, 0);   // magic "glTF"
out.writeUInt32LE(2, 4);
out.writeUInt32LE(total, 8);
out.writeUInt32LE(jsonBuf.length, 12);
out.writeUInt32LE(0x4E4F534A, 16);  // "JSON"
jsonBuf.copy(out, 20);
out.writeUInt32LE(newBin.length, 20 + jsonBuf.length);
out.writeUInt32LE(0x004E4942, 24 + jsonBuf.length); // "BIN\0"
newBin.copy(out, 28 + jsonBuf.length);

fs.writeFileSync(outP, out);
console.log(`${inP} ${(buf.length / 1024).toFixed(0)}KB -> ${outP} ${(out.length / 1024).toFixed(0)}KB`);
console.log(`  几何 ${(geom.length / 1024).toFixed(0)}KB + 占位纹理 ${png.length}B`);

// 确认 UV 与卡面朝向的对应：v=0 对应卡面顶部还是底部？u=0 对应左侧还是右侧？
const fs = require('fs');
const buf = fs.readFileSync(process.argv[2]);
let off = 12, json = null, binOff = null;
while (off < buf.length) {
  const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
  if (type === 0x4E4F534A) json = JSON.parse(buf.slice(off + 8, off + 8 + len).toString('utf8'));
  if (type === 0x004E4942) binOff = off + 8;
  off += 8 + len;
}
const g = json;
function readAccessor(idx) {
  const a = g.accessors[idx], bv = g.bufferViews[a.bufferView];
  const compSize = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }[a.componentType];
  const numComp = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  const stride = bv.byteStride || compSize * numComp;
  const base = binOff + (bv.byteOffset || 0) + (a.byteOffset || 0);
  const out = [];
  for (let i = 0; i < a.count; i++) {
    const rec = [];
    for (let c = 0; c < numComp; c++) {
      const p = base + i * stride + c * compSize;
      rec.push(a.componentType === 5126 ? buf.readFloatLE(p)
        : a.componentType === 5125 ? buf.readUInt32LE(p)
        : a.componentType === 5123 ? buf.readUInt16LE(p) : buf.readUInt8(p));
    }
    out.push(rec);
  }
  return out;
}
const prim = g.meshes[0].primitives[0];
const POS = readAccessor(prim.attributes.POSITION);
const NRM = readAccessor(prim.attributes.NORMAL);
const UV = readAccessor(prim.attributes.TEXCOORD_0);
const IDX = readAccessor(prim.indices).map(r => r[0]);

for (const [label, want] of [['FRONT (nz>0.5)', 1], ['BACK (nz<-0.5)', -1]]) {
  const set = new Set();
  for (let t = 0; t < IDX.length; t += 3) {
    const tri = [IDX[t], IDX[t + 1], IDX[t + 2]];
    const nz = tri.reduce((s, i) => s + NRM[i][2], 0) / 3;
    if ((want > 0 && nz > 0.5) || (want < 0 && nz < -0.5)) tri.forEach(i => set.add(i));
  }
  const pts = [...set].map(i => ({ x: POS[i][0], y: POS[i][1], u: UV[i][0], v: UV[i][1] }));
  // 取四个极端点
  const byYmin = pts.reduce((a, b) => (b.y < a.y ? b : a));
  const byYmax = pts.reduce((a, b) => (b.y > a.y ? b : a));
  const byXmin = pts.reduce((a, b) => (b.x < a.x ? b : a));
  const byXmax = pts.reduce((a, b) => (b.x > a.x ? b : a));
  console.log(`\n=== ${label} ===`);
  console.log(`  最低点 y=${byYmin.y.toFixed(4)}  ->  u=${byYmin.u.toFixed(4)} v=${byYmin.v.toFixed(4)}`);
  console.log(`  最高点 y=${byYmax.y.toFixed(4)}  ->  u=${byYmax.u.toFixed(4)} v=${byYmax.v.toFixed(4)}`);
  console.log(`  最左点 x=${byXmin.x.toFixed(4)}  ->  u=${byXmin.u.toFixed(4)} v=${byXmin.v.toFixed(4)}`);
  console.log(`  最右点 x=${byXmax.x.toFixed(4)}  ->  u=${byXmax.u.toFixed(4)} v=${byXmax.v.toFixed(4)}`);
  // 相关系数
  const n = pts.length;
  const mean = k => pts.reduce((s, p) => s + p[k], 0) / n;
  const mx = mean('x'), my = mean('y'), mu = mean('u'), mv = mean('v');
  let sxy = 0, suv = 0, sxx = 0, suu = 0, syv = 0, syy = 0, svv = 0;
  pts.forEach(p => {
    sxy += (p.x - mx) * (p.u - mu); sxx += (p.x - mx) ** 2; suu += (p.u - mu) ** 2;
    syv += (p.y - my) * (p.v - mv); syy += (p.y - my) ** 2; svv += (p.v - mv) ** 2;
  });
  console.log(`  corr(x,u) = ${(sxy / Math.sqrt(sxx * suu)).toFixed(3)}   -> u 随 x ${sxy > 0 ? '增大' : '减小'}`);
  console.log(`  corr(y,v) = ${(syv / Math.sqrt(syy * svv)).toFixed(3)}   -> v 随 y ${syv > 0 ? '增大' : '减小'}`);
}

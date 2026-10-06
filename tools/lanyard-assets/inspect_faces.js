// 按法线方向分组三角形，分别求「正面/背面」的 UV 包围盒与物理包围盒
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
  const a = g.accessors[idx];
  const bv = g.bufferViews[a.bufferView];
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

// ---- card mesh = 0 ----
const prim = g.meshes[0].primitives[0];
const POS = readAccessor(prim.attributes.POSITION);
const NRM = readAccessor(prim.attributes.NORMAL);
const UV = readAccessor(prim.attributes.TEXCOORD_0);
const IDX = readAccessor(prim.indices).map(r => r[0]);

const groups = { front: [], back: [], side: [] };
for (let t = 0; t < IDX.length; t += 3) {
  const [a, b, c] = [IDX[t], IDX[t + 1], IDX[t + 2]];
  const nz = (NRM[a][2] + NRM[b][2] + NRM[c][2]) / 3;
  const key = nz > 0.5 ? 'front' : nz < -0.5 ? 'back' : 'side';
  groups[key].push([a, b, c]);
}

const stats = {};
for (const [k, tris] of Object.entries(groups)) {
  if (!tris.length) continue;
  const uvs = [], poss = [];
  tris.forEach(tr => tr.forEach(i => { uvs.push(UV[i]); poss.push(POS[i]); }));
  const uMin = Math.min(...uvs.map(v => v[0])), uMax = Math.max(...uvs.map(v => v[0]));
  const vMin = Math.min(...uvs.map(v => v[1])), vMax = Math.max(...uvs.map(v => v[1]));
  const xMin = Math.min(...poss.map(p => p[0])), xMax = Math.max(...poss.map(p => p[0]));
  const yMin = Math.min(...poss.map(p => p[1])), yMax = Math.max(...poss.map(p => p[1]));
  stats[k] = { tris: tris.length, uMin, uMax, vMin, vMax, xMin, xMax, yMin, yMax };
  console.log(`\n[${k}] tris=${tris.length}`);
  console.log(`  UV  u:[${uMin.toFixed(4)}, ${uMax.toFixed(4)}]  v:[${vMin.toFixed(4)}, ${vMax.toFixed(4)}]`);
  console.log(`      -> uvRect x=${uMin.toFixed(4)} y=${vMin.toFixed(4)} w=${(uMax - uMin).toFixed(4)} h=${(vMax - vMin).toFixed(4)}`);
  console.log(`  POS x:[${xMin.toFixed(4)}, ${xMax.toFixed(4)}] w=${(xMax - xMin).toFixed(4)}`);
  console.log(`      y:[${yMin.toFixed(4)}, ${yMax.toFixed(4)}] h=${(yMax - yMin).toFixed(4)}`);
  console.log(`  face aspect (W/H) = ${((xMax - xMin) / (yMax - yMin)).toFixed(4)}`);
}

// 目标：纹理上不被拉伸 —— 物理宽高比 应等于 uvRect 在像素上的宽高比
const AW = 1678, AH = 1677;
console.log('\n=== 无拉伸所需的设计比例 ===');
for (const k of ['front', 'back']) {
  const s = stats[k];
  if (!s) continue;
  const pxW = (s.uMax - s.uMin) * AW;
  const pxH = (s.vMax - s.vMin) * AH;
  console.log(`${k}: uvRect 像素 ${pxW.toFixed(1)} x ${pxH.toFixed(1)}  -> 设计长宽比 ${(pxW / pxH).toFixed(4)}`);
  console.log(`      物理面 ${(s.xMax - s.xMin).toFixed(4)} x ${(s.yMax - s.yMin).toFixed(4)} -> 实际长宽比 ${((s.xMax - s.xMin) / (s.yMax - s.yMin)).toFixed(4)}`);
  console.log(`      若按物理比例出图，需要 uvRect 修正: w' = ${(s.uMax - s.uMin).toFixed(4)} h' = ${(s.vMax - s.vMin).toFixed(4)}`);
}

// 解析 GLB 的 JSON chunk，读出 mesh / material / texture / image 结构
const fs = require('fs');
const path = process.argv[2];
const buf = fs.readFileSync(path);

// GLB header: magic(4) version(4) length(4)
const magic = buf.readUInt32LE(0);
const version = buf.readUInt32LE(4);
const total = buf.readUInt32LE(8);
console.log('magic=0x' + magic.toString(16), 'version=' + version, 'length=' + total);

let off = 12;
let json = null;
const chunks = [];
while (off < total) {
  const len = buf.readUInt32LE(off);
  const type = buf.readUInt32LE(off + 4);
  chunks.push({ len, type: '0x' + type.toString(16), off: off + 8 });
  if (type === 0x4E4F534A) json = JSON.parse(buf.slice(off + 8, off + 8 + len).toString('utf8'));
  off += 8 + len;
}
console.log('chunks:', chunks.map(c => `${c.type}(${c.len})`).join(', '));

const g = json;
console.log('\n--- meshes ---');
(g.meshes || []).forEach((m, i) => {
  console.log(`[${i}] ${m.name}`);
  m.primitives.forEach((p, j) => {
    const attrs = Object.keys(p.attributes || {}).join(',');
    console.log(`   prim${j} material=${p.material} attrs={${attrs}} indices=${p.indices}`);
  });
});

console.log('\n--- materials ---');
(g.materials || []).forEach((m, i) => {
  const pbr = m.pbrMetallicRoughness || {};
  console.log(`[${i}] ${m.name} baseColorTexture=${JSON.stringify(pbr.baseColorTexture)} metallic=${pbr.metallicFactor} rough=${pbr.roughnessFactor}`);
});

console.log('\n--- textures / images ---');
(g.textures || []).forEach((t, i) => console.log(`tex[${i}] source=${t.source} sampler=${t.sampler}`));
(g.images || []).forEach((im, i) => {
  const bv = im.bufferView != null ? g.bufferViews[im.bufferView] : null;
  console.log(`img[${i}] name=${im.name} mime=${im.mimeType} uri=${im.uri || '(embedded)'} bufferView=${im.bufferView} bytes=${bv ? bv.byteLength : '?'}`);
});

console.log('\n--- nodes ---');
(g.nodes || []).forEach((n, i) => console.log(`[${i}] ${n.name} mesh=${n.mesh} children=${JSON.stringify(n.children || [])} scale=${JSON.stringify(n.scale || null)}`));

console.log('\n--- accessors (POSITION) ---');
(g.meshes || []).forEach((m, i) => {
  m.primitives.forEach((p, j) => {
    const a = g.accessors[p.attributes.POSITION];
    console.log(`mesh[${i}] prim${j} POSITION count=${a.count} min=${JSON.stringify(a.min)} max=${JSON.stringify(a.max)}`);
  });
});

console.log('\n--- TEXCOORD_0 ---');
(g.meshes || []).forEach((m, i) => {
  m.primitives.forEach((p, j) => {
    const t = p.attributes.TEXCOORD_0;
    if (t == null) { console.log(`mesh[${i}] prim${j} no UV`); return; }
    const a = g.accessors[t];
    console.log(`mesh[${i}] prim${j} TEXCOORD_0 count=${a.count} min=${JSON.stringify(a.min)} max=${JSON.stringify(a.max)}`);
  });
});

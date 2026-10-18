/* 验证粒子球：
   ① 拖拽粒子层已移除（#particleTrail 不存在）；
   ② 球体在自转（相隔 1s 的两帧像素有差异）；
   ③ 按数码雨线速度换算出的角速度/转一圈耗时（复算一遍公式，和代码对照）。

   用法：node tools/verify-sphere.js */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9345;
const fileUrl = 'file:///' + path.join(__dirname, '..', 'index.html')
  .replace(/\\/g, '/').replace(/ /g, '%20');

// 与 js/main.js 保持一致
const RAIN_SPEED = 0.05;
const RAIN_CELL = 16;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function getJson(p) {
  return new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port: PORT, path: p }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { res(d); } });
    }).on('error', rej);
  });
}

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new', '--hide-scrollbars', '--no-first-run',
    '--window-size=1440,900', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(__dirname, '.chrome-profile-sphere'),
    'about:blank',
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 40; i++) {
    try { targets = await getJson('/json/list'); if (targets && targets.length) break; } catch (e) { }
    await sleep(250);
  }
  if (!targets || !targets.length) throw new Error('无法连接 Chrome');
  const page = targets.find(t => t.type === 'page') || targets[0];

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  const send = (method, params = {}) => new Promise(res => {
    const i = ++id; pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evalJs = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result && r.result.result ? r.result.result.value : undefined;
  };

  // 取球体画布像素的指纹：统计非透明像素数 + 抽样求和，用来判断画面是否在变
  const fingerprint = () => evalJs(`(() => {
    const c = document.getElementById('particleCloud');
    const g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let n = 0, sum = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 8) { n++; sum += d[i] + d[i + 1] + d[i + 2]; }
    }
    return JSON.stringify({ n: n, sum: sum });
  })()`);

  await new Promise(r => { ws.onopen = r; });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: fileUrl });
  await sleep(2600);

  const hasTrail = await evalJs(`!!document.getElementById('particleTrail')`);
  const hasSpinClass = await evalJs(`/is-spinning/.test(document.documentElement.className)`);
  const vw = await evalJs('window.innerWidth');
  const vh = await evalJs('window.innerHeight');

  const f1 = JSON.parse(await fingerprint());
  await sleep(1000);
  const f2 = JSON.parse(await fingerprint());

  // 复算角速度
  const R = Math.min(vw, vh) * 0.46;
  const surfacePxPerSec = RAIN_SPEED * RAIN_CELL * 60;
  const omega = surfacePxPerSec / R;            // rad/s
  const period = (2 * Math.PI) / omega;         // 秒/圈

  console.log('#particleTrail 存在 :', hasTrail, hasTrail ? '← 应该已删除' : '（已移除）');
  console.log('html.is-spinning    :', hasSpinClass);
  console.log('视口                :', vw + 'x' + vh, ' 球半径 R =', R.toFixed(1));
  console.log('数码雨线速度        :', surfacePxPerSec + ' px/s  (0.05 格/帧 × 16px × 60fps)');
  console.log('球自转角速度        :', omega.toFixed(4), 'rad/s  ≈', (omega * 180 / Math.PI).toFixed(1), '°/s');
  console.log('转一圈耗时          :', period.toFixed(1), '秒');
  console.log('1s 内非透明像素     :', f1.n, '→', f2.n);
  console.log('1s 内像素指纹和     :', f1.sum, '→', f2.sum, f1.sum !== f2.sum ? '（有变化 → 在转）' : '（无变化 → 停住了）');

  ws.close(); chrome.kill();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

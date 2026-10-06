/* 验证「删除左右两栏 + 粒子雨」改动。
   检查项：
     1. 左右两栏 DOM 已消失（.badge-side / .side-*）
     2. 粒子雨 canvas 存在、尺寸正确、确实在动
     3. 工牌舞台居中
     4. 粒子雨不吃事件：工牌仍可拖拽
     5. 点空白处仍能唤起平面图弹窗
     6. prefers-reduced-motion 下不跑动画（只铺静态帧）
   用法：node tools/verify_rain.js [url] [outDir] */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = process.argv[2] || 'http://127.0.0.1:4184/index.html';
const OUT = process.argv[3] || path.join(__dirname, '_read/rain');
const PORT = 9360;

fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

function getJson(p) {
  return new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port: PORT, path: p }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch { res(d); } });
    }).on('error', rej);
  });
}

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--window-size=1440,900', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(__dirname, '.chrome-profile-rain'),
    'about:blank',
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 80; i++) {
    try { targets = await getJson('/json/list'); if (targets && targets.length) break; } catch { }
    await sleep(250);
  }
  const page = targets.find(t => t.type === 'page') || targets[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const logs = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') logs.push('[pageerror] ' + (m.params.exceptionDetails?.exception?.description || '').slice(0, 250));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      logs.push('[console.error] ' + (m.params.args || []).map(a => a.value ?? a.description ?? '').join(' ').slice(0, 200));
    }
  };
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async e => {
    const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
    const ex = r.result?.exceptionDetails;
    if (ex) return { err: (ex.exception?.description || ex.text || '').slice(0, 300) };
    return { value: r.result?.result?.value };
  };
  const shot = async (name, clip) => {
    const p = { format: 'png' };
    if (clip) p.clip = { ...clip, scale: 1 };
    const s = await send('Page.captureScreenshot', p);
    fs.writeFileSync(path.join(OUT, name), Buffer.from(s.result.data, 'base64'));
  };

  await new Promise(r => { ws.onopen = r; });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: URL_ });

  // 先滚到工牌区触发按需加载
  await sleep(4000);
  await evalJs(`(function(){ var e=document.getElementById('badge'); if(e) e.scrollIntoView({block:'center'}); return 1; })()`);
  for (let i = 0; i < 240; i++) {
    if (await evalJs(`!!document.querySelector('#badge canvas[data-mxy-badge], .badge-mount canvas')`) === true) break;
    await sleep(500);
  }
  await sleep(5000);
  await evalJs(`(function(){ document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); el.style.opacity='1'; el.style.transform='none'; }); return 1; })()`);
  await sleep(1200);

  // ---- 1) 左右两栏应已消失 ----
  const gone = await evalJs(`(function(){
    return JSON.stringify({
      badgeSide: document.querySelectorAll('.badge-side').length,
      sideRows: document.querySelectorAll('.side-rows').length,
      sideList: document.querySelectorAll('.side-list').length,
      sideMark: document.querySelectorAll('.side-mark').length,
      sideSign: document.querySelectorAll('.side-sign').length,
      badgeGrid: document.querySelectorAll('.badge-grid').length
    });
  })()`);
  const G = JSON.parse(gone.value);
  const allGone = Object.values(G).every(v => v === 0);
  console.log('[1] 左右两栏 DOM 已清除:', allGone ? '✓' : '✗', JSON.stringify(G));

  // ---- 2) 粒子雨 canvas ----
  const rain = await evalJs(`(function(){
    var cv = document.getElementById('badgeRain');
    if (!cv) return JSON.stringify({found:false});
    var r = cv.getBoundingClientRect();
    var cs = getComputedStyle(cv);
    return JSON.stringify({
      found: true,
      cssW: Math.round(r.width), cssH: Math.round(r.height),
      bufW: cv.width, bufH: cv.height,
      zIndex: cs.zIndex, pointerEvents: cs.pointerEvents,
      position: cs.position
    });
  })()`);
  console.log('[2] 粒子雨 canvas:', rain.value);

  // 采样一小块，隔 700ms 再采，比较 alpha 和 → 判断是否在动
  const sample = `(function(){
    var cv = document.getElementById('badgeRain');
    if (!cv) return -1;
    var t = document.createElement('canvas'); t.width = 260; t.height = 260;
    var tc = t.getContext('2d');
    tc.drawImage(cv, 0, 0, 260, 260, 0, 0, 260, 260);
    var d = tc.getImageData(0, 0, 260, 260).data;
    var sum = 0, nz = 0;
    for (var i = 3; i < d.length; i += 4) { if (d[i] > 0) { nz++; sum += d[i]; } }
    return JSON.stringify({ nz: nz, sum: sum });
  })()`;
  const s1 = JSON.parse((await evalJs(sample)).value);
  await sleep(700);
  const s2 = JSON.parse((await evalJs(sample)).value);
  await sleep(700);
  const s3 = JSON.parse((await evalJs(sample)).value);
  const animating = !(s1.sum === s2.sum && s2.sum === s3.sum);
  console.log('[2b] 雨幕像素采样:', JSON.stringify([s1, s2, s3]));
  console.log('[2c] 粒子雨确实在动:', animating ? '✓' : '✗ (静止)');
  console.log('[2d] 雨幕非空(画了东西):', s1.nz > 0 ? '✓' : '✗');

  // ---- 3) 工牌舞台居中 ----
  const center = await evalJs(`(function(){
    var st = document.querySelector('.badge-stage');
    var r = st.getBoundingClientRect();
    var leftGap = r.left;
    var rightGap = innerWidth - r.right;
    return JSON.stringify({ leftGap: Math.round(leftGap), rightGap: Math.round(rightGap),
      stageW: Math.round(r.width), stageH: Math.round(r.height), vw: innerWidth });
  })()`);
  const C = JSON.parse(center.value);
  console.log('[3] 舞台居中:', Math.abs(C.leftGap - C.rightGap) <= 2 ? '✓' : '✗', center.value);

  // ---- 4) 截图 ----
  const clipOf = async (sel, pad = 30) => {
    const r = await evalJs(`(function(){
      var e = document.querySelector('${sel}'); var r = e.getBoundingClientRect();
      return JSON.stringify({ x:0, y: Math.max(0, r.top + window.scrollY - ${pad}), w: innerWidth, h: r.height + ${pad * 2} });
    })()`);
    const v = JSON.parse(r.value);
    return { x: v.x, y: v.y, width: v.w, height: v.h };
  };
  const CLIP = await clipOf('#badge');
  await shot('rain-1-section.png', CLIP);
  await sleep(600);
  await shot('rain-2-section-later.png', CLIP);

  // ---- 5) 工牌仍可拖拽（雨幕不吃事件）----
  const cvsBox = await evalJs(`(function(){
    var cv = document.querySelector('.badge-mount canvas'); if (!cv) return null;
    var r = cv.getBoundingClientRect();
    return JSON.stringify({ x:r.x+r.width*0.5, y:r.y+r.height*0.62 });
  })()`);
  if (cvsBox.value) {
    const P = JSON.parse(cvsBox.value);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: P.x, y: P.y, buttons: 0 });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: P.x, y: P.y, button: 'left', buttons: 1, clickCount: 1 });
    for (let i = 1; i <= 14; i++) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: P.x + i * 13, y: P.y - i * 3, button: 'left', buttons: 1 });
      await sleep(18);
    }
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: P.x + 182, y: P.y - 42, button: 'left', buttons: 0, clickCount: 1 });
    await sleep(1400);
    const modal = await evalJs(`!!document.querySelector('.mxy-badge-modal')`);
    console.log('[4] 拖拽工牌后未误触弹窗:', modal.value === false ? '✓' : '✗');
    await shot('rain-3-dragged.png', CLIP);
  }

  // ---- 6) 点空白仍能开平面图 ----
  const stageBox = await evalJs(`(function(){
    var st = document.querySelector('.badge-stage'); var r = st.getBoundingClientRect();
    return JSON.stringify({ x: r.x + r.width*0.06, y: r.y + r.height*0.08 });
  })()`);
  const S = JSON.parse(stageBox.value);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: S.x, y: S.y, buttons: 0 });
  await sleep(150);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: S.x, y: S.y, button: 'left', buttons: 1, clickCount: 1 });
  await sleep(40);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: S.x, y: S.y, button: 'left', buttons: 0, clickCount: 1 });
  await sleep(1300);
  const modal2 = await evalJs(`!!document.querySelector('.mxy-badge-modal')`);
  console.log('[5] 点空白 → 平面图弹窗:', modal2.value === true ? '✓' : '✗');
  if (modal2.value) { await shot('rain-4-modal.png'); }

  // ---- 7) reduced-motion 下应静止 ----
  const reduce = await evalJs(`(function(){
    var cv = document.getElementById('badgeRain');
    if (!cv) return -1;
    var t = document.createElement('canvas'); t.width=200; t.height=200;
    var tc = t.getContext('2d');
    tc.drawImage(cv, 0, 0, 200, 200, 0, 0, 200, 200);
    var d = tc.getImageData(0,0,200,200).data;
    var sum=0; for (var i=3;i<d.length;i+=4) sum+=d[i];
    return sum;
  })()`);
  console.log('[6] (正常模式) 雨幕像素和基线:', reduce.value);

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: URL_ });
  await sleep(5000);
  await evalJs(`(function(){ var e=document.getElementById('badge'); if(e) e.scrollIntoView({block:'center'}); return 1; })()`);
  await sleep(4000);
  const r1 = await evalJs(`(function(){
    var cv = document.getElementById('badgeRain');
    if (!cv) return -1;
    var t = document.createElement('canvas'); t.width=200; t.height=200;
    var tc = t.getContext('2d');
    tc.drawImage(cv, 0, 0, 200, 200, 0, 0, 200, 200);
    var d = tc.getImageData(0,0,200,200).data;
    var sum=0; for (var i=3;i<d.length;i+=4) sum+=d[i];
    return sum;
  })()`);
  await sleep(900);
  const r2 = await evalJs(`(function(){
    var cv = document.getElementById('badgeRain');
    if (!cv) return -1;
    var t = document.createElement('canvas'); t.width=200; t.height=200;
    var tc = t.getContext('2d');
    tc.drawImage(cv, 0, 0, 200, 200, 0, 0, 200, 200);
    var d = tc.getImageData(0,0,200,200).data;
    var sum=0; for (var i=3;i<d.length;i+=4) sum+=d[i];
    return sum;
  })()`);
  console.log('[7] reduced-motion 下两次采样:', r1.value, r2.value, '→', r1.value === r2.value ? '✓ 静止' : '✗ 仍在动');
  await shot('rain-5-reduced-motion.png');

  console.log('--- 错误日志 ---');
  console.log(logs.length ? [...new Set(logs)].join('\n') : '(clean)');

  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

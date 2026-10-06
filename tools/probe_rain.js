/* 聚焦诊断：粒子雨 canvas 是否存在、有无尺寸、是否在动、有无控制台报错。
   用法：node tools/probe_rain.js [url] */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = process.argv[2] || 'http://127.0.0.1:8788/index.html';
const PORT = 9366;
const OUT = path.join(__dirname, '_read/rain');
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
    '--user-data-dir=' + path.join(__dirname, '.chrome-profile-probe'),
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
    if (m.method === 'Runtime.exceptionThrown') logs.push('[pageerror] ' + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || '').slice(0, 300));
    if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) {
      logs.push('[' + m.params.type + '] ' + (m.params.args || []).map(a => a.value ?? a.description ?? '').join(' ').slice(0, 220));
    }
  };
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async e => {
    const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
    const ex = r.result?.exceptionDetails;
    if (ex) return { err: (ex.exception?.description || ex.text || '').slice(0, 400) };
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

  // 等 load 事件（17MB 本地也需一两秒）
  for (let i = 0; i < 120; i++) {
    const st = await evalJs('document.readyState');
    if (st.value === 'complete') break;
    await sleep(500);
  }
  console.log('readyState =', (await evalJs('document.readyState')).value);

  // 滚到工牌区
  await evalJs(`(function(){ var e=document.getElementById('badge'); if(e) e.scrollIntoView({block:'center'}); return 1; })()`);
  await sleep(1500);

  // A) 脚本是否解析成功（全局是否留下痕迹）
  const tagProbe = await evalJs(`(function(){
    var scripts = Array.prototype.slice.call(document.scripts);
    var rainTag = scripts.filter(function(s){ return s.textContent.indexOf('badgeRain') !== -1; });
    var cv = document.getElementById('badgeRain');
    var r = cv ? cv.getBoundingClientRect() : null;
    var cs = cv ? getComputedStyle(cv) : null;
    return JSON.stringify({
      scriptCount: scripts.length,
      rainScriptTags: rainTag.length,
      canvasFound: !!cv,
      cssW: r ? Math.round(r.width) : null,
      cssH: r ? Math.round(r.height) : null,
      bufW: cv ? cv.width : null,
      bufH: cv ? cv.height : null,
      zIndex: cs ? cs.zIndex : null,
      pointerEvents: cs ? cs.pointerEvents : null,
      position: cs ? cs.position : null,
      display: cs ? cs.display : null
    });
  })()`);
  console.log('[A] 结构:', tagProbe.value ?? tagProbe.err);

  // B) 像素采样 x3
  const sample = `(function(){
    var cv = document.getElementById('badgeRain');
    if (!cv) return -1;
    var t = document.createElement('canvas'); t.width = 300; t.height = 300;
    var tc = t.getContext('2d');
    try { tc.drawImage(cv, 0, 0, 300, 300, 0, 0, 300, 300); } catch(e) { return -2; }
    var d = tc.getImageData(0, 0, 300, 300).data;
    var sum = 0, nz = 0;
    for (var i = 3; i < d.length; i += 4) { if (d[i] > 0) { nz++; sum += d[i]; } }
    return JSON.stringify({ nz: nz, sum: sum });
  })()`;
  const s = [];
  for (let i = 0; i < 3; i++) { const v = await evalJs(sample); s.push(v.value); await sleep(600); }
  console.log('[B] 像素采样:', JSON.stringify(s));

  // C) 截图工牌区块
  const clipR = await evalJs(`(function(){
    var e = document.getElementById('badge');
    var r = e.getBoundingClientRect();
    return JSON.stringify({ x:0, y: Math.max(0, r.top + window.scrollY), w: innerWidth, h: Math.min(r.height, 900) });
  })()`);
  if (clipR.value) {
    const v = JSON.parse(clipR.value);
    await shot('probe-badge-section.png', { x: v.x, y: v.y, width: v.w, height: v.h });
    console.log('[C] 截图 probe-badge-section.png', JSON.stringify(v));
  }

  console.log('[D] 控制台/异常:');
  if (!logs.length) console.log('     (无)');
  else logs.slice(0, 30).forEach(l => console.log('   ', l));

  ws.close();
  chrome.kill();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });

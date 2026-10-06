/* 舞台特写 + 移动端，用于核对粒子雨在舞台内部的可见度。
   用法：node tools/_shot_stage.js [url] [outDir] */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = process.argv[2] || 'http://127.0.0.1:4184/index.html';
const OUT = process.argv[3] || path.join(__dirname, '_read/rain');
const PORT = 9362;
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
  // 线上 *.vercel.app 直连超时（cmcc 宽带），自动挂 Clash 代理；本地服务则必须直连
  const needProxy = /\.vercel\.app|\.now\.sh/.test(URL_);
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    ...(needProxy ? ['--proxy-server=http://127.0.0.1:7897'] : []),
    '--window-size=1440,900', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(__dirname, '.chrome-profile-stage'),
    'about:blank',
  ], { stdio: 'ignore' });
  console.log('proxy:', needProxy ? 'on (7897)' : 'off (local)');

  let t = null;
  for (let i = 0; i < 80; i++) { try { t = await getJson('/json/list'); if (t && t.length) break; } catch { } await sleep(250); }
  const page = t.find(x => x.type === 'page') || t[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (m, p = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const evalJs = async e => {
    const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) return { err: r.result.exceptionDetails.text };
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
  await sleep(4000);
  await evalJs(`(function(){ var e=document.getElementById('badge'); if(e) e.scrollIntoView({block:'center'}); return 1; })()`);
  for (let i = 0; i < 240; i++) { if (await evalJs(`!!document.querySelector('.badge-mount canvas')`) === true) break; await sleep(500); }
  await sleep(5000);
  await evalJs(`(function(){ document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); el.style.opacity='1'; el.style.transform='none'; }); return 1; })()`);
  await sleep(1200);

  // 舞台特写（绝对坐标）
  const clip = await evalJs(`(function(){
    var st = document.querySelector('.badge-stage');
    var r = st.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) });
  })()`);
  const C = JSON.parse(clip.value);
  await shot('stage-closeup.png', { x: C.x, y: C.y, width: C.w, height: C.h });
  console.log('stage clip:', JSON.stringify(C));

  // 舞台内部 vs 外部：分别采样雨幕像素密度
  const density = await evalJs(`(function(){
    var cv = document.getElementById('badgeRain');
    var st = document.querySelector('.badge-stage');
    var cr = cv.getBoundingClientRect(), sr = st.getBoundingClientRect();
    // 舞台在 canvas 坐标系里的位置
    var sx = sr.left - cr.left, sy = sr.top - cr.top;
    function count(x, y, w, h) {
      var t = document.createElement('canvas'); t.width = Math.round(w); t.height = Math.round(h);
      var tc = t.getContext('2d');
      tc.drawImage(cv, x, y, w, h, 0, 0, Math.round(w), Math.round(h));
      var d = tc.getImageData(0, 0, Math.round(w), Math.round(h)).data;
      var n = 0;
      for (var i = 3; i < d.length; i += 4) if (d[i] > 6) n++;
      return n;
    }
    var inside = count(sx, sy, sr.width, sr.height);
    // 取舞台左侧同高度的条带作对照
    var outside = count(0, sy, Math.max(1, sx - 4), sr.height);
    var outArea = Math.max(1, sx - 4) * sr.height;
    var inArea = sr.width * sr.height;
    return JSON.stringify({
      inside: inside, insideArea: Math.round(inArea), insidePerK: +(inside / inArea * 1000).toFixed(2),
      outside: outside, outsideArea: Math.round(outArea), outsidePerK: +(outside / outArea * 1000).toFixed(2)
    });
  })()`);
  console.log('雨幕密度 内/外:', density.value || JSON.stringify(density));

  // 移动端
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: URL_ });
  await sleep(5000);
  await evalJs(`(function(){ var e=document.getElementById('badge'); if(e) e.scrollIntoView({block:'center'}); return 1; })()`);
  await sleep(6000);
  await evalJs(`(function(){ document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); el.style.opacity='1'; el.style.transform='none'; }); return 1; })()`);
  await sleep(1200);
  await shot('stage-mobile.png');

  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

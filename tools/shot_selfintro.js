/* 旧版自我介绍站截图（CDP，无 playwright 依赖）
   用法：node tools/shot_selfintro.js [url] [outDir] */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = process.argv[2] || 'http://127.0.0.1:4182/index.html';
const OUT = process.argv[3] || path.join(__dirname, '_read/shots');
const PORT = 9350;

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
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=1440,900', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(__dirname, '.chrome-profile-si'),
    'about:blank',
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 60; i++) {
    try { targets = await getJson('/json/list'); if (targets && targets.length) break; } catch { }
    await sleep(250);
  }
  const page = targets.find(t => t.type === 'page') || targets[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const logs = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === 'Runtime.consoleAPICalled') logs.push('[c.' + m.params.type + '] ' + (m.params.args || []).map(a => a.value ?? a.description ?? a.type).join(' ').slice(0, 200));
    if (m.method === 'Runtime.exceptionThrown') logs.push('[pageerror] ' + (m.params.exceptionDetails?.exception?.description || '').slice(0, 250));
  };
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async e => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); const ex = r.result?.exceptionDetails; if (ex) return { err: (ex.exception?.description || ex.text || '').slice(0, 250) }; return { value: r.result?.result?.value }; };
  const shot = async (name) => {
    const s = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, name), Buffer.from(s.result.data, 'base64'));
  };

  await new Promise(r => { ws.onopen = r; });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: URL_ });
  await sleep(7000);

  const info = await evalJs(`(function(){
    return JSON.stringify({
      title: document.title,
      scrollH: document.documentElement.scrollHeight,
      vh: innerHeight,
      sections: [].map.call(document.querySelectorAll('section,[id]'), function(e){ return e.id; }).filter(Boolean),
      hasAudio: !!document.querySelector('audio'),
      bodyBg: getComputedStyle(document.body).backgroundColor
    });
  })()`);
  console.log(info.value || JSON.stringify(info));

  await shot('si-1-top.png');

  // 向下滚几屏
  const H = await evalJs(`document.documentElement.scrollHeight`);
  const total = Number(H.value) || 3000;
  for (let i = 1; i <= 3; i++) {
    await evalJs(`window.scrollTo(0, ${Math.round(total * i / 4)}); 1`);
    await sleep(1400);
    await shot(`si-${i + 1}-scroll${i}.png`);
  }

  // 移动端
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: URL_ });
  await sleep(6000);
  await shot('si-5-mobile.png');

  console.log('--- logs ---');
  console.log(logs.length ? logs.join('\n') : '(clean)');
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

/* 量元素尺寸：在指定视口下打开页面，打印若干选择器的宽高与关键间距。
   用法：node tools/measure.js [视口宽] [视口高] [选择器...]
   例：  node tools/measure.js 390 844 .panel-icon .archive-card */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9347;
const VW = Number(process.argv[2]) || 390;
const VH = Number(process.argv[3]) || 844;
const SELECTORS = process.argv.slice(4);
if (!SELECTORS.length) SELECTORS.push('body');

const fileUrl = 'file:///' + path.join(__dirname, '..', 'index.html')
  .replace(/\\/g, '/').replace(/ /g, '%20');

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
    '--window-size=' + Math.max(VW, 520) + ',' + VH,
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(__dirname, '.chrome-profile-measure'),
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

  await new Promise(r => { ws.onopen = r; });
  await send('Page.enable');
  await send('Runtime.enable');
  // 窄视口必须走设备模拟：Chrome 在 Windows 上有约 500px 的最小窗口宽度
  if (VW < 500) {
    await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: true });
  }
  await send('Page.navigate', { url: fileUrl });
  await sleep(2200);

  const out = await evalJs(`(() => {
    const sels = ${JSON.stringify(SELECTORS)};
    const rows = [];
    for (const s of sels) {
      const els = document.querySelectorAll(s);
      if (!els.length) { rows.push(s + '  → 未找到'); continue; }
      const r = els[0].getBoundingClientRect();
      const cs = getComputedStyle(els[0]);
      rows.push(s + '  ×' + els.length + '  ' + Math.round(r.width) + '×' + Math.round(r.height) +
        '  padding=' + cs.padding + '  font=' + cs.fontSize + '  gap=' + cs.rowGap);
    }
    rows.push('视口 ' + window.innerWidth + '×' + window.innerHeight);
    return rows.join('\\n');
  })()`);

  console.log(out);
  ws.close(); chrome.kill();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

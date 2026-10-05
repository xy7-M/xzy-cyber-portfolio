/* 验证「点舞台空白处 → 弹出工牌正反面平面图」。
   用 Chrome headless + CDP，无需 playwright/puppeteer。
   用法：node tools/lanyard-assets/verify_showcase.js [url] [outDir]
   默认 url = http://127.0.0.1:4181/index.html */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = process.argv[2] || 'http://127.0.0.1:4181/index.html';
const OUT = process.argv[3] || path.join(__dirname, '_read/shots');
const PORT = 9336;

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
    '--user-data-dir=' + path.join(__dirname, '.chrome-profile'),
    'about:blank',
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 60; i++) {
    try { targets = await getJson('/json/list'); if (targets && targets.length) break; } catch { }
    await sleep(250);
  }
  if (!targets || !targets.length) throw new Error('无法连接 Chrome');
  const page = targets.find(t => t.type === 'page') || targets[0];

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const logs = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === 'Runtime.consoleAPICalled') {
      logs.push('[console.' + m.params.type + '] ' + (m.params.args || []).map(a => a.value ?? a.description ?? a.type).join(' ').slice(0, 200));
    }
    if (m.method === 'Runtime.exceptionThrown') {
      logs.push('[pageerror] ' + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || '').slice(0, 240));
    }
  };
  const send = (method, params = {}) => new Promise(res => {
    const i = ++id; pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evalJs = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    const ex = r.result?.exceptionDetails;
    if (ex) return { err: (ex.exception?.description || ex.text || 'unknown').slice(0, 300) };
    return { value: r.result?.result?.value };
  };
  const shot = async (name, clip) => {
    const p = { format: 'png' };
    if (clip) p.clip = { ...clip, scale: 1 };
    const s = await send('Page.captureScreenshot', p);
    fs.writeFileSync(path.join(OUT, name), Buffer.from(s.result.data, 'base64'));
  };
  const move = (x, y) => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 });
  const click = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
    await sleep(40);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  };
  const key = async (k) => {
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: k === 'Escape' ? 27 : 0, key: k });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: k === 'Escape' ? 27 : 0, key: k });
  };

  await new Promise(r => { ws.onopen = r; });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: URL_ });

  // 先滚到工牌区块，触发 IntersectionObserver 按需加载
  await evalJs(`(function(){ var el=document.querySelector('.badge-stage'); if(el) el.scrollIntoView({ block:'center' }); return true; })()`);
  await sleep(1200);

  // 等 canvas 出现（说明 bundle 已 Blob+import 并挂载）
  let mounted = false;
  for (let i = 0; i < 300; i++) {
    const r = await evalJs(`!!document.querySelector('#badge canvas')`);
    if (r.value === true) { mounted = true; break; }
    await sleep(500);
  }
  if (!mounted) throw new Error('canvas 未能挂载：#badge canvas 始终不存在');
  await sleep(6000);

  // 再滚一次（确保布局稳定后取到最终几何）
  const geo = await evalJs(`(function () {
    var el = document.querySelector('.badge-stage');
    var cv = document.querySelector('#badge canvas');
    if (!el || !cv) return null;
    el.scrollIntoView({ block: 'center' });
    var r = el.getBoundingClientRect();
    var c = cv.getBoundingClientRect();
    return JSON.stringify({ stage: { x:r.x, y:r.y, w:r.width, h:r.height }, canvas: { x:c.x, y:c.y, w:c.width, h:c.height } });
  })()`);
  const G = geo.value ? JSON.parse(geo.value) : null;
  if (!G) throw new Error('找不到 .badge-stage：' + JSON.stringify(geo));
  console.log('canvas mounted:', mounted, '| stage', JSON.stringify(G.stage));
  await sleep(1500);
  await shot('sc-1-stage.png', { x: G.stage.x, y: G.stage.y, width: G.stage.w, height: G.stage.h });

  const has = async () => (await evalJs(`!!document.querySelector('.mxy-badge-modal')`)).value === true;
  const EMPTY = { x: G.stage.x + G.stage.w * 0.05, y: G.stage.y + G.stage.h * 0.08 };
  const CARD = { x: G.canvas.x + G.canvas.w * 0.5, y: G.canvas.y + G.canvas.h * 0.62 };

  // 1) 点空白角落 → 打开
  await move(EMPTY.x, EMPTY.y); await sleep(120); await click(EMPTY.x, EMPTY.y);
  await sleep(1200);
  console.log('[1] click EMPTY → modal open:', await has());
  await shot('sc-2-open.png');

  // 2) Esc 关闭
  await key('Escape'); await sleep(700);
  console.log('[2] Escape → modal open (expect false):', await has());

  // 3) 重开 → 点遮罩关闭
  await click(EMPTY.x, EMPTY.y); await sleep(1000);
  const re = await has();
  console.log('[3] reopen:', re);
  if (re) {
    await move(40, 40); await sleep(100); await click(40, 40); await sleep(800);
    console.log('[3] backdrop click → modal open (expect false):', await has());
  }

  // 4) 点工牌本体 → 不弹
  await move(CARD.x, CARD.y); await sleep(120); await click(CARD.x, CARD.y);
  await sleep(1200);
  console.log('[4] click ON card → modal open (expect false):', await has());

  // 5) 关闭按钮
  await click(EMPTY.x, EMPTY.y); await sleep(1000);
  const fifth = await evalJs(`(() => {
    const b = document.querySelector('.mxy-badge-modal-close');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return JSON.stringify({ x: r.x + r.width/2, y: r.y + r.height/2 });
  })()`);
  if (fifth.value) {
    const b = JSON.parse(fifth.value);
    await move(b.x, b.y); await sleep(100); await click(b.x, b.y); await sleep(800);
    console.log('[5] CLOSE button → modal open (expect false):', await has());
  } else {
    console.log('[5] CLOSE button not found');
  }

  // 6) 拖拽工牌仍要正常工作（拖动后不应弹窗）
  await move(CARD.x, CARD.y);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: CARD.x, y: CARD.y, button: 'left', buttons: 1, clickCount: 1 });
  for (let i = 1; i <= 16; i++) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: CARD.x + i * 12, y: CARD.y - i * 3, button: 'left', buttons: 1 });
    await sleep(18);
  }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: CARD.x + 192, y: CARD.y - 48, button: 'left', buttons: 0, clickCount: 1 });
  await sleep(1200);
  console.log('[6] after DRAG → modal open (expect false):', await has());
  await shot('sc-4-dragged.png', { x: G.stage.x, y: G.stage.y, width: G.stage.w, height: G.stage.h });

  ws.close();
  chrome.kill();
  await sleep(300);

  console.log('--- console tally ---');
  if (!logs.length) console.log('(clean)');
  const tally = new Map();
  logs.forEach(l => tally.set(l, (tally.get(l) || 0) + 1));
  [...tally.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(String(v).padStart(4) + '  ' + k));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

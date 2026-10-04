/* 精确区域截图：以正常视口打开页面，滚动到指定元素后再截图，
   避免 vh 单位被超高视口破坏。
   用法：node tools/shot-el.js <选择器> <输出png> [视口宽] [视口高]
   例：  node tools/shot-el.js "#goal" out.png          → 1440x900
         node tools/shot-el.js "body" mobile.png 390 844 → 手机视口
   依赖：Chrome headless + CDP（无需 puppeteer） */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const fileUrl = 'file:///' + path.join(__dirname, '.shot-preview.html').replace(/\\/g, '/').replace(/ /g, '%20');

const selector = process.argv[2] || '#goal';
const out = process.argv[3] || path.join(__dirname, 'shot-el.png');
const VW = Number(process.argv[4]) || 1440;
const VH = Number(process.argv[5]) || 900;
const PRE_JS = process.argv[6] || '';
const PORT = 9333;

function getJson(p) {
  return new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port: PORT, path: p }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { res(d); } });
    }).on('error', rej);
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--window-size=' + VW + ',' + VH, '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(__dirname, '.chrome-profile'),
    'about:blank',
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 40; i++) {
    try { targets = await getJson('/json/list'); if (targets && targets.length) break; } catch (e) { }
    await sleep(250);
  }
  if (!targets || !targets.length) throw new Error('无法连接 Chrome');
  const page = targets.find(t => t.type === 'page') || targets[0];

  // Node 18+ 内置 WebSocket 全局对象，无需第三方依赖
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

  await new Promise(r => { ws.onopen = r; });
  await send('Page.enable');
  await send('Page.navigate', { url: fileUrl });

  // 轮询等待目标元素出现（最多 15s）
  let ready = false;
  for (let i = 0; i < 60; i++) {
    const chk = await send('Runtime.evaluate', {
      expression: `!!document.querySelector('${selector}')`, returnByValue: true,
    });
    if (chk.result && chk.result.result && chk.result.result.value === true) { ready = true; break; }
    await sleep(250);
  }
  if (!ready) throw new Error('页面未就绪，找不到元素 ' + selector);
  await sleep(600);

  // 可选：截图前先执行一段 JS（如点击按钮展开菜单）
  if (PRE_JS) {
    await send('Runtime.evaluate', { expression: PRE_JS });
    await sleep(700);
  }

  // 强制显示所有 reveal，并滚到目标元素原点
  await send('Runtime.evaluate', {
    expression: `(() => {
      document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('in');
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.transition = 'none';
      });
      const el = document.querySelector('${selector}');
      if (!el) return 'not-found';
      const r = el.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + r.top - 40);
      return JSON.stringify({ top: r.top, h: r.height });
    })()`,
    returnByValue: true,
  });
  await sleep(1800);

  // captureScreenshot 的 clip 使用「页面绝对坐标」，需叠加当前 scrollY
  const rect = await send('Runtime.evaluate', {
    expression: `(() => { const r = document.querySelector('${selector}').getBoundingClientRect();
      return JSON.stringify({
        x: 0,
        y: Math.max(0, r.top + window.scrollY),
        w: window.innerWidth,
        h: Math.min(r.height, window.innerHeight),
      }); })()`,
    returnByValue: true,
  });
  if (!rect.result || !rect.result.result || rect.result.result.value === undefined) {
    throw new Error('evaluate 失败: ' + JSON.stringify(rect));
  }
  const r = JSON.parse(rect.result.result.value);

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 },
  });
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log('wrote', out, r.w + 'x' + Math.round(r.h));

  ws.close(); chrome.kill();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

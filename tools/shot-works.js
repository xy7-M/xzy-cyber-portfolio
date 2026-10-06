/* 截图 portfolio/index.html 的 SELECTED WORKS 区块（避免首屏视频干扰）。
   直接打开 portfolio 页面，跳过 hero，滚到 #works 再截。
   用法：node tools/shot-works.js <输出png> [视口宽] [视口高] [额外CSS注入]
   例：  node tools/shot-works.js before.png
         node tools/shot-works.js after.png 1440 900 ".g-vignette{display:none}" */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT = path.join(__dirname, '..');
const TARGET = path.join(ROOT, 'portfolio', 'index.html');
const fileUrl = 'file:///' + TARGET.replace(/\\/g, '/').replace(/ /g, '%20');

const out = process.argv[2] || path.join(__dirname, 'shot-works.png');
const VW = Number(process.argv[3]) || 1440;
const VH = Number(process.argv[4]) || 900;
const EXTRA_CSS = process.argv[5] || '';
const PORT = 9345;

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
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=' + VW + ',' + VH, '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(__dirname, '.chrome-profile-works'),
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

  await new Promise(r => { ws.onopen = r; });
  await send('Page.enable');
  await send('Page.navigate', { url: fileUrl });

  let ready = false;
  for (let i = 0; i < 80; i++) {
    const chk = await send('Runtime.evaluate', {
      expression: `!!document.querySelector('#works')`, returnByValue: true,
    });
    if (chk.result && chk.result.result && chk.result.result.value === true) { ready = true; break; }
    await sleep(250);
  }
  if (!ready) throw new Error('页面未就绪');
  await sleep(1200);

  // 注入可选 CSS（before/after 对比用）
  if (EXTRA_CSS) {
    await send('Runtime.evaluate', {
      expression: `(() => { const s = document.createElement('style');
        s.textContent = ${JSON.stringify(EXTRA_CSS)}; document.head.appendChild(s); return 'ok'; })()`,
      returnByValue: true,
    });
    await sleep(400);
  }

  // 展开全部 reveal，滚到 #works 顶部
  await send('Runtime.evaluate', {
    expression: `(() => {
      document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('in');
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.transition = 'none';
      });
      const el = document.querySelector('#works');
      window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top);
      return 'ok';
    })()`,
    returnByValue: true,
  });
  await sleep(1600);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log('wrote', out, VW + 'x' + VH);

  ws.close(); chrome.kill();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

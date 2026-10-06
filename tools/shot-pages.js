/* 整页分段截图：用于核对底色改动后各区块是否协调。
   用法：node tools/shot-pages.js <输出前缀> [视口宽] [视口高] */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT = path.join(__dirname, '..');
const TARGET = path.join(ROOT, 'portfolio', 'index.html');
const fileUrl = 'file:///' + TARGET.replace(/\\/g, '/').replace(/ /g, '%20');

const prefix = process.argv[2] || path.join(__dirname, 'page');
const VW = Number(process.argv[3]) || 1440;
const VH = Number(process.argv[4]) || 900;
const PORT = 9351;

const getJson = p => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { res(d); } });
  }).on('error', rej);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=' + VW + ',' + VH, '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(__dirname, '.chrome-profile-pages'),
    'about:blank',
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 40; i++) {
    try { targets = await getJson('/json/list'); if (targets && targets.length) break; } catch (e) { }
    await sleep(250);
  }
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
  await sleep(3500);

  await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('.reveal').forEach(el=>{el.classList.add('in');el.style.opacity='1';el.style.transform='none';el.style.transition='none';});`,
    returnByValue: true,
  });
  await sleep(1200);

  const shots = [
    { name: 'hero', scroll: 0 },
    { name: 'badge', sel: '#badge' },
    { name: 'works', sel: '#works' },
    { name: 'colophon', sel: '.colophon' },
  ];

  for (const s of shots) {
    if (s.sel) {
      await send('Runtime.evaluate', {
        expression: `window.scrollTo(0, window.scrollY + document.querySelector('${s.sel}').getBoundingClientRect().top);`,
        returnByValue: true,
      });
    } else {
      await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${s.scroll});`, returnByValue: true });
    }
    await sleep(1400);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const out = prefix + '-' + s.name + '.png';
    fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
    console.log('wrote', out);
  }

  ws.close(); chrome.kill();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

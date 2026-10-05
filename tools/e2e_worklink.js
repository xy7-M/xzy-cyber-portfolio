/* 端到端：在线上作品集页点「WHO AM I」，确认新标签页真的打开了自我介绍站。
   线上 *.vercel.app 需走 Clash 7897，故 Chrome 也带 --proxy-server。
   用法：node tools/e2e_worklink.js */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROXY = '--proxy-server=http://127.0.0.1:7897';
const PORT = 9355;
const OUT = path.join(__dirname, '_read/e2e');
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
    PROXY,
    '--window-size=1440,900', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(__dirname, '.chrome-profile-e2e'),
    'about:blank',
  ], { stdio: 'ignore' });

  let t = null;
  for (let i = 0; i < 80; i++) { try { t = await getJson('/json/list'); if (t && t.length) break; } catch { } await sleep(250); }
  const page = t.find(x => x.type === 'page') || t[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async e => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r.result?.result?.value; };
  const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, name), Buffer.from(s.result.data, 'base64')); };

  await new Promise(r => { ws.onopen = r; });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Target.setDiscoverTargets', { discover: true });

  // 记录新开的 target（target=_blank 会新建 page target）
  const created = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Target.targetCreated') created.push(m.params.targetInfo);
  });

  console.log('→ 打开作品集页');
  await send('Page.navigate', { url: 'https://xzy-cyber-profile.vercel.app/' });
  await sleep(14000);
  await evalJs(`(function(){ var e=document.querySelector('#works'); if(e) e.scrollIntoView({block:'center'}); return 1; })()`);
  await sleep(2500);
  await evalJs(`(function(){ document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); el.style.opacity='1'; el.style.transform='none'; }); return 1; })()`);
  await sleep(1500);
  await shot('e2e-1-portfolio.png');

  // 点击前先枚举一次 target 列表
  const listBefore = (await getJson('/json/list')).filter(x => x.type === 'page').map(x => x.url);
  console.log('→ 点击前 page target 数:', listBefore.length);

  // 真实鼠标点击首条工作项
  const t2 = await evalJs(`(function(){ var a=document.querySelector('.work.is-external a'); var r=a.getBoundingClientRect(); return JSON.stringify({x:r.x+r.width*0.3, y:r.y+r.height/2}); })()`);
  const T = JSON.parse(t2);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: T.x, y: T.y, buttons: 0 });
  await sleep(300);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: T.x, y: T.y, button: 'left', buttons: 1, clickCount: 1 });
  await sleep(50);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: T.x, y: T.y, button: 'left', buttons: 0, clickCount: 1 });
  await sleep(9000);

  // 点击后再枚举（不依赖事件监听，更稳）
  const listAfter = (await getJson('/json/list')).filter(x => x.type === 'page').map(x => x.url);
  console.log('→ 点击后 page target 数:', listAfter.length);
  console.log('   targets:', JSON.stringify(listAfter, null, 0));

  const news = listAfter.filter(u => /xzy-self-intro/.test(u));
  console.log('→ 自我介绍站 target 数:', news.length);
  if (news.length) console.log('   url:', news[0]);

  // 切到新标签页截图
  if (news.length) {
    const t3 = await getJson('/json/list');
    const np = t3.find(x => x.type === 'page' && /xzy-self-intro/.test(x.url));
    if (np) {
      const ws2 = new WebSocket(np.webSocketDebuggerUrl);
      let id2 = 0; const pend2 = new Map();
      ws2.onmessage = e2 => { const m = JSON.parse(e2.data); if (m.id && pend2.has(m.id)) { pend2.get(m.id)(m); pend2.delete(m.id); } };
      const send2 = (method, params = {}) => new Promise(res => { const i = ++id2; pend2.set(i, res); ws2.send(JSON.stringify({ id: i, method, params })); });
      await new Promise(r => { ws2.onopen = r; });
      await send2('Page.enable'); await send2('Runtime.enable');
      await sleep(6000);
      const info = await send2('Runtime.evaluate', { expression: `JSON.stringify({title:document.title, url:location.href})`, returnByValue: true });
      console.log('→ 新标签页状态:', info.result?.result?.value);
      const s = await send2('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(OUT, 'e2e-2-selfintro.png'), Buffer.from(s.result.data, 'base64'));
      ws2.close();
    }
  }

  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

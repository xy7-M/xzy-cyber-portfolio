/* 按 URL 截图：正常视口打开真实页面，滚到指定元素后截图。
   与 shot-el.js 的区别是不走 tools/.shot-preview.html 快照 —— 直接打 index.html，
   所以改了 css/js 之后无需重新生成预览页即可看到效果。

   用法：node tools/shot-url.js <选择器> <输出png> [视口宽] [视口高] [页面路径]
   例：  node tools/shot-url.js "#identity" out.png 1440 900
         node tools/shot-url.js "#identity" mobile.png 390 844 index.html
   依赖：Chrome headless + CDP（无需 puppeteer） */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const selector = process.argv[2] || '#identity';
const out = process.argv[3] || path.join(__dirname, 'shot-url.png');
const VW = Number(process.argv[4]) || 1440;
const VH = Number(process.argv[5]) || 900;
const PAGE = process.argv[6] || 'index.html';
const CLIP_H = Number(process.argv[7]) || 0;   // 只截视口顶部这么高，用于放大看细节
const SCALE = Number(process.argv[8]) || 2;    // 配合 CLIP_H 的放大倍数
const CLIP_OFF = Number(process.argv[9]) || 0;  // 裁剪起点相对元素顶部的偏移（负值=往上多截）
const SCROLL_TO = Number(process.argv[10]) || 40; // 元素顶部停在视口往下多少 px 处
const PORT = 9337;

const fileUrl = 'file:///' + path.join(__dirname, '..', PAGE)
  .replace(/\\/g, '/').replace(/ /g, '%20');

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
    '--headless=new', '--hide-scrollbars', '--no-first-run',
    '--window-size=' + VW + ',' + VH, '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(__dirname, '.chrome-profile-url'),
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
  await send('Runtime.enable');
  await send('Page.navigate', { url: fileUrl });

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

  // 强制显示所有 reveal，并滚到目标元素（smooth 会拖时间，先关掉）
  await send('Runtime.evaluate', {
    expression: `(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('in');
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.transition = 'none';
      });
      const el = document.querySelector('${selector}');
      if (!el) return 'not-found';
      const r = el.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + r.top - ${SCROLL_TO});
      return JSON.stringify({ top: r.top, h: r.height });
    })()`,
    returnByValue: true,
  });
  // 等粒子云跑几帧再拍，否则拍到的是刚 seed 出来的初始姿态
  await sleep(2600);

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

  // CLIP_H > 0 才裁指定区域；否则直接拍当前视口。
  // 注意 clip 用的是页面绝对坐标，超出视口的部分需要 captureBeyondViewport 才不是黑块。
  const shotParams = { format: 'png' };
  if (CLIP_H > 0) {
    shotParams.clip = { x: 0, y: Math.max(0, r.y + CLIP_OFF), width: r.w, height: CLIP_H, scale: SCALE };
    shotParams.captureBeyondViewport = true;
  }
  const shot = await send('Page.captureScreenshot', shotParams);
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log('wrote', out, r.w + 'x' + Math.round(r.h));

  ws.close(); chrome.kill();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

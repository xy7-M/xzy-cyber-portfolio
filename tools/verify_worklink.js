/* 验证「01 WHO AM I → 自我介绍站」外链 + 悬停箭头
   用法：node tools/verify_worklink.js [url] [outDir] */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = process.argv[2] || 'http://127.0.0.1:4183/index.html';
const OUT = process.argv[3] || path.join(__dirname, '_read/shots');
const PORT = 9352;

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
    '--user-data-dir=' + path.join(__dirname, '.chrome-profile-wl'),
    'about:blank',
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 60; i++) {
    try { targets = await getJson('/json/list'); if (targets && targets.length) break; } catch { }
    await sleep(250);
  }
  const page = targets.find(t => t.type === 'page') || targets[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async e => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); const ex = r.result?.exceptionDetails; if (ex) return { err: (ex.exception?.description || ex.text || '').slice(0, 250) }; return { value: r.result?.result?.value }; };
  const shot = async (name, clip) => { const p = { format: 'png' }; if (clip) p.clip = { ...clip, scale: 1 }; const s = await send('Page.captureScreenshot', p); fs.writeFileSync(path.join(OUT, name), Buffer.from(s.result.data, 'base64')); };

  await new Promise(r => { ws.onopen = r; });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: URL_ });
  await sleep(4000);

  // 滚到 works 区块
  await evalJs(`(function(){ var e=document.querySelector('#works'); if(e) e.scrollIntoView({block:'center'}); return 1; })()`);
  await sleep(2500);
  await evalJs(`(function(){ document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); el.style.opacity='1'; el.style.transform='none'; }); return 1; })()`);
  await sleep(1500);

  // 1) 断言链接
  const link = await evalJs(`(function(){
    var a = document.querySelectorAll('.work a')[0];
    if (!a) return null;
    return JSON.stringify({
      href: a.getAttribute('href'),
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel'),
      cls: a.closest('li').className,
      arrowText: (a.querySelector('.w-go')||{}).textContent || null
    });
  })()`);
  console.log('[1] 首条工作项链接:', link.value || JSON.stringify(link));

  // 2) 其余条目应仍为站内锚点
  const others = await evalJs(`(function(){
    return JSON.stringify([].map.call(document.querySelectorAll('.work a'), function(a){ return a.getAttribute('href'); }));
  })()`);
  console.log('[2] 全部工作项 href:', others.value);

  // 3) 箭头元素几何 + 未 hover 的透明度
  const g = await evalJs(`(function(){
    var li = document.querySelector('.work.is-external');
    var el = li.querySelector('.w-go');
    var r = el.getBoundingClientRect();
    return JSON.stringify({ visible: r.width>0 && r.height>0, w:Math.round(r.width), h:Math.round(r.height), opacity:getComputedStyle(el).opacity });
  })()`);
  console.log('[3] 箭头几何/默认透明度:', g.value);

  // 4) 截图：未 hover（截首条工作项及其上下邻条）
  // 注意：Page.captureScreenshot 的 clip 用的是「页面绝对坐标」，
  // getBoundingClientRect 给的是视口坐标，必须叠加 scrollY，否则截到空白。
  const clipOf = async (sel, padTop = 40, padBottom = 320) => {
    const r = await evalJs(`(function(){
      var e = document.querySelector('${sel}');
      var r = e.getBoundingClientRect();
      return JSON.stringify({ x: 0, y: r.top + window.scrollY - ${padTop}, w: innerWidth, h: r.height + ${padTop + padBottom} });
    })()`);
    const v = JSON.parse(r.value);
    return { x: v.x, y: Math.max(0, v.y), width: v.w, height: v.h };
  };
  const CLIP = await clipOf('.work.is-external');
  await shot('wl-1-list.png', CLIP);

  // 5) hover 第一条 → 箭头应点亮
  const t = await evalJs(`(function(){ var a=document.querySelector('.work.is-external a'); var r=a.getBoundingClientRect(); return JSON.stringify({x:r.x+r.width*0.35, y:r.y+r.height/2}); })()`);
  const T = JSON.parse(t.value);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: T.x, y: T.y, buttons: 0 });
  await sleep(900);
  const hov = await evalJs(`(function(){
    var el = document.querySelector('.work.is-external .w-go');
    var cs = getComputedStyle(el);
    return JSON.stringify({ opacity: cs.opacity, transform: cs.transform });
  })()`);
  console.log('[5] hover 后箭头:', hov.value);
  await shot('wl-2-hover.png', CLIP);

  // 6) 断言点击会新开标签页（用拦截，不真的跳走）
  await evalJs(`(function(){ window.__opened=null; window.open = function(u){ window.__opened=u; return null; }; return 1; })()`);
  // 直接触发 click 让浏览器走 target=_blank 逻辑会被 window.open 覆盖
  const clicked = await evalJs(`(function(){
    var a=document.querySelector('.work.is-external a');
    a.click();
    return window.__opened;
  })()`);
  console.log('[6] click 后 window.open 收到:', clicked.value);

  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

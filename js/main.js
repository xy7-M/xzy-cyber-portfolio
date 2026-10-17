/* ============================================================
   赛博档案站脚本
   矩阵雨(两侧页边) / 开机引导 / 打字机 / 滚动入场 / 计数 / 导航
   ============================================================ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 字体就绪闸门 ----------
     矩阵雨用的是等宽字体，若在字体 swap 前就开跑，
     已落下的字符会带着旧字形永远留在尾迹里。
     等 document.fonts.ready 后再启动一次，让整屏重排为最终字形。 */
  const fontsReady = (document.fonts && document.fonts.ready)
    ? document.fonts.ready
    : Promise.resolve();

  /* ---------- 矩阵雨：只落两侧页边 ---------- */
  /* 慢速下落：每格约 1.6s 落一格 */
  /* 移动端（窄屏 ≤768px 或触摸设备）不启动矩阵雨：
     屏幕小、字符密，观感噪杂且耗电；电脑端保留。
     用 matchMedia 监听，跨越阈值时动态启停（如手机横竖屏切换、桌面拖拽窗口）。 */
  const rainMobileMQ = window.matchMedia('(max-width: 768px), (pointer: coarse)');
  const RAIN_SPEED = 0.05;
  const canvas = document.getElementById('matrix');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const symbols = '01'; // 二进制流：只用 0 与 1，代表计算机
    const fontSize = 16;
    let width = 0;
    let height = 0;
    let drops = [];
    let margin = 0;
    let maskOn = false;
    let raf = 0; // 当前动画帧句柄，0 表示未运行

    function updateMargin() {
      // 正文列宽与 .container 一致：min(1180px, 92%)；两侧页边归数码雨
      const wrapW = Math.min(width * 0.92, 1180);
      margin = Math.max((width - wrapW) / 2, 0);
      maskOn = margin >= 48; // 窄屏没有页边时不遮罩，保留整幅雨
    }

    /* 页边靠外最亮，贴近正文边缘渐隐到 0 */
    function bandFactor(x) {
      if (!maskOn) return 1;
      const d = Math.min(x, width - x);
      if (d >= margin) return 0;
      return Math.min(1, (margin - d) / Math.max(margin * 0.5, 26));
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.ceil(width / fontSize);
      drops = Array.from({ length: count }, () => Math.random() * -height / fontSize);
      updateMargin();
      ctx.fillStyle = 'rgba(4, 6, 13, 1)';
      ctx.fillRect(0, 0, width, height);
    }

    function draw() {
      ctx.fillStyle = 'rgba(4, 6, 13, 0.0125)'; // 拖尾淡出同步减半，下落放慢后尾迹长度才保持一致
      ctx.fillRect(0, 0, width, height);
      ctx.font = fontSize + 'px Consolas, "Microsoft YaHei UI", monospace';
      ctx.textAlign = 'center';

      drops.forEach(function (drop, i) {
        const x = i * fontSize + fontSize / 2;
        const y = Math.floor(drop) * fontSize; // 吸附到字符网格，逐格下落
        const f = bandFactor(x);
        if (f > 0.02) {
          const char = symbols[Math.floor(Math.random() * symbols.length)];
          if (Math.random() < 0.045) {
            ctx.fillStyle = 'rgba(255, 42, 109, 0.9)';
          } else if (Math.random() < 0.3) {
            ctx.fillStyle = 'rgba(56, 242, 161, 0.92)';
          } else {
            ctx.fillStyle = 'rgba(0, 229, 255, 0.66)';
          }
          ctx.globalAlpha = f;
          ctx.fillText(char, x, y);
          ctx.globalAlpha = 1;
        }

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i] += RAIN_SPEED; // 慢速下落
        }
      });

      raf = requestAnimationFrame(draw);
    }

    function startRain() {
      if (raf || reduced || rainMobileMQ.matches) return;
      ctx.fillStyle = 'rgba(4, 6, 13, 1)';
      ctx.fillRect(0, 0, width, height);
      raf = requestAnimationFrame(draw);
    }

    function stopRain() {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      ctx.clearRect(0, 0, width, height); // 清空画布，避免留下静止的字符残影
    }

    resize();
    window.addEventListener('resize', resize);

    // 字体落地后清一次画布：早期字形不会留在尾迹中
    fontsReady.then(function () {
      if (!raf) return;
      ctx.fillStyle = 'rgba(4, 6, 13, 1)';
      ctx.fillRect(0, 0, width, height);
    });

    // 跨越移动端/桌面阈值时动态启停
    const onRainBreakpoint = function (e) {
      if (e.matches) {
        stopRain();
      } else {
        resize(); // 从窄屏回到宽屏：重建字符网格再开跑
        startRain();
      }
    };
    if (rainMobileMQ.addEventListener) {
      rainMobileMQ.addEventListener('change', onRainBreakpoint);
    } else {
      rainMobileMQ.addListener(onRainBreakpoint); // 旧版 Safari 回退
    }

    startRain();
  }

  /* ---------- 开机引导 + 签名打字机 ---------- */
  const bootEl = document.getElementById('bootText');
  const sigEl = document.getElementById('signature');
  const signature = '造物，求索，无限进步';

  const bootLines = [
    '> BOOTING XIONG PROFILE ...',
    '> IDENTITY  : 熊昭轶 // 梦逍遥',
    '> CORE      : 造物 / 求索 / 无限进步',
    '> EDUCATION : 云南大学 · 本科',
    '> GOAL      : 非计算机专业 × AI',
    '> STATUS    : READY'
  ];

  function typeLines(lines, el, done) {
    let li = 0;
    let ci = 0;
    el.textContent = '';
    (function tick() {
      if (li >= lines.length) {
        if (done) done();
        return;
      }
      const line = lines[li];
      if (ci <= line.length) {
        el.textContent = lines.slice(0, li).join('\n') + (li ? '\n' : '') + line.slice(0, ci);
        ci++;
        setTimeout(tick, 24);
      } else {
        li++;
        ci = 0;
        setTimeout(tick, 150);
      }
    })();
  }

  function typeText(text, el) {
    let i = 0;
    (function tick() {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        i++;
        setTimeout(tick, 130);
      }
    })();
  }

  if (bootEl && sigEl) {
    typeLines(bootLines, bootEl, function () {
      setTimeout(function () { typeText(signature, sigEl); }, 220);
    });
  }

  /* ---------- 数字计数 ---------- */
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const dur = 1500;
    const t0 = performance.now();
    function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      entry.target.querySelectorAll('.counter').forEach(function (c) {
        if (!c.dataset.done) {
          c.dataset.done = '1';
          animateCount(c);
        }
      });
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.16 });

  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ---------- 导航 ---------- */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      const open = navLinks.classList.toggle('open');
      navToggle.textContent = open ? 'CLOSE' : 'MENU';
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.textContent = 'MENU';
      });
    });
  }

  /* ---------- HERO 网格视差 ---------- */
  const heroGrid = document.querySelector('.hero-grid');
  const hero = document.getElementById('hero');
  if (heroGrid && hero) {
    hero.addEventListener('mousemove', function (e) {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      heroGrid.style.transform = 'translate(' + x * 14 + 'px,' + y * 14 + 'px)';
    });
  }

})();

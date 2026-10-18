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
  /* 数码雨的下落速度：每帧下落 RAIN_SPEED 格，一格 = RAIN_CELL 像素。
     粒子球的自转角速度由这个线速度换算而来，两处共用同一组常量 —— 改一处两边同步。 */
  const RAIN_SPEED = 0.05;
  const RAIN_CELL = 16;
  const canvas = document.getElementById('matrix');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const symbols = '01'; // 二进制流：只用 0 与 1，代表计算机
    const fontSize = RAIN_CELL;
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

  /* ---------- 粒子球：整站背景（自动自转，不接鼠标） ----------
     球体撒点 → 绕 Y 轴匀速自转 → 透视投影 → 方形像素点。
     固定在视口中央，滚动时始终在内容背后（做法参考 cyber-design-system-preview）。
     自转角速度不是拍脑袋定的，而是从数码雨的下落速度换算来的，见 layout()。 */
  const cloudCanvas = document.getElementById('particleCloud');

  if (cloudCanvas && cloudCanvas.getContext) {
    const cctx = cloudCanvas.getContext('2d');
    const FOV = 2.4;         // 焦距：越大透视越平，越小球越"凸"
    const TILT = -0.12;      // 固定俯仰角：球心略高于视线，露一点上半球
    const lowEnd = (navigator.hardwareConcurrency || 8) <= 4;

    let cw = 0, ch = 0;
    let cx = 0, cy = 0, R = 0;
    let cloudRaf = 0;
    let yaw = 0.4;           // 自转角

    /* 自转角速度：固定值，桌面与手机完全一致。
       基准取「数码雨线速度 ÷ 基准球半径」再降到 2/3：
       (0.05 格/帧 × 16px × 60fps) / 369 × 2/3 ≈ 0.0867 rad/s，约 72 秒转一圈。
       这里刻意不除以本机半径 —— 除 R 会让球越小转得越快，手机上一圈只有桌面的一半时间。
       改成固定角速度后两端观感一致，代价是球面线速度随半径变化（小屏上略慢）。 */
    const SPIN_REF_R = 369;   // 1440×900 视口下的球半径：min(1440, 802) × 0.46
    const SPIN_PER_MS = (RAIN_SPEED * RAIN_CELL * 60 / SPIN_REF_R) * (2 / 3) / 1000;
    let lastTick = 0;
    let pts = [];
    let pScale = 1;          // 窄屏整体缩一档，否则方点相对屏幕太大

    const COL = { hi: '#E8FFFF', near: '#00E5FF', mid: '#66D8FF', far: '#A855F7' };

    function seed() {
      const n = cw < 768 ? 280 : (lowEnd ? 620 : 1000);
      pts = [];
      for (let i = 0; i < n; i++) {
        // 约 45% 铺在球壳上：球壳点更亮更大，负责勾出球的轮廓；
        // 其余按体积填充，负责内部的纵深。只填壳会变光圈，只填体积会变星场。
        const shell = (i % 20) < 9;
        const u = Math.random() * 2 - 1;
        const t = Math.random() * Math.PI * 2;
        const r = shell
          ? 0.94 + Math.random() * 0.06
          : 0.24 + 0.66 * Math.cbrt(Math.random());
        const s = Math.sqrt(1 - u * u);
        pts.push({
          x: s * Math.cos(t) * r,
          y: u * r * 0.92,          // 略压扁，像一颗行星而不是正球
          z: s * Math.sin(t) * r,
          base: Math.random(),
          ph: Math.random() * Math.PI * 2,
          shell: shell
        });
      }
    }

    function layout() {
      cw = Math.max(1, window.innerWidth);
      ch = Math.max(1, window.innerHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cloudCanvas.width = Math.round(cw * dpr);
      cloudCanvas.height = Math.round(ch * dpr);
      cloudCanvas.style.width = cw + 'px';
      cloudCanvas.style.height = ch + 'px';
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 整站背景：球心钉在视口中央，随窗口缩放重新取半径
      cx = cw * 0.5;
      cy = ch * 0.46;
      R = Math.min(cw, ch) * 0.46;
      pScale = cw < 768 ? 0.7 : 1;

      seed();
    }

    function draw(now, single) {
      const dt = single ? 16 : Math.min(Math.max(now - lastTick, 1), 50);
      lastTick = now;

      yaw += dt * SPIN_PER_MS;   // 匀速自转，没有加减速、没有惯性

      const ca = Math.cos(yaw), sa = Math.sin(yaw);
      const cb = Math.cos(TILT), sb = Math.sin(TILT);

      cctx.clearRect(0, 0, cw, ch);

      // 球心柔光：给球一点实体感，否则只剩一堆离散点
      const g = cctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.9);
      g.addColorStop(0, 'rgba(0,229,255,.07)');
      g.addColorStop(.45, 'rgba(168,85,247,.04)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      cctx.fillStyle = g;
      cctx.fillRect(cx - R * 1.9, cy - R * 1.9, R * 3.8, R * 3.8);

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const x1 = p.x * ca - p.z * sa;
        const z1 = p.x * sa + p.z * ca;
        const y1 = p.y * cb - z1 * sb;
        const z2 = p.y * sb + z1 * cb;
        const persp = FOV / (FOV + z2);           // z2∈[-1,1] → persp∈[0.71,1.63]
        const sx = cx + x1 * R * persp;
        const sy = cy + y1 * R * persp;
        if (sx < -12 || sx > cw + 12 || sy < -12 || sy > ch + 12) continue;
        const size = Math.min(9, Math.max(1.2, 3.6 * pScale * persp * (0.45 + p.base) * (p.shell ? 1.1 : 1)));
        const twinkle = 0.75 + 0.25 * Math.sin(now * 0.0016 + p.ph);
        const amp = p.shell ? 0.32 : 0.20;
        cctx.globalAlpha = Math.min(.9, Math.max(.04, amp * persp * (0.4 + p.base) * twinkle));
        if (p.base > 0.9) cctx.fillStyle = COL.hi;        // 约 10% 的点做高光
        else if (z2 < -0.15) cctx.fillStyle = COL.near;   // 前半球：青
        else if (z2 < 0.45) cctx.fillStyle = COL.mid;     // 中景：淡青
        else cctx.fillStyle = COL.far;                    // 后半球：紫，撑出纵深
        cctx.fillRect(sx, sy, size, size);
      }
      cctx.globalAlpha = 1;

      if (!single) cloudRaf = requestAnimationFrame(draw);
    }

    function startCloud() {
      if (cloudRaf || reduced) return;
      lastTick = 0;
      cloudRaf = requestAnimationFrame(draw);
    }

    function stopCloud() {
      if (cloudRaf) {
        cancelAnimationFrame(cloudRaf);
        cloudRaf = 0;
      }
      lastTick = 0;
    }

    layout();
    cloudCanvas.classList.add('is-on');   // 先淡入，避免首帧突兀

    if (reduced) {
      draw(0, true);                      // 静态一帧：球还在，但不动
    } else {
      startCloud();
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stopCloud(); else startCloud();
      });
    }

    // resize 会重建粒子，防抖一下，别把拖拽窗口变成重排风暴
    let cloudResizeTimer = 0;
    window.addEventListener('resize', function () {
      clearTimeout(cloudResizeTimer);
      cloudResizeTimer = setTimeout(function () {
        layout();
        if (reduced) draw(0, true);
      }, 180);
    });
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

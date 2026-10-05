/**
 * 独立挂载入口：把项目里已经调好的 React Bits Lanyard 组件（含梦逍遥工牌素材）
 * 打包成一个自包含的 ES bundle，供纯静态页（portfolio/index.html）使用。
 *
 * 静态页那边只需要：
 *   <div class="badge-stage" data-mxy-badge></div>
 *   <script type="module" src="badge/badge.js"></script>
 * 本模块会自动找到 [data-mxy-badge] 并挂载。
 *
 * 另外负责「点舞台空白处 → 看正反面平面图」的弹窗：点击判定由 R3F 的
 * onPointerMissed 给出（Canvas 铺满舞台，DOM 层收不到 stage 上的点击），
 * 命中工牌时不触发，所以不会和拖拽抢事件。
 *
 * 注意：素材与组件都复用 app/ 里那一份，不另起一套，避免两处设计漂移。
 */
import { createRoot } from 'react-dom/client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import Lanyard from '../components/lanyard/Lanyard';

/**
 * 素材 URL 解析：
 * - 优先用宿主注入的 data URL（自包含预览场景：bundle 被 Blob-URL 加载，
 *   import.meta.url 不透明，没法相对解析 sibling 文件，所以宿主直接把
 *   webp 以 data URL 塞进 window.__MXY_BADGE__）；
 * - 退化到 BADGE_BASE + 文件名（http 部署场景：动态 import 时 import.meta.url
 *   是正常 URL，能解析出 badge/ 这个目录）；
 * - 两种都没有就空串（useTexture 拿到空 URL 会用默认 1x1 材质——基本上看不见）。
 */
const BADGE_BASE = (() => {
  try { return new URL('.', import.meta.url).href; } catch { return ''; }
})();
const HOST = (typeof window !== 'undefined'
  ? (window as unknown as { __MXY_BADGE__?: { front?: string; back?: string; lanyard?: string } }).__MXY_BADGE__
  : null) ?? null;
const FILE = { front: 'card-front.webp', back: 'card-back.webp', lanyard: 'lanyard-strap.webp' } as const;
const resolveAsset = (kind: keyof typeof FILE): string =>
  (HOST?.[kind] ?? (BADGE_BASE ? `${BADGE_BASE}assets/${FILE[kind]}` : ''));

const cardFront = resolveAsset('front');
const cardBack = resolveAsset('back');
const strapImage = resolveAsset('lanyard');

/**
 * 相机参数说明（与 app/ 里 PersonalCard 的调用不同，这里是新场景，可自由调）：
 * - 工牌是这个区块的视觉主体，要占满舞台：视锥高度收到约 5 个世界单位，
 *   卡面高 2.25 单位，落在画面里约 45% 高度；
 * - 视线中心下移到 y=-0.5，让工牌居中、吊带自然从舞台顶端垂入并被裁切；
 * - fov 收窄到 16 换取更饱满的构图，同时保持透视自然。
 */
const BADGE_CAMERA = {
  position: [0, -0.5, 18] as [number, number, number],
  gravity: [0, -40, 0] as [number, number, number],
  fov: 16,
};

/**
 * 正反面平面图弹窗。
 *
 * 结构刻意做得很薄：一张 .mxy-badge-modal 遮罩（透明黑，点击关闭）里放
 * 两个 .mxy-badge-sheet 面片（正/背），每片是一张原比例 webp。样式不写在
 * 这里，而是走 portfolio/index.html 的 .mxy-badge-* 类——静态页是唯一视觉
 * 权威，bundle 只负责结构，避免两处设计漂移。
 */
function BadgeShowcase({ onClose }: { onClose: () => void }) {
  // Esc 关闭。挂 window 上而不是 modal 上，因为 modal 不一定有焦点。
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 打开期间锁滚动，避免背景页在弹窗下面跟着滚。
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="mxy-badge-modal"
      role="dialog"
      aria-modal="true"
      aria-label="工牌平面设计图"
      onClick={onClose}
    >
      <div className="mxy-badge-modal-inner" onClick={(e) => e.stopPropagation()}>
        <span className="mxy-badge-modal-corner tl" aria-hidden="true" />
        <span className="mxy-badge-modal-corner tr" aria-hidden="true" />
        <span className="mxy-badge-modal-corner bl" aria-hidden="true" />
        <span className="mxy-badge-modal-corner br" aria-hidden="true" />

        <header className="mxy-badge-modal-head">
          <span className="mxy-badge-modal-title mono">IDENTITY BADGE / FLAT SHEET</span>
          <button
            type="button"
            className="mxy-badge-modal-close mono"
            onClick={onClose}
            aria-label="关闭平面图"
          >
            CLOSE ✕
          </button>
        </header>

        <div className="mxy-badge-modal-sheets">
          <figure className="mxy-badge-sheet">
            {cardFront ? <img src={cardFront} alt="工牌正面平面图" draggable={false} /> : null}
            <figcaption className="mono">FRONT · 正面</figcaption>
          </figure>
          <figure className="mxy-badge-sheet">
            {cardBack ? <img src={cardBack} alt="工牌背面平面图" draggable={false} /> : null}
            <figcaption className="mono">BACK · 背面</figcaption>
          </figure>
        </div>

        <p className="mxy-badge-modal-hint mono">ESC / CLICK OUTSIDE TO CLOSE</p>
      </div>
    </div>
  );
}

/**
 * 舞台：3D 工牌 + 空白处点击唤起的平面图弹窗。
 * 拆成独立组件是因为 onMiss 要 setState，必须活在函数组件里。
 */
function BadgeStage() {
  const [showcase, setShowcase] = useState(false);
  const openShowcase = useCallback(() => setShowcase(true), []);
  const closeShowcase = useCallback(() => setShowcase(false), []);

  return (
    <>
      <Lanyard
        position={BADGE_CAMERA.position}
        gravity={BADGE_CAMERA.gravity}
        fov={BADGE_CAMERA.fov}
        transparent
        frontImage={cardFront}
        backImage={cardBack}
        imageFit="fill"
        lanyardImage={strapImage}
        onMiss={openShowcase}
      />
      {showcase ? <BadgeShowcase onClose={closeShowcase} /> : null}
    </>
  );
}

export function mountBadge(el: HTMLElement): () => void {
  const root = createRoot(el);
  root.render(
    <Suspense fallback={null}>
      <BadgeStage />
    </Suspense>
  );
  return () => root.unmount();
}

// 自动挂载
function boot(): void {
  const el = document.querySelector<HTMLElement>('[data-mxy-badge]');
  if (!el) return;
  mountBadge(el);
  el.classList.add('is-ready');
  document.documentElement.classList.add('mxy-badge-ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

// 供页面手动控制（例如重新挂载）
declare global {
  interface Window {
    MxyBadge?: { mount: typeof mountBadge };
  }
}
window.MxyBadge = { mount: mountBadge };

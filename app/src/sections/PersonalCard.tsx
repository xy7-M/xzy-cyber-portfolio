import { useEffect, useRef, lazy, Suspense } from 'react';
import gsap from 'gsap';
import { personalCardConfig } from '../config';

// 工牌视觉素材（梦逍遥赛博风）——由 front/back/strap 三张设计稿导出，
// 设计源文件见 components/lanyard/source/*.html。
// 卡面按「物理面比例 0.7164」出图，配合 imageFit="fill" 才能不拉伸。
import cardFront from '../components/lanyard/card-front.webp';
import cardBack from '../components/lanyard/card-back.webp';
import strapImage from '../components/lanyard/lanyard-strap.webp';

// The 3D stack (three + rapier + meshline) is heavy, so it loads on demand
// rather than blocking the first paint of the page.
const Lanyard = lazy(() => import('../components/lanyard/Lanyard'));

const MONO = "'GeistMono', 'Microsoft YaHei UI', monospace";

export default function PersonalCard() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const targets = [leftRef.current, rightRef.current].filter(Boolean) as HTMLElement[];
    if (!section || targets.length === 0) return;

    gsap.set(targets, { opacity: 0, y: 40 });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(targets, {
              opacity: 1,
              y: 0,
              duration: 1.2,
              ease: 'power3.out',
              stagger: 0.12,
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="card"
      ref={sectionRef}
      style={{
        padding: '150px 5vw 80px',
        background: '#050a12',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div
          className="mb-6"
          style={{
            fontFamily: MONO,
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: '#00e5ff',
            opacity: 0.85,
            textShadow: '0 0 10px rgba(0, 229, 255, 0.45)',
          }}
        >
          {personalCardConfig.sectionLabel}
        </div>
        <div
          className="mb-16"
          style={{
            width: '100%',
            height: 1,
            background: 'rgba(0, 229, 255, 0.16)',
          }}
        />

        <div
          className="flex flex-col md:flex-row md:items-center"
          style={{ gap: 'clamp(36px, 5vw, 80px)' }}
        >
          {/* ---- left: the copy ---- */}
          <div ref={leftRef} className="w-full md:w-[46%]" style={{ minWidth: 0 }}>
            <h2
              style={{
                fontFamily: MONO,
                fontWeight: 600,
                fontSize: 'clamp(30px, 3.6vw, 56px)',
                lineHeight: 1.18,
                letterSpacing: '0.02em',
                color: '#ffffff',
                margin: 0,
                textWrap: 'balance',
                textShadow: '0 0 18px rgba(0, 229, 255, 0.3)',
              }}
            >
              {personalCardConfig.title}
            </h2>

            <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {personalCardConfig.paragraphs.map((text, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: MONO,
                    fontWeight: 300,
                    fontSize: 16,
                    lineHeight: 1.85,
                    color: '#c8d9ff',
                    margin: 0,
                    textWrap: 'pretty',
                  }}
                >
                  {text}
                </p>
              ))}
            </div>

            <div
              style={{
                marginTop: 34,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: '2px',
                color: '#00e5ff',
                textTransform: 'uppercase',
                opacity: 0.9,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 28,
                  height: 1,
                  background: '#00e5ff',
                  boxShadow: '0 0 8px #00e5ff',
                }}
              />
              {personalCardConfig.hint}
            </div>
          </div>

          {/* ---- right: the 3D badge ---- */}
          <div
            ref={rightRef}
            className="w-full md:w-[54%]"
            style={{
              minWidth: 0,
              height: 'clamp(480px, 64vh, 680px)',
              minHeight: 480,
              position: 'relative',
            }}
          >
            <Suspense
              fallback={
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: MONO,
                    fontSize: 12,
                    letterSpacing: '3px',
                    color: 'rgba(0, 229, 255, 0.6)',
                    textTransform: 'uppercase',
                  }}
                >
                  {personalCardConfig.fallbackText}
                </div>
              }
            >
              <Lanyard
                position={[0, 0, 30]}
                gravity={[0, -40, 0]}
                fov={20}
                transparent
                frontImage={cardFront}
                backImage={cardBack}
                imageFit="fill"
                lanyardImage={strapImage}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}

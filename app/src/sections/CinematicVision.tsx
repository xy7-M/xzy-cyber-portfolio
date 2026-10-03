import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { architectureConfig } from '../config';

export default function CinematicVision() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    if (!section || !text) return;

    gsap.set(text, { opacity: 0, y: 40 });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(text, {
              opacity: 1,
              y: 0,
              duration: 1.2,
              ease: 'power3.out',
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  if (!architectureConfig.sectionLabel && !architectureConfig.title) {
    return null;
  }

  return (
    <section
      id="cinematic"
      ref={sectionRef}
      style={{
        padding: '150px 5vw 80px',
        background: '#050a12',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {architectureConfig.sectionLabel && (
          <div
            className="mb-6"
            style={{
              fontFamily: "'GeistMono', monospace",
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#00e5ff',
              opacity: 0.85,
              textShadow: '0 0 10px rgba(0, 229, 255, 0.45)',
            }}
          >
            {architectureConfig.sectionLabel}
          </div>
        )}
        <div
          className="mb-16"
          style={{
            width: '100%',
            height: 1,
            background: 'rgba(0, 229, 255, 0.16)',
          }}
        />

        <div className="relative">
          {architectureConfig.videoPath && (
            <div
              className="relative overflow-hidden"
              style={{
                width: '100%',
                maxWidth: '80vw',
                margin: '0 auto',
                aspectRatio: '21/9',
                border: '1px solid rgba(0, 229, 255, 0.18)',
                boxShadow: '0 0 28px rgba(0, 229, 255, 0.12)',
              }}
            >
              <video
                ref={videoRef}
                src={architectureConfig.videoPath}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
                style={{ display: 'block' }}
              />
            </div>
          )}

          <div
            ref={textRef}
            className="flex flex-col md:flex-row md:items-center"
            style={{ marginTop: 160, gap: '60px' }}
          >
            {architectureConfig.title && (
              <h2
                style={{
                  fontFamily: "'GeistMono', 'Microsoft YaHei UI', monospace",
                  fontWeight: 600,
                  fontSize: 'clamp(32px, 4vw, 64px)',
                  lineHeight: 1.15,
                  letterSpacing: '0.02em',
                  color: '#ffffff',
                  margin: 0,
                  flex: '0 0 50%',
                  textWrap: 'balance',
                  textShadow: '0 0 18px rgba(0, 229, 255, 0.3)',
                }}
              >
                {architectureConfig.title}
              </h2>
            )}
            {architectureConfig.description && (
              <p
                style={{
                  fontFamily: "'GeistMono', 'Microsoft YaHei UI', monospace",
                  fontWeight: 300,
                  fontSize: 17,
                  lineHeight: 1.85,
                  color: '#c8d9ff',
                  margin: 0,
                  flex: '1 1 50%',
                  textWrap: 'pretty',
                }}
              >
                {architectureConfig.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

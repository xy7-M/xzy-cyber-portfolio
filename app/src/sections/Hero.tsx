import AmberCascades from './AmberCascades';
import LiquidGlassButton from '../components/LiquidGlassButton';
import { heroConfig } from '../config';

export default function Hero() {
  if (!heroConfig.title) {
    return null;
  }

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ height: '100vh' }}
    >
      <AmberCascades />
      <div
        className="relative z-10 flex flex-col justify-between pointer-events-none"
        style={{
          height: '100%',
          padding: '22vh 5vw 8vh',
        }}
      >
        <div>
          {/* 本名 —— 霓虹发光大字 */}
          <h1
            className="neon-text"
            style={{
              fontFamily: "'GeistMono', monospace",
              fontWeight: 400,
              fontSize: 'clamp(64px, 8vw, 128px)',
              lineHeight: 1.0,
              letterSpacing: '0.04em',
              margin: 0,
              width: 'fit-content',
            }}
          >
            {heroConfig.title}
          </h1>

          {/* 昵称 —— 霓虹发光副标题 */}
          {heroConfig.nickname && (
            <div
              className="neon-text"
              style={{
                fontFamily: "'GeistMono', monospace",
                fontWeight: 400,
                fontSize: 'clamp(24px, 2.8vw, 44px)',
                lineHeight: 1.2,
                letterSpacing: '0.35em',
                marginTop: 'clamp(14px, 1.8vw, 26px)',
                width: 'fit-content',
              }}
            >
              {heroConfig.nickname}
            </div>
          )}

          {/* 分行信息区：标签 + 内容，逐行递进 */}
          <div
            style={{
              marginTop: 'clamp(36px, 4.5vw, 60px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(10px, 1.2vw, 16px)',
            }}
          >
            {heroConfig.infoLines.map((line) => (
              <div
                key={line.label}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 18,
                }}
              >
                <span
                  style={{
                    fontFamily: "'GeistMono', monospace",
                    fontSize: 'clamp(11px, 0.9vw, 13px)',
                    fontWeight: 400,
                    letterSpacing: '0.25em',
                    color: '#00e5ff',
                    textShadow: '0 0 10px rgba(0, 229, 255, 0.6)',
                    flexShrink: 0,
                    minWidth: '5.5em',
                  }}
                >
                  {line.label} //
                </span>
                <span
                  style={{
                    fontFamily: "'GeistMono', 'Microsoft YaHei UI', monospace",
                    fontWeight: 300,
                    fontSize: 'clamp(15px, 1.4vw, 20px)',
                    lineHeight: 1.6,
                    letterSpacing: '0.05em',
                    color: '#e8f4ff',
                    textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                  }}
                >
                  {line.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {heroConfig.ctaText && (
          <div style={{ display: 'flex', justifyContent: 'center' }} className="pointer-events-auto">
            <LiquidGlassButton
              onClick={() => {
                document.querySelector('#curriculum')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {heroConfig.ctaText}
            </LiquidGlassButton>
          </div>
        )}
      </div>
    </section>
  );
}

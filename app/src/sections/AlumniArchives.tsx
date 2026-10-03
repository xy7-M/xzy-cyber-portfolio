import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { researchConfig } from '../config';

export default function AlumniArchives() {
  const gridRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const items = itemRefs.current.filter(Boolean) as HTMLDivElement[];

    items.forEach((item) => {
      gsap.set(item, { opacity: 0, y: 30 });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = items.indexOf(entry.target as HTMLDivElement);
            gsap.to(entry.target, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              delay: (idx % 4) * 0.1,
              ease: 'power2.out',
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  if (!researchConfig.sectionLabel && researchConfig.projects.length === 0) {
    return null;
  }

  return (
    <section
      id="alumni"
      style={{
        padding: '150px 5vw',
        background: '#050a12',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {researchConfig.sectionLabel && (
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
            {researchConfig.sectionLabel}
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

        <div
          ref={gridRef}
          className="grid grid-cols-2 md:grid-cols-4"
          style={{ gap: 0 }}
        >
          {researchConfig.projects.map((project, i) => (
            <div
              key={`${project.title}-${i}`}
              ref={(el) => { itemRefs.current[i] = el; }}
              className="group cursor-pointer"
              style={{
                borderBottom: '1px solid rgba(0, 229, 255, 0.14)',
                borderRight: (i + 1) % 4 !== 0 ? '1px solid rgba(0, 229, 255, 0.14)' : 'none',
                padding: '24px 20px',
                transition: 'background 0.4s',
              }}
            >
              <div
                className="relative overflow-hidden mb-4"
                style={{
                  aspectRatio: '1/1',
                  border: '1px solid rgba(0, 229, 255, 0.16)',
                  background: 'rgba(0, 229, 255, 0.03)',
                }}
              >
                {project.image && (
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-all duration-700"
                    style={{
                      opacity: 0.5,
                      filter: 'grayscale(100%)',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLImageElement).style.opacity = '1';
                      (e.target as HTMLImageElement).style.filter = 'grayscale(0%)';
                      (e.target as HTMLImageElement).style.transform = 'scale(1.04)';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLImageElement).style.opacity = '0.5';
                      (e.target as HTMLImageElement).style.filter = 'grayscale(100%)';
                      (e.target as HTMLImageElement).style.transform = 'scale(1)';
                    }}
                    loading="lazy"
                  />
                )}
              </div>
              <h4
                style={{
                  fontFamily: "'GeistMono', 'Microsoft YaHei UI', monospace",
                  fontWeight: 600,
                  fontSize: 18,
                  color: '#ffffff',
                  margin: '0 0 6px 0',
                  lineHeight: 1.3,
                  letterSpacing: '0.03em',
                  textShadow: '0 0 12px rgba(0, 229, 255, 0.22)',
                }}
              >
                {project.title}
              </h4>
              <div
                className="flex items-center justify-between"
              >
                <span
                  style={{
                    fontFamily: "'GeistMono', monospace",
                    fontWeight: 300,
                    fontSize: 12,
                    color: '#8fa0c9',
                    opacity: 0.9,
                  }}
                >
                  {project.discipline}
                </span>
                <span
                  style={{
                    fontFamily: "'GeistMono', monospace",
                    fontWeight: 400,
                    fontSize: 11,
                    color: '#00e5ff',
                    opacity: 0.75,
                  }}
                >
                  {project.year}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

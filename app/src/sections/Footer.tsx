import { footerConfig } from '../config';

export default function Footer() {
  if (!footerConfig.heading && footerConfig.columns.length === 0) {
    return null;
  }

  return (
    <footer
      id="footer"
      style={{
        padding: '150px 5vw 60px',
        background: '#050a12',
        position: 'relative',
        zIndex: 2,
        borderTop: '1px solid rgba(0, 229, 255, 0.18)',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {footerConfig.heading && (
          <h2
            style={{
              fontFamily: "'GeistMono', 'Microsoft YaHei UI', monospace",
              fontWeight: 600,
              fontSize: 'clamp(40px, 5vw, 80px)',
              lineHeight: 1.1,
              letterSpacing: '0.02em',
              color: '#ffffff',
              marginBottom: 80,
              textShadow: '0 0 24px rgba(0, 229, 255, 0.3)',
            }}
          >
            {footerConfig.heading}
          </h2>
        )}

        {footerConfig.columns.length > 0 && (
          <div
            className="grid grid-cols-1 md:grid-cols-2"
            style={{ gap: 60, marginBottom: 120 }}
          >
            {footerConfig.columns.map((column, colIndex) => (
              <div key={colIndex} className="flex flex-col" style={{ gap: 16 }}>
                {column.title && (
                  <span
                    style={{
                      fontFamily: "'GeistMono', monospace",
                      fontSize: 12,
                      fontWeight: 400,
                      letterSpacing: '3px',
                      textTransform: 'uppercase',
                      color: '#00e5ff',
                      opacity: 0.75,
                      marginBottom: 8,
                    }}
                  >
                    {column.title}
                  </span>
                )}
                {column.links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="nav-link"
                    style={{ width: 'fit-content' }}
                  >
                    {link}
                  </a>
                ))}
              </div>
            ))}
          </div>
        )}

        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between"
          style={{
            paddingTop: 24,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            gap: 16,
          }}
        >
          {footerConfig.copyright && (
            <span
              style={{
              fontFamily: "'GeistMono', monospace",
              fontWeight: 300,
                fontSize: 12,
              color: '#8fa0c9',
              opacity: 0.85,
              }}
            >
              {footerConfig.copyright}
            </span>
          )}
          {footerConfig.bottomLinks.length > 0 && (
            <div className="flex items-center" style={{ gap: 24 }}>
              {footerConfig.bottomLinks.map((bottomLink) => (
                <a
                  key={bottomLink.label}
                  href={bottomLink.href || '#'}
                  style={{
                    fontFamily: "'GeistMono', monospace",
                    fontWeight: 300,
                    fontSize: 12,
                    color: '#8fa0c9',
                    opacity: 0.85,
                    textDecoration: 'none',
                    transition: 'opacity 0.3s',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '0.8'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.4'; }}
                >
                  {bottomLink.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

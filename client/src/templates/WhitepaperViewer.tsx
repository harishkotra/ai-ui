import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// This is the pre-built whitepaper viewer template
// The AI only needs to provide the whitepaper content!

interface WhitepaperViewerProps {
  content: string;
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
}

export default function WhitepaperViewer({
  content,
  title = "Whitepaper",
  subtitle,
  author,
  date
}: WhitepaperViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showToc, setShowToc] = useState(true);
  const [headings, setHeadings] = useState<Array<{ id: string; text: string; level: number }>>([]);

  useEffect(() => {
    // Extract headings for TOC
    const extractedHeadings: Array<{ id: string; text: string; level: number }> = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const id = `heading-${index}`;
        extractedHeadings.push({ id, text, level });
      }
    });

    setHeadings(extractedHeadings);
  }, [content]);

  const handlePrint = () => {
    window.print();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredContent = searchQuery
    ? content.split('\n').filter(line =>
        line.toLowerCase().includes(searchQuery.toLowerCase())
      ).join('\n')
    : content;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B1220',
      color: '#E5E7EB',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        background: 'linear-gradient(135deg, #0B1020 0%, #1E40AF 100%)',
        borderBottom: '2px solid #4F8AE6',
        padding: '1.5rem 2rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#E5E7EB' }}>{title}</h1>
          {subtitle && <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#93C5FD' }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setShowToc(!showToc)} style={buttonStyle}>
            {showToc ? '📖 Hide TOC' : '📖 Show TOC'}
          </button>
          <button onClick={handlePrint} style={buttonStyle}>
            📥 PDF
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
        {/* Table of Contents */}
        {showToc && (
          <aside style={{
            width: '280px',
            background: '#0F172A',
            borderRight: '1px solid #334155',
            padding: '1.5rem',
            overflowY: 'auto',
            position: 'sticky',
            top: '80px',
            maxHeight: 'calc(100vh - 80px)',
          }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#93C5FD' }}>
              📑 Table of Contents
            </h2>
            {headings.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: '#64748B' }}>No headings found</p>
            ) : (
              <nav>
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    style={{
                      display: 'block',
                      padding: '0.5rem',
                      paddingLeft: `${(heading.level - 1) * 1}rem`,
                      fontSize: heading.level === 1 ? '0.9rem' : '0.85rem',
                      color: heading.level === 1 ? '#E5E7EB' : '#94A3B8',
                      textDecoration: 'none',
                      borderRadius: '0.5rem',
                      marginBottom: '0.25rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1E293B';
                      e.currentTarget.style.color = '#4F8AE6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = heading.level === 1 ? '#E5E7EB' : '#94A3B8';
                    }}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            )}
          </aside>
        )}

        {/* Main Content */}
        <main style={{
          flex: 1,
          padding: '2rem',
          maxWidth: '900px',
          margin: '0 auto',
        }}>
          {/* Search */}
          <div style={{ marginBottom: '2rem' }}>
            <input
              type="text"
              placeholder="🔍 Search whitepaper..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                color: '#E5E7EB',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Metadata */}
          {(author || date) && (
            <div style={{
              padding: '1rem',
              background: '#0F172A',
              borderRadius: '0.5rem',
              marginBottom: '2rem',
              fontSize: '0.875rem',
              color: '#94A3B8',
            }}>
              {author && <div>✍️ <strong>Author:</strong> {author}</div>}
              {date && <div>📅 <strong>Date:</strong> {date}</div>}
            </div>
          )}

          {/* Markdown Content */}
          <article style={{
            fontSize: '1rem',
            lineHeight: '1.75',
            color: '#E5E7EB',
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }: { children?: React.ReactNode }) => (
                  <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    marginTop: '2rem',
                    marginBottom: '1rem',
                    color: '#E5E7EB',
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>{children}</h1>
                ),
                h2: ({ children }: { children?: React.ReactNode }) => (
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '600',
                    marginTop: '2rem',
                    marginBottom: '0.75rem',
                    color: '#93C5FD',
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>{children}</h2>
                ),
                h3: ({ children }: { children?: React.ReactNode }) => (
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    marginTop: '1.5rem',
                    marginBottom: '0.5rem',
                    color: '#93C5FD',
                  }}>{children}</h3>
                ),
                p: ({ children }: { children?: React.ReactNode }) => (
                  <p style={{ marginBottom: '1rem' }}>{children}</p>
                ),
                a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
                  <a href={href} style={{
                    color: '#4F8AE6',
                    textDecoration: 'none',
                    borderBottom: '1px solid transparent',
                  }} onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = '#4F8AE6'}
                     onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}>
                    {children}
                  </a>
                ),
                code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) => (
                  inline ? (
                    <code style={{
                      background: '#1E293B',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.9em',
                      color: '#93C5FD',
                    }}>{children}</code>
                  ) : (
                    <code style={{
                      display: 'block',
                      background: '#1E293B',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      overflowX: 'auto',
                      fontSize: '0.9em',
                      color: '#E5E7EB',
                      marginBottom: '1rem',
                    }}>{children}</code>
                  )
                ),
                blockquote: ({ children }: { children?: React.ReactNode }) => (
                  <blockquote style={{
                    borderLeft: '4px solid #4F8AE6',
                    paddingLeft: '1rem',
                    margin: '1rem 0',
                    fontStyle: 'italic',
                    color: '#94A3B8',
                  }}>{children}</blockquote>
                ),
                ul: ({ children }: { children?: React.ReactNode }) => (
                  <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>{children}</ul>
                ),
                ol: ({ children }: { children?: React.ReactNode }) => (
                  <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>{children}</ol>
                ),
                table: ({ children }: { children?: React.ReactNode }) => (
                  <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      background: '#0F172A',
                      borderRadius: '0.5rem',
                    }}>{children}</table>
                  </div>
                ),
                th: ({ children }: { children?: React.ReactNode }) => (
                  <th style={{
                    padding: '0.75rem',
                    background: '#1E293B',
                    borderBottom: '2px solid #4F8AE6',
                    textAlign: 'left',
                    fontWeight: '600',
                  }}>{children}</th>
                ),
                td: ({ children }: { children?: React.ReactNode }) => (
                  <td style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #334155',
                  }}>{children}</td>
                ),
              }}
            >
              {filteredContent}
            </ReactMarkdown>
          </article>
        </main>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: '#4F8AE6',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '3rem',
          height: '3rem',
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(79, 138, 230, 0.4)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 138, 230, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 138, 230, 0.4)';
        }}
      >
        ↑
      </button>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; color: black; }
          header, aside, button { display: none !important; }
          main { max-width: 100%; padding: 1rem; }
        }
      `}</style>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: '#334155',
  border: 'none',
  borderRadius: '0.5rem',
  color: '#E5E7EB',
  fontSize: '0.875rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

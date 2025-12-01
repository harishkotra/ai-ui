// Template for generated whitepaper viewer
// This file is imported by App.tsx and used to generate the Sandpack preview
// Markers like {{CONTENT}} will be replaced with actual data

export const VIEWER_TEMPLATE = `import React, { useState, useEffect } from 'react';
import Markdown from 'markdown-to-jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('whitepaper');
  const [searchQuery, setSearchQuery] = useState('');
  const [showToc, setShowToc] = useState(true);
  const [headings, setHeadings] = useState([]);

  const content = \`{{CONTENT}}\`;
  const pitchContent = \`{{PITCH}}\`;
  const title = "{{TITLE}}";
  const subtitle = "{{SUBTITLE}}";
  const author = "{{AUTHOR}}";
  const date = "{{DATE}}";

  useEffect(() => {
    // Extract headings for TOC
    const extracted = [];
    const lines = content.split('\\n');
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,3})\\s+(.+)$/);
      if (match) {
        extracted.push({
          id: \`heading-\${index}\`,
          text: match[2],
          level: match[1].length
        });
      }
    });
    setHeadings(extracted);
  }, [content]);

  const filterContent = (text) => {
    if (!text) return '';
    if (searchQuery && activeTab === 'whitepaper') {
      return text.split('\\n')
        .filter(line => line.toLowerCase().includes(searchQuery.toLowerCase()))
        .join('\\n');
    }
    return text;
  };

  const currentContent = activeTab === 'whitepaper' ? content : pitchContent;
  const displayContent = filterContent(currentContent);

  const markdownOptions = {
    overrides: {
      h1: {
        component: ({ children, ...props }) => (
          <h1 style={{ fontSize: '2.25rem', fontWeight: '700', marginTop: '3rem', marginBottom: '1.25rem', color: '#111827', lineHeight: '1.2' }} {...props}>
            {children}
          </h1>
        )
      },
      h2: {
        component: ({ children, ...props }) => (
          <h2 style={{ fontSize: '1.875rem', fontWeight: '600', marginTop: '2.5rem', marginBottom: '1rem', color: '#8B5CF6', lineHeight: '1.3' }} {...props}>
            {children}
          </h2>
        )
      },
      h3: {
        component: ({ children, ...props }) => (
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '0.75rem', color: '#374151', lineHeight: '1.4' }} {...props}>
            {children}
          </h3>
        )
      },
      p: {
        component: ({ children, ...props }) => (
          <p style={{ marginBottom: '1.25rem', lineHeight: '1.75', color: '#4B5563' }} {...props}>{children}</p>
        )
      },
      a: {
        component: ({ children, ...props }) => (
          <a
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#8B5CF6', textDecoration: 'none', borderBottom: '1px solid #C4B5FD', transition: 'all 0.2s' }}
            {...props}
          >
            {children}
          </a>
        )
      },
      code: {
        component: ({ children, className, ...props }) => {
          const isInline = !className;
          return isInline ? (
            <code style={{ background: '#F3F4F6', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.875em', color: '#8B5CF6', fontFamily: 'monospace', border: '1px solid #E5E7EB' }} {...props}>
              {children}
            </code>
          ) : (
            <code style={{ display: 'block', background: '#F9FAFB', padding: '1.25rem', borderRadius: '8px', overflowX: 'auto', fontSize: '0.875em', color: '#1F2937', marginBottom: '1.5rem', fontFamily: 'monospace', border: '1px solid #E5E7EB' }} {...props}>
              {children}
            </code>
          );
        }
      },
      pre: {
        component: ({ children, ...props }) => (
          <pre style={{ background: '#F9FAFB', padding: '1.25rem', borderRadius: '8px', overflowX: 'auto', marginBottom: '1.5rem', border: '1px solid #E5E7EB' }} {...props}>
            {children}
          </pre>
        )
      },
      blockquote: {
        component: ({ children, ...props }) => (
          <blockquote style={{ borderLeft: '4px solid #8B5CF6', paddingLeft: '1.25rem', margin: '1.5rem 0', fontStyle: 'italic', color: '#6B7280', background: '#F9FAFB', padding: '1rem 1.25rem', borderRadius: '0 8px 8px 0' }} {...props}>
            {children}
          </blockquote>
        )
      },
      ul: {
        component: ({ children, ...props }) => (
          <ul style={{ paddingLeft: '1.75rem', marginBottom: '1.25rem', listStyleType: 'disc', color: '#4B5563' }} {...props}>{children}</ul>
        )
      },
      ol: {
        component: ({ children, ...props }) => (
          <ol style={{ paddingLeft: '1.75rem', marginBottom: '1.25rem', listStyleType: 'decimal', color: '#4B5563' }} {...props}>{children}</ol>
        )
      },
      li: {
        component: ({ children, ...props }) => (
          <li style={{ marginBottom: '0.5rem', lineHeight: '1.75' }} {...props}>{children}</li>
        )
      },
      table: {
        component: ({ children, ...props }) => (
          <div style={{ overflowX: 'auto', marginBottom: '1.5rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FFFFFF' }} {...props}>
              {children}
            </table>
          </div>
        )
      },
      thead: {
        component: ({ children, ...props }) => (
          <thead style={{ background: '#F9FAFB' }} {...props}>{children}</thead>
        )
      },
      th: {
        component: ({ children, ...props }) => (
          <th style={{ padding: '0.875rem 1rem', borderBottom: '2px solid #E5E7EB', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }} {...props}>
            {children}
          </th>
        )
      },
      td: {
        component: ({ children, ...props }) => (
          <td style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #F3F4F6', color: '#4B5563', fontSize: '0.875rem' }} {...props}>
            {children}
          </td>
        )
      },
      hr: {
        component: (props) => (
          <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '2.5rem 0' }} {...props} />
        )
      },
      strong: {
        component: ({ children, ...props }) => (
          <strong style={{ fontWeight: '600', color: '#111827' }} {...props}>{children}</strong>
        )
      },
      em: {
        component: ({ children, ...props }) => (
          <em style={{ fontStyle: 'italic', color: '#6B7280' }} {...props}>{children}</em>
        )
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#1F2937', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <header style={{ position: 'sticky', top: 0, background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '1.5rem 2rem', zIndex: 100, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#111827', fontWeight: '700' }}>{title}</h1>
            {subtitle && <p style={{ margin: '0.5rem 0 0', fontSize: '1rem', color: '#6B7280' }}>{subtitle}</p>}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowToc(!showToc)}
              style={{ padding: '0.625rem 1.25rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#374151', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
            >
              {showToc ? 'Hide TOC' : 'Show TOC'}
            </button>
            <button
              onClick={() => window.print()}
              style={{ padding: '0.625rem 1.25rem', background: '#8B5CF6', border: 'none', borderRadius: '8px', color: '#FFFFFF', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(139, 92, 246, 0.3)' }}
            >
              Export PDF
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '1200px', margin: '1rem auto 0', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
          <button
            onClick={() => setActiveTab('whitepaper')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'whitepaper' ? '#8B5CF6' : '#FFFFFF',
              border: activeTab === 'whitepaper' ? 'none' : '1px solid #E5E7EB',
              borderRadius: '8px',
              color: activeTab === 'whitepaper' ? '#FFFFFF' : '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'whitepaper' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
            Whitepaper
          </button>
          {pitchContent && (
            <button
              onClick={() => setActiveTab('pitch')}
              style={{
                padding: '0.75rem 1.5rem',
                background: activeTab === 'pitch' ? '#8B5CF6' : '#FFFFFF',
                border: activeTab === 'pitch' ? 'none' : '1px solid #E5E7EB',
                borderRadius: '8px',
                color: activeTab === 'pitch' ? '#FFFFFF' : '#374151',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'pitch' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
              Pitch Deck
            </button>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto' }}>
        {showToc && activeTab === 'whitepaper' && (
          <aside style={{ width: '280px', background: '#FFFFFF', borderRight: '1px solid #E5E7EB', padding: '2rem 1.5rem', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', position: 'sticky', top: '200px' }}>
            <h2 style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contents</h2>
            {headings.length > 0 ? headings.map(h => (
              <a
                key={h.id}
                href={\`#\${h.id}\`}
                style={{
                  display: 'block',
                  padding: '0.5rem 0.75rem',
                  paddingLeft: \`\${(h.level-1)*16 + 12}px\`,
                  color: '#6B7280',
                  textDecoration: 'none',
                  fontSize: h.level === 1 ? '0.875rem' : '0.8125rem',
                  borderRadius: '6px',
                  marginBottom: '0.25rem',
                  transition: 'all 0.2s'
                }}
              >
                {h.text}
              </a>
            )) : <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>No headings found</p>}
          </aside>
        )}

        <main style={{ flex: 1, padding: '3rem 2rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          {activeTab === 'whitepaper' && (
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', marginBottom: '2rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#1F2937', fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
          )}

          {(author || date) && activeTab === 'whitepaper' && (
            <div style={{ padding: '1.25rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '2rem', fontSize: '0.875rem', color: '#6B7280' }}>
              {author && <div style={{ marginBottom: author && date ? '0.5rem' : '0' }}><strong style={{ color: '#374151' }}>Author:</strong> {author}</div>}
              {date && <div><strong style={{ color: '#374151' }}>Date:</strong> {date}</div>}
            </div>
          )}

          <article style={{ lineHeight: '1.75' }}>
            <Markdown options={markdownOptions}>
              {displayContent}
            </Markdown>
          </article>
        </main>
      </div>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '50%', width: '3rem', height: '3rem', fontSize: '1.25rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)', transition: 'all 0.2s' }}
        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
      >
        ↑
      </button>

      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: '#6B7280', fontSize: '0.875rem', borderTop: '1px solid #E5E7EB', marginTop: '4rem', background: '#FFFFFF' }}>
        Powered by <a href="https://gaianet.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#8B5CF6', textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s' }}>Gaia</a> decentralized AI
      </footer>

      <style>{\`
        @media print {
          body { background: white !important; color: black !important; }
          header, aside, button, footer { display: none !important; }
          main { max-width: 100% !important; padding: 1rem !important; }
        }
      \`}</style>
    </div>
  );
}`;

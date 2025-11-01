import { useState } from 'react';
import { Sandpack } from '@codesandbox/sandpack-react';
import { sandpackDark } from '@codesandbox/sandpack-themes';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './App.css';

interface FileStructure {
  [key: string]: string;
}

function App() {
  const [whitepaper, setWhitepaper] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [files, setFiles] = useState<FileStructure>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generationTime, setGenerationTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [showCodePanel, setShowCodePanel] = useState(false);

  const parseAIResponse = (response: string): { metadata: Record<string, string>; content: string } => {
    console.log('Parsing AI response, length:', response.length);

    const metadata: Record<string, string> = {
      TITLE: 'Whitepaper',
      SUBTITLE: '',
      AUTHOR: '',
      DATE: '',
    };

    let content = '';

    // Try to extract metadata section
    const metadataMatch = response.match(/---METADATA---([\s\S]*?)---CONTENT---/);
    if (metadataMatch) {
      const metadataSection = metadataMatch[1];
      const titleMatch = metadataSection.match(/TITLE:\s*(.+)/);
      const subtitleMatch = metadataSection.match(/SUBTITLE:\s*(.+)/);
      const authorMatch = metadataSection.match(/AUTHOR:\s*(.+)/);
      const dateMatch = metadataSection.match(/DATE:\s*(.+)/);

      if (titleMatch) metadata.TITLE = titleMatch[1].trim();
      if (subtitleMatch) metadata.SUBTITLE = subtitleMatch[1].trim();
      if (authorMatch) metadata.AUTHOR = authorMatch[1].trim();
      if (dateMatch) metadata.DATE = dateMatch[1].trim();
    }

    // Extract content section
    const contentMatch = response.match(/---CONTENT---([\s\S]*?)---END---/);
    if (contentMatch) {
      content = contentMatch[1].trim();
    } else {
      // Fallback: use everything after CONTENT marker
      const fallbackMatch = response.match(/---CONTENT---([\s\S]*)/);
      content = fallbackMatch ? fallbackMatch[1].trim() : response;
    }

    console.log('Parsed metadata:', metadata);
    console.log('Parsed content length:', content.length);

    return { metadata, content };
  };

  const generateWhitepaperApp = (response: string): FileStructure => {
    const { metadata, content } = parseAIResponse(response);

    // Escape content for embedding in template string
    const escapedContent = content
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');

    // Use inline template instead of importing from file
    const template = `import React, { useState } from 'react';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showToc, setShowToc] = useState(true);

  const content = \`${escapedContent}\`;
  const title = "${metadata.TITLE}";
  const subtitle = "${metadata.SUBTITLE}";
  const author = "${metadata.AUTHOR}";
  const date = "${metadata.DATE}";

  // Extract headings for TOC
  const headings = [];
  const lines = content.split('\\n');
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,3})\\s+(.+)$/);
    if (match) {
      headings.push({ id: \`h\${index}\`, text: match[2], level: match[1].length });
    }
  });

  const parseMarkdown = (text) => {
    if (!text) return [];
    if (searchQuery) {
      text = text.split('\\n').filter(l => l.toLowerCase().includes(searchQuery.toLowerCase())).join('\\n');
    }

    // Helper to parse inline markdown (bold, italic)
    const parseInline = (str) => {
      if (!str) return str;
      const parts = [];
      let lastIndex = 0;

      // Match **bold**, *italic*, \u0060code\u0060 (using unicode for backtick)
      const regex = /(\\\\*\\\\*(.+?)\\\\*\\\\*)|(\\\\*(.+?)\\\\*)|((\\u0060)(.+?)(\\u0060))/g;
      let match;

      while ((match = regex.exec(str)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
          parts.push(str.substring(lastIndex, match.index));
        }

        // Add formatted match
        if (match[1]) { // **bold**
          parts.push(<strong key={match.index} style={{ fontWeight: 'bold' }}>{match[2]}</strong>);
        } else if (match[3]) { // *italic*
          parts.push(<em key={match.index} style={{ fontStyle: 'italic' }}>{match[4]}</em>);
        } else if (match[5]) { // \u0060code\u0060
          parts.push(<code key={match.index} style={{ background: '#1E293B', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.9em', color: '#93C5FD' }}>{match[7]}</code>);
        }

        lastIndex = regex.lastIndex;
      }

      // Add remaining text
      if (lastIndex < str.length) {
        parts.push(str.substring(lastIndex));
      }

      return parts.length > 0 ? parts : str;
    };

    return text.split('\\n').map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: '1.5rem', color: '#93C5FD', marginTop: '1.5rem' }}>{parseInline(line.slice(4))}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '2rem', color: '#93C5FD', marginTop: '2rem' }}>{parseInline(line.slice(3))}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '2.5rem', color: '#E5E7EB', marginTop: '2rem' }}>{parseInline(line.slice(2))}</h1>;
      if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: '1.5rem' }}>{parseInline(line.slice(2))}</li>;
      if (line.startsWith('> ')) return <blockquote key={i} style={{ borderLeft: '4px solid #4F8AE6', paddingLeft: '1rem', color: '#94A3B8' }}>{parseInline(line.slice(2))}</blockquote>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} style={{ marginBottom: '1rem' }}>{parseInline(line)}</p>;
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B1220', color: '#E5E7EB', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ position: 'sticky', top: 0, background: 'linear-gradient(135deg, #0B1020, #1E40AF)', borderBottom: '2px solid #4F8AE6', padding: '1.5rem 2rem', zIndex: 100, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{title}</h1>
          {subtitle && <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#93C5FD' }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setShowToc(!showToc)} style={{ padding: '0.5rem 1rem', background: '#334155', border: 'none', borderRadius: '0.5rem', color: '#E5E7EB', cursor: 'pointer' }}>
            {showToc ? '📖 Hide TOC' : '📖 Show TOC'}
          </button>
          <button onClick={() => window.print()} style={{ padding: '0.5rem 1rem', background: '#334155', border: 'none', borderRadius: '0.5rem', color: '#E5E7EB', cursor: 'pointer' }}>📥 PDF</button>
        </div>
      </header>
      <div style={{ display: 'flex' }}>
        {showToc && (
          <aside style={{ width: '280px', background: '#0F172A', borderRight: '1px solid #334155', padding: '1.5rem', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1rem', color: '#93C5FD', marginBottom: '1rem' }}>📑 Contents</h2>
            {headings.map(h => (
              <a key={h.id} href={\`#\${h.id}\`} style={{ display: 'block', padding: '0.5rem', paddingLeft: \`\${(h.level-1)*16}px\`, color: '#94A3B8', textDecoration: 'none', fontSize: h.level === 1 ? '0.9rem' : '0.85rem' }}>{h.text}</a>
            ))}
          </aside>
        )}
        <main style={{ flex: 1, padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
          <input type="text" placeholder="🔍 Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', marginBottom: '2rem', background: '#0F172A', border: '1px solid #334155', borderRadius: '0.5rem', color: '#E5E7EB' }} />
          {(author || date) && (
            <div style={{ padding: '1rem', background: '#0F172A', borderRadius: '0.5rem', marginBottom: '2rem', fontSize: '0.875rem', color: '#94A3B8' }}>
              {author && <div>✍️ <strong>Author:</strong> {author}</div>}
              {date && <div>📅 <strong>Date:</strong> {date}</div>}
            </div>
          )}
          <article style={{ lineHeight: '1.75' }}>{parseMarkdown(content)}</article>
        </main>
      </div>
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#4F8AE6', color: 'white', border: 'none', borderRadius: '50%', width: '3rem', height: '3rem', fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,138,230,0.4)' }}>↑</button>
    </div>
  );
}`;

    console.log('Generated app template, length:', template.length);

    return {
      '/App.js': template  // Sandpack expects .js not .tsx for the react template
    };
  };

  // Helper to get content size info
  const getContentSizeInfo = () => {
    const chars = whitepaper.length;
    const kb = (chars / 1024).toFixed(1);
    const isLarge = chars > 50000;
    const isVeryLarge = chars > 100000;

    return { chars, kb, isLarge, isVeryLarge };
  };

  const handleGenerate = async () => {
    if (!whitepaper.trim()) {
      alert('Please enter whitepaper content');
      return;
    }

    const { isVeryLarge } = getContentSizeInfo();
    if (isVeryLarge && !confirm('Your whitepaper is very large (>100KB). Generation may take longer or be truncated. Continue?')) {
      return;
    }

    setIsGenerating(true);
    setGeneratedCode('');
    setFiles({});
    setShowPreview(false);
    setStartTime(Date.now());
    setGenerationTime(0);

    try {
      const response = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whitepaper }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedCode = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                setGenerationTime(parseFloat(elapsed));
                setIsGenerating(false);
                setShowPreview(true);
                console.log(`Generation complete in ${elapsed}s`);
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedCode += parsed.content;
                  setGeneratedCode(accumulatedCode);

                  // Generate whitepaper app from AI response
                  try {
                    const appFiles = generateWhitepaperApp(accumulatedCode);
                    if (Object.keys(appFiles).length > 0) {
                      setFiles(appFiles);
                      // Update the code display to show the generated app, not AI response
                      setGeneratedCode(appFiles['/App.js'] || accumulatedCode);
                      setShowPreview(true);
                    }
                  } catch (e) {
                    console.error('Error generating app:', e);
                  }
                }
              } catch (e) {
                // Ignore parse errors for incomplete JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating:', error);
      alert('Error generating app. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleContinue = async () => {
    if (!generatedCode) {
      alert('No previous code to continue from');
      return;
    }

    console.log('Continue clicked, previous code length:', generatedCode.length);
    setIsGenerating(true);

    try {
      const response = await fetch('/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whitepaper, previousResponse: generatedCode }),
      });

      console.log('Continue response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedCode = generatedCode;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsGenerating(false);
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedCode += parsed.content;
                  setGeneratedCode(accumulatedCode);

                  try {
                    const appFiles = generateWhitepaperApp(accumulatedCode);
                    if (Object.keys(appFiles).length > 0) {
                      setFiles(appFiles);
                      // Update the code display to show the generated app
                      setGeneratedCode(appFiles['/App.js'] || accumulatedCode);
                      setShowPreview(true);
                    }
                  } catch (e) {
                    console.error('Error generating app:', e);
                  }
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error continuing:', error);
      alert('Error continuing generation. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (Object.keys(files).length === 0) {
      alert('No code to download. Generate an app first!');
      return;
    }

    const zip = new JSZip();

    // Add generated files
    Object.entries(files).forEach(([path, content]) => {
      // Remove leading slash for cleaner paths
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      zip.file(cleanPath, content);
    });

    // Add package.json with dependencies
    const packageJson = {
      name: 'whitepaper-viewer',
      version: '1.0.0',
      description: 'Generated whitepaper viewer app',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0'
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.2.0',
        vite: '^5.0.0'
      }
    };
    zip.file('package.json', JSON.stringify(packageJson, null, 2));

    // Add index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Whitepaper Viewer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
    zip.file('index.html', indexHtml);

    // Add main.jsx entry point
    const mainJsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
    zip.file('src/main.jsx', mainJsx);

    // Add vite.config.js
    const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`;
    zip.file('vite.config.js', viteConfig);

    // Add README
    const readme = `# Whitepaper Viewer App

Generated by AI Whitepaper App Generator
Built by Harish Kotra

## Setup

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Run development server:
   \`\`\`
   npm run dev
   \`\`\`

3. Build for production:
   \`\`\`
   npm run build
   \`\`\`

## Features

- Dark/blue theme design
- Table of contents with auto-generated headings
- Search functionality
- PDF export (via browser print)
- Responsive layout
- Back to top button
`;
    zip.file('README.md', readme);

    // Generate and download zip
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'whitepaper-app.zip');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div>
          <h1>🚀 AI Whitepaper App Generator</h1>
          <p>Powered by <a href="https://gaianet.ai/?ref=ai-ui" target="_blank">Gaia Nodes</a></p>
        </div>
        <button
          onClick={() => setShowCodePanel(!showCodePanel)}
          className="toggle-code-btn"
          title={showCodePanel ? 'Hide code panel' : 'Show code panel'}
        >
          {showCodePanel ? '👁️ Hide Code' : '👁️ Show Code'}
        </button>
      </header>

      {/* Main Content - Split View */}
      <div className="main-content">
        {/* Left Panel - Input */}
        <div className="input-panel">
          <div className="panel-header">
            <h2>📄 Whitepaper Input</h2>
            {whitepaper && (
              <span className={`char-count ${getContentSizeInfo().isLarge ? 'warning' : ''}`}>
                {getContentSizeInfo().kb} KB
                {getContentSizeInfo().isLarge && ' ⚠️'}
              </span>
            )}
          </div>
          <textarea
            value={whitepaper}
            onChange={(e) => setWhitepaper(e.target.value)}
            placeholder="Paste your whitepaper content here (text or markdown)..."
            disabled={isGenerating}
          />
          <div className="button-group">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !whitepaper.trim()}
              className="generate-btn"
            >
              {isGenerating ? (
                <>
                  <span className="spinner"></span>
                  Generating...
                </>
              ) : (
                '✨ Generate App'
              )}
            </button>
            {generatedCode && (
              <button
                onClick={handleContinue}
                disabled={isGenerating}
                className="continue-btn"
              >
                ➕ Continue Generation
              </button>
            )}
          </div>
        </div>

        {/* Middle Panel - Generated Code (Toggleable) */}
        {showCodePanel && (
          <div className="code-panel">
            <div className="panel-header">
              <h2>💻 Generated Code</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {generationTime > 0 && (
                  <span className="char-count" style={{ background: '#10B981' }}>
                    ⚡ {generationTime}s
                  </span>
                )}
                <span className="file-count">
                  {Object.keys(files).length} {Object.keys(files).length === 1 ? 'file' : 'files'}
                </span>
              </div>
            </div>
            <div className="code-display">
              {generatedCode ? (
                <pre>{generatedCode}</pre>
              ) : (
                <div className="empty-state">
                  <p>Generated code will appear here...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Panel - Live Preview */}
        <div className="preview-panel">
          <div className="panel-header">
            <h2>🎨 Live Preview</h2>
            {Object.keys(files).length > 0 && (
              <button
                onClick={handleDownload}
                className="download-btn"
                title="Download complete app code"
              >
                📥 Download
              </button>
            )}
          </div>
          <div className="preview-container">
            {showPreview && Object.keys(files).length > 0 ? (
              <Sandpack
                theme={sandpackDark}
                template="react"
                files={files}
                options={{
                  showNavigator: false,
                  showTabs: true,
                  showLineNumbers: true,
                  editorHeight: '100%',
                  editorWidthPercentage: 50,
                }}
              />
            ) : (
              <div className="empty-state">
                {isGenerating ? (
                  <>
                    <p>⏳ Generating your whitepaper app...</p>
                    <p className="hint">Watch the code appear in the middle panel →</p>
                    {generatedCode && Object.keys(files).length === 0 && (
                      <p className="hint warning">
                        ⚠️ Code generated but no files parsed yet.
                        <br />
                        Check console (F12) for parsing details.
                      </p>
                    )}
                  </>
                ) : generatedCode && Object.keys(files).length === 0 ? (
                  <>
                    <p>⚠️ Code generated but couldn't parse files</p>
                    <p className="hint">
                      The AI may have used an unexpected format.
                      <br />
                      Check browser console (F12) for details.
                      <br />
                      Try clicking "Continue Generation" to get more code.
                    </p>
                  </>
                ) : (
                  <>
                    <p>Live preview will appear here...</p>
                    <p className="hint">👆 Enter whitepaper and click Generate</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>
          Built by <a href="https://github.com/harishkotra" target="_blank" rel="noopener noreferrer">Harish Kotra</a>
        </p>
      </footer>
    </div>
  );
}

export default App;

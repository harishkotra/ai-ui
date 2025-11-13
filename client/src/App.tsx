import { useState, useRef } from 'react';
import { Sandpack } from '@codesandbox/sandpack-react';
import { sandpackDark } from '@codesandbox/sandpack-themes';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { VIEWER_TEMPLATE } from './templates/ViewerTemplate';
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
  const [waitTime, setWaitTime] = useState<number>(0);
  const [pitchDeck, setPitchDeck] = useState<string>('');

  // Ref to store AbortController for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const parseWhitepaperResponse = (response: string): { metadata: Record<string, string>; content: string } => {
    console.log('Parsing whitepaper response, length:', response.length);

    const metadata: Record<string, string> = {
      TITLE: 'Whitepaper',
      SUBTITLE: '',
      AUTHOR: '',
      DATE: '',
    };

    let content = '';

    // Extract metadata section
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
      const fallbackMatch = response.match(/---CONTENT---([\s\S]*)/);
      content = fallbackMatch ? fallbackMatch[1].trim() : response;
    }

    console.log('Parsed metadata:', metadata);
    console.log('Parsed content length:', content.length);

    return { metadata, content };
  };

  const generateWhitepaperApp = (whitepaperResponse: string, pitchResponse: string): FileStructure => {
    const { metadata, content } = parseWhitepaperResponse(whitepaperResponse);
    const pitch = pitchResponse.trim();

    console.log('Generating whitepaper app with:', {
      title: metadata.TITLE,
      contentLength: content.length,
      pitchLength: pitch.length
    });

    // Escape content for embedding in template literals
    const escapeContent = (str: string) => str
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$')
      .replace(/\r\n/g, '\\n')
      .replace(/\n/g, '\\n');

    // Replace template markers with actual content
    let appCode = VIEWER_TEMPLATE
      .replace('{{CONTENT}}', escapeContent(content))
      .replace('{{PITCH}}', escapeContent(pitch))
      .replace('{{TITLE}}', metadata.TITLE.replace(/"/g, '\\"'))
      .replace('{{SUBTITLE}}', metadata.SUBTITLE.replace(/"/g, '\\"'))
      .replace('{{AUTHOR}}', metadata.AUTHOR.replace(/"/g, '\\"'))
      .replace('{{DATE}}', metadata.DATE.replace(/"/g, '\\"'));

    console.log('Generated app code, length:', appCode.length);

    return {
      '/App.js': appCode
    };
  };

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
    setWaitTime(0);

    // Update wait time every second for UI feedback
    const waitInterval = setInterval(() => {
      setWaitTime(prev => prev + 1);
    }, 1000);

    // Show warning about potential delay
    let timeoutWarning: NodeJS.Timeout | null = null;
    timeoutWarning = setTimeout(() => {
      console.warn('GaiaNet node is taking longer than expected. The remote AI node may be slow or busy.');
    }, 10000);

    try {
      abortControllerRef.current = new AbortController();
      const timeout = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, 300000); // 5 minute absolute timeout

      const response = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whitepaper }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeout);
      clearInterval(waitInterval);
      if (timeoutWarning) clearTimeout(timeoutWarning);

      if (!response.ok) throw new Error('Generation failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('Stream complete');
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulated += parsed.content;
                setGeneratedCode(accumulated);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }

      console.log('Whitepaper response length:', accumulated.length);
      setGeneratedCode(accumulated);

      // Now generate the pitch deck
      console.log('Generating pitch deck...');
      const pitchResponse = await fetch('/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whitepaper }),
        signal: abortControllerRef.current.signal,
      });

      if (!pitchResponse.ok) throw new Error('Pitch generation failed');
      if (!pitchResponse.body) throw new Error('No pitch response body');

      const pitchReader = pitchResponse.body.getReader();
      const pitchDecoder = new TextDecoder();
      let pitchAccumulated = '';

      while (true) {
        const { value, done } = await pitchReader.read();
        if (done) break;

        const chunk = pitchDecoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('Pitch stream complete');
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                pitchAccumulated += parsed.content;
              }
            } catch (e) {
              console.error('Pitch parse error:', e);
            }
          }
        }
      }

      console.log('Pitch response length:', pitchAccumulated.length);

      // Clean pitch response - remove any analysis/thinking text before actual content
      let cleanedPitch = pitchAccumulated;

      // Find where the actual pitch content starts (first # heading)
      const firstHeadingMatch = pitchAccumulated.match(/^#\s+/m);
      if (firstHeadingMatch && firstHeadingMatch.index) {
        cleanedPitch = pitchAccumulated.substring(firstHeadingMatch.index);
        console.log('Cleaned pitch, removed', firstHeadingMatch.index, 'chars of analysis');
      }

      // Store pitch deck for later use
      setPitchDeck(cleanedPitch);

      // Generate the app from both responses
      const generatedFiles = generateWhitepaperApp(accumulated, cleanedPitch);
      console.log('Generated files:', Object.keys(generatedFiles));

      setFiles(generatedFiles);
      setShowPreview(true);
      setGenerationTime(Date.now() - startTime);

    } catch (error) {
      console.error('Generation error:', error);
      clearInterval(waitInterval);
      if (error instanceof Error && error.name === 'AbortError') {
        // Check if it was manually cancelled or timed out
        if (waitTime >= 300) {
          alert('Generation timed out after 5 minutes. The GaiaNet node may be overloaded. Please try again later.');
        } else {
          console.log('Generation cancelled by user');
        }
      } else {
        alert('Failed to generate whitepaper app. Please try again.');
      }
    } finally {
      setIsGenerating(false);
      setWaitTime(0);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setWaitTime(0);
      abortControllerRef.current = null;
    }
  };

  const handleContinue = async () => {
    if (!generatedCode) {
      alert('No previous generation to continue from');
      return;
    }

    setIsGenerating(true);
    const continueStartTime = Date.now();

    try {
      const response = await fetch('/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whitepaper,
          previousResponse: generatedCode,
        }),
      });

      if (!response.ok) throw new Error('Continue failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = generatedCode;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulated += parsed.content;
                setGeneratedCode(accumulated);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }

      // Regenerate with continued content
      const generatedFiles = generateWhitepaperApp(accumulated, pitchDeck);
      setFiles(generatedFiles);
      setShowPreview(true);
      setGenerationTime(Date.now() - continueStartTime);

    } catch (error) {
      console.error('Continue error:', error);
      alert('Failed to continue generation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (Object.keys(files).length === 0) {
      alert('No files to download');
      return;
    }

    const zip = new JSZip();

    // Add generated files
    Object.entries(files).forEach(([path, content]) => {
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      zip.file(cleanPath, content);
    });

    // Add package.json with dependencies
    const packageJson = {
      name: 'whitepaper-viewer',
      version: '1.0.0',
      description: 'Generated whitepaper viewer powered by GaiaNet',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-markdown': '^9.0.1',
        'remark-gfm': '^4.0.0'
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

    // Add vite config
    const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`;
    zip.file('vite.config.js', viteConfig);

    // Add README
    const readme = `# Whitepaper Viewer

Generated by AI Whitepaper Generator
Powered by [GaiaNet](https://gaianet.ai) decentralized AI

## Setup

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`
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
          <h1>🚀 AI Whitepaper Generator</h1>
          <p>Powered by <a href="https://gaianet.ai/?ref=ai-ui" target="_blank" rel="noopener noreferrer">GaiaNet</a> decentralized AI nodes</p>
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
              </span>
            )}
          </div>
          <textarea
            value={whitepaper}
            onChange={(e) => setWhitepaper(e.target.value)}
            placeholder="Paste your whitepaper content here... (Markdown supported)"
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
                  <span className="spinner"></span> {
                    waitTime > 30
                      ? `Still waiting... (${waitTime}s)`
                      : waitTime > 15
                        ? 'Waiting for GaiaNet node...'
                        : 'Generating...'
                  }
                </>
              ) : (
                <>⚡ Generate App</>
              )}
            </button>
            {isGenerating && (
              <button
                onClick={handleCancel}
                className="cancel-btn"
              >
                ✕ Cancel
              </button>
            )}
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
          {generationTime > 0 && (
            <div style={{ padding: '0.5rem 1.5rem', fontSize: '0.875rem', color: '#30E000' }}>
              ✓ Generated in {(generationTime / 1000).toFixed(1)}s
            </div>
          )}
        </div>

        {/* Middle Panel - Code (optional) */}
        {showCodePanel && (
          <div className="code-panel">
            <div className="panel-header">
              <h2>🔧 Generated Code</h2>
              {generatedCode && (
                <span className="char-count">{(generatedCode.length / 1024).toFixed(1)} KB</span>
              )}
            </div>
            <div className="code-display">
              {generatedCode ? (
                <pre>{generatedCode}</pre>
              ) : (
                <div className="empty-state">
                  <p>No code generated yet</p>
                  <p className="hint">Click "Generate App" to start</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Panel - Preview */}
        <div className="preview-panel">
          <div className="panel-header">
            <h2>👁️ Live Preview</h2>
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
                customSetup={{
                  dependencies: {
                    'markdown-to-jsx': '^7.4.0',
                  },
                }}
                options={{
                  showNavigator: false,
                  showTabs: false,
                  showLineNumbers: false,
                  editorHeight: '100%',
                  editorWidthPercentage: 0,
                  showConsole: false,
                  showConsoleButton: false,
                }}
              />
            ) : (
              <div className="empty-state">
                {isGenerating ? (
                  <>
                    <p>⏳ Generating your whitepaper app... ({waitTime}s)</p>
                    <p className="hint">
                      {waitTime > 60
                        ? '⚠️ GaiaNet node is very slow. Please wait or try again later.'
                        : waitTime > 30
                          ? '⚠️ Taking longer than expected. The AI node may be busy.'
                          : waitTime > 15
                            ? 'Waiting for GaiaNet AI node to respond...'
                            : 'This may take 10-90 seconds depending on node speed'
                      }
                    </p>
                  </>
                ) : generatedCode && Object.keys(files).length === 0 ? (
                  <>
                    <p>⚠️ Code generated but couldn't parse files</p>
                    <p className="hint">Try clicking "Continue Generation"</p>
                  </>
                ) : (
                  <>
                    <p>📄 No preview yet</p>
                    <p className="hint">Enter whitepaper content and click "Generate App"</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

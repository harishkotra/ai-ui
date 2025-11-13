#!/usr/bin/env node

// This script reads WhitepaperViewer.tsx and converts it to a template string for App.tsx
const fs = require('fs');
const path = require('path');

const viewerPath = path.join(__dirname, '../client/src/templates/WhitepaperViewer.tsx');
let viewerCode = fs.readFileSync(viewerPath, 'utf-8');

// Remove TypeScript types and convert to JS
viewerCode = viewerCode
  .replace(/: React\.ReactNode/g, '')
  .replace(/: \{ children\?: React\.ReactNode;? \w*\?: string\? \}/g, '({ children, href })')
  .replace(/: \{ children\?: React\.ReactNode; inline\?: boolean;? \}/g, '({ children, inline })')
  .replace(/: \{ children\?: React\.ReactNode \}/g, '({ children })')
  .replace(/: WhitepaperViewerProps/g, '')
  .replace(/interface.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n}/s, '')
  .replace(/export default function WhitepaperViewer\({[^}]+}\)/, 'export default function App()')
  .replace(/#4F8AE6/g, '#0E76FD') // GaiaNet blue
  .replace(/#1E40AF/g, '#0E76FD') // GaiaNet blue
  .replace(/#93C5FD/g, '#0E76FD') // GaiaNet blue for headings
  .replace(/borderRadius: '0.5rem'/g, "borderRadius: '12px'") // GaiaNet rounded corners
  ;

// Add pitch content handling
viewerCode = viewerCode.replace(
  'content: string;',
  'content: string;\n  pitchContent: string;'
);

console.log('Template generated successfully');
console.log('Copy this to App.tsx:');
console.log('```');
console.log(viewerCode);
console.log('```');

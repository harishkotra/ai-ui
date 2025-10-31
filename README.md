# AI Whitepaper App Generator

Transform whitepapers into beautiful, production-ready Next.js applications using AI - powered by **Gaia Nodes**.

## Overview

This application takes whitepaper content (text or markdown) as input and uses AI to generate a complete, runnable Next.js application with an elegant dark, blue-forward design. The generated app includes:

- 📱 Responsive whitepaper viewer with dark/blue theme
- 📑 Auto-generated table of contents
- 🔍 In-document search
- 📥 PDF export functionality
- ♿ Full accessibility features
- 🎨 Beautiful UI with Tailwind CSS, shadcn/ui components

## Features

### 🎯 Core Capabilities

- **Live Preview**: See the generated app running in real-time using Sandpack
- **Split-Panel UI**: View input, generated code, and live preview simultaneously
- **Streaming Generation**: Watch the code generate in real-time
- **Continue Generation**: Extend the generated code if needed
- **Production-Ready Output**: Complete Next.js apps ready to deploy

### 🛠️ Technology Stack

**Frontend:**
- React 18
- Vite (for fast development)
- Sandpack (CodeSandbox's in-browser bundler)
- TypeScript

**Backend:**
- Express.js
- OpenAI SDK (configured for Gaia Nodes)
- Server-Sent Events (SSE) for streaming

**AI Provider:**
- Gaia Nodes (Qwen3-30B model)

## Project Structure

```
ai-ui/
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── App.tsx     # Main UI component
│   │   ├── App.css     # Styles
│   │   └── index.css   # Global styles
│   └── package.json
├── server/              # Express backend
│   ├── server.ts       # API endpoints
│   ├── dist/           # Compiled JS
│   └── tsconfig.json
├── .env                 # Environment variables
├── .env.example         # Environment template
└── package.json         # Root package manager
```

## Setup Instructions

### 1. Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Gaia Nodes API key

### 2. Environment Configuration

Copy `.env.example` to `.env` and add your Gaia API key:

```bash
GAIA_API_KEY=your_gaia_api_key_here
GAIA_NODE_URL=https://qwen72b.gaia.domains/v1
GAIA_MODEL_NAME=Qwen3-30B-A3B-Q5_K_M
PORT=3001
```

### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install
cd ..
```

### 4. Running the Application

**Option 1: Start both servers separately**

Terminal 1 (Backend):
```bash
npm run server:build  # Build the server once
node server/dist/server.js
```

Terminal 2 (Frontend):
```bash
cd client && npm run dev
```

**Option 2: If you have concurrently installed**
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## Usage

1. **Open the application** at http://localhost:5173

2. **Enter whitepaper content** in the left panel (supports text or markdown)

3. **Click "Generate App"** to start the AI generation

4. **Watch the code generate** in the middle panel as the AI streams the response

5. **See the live preview** in the right panel - the app updates in real-time!

6. **Continue generation** (optional) if you want to add more features

## API Endpoints

### `POST /generate`
Generate a new whitepaper app from content.

**Request:**
```json
{
  "whitepaper": "Your whitepaper content here..."
}
```

**Response:** Server-Sent Events stream with generated code

### `POST /continue`
Continue generating from where the previous generation left off.

**Request:**
```json
{
  "whitepaper": "Original whitepaper content",
  "previousResponse": "Previously generated code"
}
```

**Response:** Server-Sent Events stream with additional code

## How It Works

1. **User Input**: User pastes whitepaper content into the UI

2. **AI Processing**:
   - Content is sent to Gaia Nodes (Qwen model)
   - AI follows a detailed prompt to generate Next.js code
   - Response is streamed back in real-time

3. **Code Parsing**:
   - Frontend parses code blocks from AI response
   - Extracts file paths and contents
   - Maps to Sandpack file structure

4. **Live Preview**:
   - Sandpack bundles and runs the code in-browser
   - Shows the generated app immediately
   - Updates incrementally as more code arrives

## Code Parsing

The application uses regex to extract code blocks from the AI response:

```typescript
const fileRegex = /```(?:tsx?|jsx?|css|json|md)?\s*(?:\/\/ )?([\w\/.]+)\n([\s\S]*?)```/g;
```

This matches code blocks with file paths like:
```tsx
// app/page.tsx
export default function Page() { ... }
```

## Design System

The generated apps follow a consistent design language:

**Colors:**
- Backgrounds: `#0B1220`, `#0F172A`, `#0B1020`
- Primary Blues: `#4F8AE6`, `#1E40AF`, `#93C5FD`
- Text: `#E5E7EB`, `#94A3B8`
- Borders: `#334155`

**Typography:**
- Body: Inter
- Headings: Space Grotesk

**Components:**
- Rounded corners (2xl)
- Soft shadows
- Generous spacing
- High contrast for readability

## Development

### Build for Production

```bash
# Build both server and client
npm run build

# Or separately:
npm run server:build
npm run client:build
```

### Scripts

- `npm run dev` - Start both servers
- `npm run client:dev` - Start frontend only
- `npm run server:dev` - Start backend only
- `npm run build` - Build everything
- `npm run server:build` - Build server
- `npm run client:build` - Build client

## Troubleshooting

### Server won't start
- Check that `.env` file exists with valid `GAIA_API_KEY`
- Ensure port 3001 is not in use
- Run `npm run server:build` first

### Client won't connect
- Verify backend is running on port 3001
- Check Vite proxy configuration in `client/vite.config.ts`
- Clear browser cache

### Generated app not showing
- Check browser console for errors
- Ensure code blocks are properly formatted
- Verify Sandpack can parse the file structure

## Contributing

This project is a proof-of-concept. To extend it:

1. **Improve code parsing**: Handle more file formats
2. **Add templates**: Support different app types
3. **Export functionality**: Download generated projects
4. **Enhanced preview**: Multiple device sizes
5. **Code editing**: Allow modifying generated code

## License

ISC

## Acknowledgments

- **Gaia Nodes** - AI infrastructure
- **Sandpack** - In-browser bundling
- **CodeSandbox** - Sandpack library
- **Qwen** - Language model

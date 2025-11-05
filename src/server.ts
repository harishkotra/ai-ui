import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- Static File Serving ---
const publicPath = path.join(process.cwd(), 'public');
console.log(`Serving static files from: ${publicPath}`);
app.use(express.static(publicPath));

// Middleware
app.use(express.json({ limit: '10mb' }));

// --- OpenAI and System Prompt Setup ---
const openai = new OpenAI({
    apiKey: process.env.GAIA_API_KEY,
    baseURL: process.env.GAIA_NODE_URL,
});

const systemPrompt = `
You are an expert React/Next.js engineer and designer. Your task is to generate the complete code and setup instructions for a web application based on the user's whitepaper content. Follow the detailed technical and design specifications provided below. When the user asks you to "continue", you must pick up exactly where you left off, without repeating any previous output.

<SPECIFICATIONS>
Tech & Project Setup
- Stack: Next.js (App Router), TypeScript, Tailwind CSS, MDX (or react-markdown), shadcn/ui, lucide-react, Framer Motion.
- Create a new Next.js app, configure Tailwind, and set up a /content/whitepaper.md file.
- Parse and render the full Markdown content, preserving all elements like headings, lists, tables, and code blocks.

Design Language (Dark / Blue Theme)
- Backgrounds: #0B1220 (page), #0F172A (panels).
- Text & Borders: #E5E7EB (high), #94A3B8 (mid), #334155 (borders).
- Blues: #4F8AE6 (primary), #1E40AF (deep), #93C5FD (tints).

Required Features
1.  Sticky Header: Title, "Download PDF", "Copy Link", "Toggle Outline".
2.  Collapsible Left Sidebar: Auto-generated Table of Contents (from h1-h3) with scroll-spy highlighting.
3.  Right Utility Rail: Client-side search and a "Back to Top" button.
4.  Main Content: Full, un-truncated whitepaper rendering with styled tables, code blocks (with copy button), blockquotes, etc.
5.  Performance: Lazy-loaded media, smooth scrolling, respect for reduced-motion.
6.  Print Stylesheet: A clean, readable print version for PDF export via window.print().
7.  SEO/Meta: Basic metadata and social sharing tags.
8.  Accessibility: High contrast, focus rings, semantic HTML, skip-to-content link.
</SPECIFICATIONS>
`;

// --- API Endpoints for Streaming ---

app.post('/generate', async (req: Request, res: Response) => {
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ error: 'Whitepaper content is required.' });
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    try {
        const stream = await openai.chat.completions.create({
            model: process.env.MODEL_NAME || "Qwen3-30B-A3B-Q5_K_M",
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Here is the whitepaper content:\n\n${content}` },
            ],
            stream: true,
        });
        for await (const chunk of stream) {
            const textChunk = chunk.choices[0]?.delta?.content || '';
            if (textChunk) {
                res.write(`data: ${JSON.stringify(textChunk)}\n\n`);
            }
        }
    } catch (error) {
        console.error('Error during AI stream:', error);
        res.write(`data: ${JSON.stringify({ error: 'An error occurred during generation.' })}\n\n`);
    } finally {
        res.end();
    }
});

app.post('/continue', async (req: Request, res: Response) => {
    const { content, partialResponse } = req.body;
    if (!content || !partialResponse) {
        return res.status(400).json({ error: 'Original content and partial response are required.' });
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    try {
        const stream = await openai.chat.completions.create({
            model: process.env.MODEL_NAME || "Qwen3-30B-A3B-Q5_K_M",
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Here is the whitepaper content:\n\n${content}` },
                { role: 'assistant', content: partialResponse },
            ],
            stream: true,
        });
        for await (const chunk of stream) {
            const textChunk = chunk.choices[0]?.delta?.content || '';
            if (textChunk) {
                res.write(`data: ${JSON.stringify(textChunk)}\n\n`);
            }
        }
    } catch (error) {
        console.error('Error during AI stream continuation:', error);
        res.write(`data: ${JSON.stringify({ error: 'An error occurred while continuing generation.' })}\n\n`);
    } finally {
        res.end();
    }
});

// --- Catch-all route for SPA ---
// Uses regex pattern for modern Express/path-to-regexp compatibility.
// This serves the main page for any other GET request that isn't a static file.
app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
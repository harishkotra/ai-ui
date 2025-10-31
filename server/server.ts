import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
// Increase payload limit to 50MB for large whitepapers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('dist'));

const openai = new OpenAI({
  apiKey: process.env.GAIA_API_KEY,
  baseURL: process.env.GAIA_NODE_URL,
});

const SYSTEM_PROMPT = `Extract metadata and format whitepaper content.

Your task: Analyze the whitepaper and extract:
1. Title (first heading or inferred from content)
2. Subtitle (if present)
3. Author (if mentioned)
4. Date (if mentioned)
5. Clean, well-formatted markdown content

Respond in this EXACT format:

---METADATA---
TITLE: [extracted title]
SUBTITLE: [extracted subtitle or leave blank]
AUTHOR: [extracted author or leave blank]
DATE: [extracted date or leave blank]
---CONTENT---
[Full whitepaper content in clean markdown format]
---END---

Keep all content. Fix formatting if needed. Use markdown headings (# ## ###), lists, tables, code blocks, etc.`;

app.post('/generate', async (req, res) => {
  const { whitepaper } = req.body;

  if (!whitepaper) {
    return res.status(400).json({ error: 'Whitepaper content is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await openai.chat.completions.create({
      model: process.env.GAIA_MODEL_NAME || 'Qwen3-30B-A3B-Q5_K_M',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Extract metadata and format this whitepaper:\n\n${whitepaper}` }
      ],
      stream: true,
      temperature: 0.3,
      max_tokens: 8000,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`);
    res.end();
  }
});

app.post('/continue', async (req, res) => {
  const { whitepaper, previousResponse } = req.body;

  if (!whitepaper || !previousResponse) {
    return res.status(400).json({ error: 'Whitepaper and previous response are required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await openai.chat.completions.create({
      model: process.env.GAIA_MODEL_NAME || 'Qwen3-30B-A3B-Q5_K_M',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Extract metadata and format this whitepaper:\n\n${whitepaper}` },
        { role: 'assistant', content: previousResponse },
        { role: 'user', content: 'Continue from where you left off. Complete the content section.' }
      ],
      stream: true,
      temperature: 0.3,
      max_tokens: 8000,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

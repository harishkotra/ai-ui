import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GAIA_API_KEY,
  baseURL: process.env.GAIA_NODE_URL,
});

const WHITEPAPER_PROMPT = `You are a document formatter. Extract metadata and format the whitepaper content in clean markdown.

Output ONLY the final formatted response. NO analysis, NO thinking process, NO explanations - just the formatted output.

Respond in this EXACT format:

---METADATA---
TITLE: [extracted title from first heading or content]
SUBTITLE: [extracted subtitle if present, otherwise leave blank]
AUTHOR: [extracted author if mentioned, otherwise leave blank]
DATE: [extracted date if mentioned, otherwise leave blank]
---CONTENT---
[Full whitepaper content in clean markdown format - preserve ALL content including tables, code blocks, lists, etc. Use proper markdown: # ## ###, **bold**, *italic*, lists, tables, code blocks, blockquotes]
---END---`;

export default async function handler(req, res) {
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
        { role: 'system', content: WHITEPAPER_PROMPT },
        { role: 'user', content: whitepaper }
      ],
      stream: true,
      temperature: 0.1,
      max_tokens: 6000,
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

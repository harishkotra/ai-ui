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

const PITCH_PROMPT = `Create an investor pitch deck in markdown format. Start immediately with the Executive Summary section.

DO NOT include:
- Any analysis or thinking process
- Meta-commentary about what you're doing
- Planning or explanations
- Tags like <|channel|>, <|analysis|>, or similar

Start your response directly with: # Executive Summary

Required sections in this exact order:

# Executive Summary
2-3 paragraphs summarizing the key value proposition and opportunity.

# Problem Statement
The problem being solved. Use bullet points for key pain points.

# Solution
How the product/technology solves the problem. Key features and benefits.

# Market Opportunity
Market size, target audience, growth potential.

# Competitive Advantage
What makes this unique. Key differentiators.

# Business Model
How the business makes money.

# Roadmap & Vision
Future plans and long-term vision.

# Call to Action
Clear next steps for investors/partners/users.

Use markdown formatting: headings (#), **bold**, *italic*, bullet points. Begin immediately with # Executive Summary.`;

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
});

app.post('/generate-pitch', async (req, res) => {
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
        { role: 'system', content: PITCH_PROMPT },
        { role: 'user', content: whitepaper }
      ],
      stream: true,
      temperature: 0.3,
      max_tokens: 3000,
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
    res.write(`data: ${JSON.stringify({ error: 'Pitch generation failed' })}\n\n`);
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
        { role: 'system', content: WHITEPAPER_PROMPT },
        { role: 'user', content: whitepaper },
        { role: 'assistant', content: previousResponse },
        { role: 'user', content: 'Continue from where you left off. Complete the remaining content.' }
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
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

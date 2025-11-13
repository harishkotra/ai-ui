import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GAIA_API_KEY,
  baseURL: process.env.GAIA_NODE_URL,
});

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
}

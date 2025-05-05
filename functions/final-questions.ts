import type { Handler } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const handler: Handler = async (event, context) => {
  try {
    const prompt = `
You're a job interview expert.

Please generate two final interview questions:
1. A classic interview question like "What’s your greatest weakness?" or "Why do you want to work here?"
2. A curveball question that reveals personality, creativity, or values.

Only return the two questions as plain text, numbered like this:

1. [classic question]
2. [curveball question]
`;

    const completion = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 300,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    });

    const text = completion.content[0].text.trim();

    // Extract the two questions using basic regex
    const matches = text.match(/1\.\s*(.+)\s*2\.\s*(.+)/s);
    if (!matches || matches.length < 3) {
      throw new Error("Failed to parse questions from Claude response");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        classic: matches[1].trim(),
        curveball: matches[2].trim()
      })
    };
  } catch (error) {
    console.error("Claude error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate final questions." })
    };
  }
};

export { handler };

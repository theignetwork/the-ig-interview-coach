import { Handler } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const handler: Handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { originalQuestion, userAnswer } = body;

    if (!originalQuestion || !userAnswer) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing input' })
      };
    }

    const prompt = `
You're an expert interview coach.

A candidate was just asked a job interview question. Based on their answer, generate a single thoughtful follow-up question that digs deeper into what they said. Make it feel natural, as if it came from a real interviewer.

Only return the follow-up question.

---

Original Question:
${originalQuestion}

Candidate's Answer:
${userAnswer}
`;

    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 200,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    });

    const followUpQuestion = response.content[0].text.trim();

    return {
      statusCode: 200,
      body: JSON.stringify({ followUpQuestion })
    };
  } catch (err) {
    console.error("Follow-up error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate follow-up.' })
    };
  }
};

export { handler };

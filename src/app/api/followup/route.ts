import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { originalQuestion, userAnswer } = body;

    if (!originalQuestion || !userAnswer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    const completion = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 200,
      temperature: 0.7,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const followUp = completion.content[0].text.trim();
    return NextResponse.json({ followUpQuestion: followUp });
  } catch (err) {
    console.error("Claude follow-up error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

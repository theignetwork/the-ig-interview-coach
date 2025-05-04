import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const handler = async (event: any) => {
  try {
    const { jobDescription } = JSON.parse(event.body || "{}");

    if (!jobDescription) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing job description" }),
      };
    }

    const prompt = `You are a friendly and sharp AI recruiter. Based on the job description below, ask a single thoughtful interview question designed to evaluate the candidate's real-world fit. Ask it in a conversational tone.\n\nJob Description:\n${jobDescription}\n\nQuestion:\n`;

    const completion = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const output = completion.content?.[0]?.text?.trim();

    return {
      statusCode: 200,
      body: JSON.stringify({ question: output }),
    };
  } catch (err: any) {
    console.error("Claude error:", err?.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};


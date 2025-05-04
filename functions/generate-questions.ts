import { Anthropic } from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const handler = async (event: any) => {
  try {
    const { jobDescription } = JSON.parse(event.body || "{}");
    if (!jobDescription || jobDescription.trim().length < 10) {
      return { statusCode: 400, body: "Missing or invalid job description" };
    }

    const prompt = `You are a sharp but friendly recruiter. Based ONLY on the job description below, ask ONE high‑impact interview question that would reveal whether the candidate can truly succeed in the role. Write just the question, no preamble.

Job Description:
${jobDescription}

Question:`;

    const resp = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      temperature: 0.7,
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const question = resp?.content?.[0]?.text?.trim() || "";
    if (!question)
      return { statusCode: 500, body: "Claude returned no output." };

    return { statusCode: 200, body: JSON.stringify({ question }) };
  } catch (err: any) {
    console.error("Claude error:", err);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};








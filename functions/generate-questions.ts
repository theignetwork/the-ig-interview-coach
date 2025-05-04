// /netlify/functions/generate-questions.ts
import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function extractTitleAndCompany(text: string) {
  const titleMatch = text.match(/(Role|Position):?\s*(.+)/i);
  const companyMatch = text.match(/(?:at|for)\s+([A-Z][a-zA-Z0-9& ]+)/);
  return {
    jobTitle: titleMatch ? titleMatch[2].trim() : "Custom Role",
    company: companyMatch ? companyMatch[1].trim() : "Company Name",
  };
}

export const handler = async (event: any) => {
  try {
    const { jobDescription } = JSON.parse(event.body || "{}");

    if (!jobDescription || jobDescription.trim().length < 10) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid job description" }),
      };
    }

    const prompt = `You are a friendly and sharp AI recruiter. Based on the job description below, ask ONE thoughtful interview question to evaluate the candidate's real-world fit. Keep the tone conversational, not robotic.

Job Description:
${jobDescription}

Question:`;

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

    if (!output) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Claude returned no output." }),
      };
    }

    const { jobTitle, company } = extractTitleAndCompany(jobDescription);

    return {
      statusCode: 200,
      body: JSON.stringify({
        questions: [output],
        jobTitle,
        company,
      }),
    };
  } catch (err: any) {
    console.error("Claude error:", err?.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};






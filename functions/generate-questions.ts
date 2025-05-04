import { Handler } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const handler: Handler = async (event) => {
  try {
    const { jobDescription } = JSON.parse(event.body || "{}");

    if (!jobDescription) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing job description" }),
      };
    }

    const prompt = `
You are a friendly, expert job interviewer. Based on the job description below, write one strong, customized interview question to assess the candidate’s fit for the role. It should be role-specific and help uncover skills, behavior, or motivation.

Job Description:
${jobDescription}

Respond ONLY with the interview question and nothing else.
`;

    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 200,
      temperature: 0.6,
      messages: [
        {
          role: "user",
          content: prompt.trim(),
        },
      ],
    });

    const question = response.content[0].text.trim();

    return {
      statusCode: 200,
      body: JSON.stringify({ question }),
    };
  } catch (error: any) {
    console.error("Claude error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handler = async (event: any) => {
  try {
    const { jobDescription, resumeSummary } = JSON.parse(event.body || "{}");

    if (!jobDescription) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing job description" }),
      };
    }

    const userPrompt = `Job Description:\n${jobDescription}` + 
      (resumeSummary ? `\n\nResume Summary:\n${resumeSummary}` : "");

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo", // GPT-4.1 as of April 2024
      messages: [
        {
          role: "system",
          content: `You are a world-class job interview coach and hiring strategist. Based on the provided job description—and, if available, the candidate’s resume summary—generate 5 customized interview questions. Use a mix of behavioral, situational, and technical questions appropriate to the role’s seniority and industry. Keep questions concise but rich in insight: they should reveal real-world problem solving, technical depth, cultural fit, and career motivations. For leadership roles, include at least one leadership-focused question. Questions must be clear, role-specific, and designed to elicit thoughtful, story-driven responses.`,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
    });

    const questions = completion.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ questions }),
    };
  } catch (err: any) {
    console.error("Error generating questions:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

import { Handler } from '@netlify/functions';
import { Anthropic } from "@anthropic-ai/sdk";
import { getCachedQuestions, setCachedQuestions } from './utils/cache';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface QuestionResponse {
  questions: Array<{
    id: string;
    text: string;
    type: string;
    skill: string;
    difficulty: string;
  }>;
}

interface ErrorResponse {
  error: string;
}

export const handler: Handler = async (event) => {
  try {
    console.log("📥 Event received:", event.body);
    const { jobDescription } = JSON.parse(event.body || "{}");

    if (!jobDescription || jobDescription.trim().length < 10) {
      console.log("❌ Missing or invalid job description");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid job description" }),
      };
    }

    // Try to get cached questions first (24-hour cache)
    const cachedQuestions = await getCachedQuestions(jobDescription);
    if (cachedQuestions && cachedQuestions.length >= 3) {
      console.log("⚡ Returning cached questions - instant response!");
      return {
        statusCode: 200,
        body: JSON.stringify({ questions: cachedQuestions, cached: true }),
      };
    }

    // Updated prompt to ask for 3 questions instead of 6
    const prompt = `You're a job interview expert.
Based on the job description below, generate a tailored list of 3 thoughtful behavioral interview questions that assess problem-solving, communication, leadership, adaptability, and job-specific skills.
Only return the 3 questions as a numbered list — no intro or explanation.
Job Description:
${jobDescription}
Questions:
1.`;
    
    console.log("🧠 Sending prompt to Claude...");
    const completion = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });
    
    console.log("✅ Claude response received:", completion);
    const text = completion.content?.[0]?.text?.trim();
    console.log("📝 Raw Claude output:", text);
    
    if (!text) {
      console.log("⚠️ Claude returned no usable output");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Claude returned no output." }),
      };
    }
    
    const lines = text.match(/\d+\.\s(.+)/g);
    
    // Updated to check for 3 questions instead of 6
    if (!lines || lines.length < 3) {
      console.log("⚠️ Parsing failed or not enough lines returned:", lines);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Claude did not return enough questions." }),
      };
    }
    
    const questions = lines.map((line, i) => ({
      id: `q${i + 1}`,
      text: line.replace(/^\d+\.\s*/, '').trim(),
      type: "behavioral",
      skill: "unspecified",
      difficulty: "medium",
    }));

    console.log("✅ Parsed questions:", questions);

    // Cache the questions for future requests (fire and forget)
    setCachedQuestions(jobDescription, questions).catch(err =>
      console.warn("Failed to cache questions:", err)
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ questions, cached: false } as QuestionResponse),
    };
  } catch (err: any) {
    console.error("🔥 Claude handler error:", err?.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" } as ErrorResponse),
    };
  }
};











import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const handler = async (event: any) => {
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

    const prompt = `You're a job interview expert.

Based on the job description below, generate a tailored list of 6 behavioral interview questions that assess problem-solving, communication, leadership, adaptability, and job-specific skills.

Only return the 6 questions as a numbered list — no intro or explanation.

Job Description:
${jobDescription}

Questions:
1.`;

    console.log("🧠 Sending prompt to Claude...");

    const completion = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
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

    if (!lines || lines.length < 6) {
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

    return {
      statusCode: 200,
      body: JSON.stringify({ questions }),
    };
  } catch (err: any) {
    console.error("🔥 Claude handler error:", err?.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};












import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Try to pull out a title (after "Role:" or "Position:")
// and a company (after "at" or "for")
function extractTitleAndCompany(text: string) {
  const titleMatch = text.match(/(?:Role|Position):\s*(.+)/i);
  const companyMatch = text.match(/(?:at|for)\s+([A-Z][\w &]+)/i);
  return {
    jobTitle: titleMatch ? titleMatch[1].trim() : "Custom Role",
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

    // Build the prompt
    const prompt = [
      "You are a sharp but friendly recruiter.",
      "Based ONLY on the job description below, ask ONE high-impact interview question",
      "that would reveal whether the candidate can truly succeed in the role.",
      "Write just the question, no preamble.",
      "",
      "Job Description:",
      jobDescription,
      "",
      "Question:",
    ].join("\n");

    // Call Claude
    const resp = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      temperature: 0.7,
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const question = resp?.content?.[0]?.text?.trim() || "";
    if (!question) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Claude returned no question." }),
      };
    }

    // Extract title/company from the original description
    const { jobTitle, company } = extractTitleAndCompany(jobDescription);

    // Return as an array
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questions: [question],
        jobTitle,
        company,
      }),
    };
  } catch (err: any) {
    console.error("Claude error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};









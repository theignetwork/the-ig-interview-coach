import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const handler = async (event: any) => {
  try {
    const { jobDescription } = JSON.parse(event.body || "{}");

    if (!jobDescription || jobDescription.trim().length < 10) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid job description" }),
      };
    }

    // Prompt to generate a single clear question
    const questionPrompt = `You are a professional interview coach. Based on the job description below, generate ONE clear, thoughtful interview question to assess the candidate's fit. 
Only return the interview question — no extra commentary or greetings.

Job Description:
${jobDescription}

Interview Question:`; 

    // Prompt to extract job title and company
    const metadataPrompt = `Extract the job title and company name from the following job description. 
Return the result as JSON in this exact format: {"jobTitle": "X", "company": "Y"}.
If either is missing, use "Unknown".

Job Description:
${jobDescription}
`;

    // Call Claude for question
    const questionRes = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: questionPrompt,
        },
      ],
    });

    const rawQuestion = questionRes.content?.[0]?.text?.trim();
    if (!rawQuestion) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Claude returned no question." }),
      };
    }

    // Call Claude for metadata
    const metaRes = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 100,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: metadataPrompt,
        },
      ],
    });

    let jobTitle = "Custom Role";
    let company = "Company Name";
    try {
      const parsedMeta = JSON.parse(metaRes.content?.[0]?.text || "{}");
      jobTitle = parsedMeta.jobTitle || jobTitle;
      company = parsedMeta.company || company;
    } catch (e) {
      console.warn("Failed to parse metadata JSON from Claude.");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        question: rawQuestion,
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




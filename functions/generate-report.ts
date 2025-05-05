const handler: Handler = async (event) => {
  try {
    console.log("Function started, received event body:", event.body ? event.body.substring(0, 200) + "..." : "No body");
    
    const { jobDescription, sessionId, questionsAndAnswers } = JSON.parse(event.body || '{}');
    
    // Validate inputs
    if (!questionsAndAnswers || !Array.isArray(questionsAndAnswers) || questionsAndAnswers.length === 0) {
      console.error("Missing or invalid questionsAndAnswers:", questionsAndAnswers);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid interview data" })
      };
    }
    
    console.log("Processing interview with", questionsAndAnswers.length, "Q&A pairs");
    
    // Prepare the interview summary for Claude
    const interviewSummary = questionsAndAnswers.map(qa => 
      `Question: ${qa.question}\nAnswer: ${qa.answer || "No answer provided"}`
    ).join("\n\n");
    
    console.log("Prepared interview summary, length:", interviewSummary.length);
    console.log("Checking Anthropic API key...");
    
    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key not configured" })
      };
    }
    
    console.log("API key exists, creating prompt...");
    
    // Create a shorter prompt if the interview is large
    const prompt = `
You are an expert interview coach analyzing a mock interview. Generate detailed feedback based on the candidate's responses.

Job Description:
${jobDescription ? jobDescription.substring(0, 500) + (jobDescription.length > 500 ? "..." : "") : "A professional role requiring communication, problem-solving, and technical skills."}

Interview Transcript:
${interviewSummary}

Provide an analysis that will help the candidate improve their interview skills and presentation. Be constructive but honest.

Include:
1. Overall score (0-100) with brief justification (1-2 sentences)
2. 3-4 key strengths with bullet points
3. 3-4 areas for improvement with bullet points
4. "Danger zone" alerts - potential red flags in the interview (if any)
5. Individual feedback for each question (score 0-100 and specific strengths/areas to improve)

Format the response as JSON:
{
  "overallScore": 85,
  "overallFeedback": "Brief overall assessment",
  "keyStrengths": ["Strength 1", "Strength 2", "Strength 3"],
  "areasForImprovement": ["Area 1", "Area 2", "Area 3"],
  "dangerZones": ["Flag 1", "Flag 2"],
  "dangerZoneRisk": "Low/Medium/High",
  "questionFeedback": [
    {
      "question": "Question text",
      "score": 80,
      "strengths": ["Strength 1", "Strength 2"],
      "improvements": ["Improvement 1", "Improvement 2"]
    }
  ]
}
`;
    
    console.log("Created prompt, sending to Anthropic API...");
    
    // Set longer timeout and smaller token limit
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1500,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    });
    
    console.log("Received response from Anthropic API");
    
    // Extract JSON from Claude's response
    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("Failed to parse JSON from Claude's response:", text.substring(0, 200));
      throw new Error("Failed to parse JSON from Claude's response");
    }
    
    console.log("Extracted JSON from response");
    const reportData = JSON.parse(jsonMatch[0]);
    
    console.log("Function completed successfully");
    return {
      statusCode: 200,
      body: JSON.stringify(reportData)
    };
  } catch (err) {
    console.error("Report generation error:", {
      message: err.message,
      name: err.name,
      stack: err.stack,
      api: err.response ? "API error detected" : "Not an API error",
      responseData: err.response?.data ? JSON.stringify(err.response.data).substring(0, 500) : "No response data"
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to generate interview report.", 
        details: err.message || "Unknown error" 
      })
    };
  }
};

import { Handler } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const handler: Handler = async (event) => {
  try {
    const { jobDescription, sessionId, questionsAndAnswers } = JSON.parse(event.body || '{}');
    
    if (!questionsAndAnswers || !Array.isArray(questionsAndAnswers) || questionsAndAnswers.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing interview data" })
      };
    }
    
    // Prepare the interview summary for Claude
    const interviewSummary = questionsAndAnswers.map(qa => 
      `Question: ${qa.question}\nAnswer: ${qa.answer || "No answer provided"}`
    ).join("\n\n");
    
    const prompt = `
You are an expert interview coach analyzing a mock interview. Generate detailed feedback based on the candidate's responses.

Job Description:
${jobDescription || "A professional role requiring communication, problem-solving, and technical skills."}

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
    
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1500,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    });
    
    // Extract JSON from Claude's response
    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from Claude's response");
    }
    
    const reportData = JSON.parse(jsonMatch[0]);
    
    return {
      statusCode: 200,
      body: JSON.stringify(reportData)
    };
  } catch (err) {
    console.error("Report generation error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate interview report." })
    };
  }
};

export { handler };

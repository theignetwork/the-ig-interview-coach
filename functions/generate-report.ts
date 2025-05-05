import { Handler } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Make sure to export the handler properly
export const handler: Handler = async (event) => {
  try {
    console.log("Function started, processing request...");
    
    const { jobDescription, sessionId, questionsAndAnswers } = JSON.parse(event.body || '{}');
    
    if (!questionsAndAnswers || !Array.isArray(questionsAndAnswers) || questionsAndAnswers.length === 0) {
      console.error("Missing or invalid interview data");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid interview data" })
      };
    }
    
    // Create a more compact interview summary
    const interviewSummary = questionsAndAnswers.map(qa => 
      `Q: ${qa.question.substring(0, 150)}\nA: ${(qa.answer || "No answer").substring(0, 200)}`
    ).join("\n\n");
    
    // Create a shorter prompt
    const prompt = `
As an interview coach, analyze this mock interview and provide JSON feedback:

${jobDescription ? "Job: " + jobDescription.substring(0, 200) + "..." : ""}

Interview:
${interviewSummary}

Return only this JSON object:
{
  "overallScore": (0-100),
  "overallFeedback": "1-2 sentence assessment",
  "keyStrengths": ["Strength 1", "Strength 2", "Strength 3"],
  "areasForImprovement": ["Area 1", "Area 2", "Area 3"],
  "dangerZones": ["Flag 1", "Flag 2"],
  "dangerZoneRisk": "Low/Medium/High",
  "questionFeedback": [
    {
      "question": "Question text",
      "score": (0-100),
      "strengths": ["Strength 1"],
      "improvements": ["Improvement 1"]
    }
  ]
}`;
    
    console.log("Sending request to Anthropic API...");
    
    // Use a faster model for quicker responses
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",  // Using a faster model
      max_tokens: 1500,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    });
    
    console.log("Received response from Anthropic API");
    
    // Extract JSON from Claude's response
    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from Claude's response");
    }
    
    // Parse the JSON response
    const reportData = JSON.parse(jsonMatch[0]);
    
    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify(reportData)
    };
  } catch (err) {
    console.error("Report generation error:", {
      message: err.message,
      name: err.name,
      stack: err.stack
    });
    
    // Provide a fallback report in case of errors
    const fallbackReport = {
      overallScore: 75,
      overallFeedback: "We couldn't generate a detailed report, but your interview contained some good points. Here's a basic assessment.",
      keyStrengths: [
        "You completed the full interview process",
        "You provided answers to all questions",
        "You demonstrated engagement with the interview format"
      ],
      areasForImprovement: [
        "Consider adding more specific examples in your answers",
        "Structure responses with a situation, action, and result format",
        "Practice more concise and focused answering techniques"
      ],
      dangerZones: [],
      dangerZoneRisk: "Low",
      questionFeedback: [
        {
          question: "Interview Question",
          score: 75,
          strengths: ["You provided a complete answer"],
          improvements: ["Add more specificity to your examples"]
        }
      ]
    };
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        error: "Error generating detailed report, providing basic feedback instead.",
        ...fallbackReport
      })
    };
  }
};

// Make sure there's also a default export
export default { handler };

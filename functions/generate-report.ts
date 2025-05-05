import { Handler } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Export the handler properly
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
    
    // Create the improved prompt
    const prompt = `
As an expert interview coach, analyze this mock interview and provide detailed, actionable feedback.

Job Description:
${jobDescription ? jobDescription.substring(0, 500) + (jobDescription.length > 500 ? "..." : "") : "A professional role requiring communication, problem-solving, and technical skills."}

Interview Transcript:
${interviewSummary}

Provide a personalized analysis that will help the candidate improve. Be specific, varied, and actionable in your feedback.

When writing feedback:
1. Vary your improvement suggestions beyond just "provide more specific examples"
2. Include specific action items for each area of improvement
3. Explain briefly why each improvement matters for this specific job role
4. Suggest 1-2 specific follow-up practice questions for areas that need improvement
5. End with a brief personalized note of encouragement

Return your analysis in this JSON format:
{
  "overallScore": 75, // Score from 0-100
  "overallFeedback": "1-2 sentence personalized assessment that addresses strengths and weaknesses",
  "keyStrengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
  "areasForImprovement": ["Specific improvement area 1", "Specific improvement area 2", "Specific improvement area 3"],
  "dangerZones": ["Specific red flag 1", "Specific red flag 2"], // Include only if applicable
  "dangerZoneRisk": "Low/Medium/High", // Include only if dangerZones exist
  "questionFeedback": [
    {
      "question": "The question text",
      "score": 75, // Score from 0-100
      "strengths": ["Specific strength 1", "Specific strength 2"],
      "improvements": ["Specific actionable improvement 1", "Specific actionable improvement 2"]
    }
  ],
  "practiceQuestions": ["Follow-up question 1", "Follow-up question 2"],
  "encouragementNote": "A brief personalized note of encouragement"
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
      ],
      practiceQuestions: [
        "Can you describe a specific situation where you demonstrated leadership skills?",
        "How do you prioritize tasks when facing multiple deadlines?"
      ],
      encouragementNote: "Keep practicing! With some refinement of your interview technique, you'll be well-prepared for your next opportunity."
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

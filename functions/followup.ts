import { Handler } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const handler: Handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { originalQuestion, userAnswer } = body;
    
    // Better handling of missing inputs
    if (!originalQuestion || !userAnswer) {
      console.log("Missing inputs:", { originalQuestion: !!originalQuestion, userAnswer: !!userAnswer });
      // Return a contextually appropriate follow-up instead of an error
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          followUpQuestion: "That's interesting. Could you expand on that with a specific example from your experience?" 
        })
      };
    }
    
    // Improved prompt to ensure we get an interviewer-style follow-up
    const prompt = `
You're an expert interview coach creating follow-up questions for a job interview simulation.
A candidate was just asked a job interview question. Based on their answer, generate a single thoughtful follow-up question that digs deeper.
Make it feel natural, as if it came from a real interviewer conducting the interview, not like you're giving advice to the candidate.
IMPORTANT: Only return the follow-up question text directly - no introduction, no explanation, and no other commentary.
---
Original Question:
${originalQuestion}
Candidate's Answer:
${userAnswer}
`;
    
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 200,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    });
    
    let followUpQuestion = response.content[0].text.trim();
    
    // Clean up response to ensure it's just a question
    // Remove any prefixes like "Follow-up:" or "Interviewer:"
    followUpQuestion = followUpQuestion.replace(/^(Follow-up|Interviewer|Question):?\s*/i, '');
    
    console.log("Follow-up question:", followUpQuestion);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ followUpQuestion })
    };
  } catch (err) {
    console.error("Follow-up error:", err);
    
    // Return a sensible fallback rather than an error
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        followUpQuestion: "That's an interesting perspective. Could you tell me about a time when you applied this approach in a real situation?" 
      })
    };
  }
};

export { handler };

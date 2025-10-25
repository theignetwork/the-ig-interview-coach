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
    if (!originalQuestion || !userAnswer || userAnswer.trim().length < 3) {
      console.log("Insufficient input for follow-up:", { 
        originalQuestion: originalQuestion?.substring(0, 30), 
        userAnswer: userAnswer?.substring(0, 30) 
      });
      
      // Return an interview-appropriate follow-up instead of breaking character
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          followUpQuestion: "Could you provide a specific example from your past experience that relates to this situation?" 
        })
      };
    }
    
    // Improved prompt to ensure we stay in character
    const prompt = `
You are an interviewer conducting a job interview. You should ALWAYS stay in character as the interviewer.
You were just asking the candidate this question: "${originalQuestion}"

The candidate answered: "${userAnswer}"

Based on their answer, generate ONE follow-up question that digs deeper. The question should:
- Feel natural coming from an interviewer
- Be directly related to something mentioned in their answer
- Ask for more specific details, examples, or reflection
- Be just ONE sentence if possible

IMPORTANT: Return ONLY the follow-up question text. Do not include ANY explanations, commentary, or phrases like "Follow-up:" or "Interviewer:". 
Do NOT mention that you are Claude or an AI. Strictly stay in character as a human interviewer.
`;
    
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 150,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    });
    
    let followUpQuestion = response.content[0].text.trim();
    
    // Clean up response to ensure it's just a question
    followUpQuestion = followUpQuestion
      .replace(/^(Follow-up|Interviewer|Question):?\s*/i, '')
      .replace(/^["']|["']$/g, ''); // Remove quotes if Claude added them
    
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
        followUpQuestion: "Can you share a specific example of how you handled a similar situation in your previous role?" 
      })
    };
  }
};

export { handler };

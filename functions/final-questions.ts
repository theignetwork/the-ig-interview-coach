import { Handler } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

interface FinalQuestionsResponse {
  classic: string;
  curveball: string;
}

interface ErrorResponse {
  error: string;
}

const handler: Handler = async (event, context) => {
  try {
    const prompt = `
You're a job interview expert generating the final two questions for an interview.

1. For the first question, generate a classic, professional interview question that helps assess the candidate's fit, like "What's your greatest strength?" or "Where do you see yourself in five years?"

2. For the second question, generate a thought-provoking curveball question that reveals deeper thinking and values. 
   
IMPORTANT FOR THE CURVEBALL QUESTION:
- Avoid clichéd questions like "what superpower would you have" or "what animal would you be"
- Instead, create a question that reveals critical thinking, problem-solving approach, values, or perspective
- The question should feel innovative but still professionally appropriate
- It should prompt reflection and reveal how the candidate thinks rather than just what they know
- The question should be intellectually stimulating and somewhat challenging
- Examples of good curveball questions:
  * "What's a commonly held belief in your field that you think might be wrong?"
  * "If you could redesign any aspect of how organizations in our industry operate, what would you change?"
  * "What's a difficult truth about this industry that people don't like to admit?"
  * "How would you explain what you do to a bright 10-year-old?"

Only return the two questions as plain text, numbered like this:
1. [classic question]
2. [curveball question]
`;
    const completion = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 300,
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }]
    });
    
    const text = completion.content[0].text.trim();
    console.log("Claude response for final questions:", text);
    
    // Extract the two questions using regex
    const matches = text.match(/1\.\s*(.+)\s*2\.\s*(.+)/s);
    
    if (!matches || matches.length < 3) {
      console.log("Failed to parse questions from Claude response:", text);
      
      // Provide better fallback questions
      return {
        statusCode: 200,
        body: JSON.stringify({
          classic: "What would you say are your greatest strengths, and how do they align with this role?",
          curveball: "What's a commonly held belief in your professional field that you think might be wrong, and why?"
        } as FinalQuestionsResponse)
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        classic: matches[1].trim(),
        curveball: matches[2].trim()
      } as FinalQuestionsResponse)
    };
  } catch (error) {
    console.error("Claude error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate final questions." } as ErrorResponse)
    };
  }
};

export { handler };

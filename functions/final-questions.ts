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
You're a job interview expert.
Please generate two final interview questions:
1. A classic interview question like "What's your greatest weakness?" or "Why do you want to work here?"
2. A curveball question that reveals personality, creativity, or values, but is still appropriate for a professional setting.
Only return the two questions as plain text, numbered like this:
1. [classic question]
2. [curveball question]
`;
    const completion = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 300,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    });
    
    const text = completion.content[0].text.trim();
    console.log("Claude response for final questions:", text);
    
    // Extract the two questions using regex
    const matches = text.match(/1\.\s*(.+)\s*2\.\s*(.+)/s);
    
    if (!matches || matches.length < 3) {
      console.log("Failed to parse questions from Claude response:", text);
      
      // Provide fallback questions
      return {
        statusCode: 200,
        body: JSON.stringify({
          classic: "What would you say are your greatest strengths, and how do they align with this role?",
          curveball: "If you could solve one big problem in your industry, what would it be and why?"
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

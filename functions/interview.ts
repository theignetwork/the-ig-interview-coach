import { Handler } from "@netlify/functions";
import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const handler: Handler = async (event, context) => {
  const { jobDescription, history } = JSON.parse(event.body || "{}");
  // Ensure history is an array
  const convHistory = Array.isArray(history) ? history : [];

  // TODO: build your prompt here using jobDescription and convHistory

  // For now, return a fixed question so we can test the flow:
  return {
    statusCode: 200,
    body: JSON.stringify({
      question: "What is one key responsibility you see in this role?",
    }),
  };
};

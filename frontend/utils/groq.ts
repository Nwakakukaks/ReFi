"use strict";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true,
});

let lastQuestion = '';

export async function getGroqChatCompletion(text: string): Promise<any> {
  // Update context with the last question
  const userMessage = lastQuestion 
    ? `Previous question: "${lastQuestion}". Now: "${text}"`
    : text;

  lastQuestion = text; // Store the current question for context

  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
        You are an assistant focused on answering questions about the Near blockchain. Provide clear and direct answers based on user queries.
        `,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    model: "llama3-8b-8192",
  });
}

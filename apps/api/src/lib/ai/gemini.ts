import { ChatGoogle } from "@langchain/google";
import { env } from "process";

const apiKey = env.GOOGLE_API_KEY;
const modelName = env.GEMINI_MODEL || "gemini-3.1-flash-lite";

if (!apiKey) {
  throw new Error("GOOGLE_API_KEY is missing");
}

export const geminiModel = new ChatGoogle(modelName, {
  apiKey,
  temperature: 0,
  maxOutputTokens: 1024,
});

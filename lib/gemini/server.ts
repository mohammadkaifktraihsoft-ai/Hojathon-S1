import "server-only";
import { GoogleGenAI } from "@google/genai";

export const DEFAULT_MODEL = "gemini-2.5-flash";

export function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Gemini AI is not configured. Please add GEMINI_API_KEY to .env.local.");
  }
  return new GoogleGenAI({ apiKey: key });
}

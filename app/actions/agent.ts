"use server";

import { getPatientContext } from "@/lib/agent/context";
import { processAgentChat } from "@/lib/agent/gemini";

// Helper for safe error responses
function mapSafeError(errorMsg: string) {
  if (errorMsg === "Unauthorized") return "You must be logged in to use the agent.";
  if (errorMsg.includes("Gemini AI is not configured")) return "Gemini AI is not configured. Please add GEMINI_API_KEY to the environment.";
  if (errorMsg.startsWith("Database error")) return "Failed to retrieve necessary patient data. Please try again later.";
  return "An unexpected error occurred.";
}

export async function sendMessage(
  history: { role: "user" | "model", parts: { text: string }[] }[],
  message: string
) {
  try {
    if (!message || message.trim().length === 0) {
      return { success: false, error: "Message cannot be empty." };
    }
    if (message.length > 2000) {
      return { success: false, error: "Message is too long." };
    }

    // Validate history
    if (!Array.isArray(history) || history.length > 50) {
       return { success: false, error: "Invalid or excessively long conversation history." };
    }
    for (const msg of history) {
      if (msg.role !== "user" && msg.role !== "model") {
        return { success: false, error: "Invalid history role." };
      }
      if (!msg.parts || !Array.isArray(msg.parts) || typeof msg.parts[0]?.text !== "string") {
        return { success: false, error: "Invalid history structure." };
      }
    }

    // 1. Get structured patient context (deterministic state)
    const context = await getPatientContext();

    // 2. Process with Gemini
    const result = await processAgentChat(history, message, context);

    if (result.error) {
      return { success: false, error: mapSafeError(result.error) };
    }

    return {
      success: true,
      response: result.response,
      actions: result.actions,
      contextUpdated: result.contextUpdated
    };
  } catch (error: any) {
    console.error("Agent Action Error:", error);
    return { success: false, error: mapSafeError(error.message || "") };
  }
}

"use server";

import { getPatientContext } from "@/lib/agent/context";
import { processAgentChat } from "@/lib/agent/gemini";

export async function sendMessage(
  history: { role: "user" | "model", parts: { text: string }[] }[],
  message: string
) {
  try {
    // 1. Get structured patient context (deterministic state)
    const context = await getPatientContext();

    // 2. Process with Gemini
    const result = await processAgentChat(history, message, context);

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, text: result.text };
  } catch (error: any) {
    console.error("Agent Action Error:", error);
    if (error.message === "Unauthorized") {
      return { success: false, error: "You must be logged in to use the agent." };
    }
    return { success: false, error: "An unexpected error occurred." };
  }
}

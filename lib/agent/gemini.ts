import "server-only";
import { getGeminiClient, DEFAULT_MODEL } from "@/lib/gemini/server";
import { Type, Tool } from "@google/genai";
import { getFollowUpStatus, listUpcomingAppointments, updateFollowUpStatus, createReminder } from "./tools";
import { FollowUpStatus } from "@/lib/contracts";

// Safety check function
function isUnsupportedMedicalRequest(text: string): boolean {
  const medicalKeywords = /\b(diagnose|diagnosis|prescribe|prescription|medication|pill|dose|symptom|pain|treatment|cure|disease|illness)\b/i;
  return medicalKeywords.test(text);
}

const tools: Tool[] = [{
  functionDeclarations: [
    {
      name: "get_follow_up_status",
      description: "Gets the current follow-up tasks and their status for the authenticated patient.",
    },
    {
      name: "list_upcoming_appointments",
      description: "Lists the upcoming appointments for the authenticated patient.",
    },
    {
      name: "update_follow_up_status",
      description: "Updates the status of a specific follow-up task.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          taskId: { type: Type.STRING, description: "The ID of the follow-up task to update" },
          status: { type: Type.STRING, description: "The new status: 'pending', 'in_progress', 'completed', or 'cancelled'" },
        },
        required: ["taskId", "status"],
      },
    },
    {
      name: "create_reminder",
      description: "Creates a reminder for a specific follow-up task.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          taskId: { type: Type.STRING, description: "The ID of the follow-up task to remind about" },
          remindAt: { type: Type.STRING, description: "The ISO 8601 date and time for the reminder" },
        },
        required: ["taskId", "remindAt"],
      },
    },
  ]
}];

export async function processAgentChat(
  history: { role: "user" | "model", parts: { text: string }[] }[],
  message: string,
  context: any
) {
  if (isUnsupportedMedicalRequest(message)) {
    return {
      response: "I am a follow-up coordination agent. I cannot diagnose, prescribe medication, or provide clinical decisions. Please consult a qualified healthcare provider for medical concerns.",
      actions: [],
      contextUpdated: false,
      error: null
    };
  }

  let client;
  try {
    client = getGeminiClient();
  } catch (err: any) {
    return { response: null, actions: [], contextUpdated: false, error: err.message };
  }

  const systemInstruction = `You are a Follow-up Care Agent. Your role is to help the patient coordinate follow-up care.
You have access to the patient's context and a set of tools to read and write application state.
Current Patient Context:
${JSON.stringify(context, null, 2)}

Do NOT diagnose, prescribe medication, or make clinical decisions.
Keep responses concise, empathetic, and truthful.
If you use a tool, explain what you found or what action you took.
Do not invent facts; rely on the provided context or tools.`;

  // Map history to the new SDK format
  const mappedHistory = history.map(m => ({
    role: m.role,
    parts: [{ text: m.parts[0]?.text || "" }]
  }));

  let chat;
  try {
    chat = client.chats.create({
      model: DEFAULT_MODEL,
      config: {
        systemInstruction,
        tools,
      },
      history: mappedHistory
    });
  } catch (err: any) {
    console.error(err);
    return { response: null, actions: [], contextUpdated: false, error: "Failed to initialize AI conversation." };
  }

  const executedActions: any[] = [];
  let contextUpdated = false;

  try {
    let result = await chat.sendMessage({ message });
    let functionCalls = result.functionCalls;

    let iteration = 0;
    while (functionCalls && functionCalls.length > 0 && iteration < 5) {
      const parts = [];

      for (const call of functionCalls) {
        let actionResult: any;
        const args = call.args as any;

        if (call.name === "get_follow_up_status") {
          actionResult = await getFollowUpStatus();
        } else if (call.name === "list_upcoming_appointments") {
          actionResult = await listUpcomingAppointments();
        } else if (call.name === "update_follow_up_status") {
          actionResult = await updateFollowUpStatus(args.taskId, args.status as FollowUpStatus);
          if (actionResult.success) contextUpdated = true;
        } else if (call.name === "create_reminder") {
          actionResult = await createReminder(args.taskId, args.remindAt);
          if (actionResult.success) contextUpdated = true;
        } else {
          actionResult = { error: "Unknown tool call" };
        }

        executedActions.push({ name: call.name, args, result: actionResult });

        parts.push({
          functionResponse: {
            name: call.name,
            response: actionResult
          }
        });
      }

      result = await chat.sendMessage({ message: parts });
      functionCalls = result.functionCalls;
      iteration++;
    }

    if (isUnsupportedMedicalRequest(result.text || "")) {
       return {
         response: "I apologize, but my previous response triggered a safety boundary regarding clinical or medical advice. Please consult your doctor.",
         actions: executedActions,
         contextUpdated,
         error: null
       };
    }

    return {
      response: result.text || "",
      actions: executedActions,
      contextUpdated,
      error: null
    };
  } catch (error: any) {
    console.error("Gemini runtime error:", error);
    let errorMsg = "An error occurred while communicating with the AI agent. Please try again.";
    if (error.message && (error.message.includes("API key not valid") || error.message.includes("API key not provided") || error.message.includes("API_KEY_INVALID"))) {
      errorMsg = "Gemini AI is not configured. Please add GEMINI_API_KEY to .env.local.";
    }
    return {
      response: null,
      actions: executedActions,
      contextUpdated,
      error: errorMsg
    };
  }
}

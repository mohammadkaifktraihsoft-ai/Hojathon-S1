import { getGeminiModel } from "@/lib/gemini/server";
import { FunctionDeclaration, SchemaType, ChatSession } from "@google/generative-ai";
import { getFollowUpStatus, listUpcomingAppointments, updateFollowUpStatus, createReminder } from "./tools";
import { FollowUpStatus } from "@/lib/contracts";

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "get_follow_up_status",
    description: "Gets the current follow-up tasks and their status for the authenticated patient.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: "list_upcoming_appointments",
    description: "Lists the upcoming appointments for the authenticated patient.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: "update_follow_up_status",
    description: "Updates the status of a specific follow-up task.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskId: {
          type: SchemaType.STRING,
          description: "The ID of the follow-up task to update",
        },
        status: {
          type: SchemaType.STRING,
          description: "The new status: 'pending', 'in_progress', 'completed', or 'cancelled'",
        },
      },
      required: ["taskId", "status"],
    },
  },
  {
    name: "create_reminder",
    description: "Creates a reminder for a specific follow-up task.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskId: {
          type: SchemaType.STRING,
          description: "The ID of the follow-up task to remind about",
        },
        remindAt: {
          type: SchemaType.STRING,
          description: "The ISO 8601 date and time for the reminder",
        },
      },
      required: ["taskId", "remindAt"],
    },
  },
];

export async function processAgentChat(
  history: { role: "user" | "model", parts: { text: string }[] }[],
  message: string,
  context: any
) {
  const model = getGeminiModel();
  
  const systemInstruction = `You are a Follow-up Care Agent. Your role is to help the patient coordinate follow-up care.
You have access to the patient's context and a set of tools to read and write application state.
Current Patient Context:
${JSON.stringify(context, null, 2)}

Do NOT diagnose, prescribe medication, or make clinical decisions.
Keep responses concise, empathetic, and truthful.
If you use a tool, explain what you found or what action you took.
Do not invent facts; rely on the provided context or tools.`;

  const chat = model.startChat({
    history: history.map(m => ({
      role: m.role,
      parts: m.parts
    })),
    systemInstruction,
    tools: [{ functionDeclarations }],
  });

  try {
    let result = await chat.sendMessage(message);
    let calls = result.response.functionCalls();
    
    // We can handle up to a few function calls in sequence
    let iteration = 0;
    while (calls && calls.length > 0 && iteration < 3) {
      const call = calls[0]; // Process first call
      let actionResult: any;

      if (call.name === "get_follow_up_status") {
        actionResult = await getFollowUpStatus();
      } else if (call.name === "list_upcoming_appointments") {
        actionResult = await listUpcomingAppointments();
      } else if (call.name === "update_follow_up_status") {
        actionResult = await updateFollowUpStatus(
          (call.args as any).taskId as string,
          (call.args as any).status as FollowUpStatus
        );
      } else if (call.name === "create_reminder") {
        actionResult = await createReminder(
          (call.args as any).taskId as string,
          (call.args as any).remindAt as string
        );
      } else {
        actionResult = { error: "Unknown tool call" };
      }

      result = await chat.sendMessage([{
        functionResponse: {
          name: call.name,
          response: actionResult
        }
      }]);
      
      calls = result.response.functionCalls();
      iteration++;
    }

    return {
      text: result.response.text(),
      error: null
    };
  } catch (error: any) {
    console.error("Gemini interaction failed:", error);
    return {
      text: null,
      error: error.message || "An error occurred while communicating with the AI agent."
    };
  }
}

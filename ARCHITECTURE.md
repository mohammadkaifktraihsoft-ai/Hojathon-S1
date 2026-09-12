# Architecture

The system uses a Next.js Server-side architecture to securely integrate Gemini.

**Flow:**
1. User types in `AgentPanel.tsx`.
2. `sendMessage` Server Action is invoked.
3. Next.js fetches user's auth token from Supabase cookies and gathers **Structured Patient Context** directly from the DB (`lib/agent/context.ts`).
4. Context + Chat History are sent to Gemini (`lib/agent/gemini.ts`) using system instructions.
5. Gemini decides if it wants to call a tool or respond.
6. The Server Action validates the requested tool and executes it server-side (`lib/agent/tools.ts`), leveraging Supabase RLS.
7. Gemini receives the tool response and formats the final string.
8. `AgentPanel.tsx` updates optimistic UI.

**Constraints:**
- Gemini DOES NOT access the database directly.
- All actions are strictly bounded to the authenticated user.
- The Agent cannot modify clinical info.

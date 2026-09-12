# Decisions

1. **Context Construction:** Context is constructed deterministically every time a user sends a message. This avoids complex state sync and ensures Gemini always has up-to-date data.
2. **Server Actions vs API Routes:** Used Next.js Server Actions for the chat bridge. It natively supports type-safety and reduces boilerplate compared to traditional API routes.
3. **Optimistic UI:** Agent Panel immediately renders the user's message, sets an `isLoading` flag, and waits for the full server roundtrip.
4. **Tool Isolation:** Gemini tool logic is isolated in `lib/agent/tools.ts`. Each tool validates the `userId` directly from Supabase, ensuring cross-patient data access is strictly impossible regardless of model hallucination.
5. **No Medical Decisions:** We hardcoded a system prompt reminding the model not to make medical decisions.

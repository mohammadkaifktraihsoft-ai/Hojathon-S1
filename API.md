# API

## Follow-up Agent Tools

The follow-up agent has the following tools exposed to the Gemini model (via `@google/genai`):

1. `get_follow_up_status`: Retrieves the current pending/in_progress follow-up tasks for the patient.
2. `list_upcoming_appointments`: Lists appointments from today onwards.
3. `update_follow_up_status`: Updates a specific task's status (pending, in_progress, completed, cancelled).
4. `create_reminder`: Creates a reminder at a specified ISO time for a given task.

## Server Actions

`sendMessage(history, message)` in `app/actions/agent.ts` handles the AI conversation.
It accepts validated message history and message string, and returns:
`{ success: boolean, response?: string, actions?: any[], contextUpdated?: boolean, error?: string }`

It securely validates the user session, queries deterministic context, catches database errors securely without exposing stack traces, and manages function calls to the allowed tools (including multiple parallel tools if requested by Gemini in a single pass).
## Admin and blood availability

- `GET /blood-availability` — authenticated patient read of hospital inventory.
- `GET /admin/*` — authenticated admin-only views.
- `updateBloodInventory` — server action; validates UUID, availability, and non-negative integer units.
- `createHospital` — server action; validates required hospital fields.
- `get_blood_availability` — Gemini allow-listed read tool; optional `bloodGroup` filter.

Admin writes require the JWT app metadata role `admin` and are protected again by Supabase RLS.

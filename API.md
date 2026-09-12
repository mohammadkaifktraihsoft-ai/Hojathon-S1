# API

## Follow-up Agent Tools

The follow-up agent has the following tools exposed to the Gemini model:

1. `get_follow_up_status`: Retrieves the current pending/in_progress follow-up tasks for the patient.
2. `list_upcoming_appointments`: Lists appointments from today onwards.
3. `update_follow_up_status`: Updates a specific task's status (pending, in_progress, completed, cancelled).
4. `create_reminder`: Creates a reminder at a specified ISO time for a given task.

## Server Actions

`sendMessage(history, message)` in `app/actions/agent.ts` handles the AI conversation. It securely validates the user session, queries deterministic context, and manages function calls to the allowed tools.

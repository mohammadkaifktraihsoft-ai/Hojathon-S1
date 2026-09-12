# Agent Data Context and UI Contract

## Purpose

This document records the current Patient Workspace UI contract and the data the Follow-up Agent must consume. It is an audit artifact for integration; it does not change the backend, schema, agent, or UI implementation.

## Current UI

The authenticated flow is:

1. `/login` authenticates through Supabase.
2. `/dashboard` verifies the session, loads `getFollowUpContext()`, and renders `WorkspaceView`.
3. `WorkspaceView` renders the patient header, attention summary, metrics, task/appointment/reminder tabs, and the right-side `AgentSlot`.
4. `AgentSlot` is the Developer 1 integration boundary. It accepts `patientContext` and `onContextUpdated`; when the Developer 2 `AgentPanel` is supplied as a child, it renders that panel without owning its internals.

The top-level `/` page is still a public landing/testing surface. It contains static marketing/metric content and mounts the Agent Panel separately. It is not the source of patient records and should not be treated as the production agent integration surface.

## UI data requirements

`WorkspaceView` requires one `PatientContext` object:

```ts
interface PatientContext {
  profile: PatientProfile | null;
  tasks: FollowUpTask[];
  appointments: Appointment[];
  reminders: Reminder[];
}
```

The UI derives:

- pending actions from tasks whose status is `pending` or `in_progress`;
- missed visits from appointments whose status is `missed`;
- upcoming visits from `scheduled` or `rescheduled` appointments;
- active reminders from reminders whose status is `pending`.

Required record fields are defined in `lib/contracts.ts`: IDs, patient ownership IDs, display/title fields, timestamps, status enums, and nullable descriptions/locations/task references. Empty arrays are valid UI data; a missing profile is rendered with an email/name fallback.

## Current data sources and classification

| Data | UI state | Current source | Classification | Notes |
|---|---|---|---|---|
| Patient profile | Implemented | `patient_profiles` via `lib/workspace/context.ts` | A — real application data | Profile is read or initialized for the authenticated user. |
| Follow-up tasks | Implemented | `follow_up_tasks` via `getFollowUpContext()` | A — real application data | No patient task seed is present in the migrations; records require the shared Supabase project. |
| Appointments | Implemented | `appointments` via `getFollowUpContext()` | A — real application data | No patient appointment seed is present. |
| Reminders | Implemented | `reminders` via `getFollowUpContext()` | A — real application data | No patient reminder seed is present. |
| Dashboard metrics | Implemented | Derived from `PatientContext` | B — deterministic derived data | Must remain computed from records, not duplicated agent state. |
| Attention summary | Implemented | Derived from tasks/appointments | B — deterministic derived data | Missed visits and pending actions are deterministic UI facts. |
| Landing-page metrics/cards | Present | Hard-coded in `app/page.tsx` | C — static placeholder/demo data | Not a valid patient data contract. |
| Doctors directory | Present | `hospital_doctors` and `lib/doctors/data.ts` | D — seeded/demo data | Outside the follow-up-agent P0 flow; migration `002_full_setup_and_seed.sql` contains demo doctors. |
| Agent response/action result | Implemented separately | Gemini server action and agent tools | E — agent-generated/agent-mediated data | Must be grounded in A/B data and authorized tool results. |

## Existing agent context

`lib/agent/context.ts` builds a separate compact context for Gemini containing:

- `patient_id`;
- `display_name`;
- open tasks (`pending` and `in_progress`);
- appointments from the last seven days onward;
- `current_time`.

This context is server-derived and independent of the dashboard DOM. It currently omits reminders, does not carry all UI fields, and ignores several Supabase query errors. The agent therefore cannot reliably answer reminder questions from context alone and must use its tools or receive an expanded context contract.

## Agent tools and deterministic data

The allow-listed tools are:

- `get_follow_up_status()` — reads the authenticated patient’s tasks;
- `list_upcoming_appointments()` — reads future appointments for the authenticated patient;
- `update_follow_up_status(taskId, status)` — verifies task ownership, then writes status;
- `create_reminder(taskId, remindAt)` — verifies task ownership, then inserts a reminder.

Gemini is used for intent selection, response generation, and function-call orchestration. It has no Supabase client or direct database access. Supabase calls occur in server-side tool functions. The current deterministic facts are the authenticated user, ownership filters, status values, timestamps, task/appointment/reminder rows, and UI-derived counts.

## Current UI-to-agent bridge

The intended bridge is `WorkspaceView` → `AgentSlot` → Developer 2 `AgentPanel`, with `PatientContext` and `onContextUpdated` as the shared boundary. The current standalone `AgentPanel` calls the `sendMessage` server action and maintains its own conversation state. The server action currently returns:

```ts
{ success: boolean; response?: string; actions?: unknown[]; contextUpdated?: boolean; error?: string }
```

The panel must use `response` (not `text`) and should invoke the integration refresh callback when `contextUpdated` is true. The public landing-page instance has no workspace context or refresh bridge and is temporary testing placement.

## Backend/data gaps to resolve during integration

1. Remove the unauthenticated mock context and mock tool successes currently present as uncommitted changes in `lib/agent/context.ts` and `lib/agent/tools.ts`. They bypass authentication and can display or mutate fabricated records.
2. Restore/resolve the uncommitted truncations in `app/page.tsx` and `components/ui/button.tsx`; the current working tree appears syntactically incomplete and is not a reliable build candidate.
3. Add runtime validation for tool arguments, especially allowed statuses, UUID/task ownership, ISO timestamps, and future reminder times.
4. Make agent context include reminders or define explicitly that reminder questions always call the read tool; document the choice in the shared contract.
5. Do not silently convert Supabase query failures to empty arrays in production. Distinguish “no records” from “data unavailable.”
6. Keep the server action response shape synchronized with `AgentPanel` and `API.md`; the current implementation uses `response/actions/contextUpdated`, while earlier documentation mentions a different shape.
7. Add an explicit refresh/revalidation path after successful writes so the workspace metrics and lists reflect agent mutations.
8. Keep the public landing/testing panel out of the final authenticated demo path or label it clearly as a non-production test surface.

## Security and healthcare boundary

The dashboard checks authentication before rendering. The agent server action and tools also need to enforce the authenticated session independently. Supabase RLS policies cover the four patient tables using `auth.uid()` ownership checks. No service-role credential is used by the reviewed agent path, and Gemini must remain unaware of Supabase credentials.

The agent prompt and deterministic pre-check reject diagnosis, prescribing, medication-change, and clinical-decision requests. Unsupported requests should receive a safe handoff to a qualified healthcare professional and must not trigger state-changing tools. The current keyword pre-check is useful but narrow; it should be treated as a defense-in-depth guard, not a complete medical-safety classifier.

## Documentation and branch state

Present on this branch: `API.md`, `ARCHITECTURE.md`, `PROJECT_STATUS.md`, `HANDOFF.md`, `DECISIONS.md`, `DEVELOPER_1_PROMPT.md`, `DEVELOPER_2_PROMPT.md`, and `IMPLEMENTATION_COORDINATION.md`. The requested `START_HERE.md`, `TASKS.md`, and `AGENTS.md` files are absent on this branch. Documentation also still describes standalone Agent Panel testing and should be updated after integration.

This audit was performed on `feature/follow-up-agent`. No build, typecheck, or lint command was run because this audit is read-only and those commands may write generated files. `package.json` has `typecheck` but no lint script. The installed Gemini package is `@google/genai`; the legacy `@google/generative-ai` package is not installed.

## Recommended integration contract

Before merging the two feature branches, agree on these items only:

- `PatientContext` and its status enums from `lib/contracts.ts`;
- server action input history shape and output `{ success, response, actions, contextUpdated, error }`;
- tool argument/result schemas and validation behavior;
- the `AgentSlot` refresh callback after successful writes;
- the single shared Supabase project, migrations, RLS ownership rules, and environment variable names.

The next implementation step is integration cleanup and contract verification, beginning with removal of temporary mocks and restoration of the malformed working-tree files, followed by authenticated end-to-end testing against real shared Supabase data.

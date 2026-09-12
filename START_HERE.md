# Admin Portal Start Here

This branch adds the isolated Admin Portal at `/admin` to the existing Hojathon Next.js application. It uses the same Supabase project, authentication, database, and RLS policies as the patient workspace.

Before testing, apply `supabase/migrations/003_blood_availability.sql` in the shared Supabase SQL Editor and set the intended administrator's Supabase Auth `app_metadata` to `{ "role": "admin" }`. The admin route and every admin server action verify that role; patients are redirected away from the portal.

Admin routes include `/admin`, `/admin/patients`, `/admin/follow-ups`, `/admin/appointments`, `/admin/reminders`, `/admin/hospitals`, and `/admin/blood-availability`.

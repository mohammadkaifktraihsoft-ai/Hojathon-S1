import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [patients, tasks, appointments, reminders, hospitals, inventory] = await Promise.all([
    supabase!.from("patient_profiles").select("id", { count: "exact", head: true }),
    supabase!.from("follow_up_tasks").select("id", { count: "exact", head: true }).in("status", ["pending", "in_progress"]),
    supabase!.from("appointments").select("id", { count: "exact", head: true }),
    supabase!.from("reminders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase!.from("hospitals").select("id", { count: "exact", head: true }),
    supabase!.from("blood_inventory").select("id", { count: "exact", head: true }),
  ]);
  const cards = [["Patients", patients.count, "/admin/patients"], ["Open Follow-ups", tasks.count, "/admin/follow-ups"], ["Appointments", appointments.count, "/admin/appointments"], ["Pending Reminders", reminders.count, "/admin/reminders"], ["Hospitals", hospitals.count, "/admin/hospitals"], ["Blood Records", inventory.count, "/admin/blood-availability"]];
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-sm font-semibold text-teal-700">System management</p><h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Manage administrative data used by the patient workspace.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label, count, href]) => <a key={href} href={href as string}><Card className="transition hover:border-teal-400"><CardHeader><CardTitle>{label}</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-teal-700">{count ?? 0}</p></CardContent></Card></a>)}</div></main>;
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") redirect("/dashboard");
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><header className="border-b bg-white dark:border-slate-800 dark:bg-slate-900"><div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4"><Link href="/admin" className="mr-4 text-lg font-bold text-teal-700">Admin Portal</Link><nav className="flex flex-wrap gap-2 text-sm"><Link className="rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800" href="/admin">Dashboard</Link><Link className="rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800" href="/admin/patients">Patients</Link><Link className="rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800" href="/admin/follow-ups">Follow-ups</Link><Link className="rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800" href="/admin/appointments">Appointments</Link><Link className="rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800" href="/admin/reminders">Reminders</Link><Link className="rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800" href="/admin/hospitals">Hospitals</Link><Link className="rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800" href="/admin/blood-availability">Blood Inventory</Link></nav><span className="ml-auto text-xs text-slate-500">{user.email}</span></div></header>{children}</div>;
}

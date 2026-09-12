import { getBloodAvailability } from "@/lib/blood/data";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BloodAvailabilityPage() {
  const result = await getBloodAvailability();
  if ("error" in result) { if (result.error === "Unauthorized.") redirect("/login"); return <main className="mx-auto max-w-5xl px-4 py-10"><h1 className="text-2xl font-bold">Blood availability unavailable</h1><p className="mt-2 text-slate-600">{result.error} Please try again later.</p></main>; }
  return <main className="mx-auto max-w-6xl px-4 py-10"><Link href="/dashboard" className="text-sm text-teal-700">← Back to workspace</Link><h1 className="mt-4 text-3xl font-bold">Blood Availability</h1><p className="mt-2 text-slate-600">Administrative inventory updates are reflected here.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{result.inventory.map((item: any) => <article key={item.id} className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{item.blood_group}</h2><span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">{item.availability}</span></div><p className="mt-3 font-medium">{item.hospital?.name || "Hospital"}</p><p className="text-sm text-slate-500">{item.hospital?.location || ""}</p><p className="mt-4 text-sm">Units reported: <strong>{item.units ?? "Not reported"}</strong></p></article>)}</div></main>;
}

import { createClient } from "@/lib/supabase/server";

export async function getPatientContext() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Unauthorized");
  }

  const patientId = userData.user.id;

  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("*")
    .eq("id", patientId)
    .single();

  const { data: tasks } = await supabase
    .from("follow_up_tasks")
    .select("*")
    .eq("patient_id", patientId)
    .in("status", ["pending", "in_progress"])
    .order("due_at", { ascending: true });

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .gte("starts_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // recent past and future
    .order("starts_at", { ascending: true });

  return {
    patient_id: patientId,
    display_name: profile?.display_name,
    open_tasks: tasks || [],
    appointments: appointments || [],
    current_time: new Date().toISOString(),
  };
}

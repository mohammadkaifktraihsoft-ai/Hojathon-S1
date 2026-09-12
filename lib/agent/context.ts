import { createClient } from "@/lib/supabase/server";

export async function getPatientContext() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    // TEMPORARY MOCK CONTEXT FOR TESTING WITHOUT LOGIN
    return {
      patient_id: "mock-patient-123",
      display_name: "Mock Patient (Test Mode)",
      open_tasks: [
        { id: "task-1", title: "Schedule MRI", status: "pending", due_at: new Date(Date.now() - 86400000).toISOString() },
        { id: "task-2", title: "Blood Test", status: "in_progress", due_at: new Date(Date.now() + 86400000).toISOString() }
      ],
      appointments: [
        { id: "apt-1", title: "Cardiology Follow-up", starts_at: new Date(Date.now() + 86400000 * 3).toISOString(), status: "scheduled" }
      ],
      current_time: new Date().toISOString(),
    };
  }

  const patientId = userData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from("patient_profiles")
    .select("*")
    .eq("id", patientId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    throw new Error(`Database error fetching profile: ${profileError.message}`);
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("follow_up_tasks")
    .select("*")
    .eq("patient_id", patientId)
    .in("status", ["pending", "in_progress"])
    .order("due_at", { ascending: true });

  if (tasksError) {
    throw new Error(`Database error fetching tasks: ${tasksError.message}`);
  }

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .gte("starts_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("starts_at", { ascending: true });

  if (appointmentsError) {
    throw new Error(`Database error fetching appointments: ${appointmentsError.message}`);
  }

  return {
    patient_id: patientId,
    display_name: profile?.display_name || "Unknown",
    open_tasks: tasks || [],
    appointments: appointments || [],
    current_time: new Date().toISOString(),
  };
}

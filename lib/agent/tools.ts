import { createClient } from "@/lib/supabase/server";
import { FollowUpStatus } from "@/lib/contracts";

export async function getFollowUpStatus() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("follow_up_tasks")
    .select("*")
    .eq("patient_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { tasks: data };
}

export async function listUpcomingAppointments() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", userData.user.id)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) return { error: error.message };
  return { appointments: data };
}

export async function updateFollowUpStatus(taskId: string, status: FollowUpStatus) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };

  // Verify ownership
  const { data: task, error: fetchError } = await supabase
    .from("follow_up_tasks")
    .select("id")
    .eq("id", taskId)
    .eq("patient_id", userData.user.id)
    .single();

  if (fetchError || !task) {
    return { error: "Task not found or unauthorized" };
  }

  const { error } = await supabase
    .from("follow_up_tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) return { error: error.message };
  return { success: true, taskId, status };
}

export async function createReminder(taskId: string, remindAt: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };

  // Verify task ownership
  const { data: task, error: fetchError } = await supabase
    .from("follow_up_tasks")
    .select("id")
    .eq("id", taskId)
    .eq("patient_id", userData.user.id)
    .single();

  if (fetchError || !task) {
    return { error: "Task not found or unauthorized" };
  }

  const { data, error } = await supabase
    .from("reminders")
    .insert({
      patient_id: userData.user.id,
      task_id: taskId,
      remind_at: remindAt,
      status: "pending"
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, reminder: data };
}

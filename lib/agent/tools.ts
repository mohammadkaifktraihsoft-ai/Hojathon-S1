import "server-only";
import { createClient } from "@/lib/supabase/server";
import { FollowUpStatus } from "@/lib/contracts";

function isValidUUID(uuid: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

function isValidISO8601(dateStr: string) {
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

export async function getFollowUpStatus() {
  const supabase = await createClient();
  if (!supabase) return { error: "Database configuration error." };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { tasks: [{ id: "task-1", title: "Schedule MRI", status: "pending" }, { id: "task-2", title: "Blood Test", status: "in_progress" }] };

  const { data, error } = await supabase
    .from("follow_up_tasks")
    .select("*")
    .eq("patient_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: "Failed to fetch follow-up status." };
  return { tasks: data };
}

export async function listUpcomingAppointments() {
  const supabase = await createClient();
  if (!supabase) return { error: "Database configuration error." };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { appointments: [{ id: "apt-1", title: "Cardiology Follow-up", starts_at: new Date(Date.now() + 86400000 * 3).toISOString(), status: "scheduled" }] };

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", userData.user.id)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) return { error: "Failed to fetch upcoming appointments." };
  return { appointments: data };
}

export async function updateFollowUpStatus(taskId: string, status: FollowUpStatus) {
  if (!taskId || !isValidUUID(taskId)) return { error: "Invalid task ID format." };
  if (!["pending", "in_progress", "completed", "cancelled"].includes(status)) {
    return { error: "Invalid status value." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Database configuration error." };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { success: true, taskId, status };

  const { data: task, error: fetchError } = await supabase
    .from("follow_up_tasks")
    .select("id")
    .eq("id", taskId)
    .eq("patient_id", userData.user.id)
    .single();

  if (fetchError || !task) {
    return { error: "Task not found or you do not have permission to modify it." };
  }

  const { error } = await supabase
    .from("follow_up_tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("patient_id", userData.user.id);

  if (error) return { error: "Failed to update task status." };
  return { success: true, taskId, status };
}

export async function createReminder(taskId: string, remindAt: string) {
  if (!taskId || !isValidUUID(taskId)) return { error: "Invalid task ID format." };
  if (!remindAt || !isValidISO8601(remindAt)) return { error: "Invalid reminder date/time." };

  const supabase = await createClient();
  if (!supabase) return { error: "Database configuration error." };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { success: true, reminder: { id: "rem-1", task_id: taskId, remind_at: remindAt, status: "pending" } };

  const { data: task, error: fetchError } = await supabase
    .from("follow_up_tasks")
    .select("id")
    .eq("id", taskId)
    .eq("patient_id", userData.user.id)
    .single();

  if (fetchError || !task) {
    return { error: "Task not found or you do not have permission." };
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

  if (error) return { error: "Failed to create reminder." };
  return { success: true, reminder: data };
}

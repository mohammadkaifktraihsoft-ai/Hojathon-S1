import "server-only";
import { createClient } from "@/lib/supabase/server";
import { BLOOD_GROUPS, BloodGroup } from "@/lib/contracts";

export async function getBloodAvailability(bloodGroup?: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Database configuration error." };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Unauthorized." };
  const group = bloodGroup && BLOOD_GROUPS.includes(bloodGroup as BloodGroup) ? bloodGroup : undefined;
  let query = supabase.from("blood_inventory").select("id, hospital_id, blood_group, availability, units, updated_at, hospitals(id, name, location, contact_phone)").order("blood_group");
  if (group) query = query.eq("blood_group", group);
  const { data, error } = await query;
  if (error) return { error: "Blood availability is not available right now." };
  return { inventory: (data || []).map((row: any) => ({ ...row, hospital: row.hospitals })) };
}

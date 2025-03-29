import { SupabaseClient } from "@supabase/supabase-js";

export async function validateLicense(
  supabase: SupabaseClient,
  studioId: string
): Promise<boolean> {
  try {
    const { data: license, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("studio_id", studioId)
      .eq("is_active", true)
      .gt("end_date", new Date().toISOString())
      .limit(1)
      .single();

    if (error || !license) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("License validation error:", error);
    return false;
  }
}

import { SupabaseClient } from "@supabase/supabase-js";

export async function validateLicense(
  supabase: SupabaseClient,
  studioId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("check_studio_license", {
      p_studio_id: studioId,
    });

    if (error) {
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("License validation error:", error);
    return false;
  }
}

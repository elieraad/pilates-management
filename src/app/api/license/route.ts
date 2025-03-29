import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all licenses for the studio
    const { data: licenses, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("studio_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(licenses, { status: 200 });
  } catch (error) {
    console.error("Get licenses error:", error);
    return NextResponse.json(
      { error: "Failed to get licenses" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

    // Check if the studio has an active license
    const { data: license, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("studio_id", session.user.id)
      .eq("is_active", true)
      .gt("end_date", new Date().toISOString())
      .limit(1)
      .single();

    if (error || !license) {
      return NextResponse.json(
        { active: false, message: "No active license found" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        active: true,
        license: {
          type: license.license_type,
          expiresAt: license.end_date,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("License check error:", error);
    return NextResponse.json(
      { error: "Failed to check license status" },
      { status: 500 }
    );
  }
}

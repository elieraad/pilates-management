import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateLicense } from "@/lib/utils/license-validator";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the studio has an active license
    const licenseValid = await validateLicense(supabase, user.id);

    if (!licenseValid) {
      return NextResponse.json(
        { error: "Active license required" },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();

    // Validate required fields
    if (
      !body.recurring_session_id ||
      !body.start_time ||
      !body.exception_type
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if session exists and belongs to this studio
    const { error: sessionError } = await supabase
      .from("class_sessions")
      .select("id, studio_id")
      .eq("id", body.recurring_session_id)
      .eq("studio_id", user.id)
      .single();

    if (sessionError) {
      return NextResponse.json(
        { error: "Recurring session not found or access denied" },
        { status: 404 }
      );
    }

    // Check if an exception already exists for this date/session
    const { data: existingException } = await supabase
      .from("session_exceptions")
      .select("id")
      .eq("recurring_session_id", body.recurring_session_id)
      .eq("start_time", body.start_time)
      .maybeSingle();

    // If an exception exists, update it; otherwise create a new one
    let result;

    if (existingException) {
      // Update existing exception
      result = await supabase
        .from("session_exceptions")
        .update({
          exception_type: body.exception_type,
          modified_start_time:
            body.exception_type === "modified"
              ? body.modified_start_time
              : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingException.id)
        .select()
        .single();
    } else {
      // Create new exception
      result = await supabase
        .from("session_exceptions")
        .insert({
          recurring_session_id: body.recurring_session_id,
          studio_id: user.id,
          start_time: body.start_time,
          exception_type: body.exception_type,
          modified_start_time:
            body.exception_type === "modified"
              ? body.modified_start_time
              : null,
        })
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error("Session exception error:", error);
    return NextResponse.json(
      { error: "Failed to create/update session exception" },
      { status: 500 }
    );
  }
}

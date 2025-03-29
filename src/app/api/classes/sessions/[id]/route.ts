import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateLicense } from "@/lib/utils/license-validator";

// GET handler to fetch a specific session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get the session with its class data
    const { data, error } = await supabase
      .from("class_sessions")
      .select(
        `
        *,
        class:class_id (*)
      `
      )
      .eq("id", params.id)
      .eq("studio_id", session.user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}

// PUT handler to update a recurring session series
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const licenseValid = await validateLicense(supabase, session.user.id);

    if (!licenseValid) {
      return NextResponse.json(
        { error: "Active license required" },
        { status: 403 }
      );
    }

    // Get the current session to verify it's a recurring one
    const { data: currentSession, error: sessionError } = await supabase
      .from("class_sessions")
      .select("*")
      .eq("id", params.id)
      .eq("studio_id", session.user.id)
      .single();

    if (sessionError) {
      return NextResponse.json(
        { error: "Recurring session not found" },
        { status: 404 }
      );
    }

    // Parse the request body
    const body = await request.json();

    // Update the recurring session
    const { error: updateError } = await supabase
      .from("class_sessions")
      .update({
        start_time: body.start_time || currentSession.start_time,
        recurring_pattern:
          body.recurring_pattern || currentSession.recurring_pattern,
        custom_recurrence:
          body.custom_recurrence || currentSession.custom_recurrence,
      })
      .eq("id", params.id)
      .eq("studio_id", session.user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update recurring session" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Recurring session updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update recurring session error:", error);
    return NextResponse.json(
      { error: "Failed to update recurring session" },
      { status: 500 }
    );
  }
}

// DELETE handler to delete an entire recurring session series
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const licenseValid = await validateLicense(supabase, session.user.id);

    if (!licenseValid) {
      return NextResponse.json(
        { error: "Active license required" },
        { status: 403 }
      );
    }

    // Get the current session to verify it's a recurring one
    const { error: sessionError } = await supabase
      .from("class_sessions")
      .select("*")
      .eq("id", params.id)
      .eq("studio_id", session.user.id)
      .single();

    if (sessionError) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Mark the recurring session as cancelled
    const { error: updateError } = await supabase
      .from("class_sessions")
      .update({
        is_cancelled: true,
      })
      .eq("id", params.id)
      .eq("studio_id", session.user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to delete recurring session" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Recurring session deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete recurring session error:", error);
    return NextResponse.json(
      { error: "Failed to delete recurring session" },
      { status: 500 }
    );
  }
}

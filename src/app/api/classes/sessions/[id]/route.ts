import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateLicense } from "@/lib/utils/license-validator";

export const dynamic = "force-dynamic";

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
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
      .eq("studio_id", user.id)
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

    // Get the current session to verify it's a recurring one
    const { data: currentSession, error: sessionError } = await supabase
      .from("class_sessions")
      .select("*")
      .eq("id", params.id)
      .eq("studio_id", user.id)
      .single();

    if (sessionError) {
      return NextResponse.json(
        { error: "Recurring session not found" },
        { status: 404 }
      );
    }

    // Parse the request body
    const body = await request.json();

    const startTime = new Date(currentSession.start_time);
    const endTime =
      (currentSession.recurring_end_date && new Date(currentSession.recurring_end_date)) || null;
    if (body.start_time) {
      const newDate = new Date(body.start_time);
      startTime.setHours(newDate.getHours());
      startTime.setMinutes(newDate.getMinutes());

      if (endTime) {
        endTime.setHours(newDate.getHours());
        endTime.setMinutes(newDate.getMinutes());
      }
    }
    // Update the recurring session
    const { error: updateError } = await supabase
      .from("class_sessions")
      .update({
        start_time: startTime.toISOString(),
        recurring_end_date: endTime?.toISOString(),
      })
      .eq("id", params.id)
      .eq("studio_id", user.id);

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

    // Get the current session to verify it's a recurring one
    const { error: sessionError } = await supabase
      .from("class_sessions")
      .select("*")
      .eq("id", params.id)
      .eq("studio_id", user.id)
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
      .eq("studio_id", user.id);

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

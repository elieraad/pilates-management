import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateLicense } from "@/lib/utils/license-validator";
import { getSessions } from "@/lib/utils/recurring-sessions";

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const url = new URL(request.url);
    const startDate =
      url.searchParams.get("startDate") || new Date().toISOString();
    const endDate =
      url.searchParams.get("endDate") ||
      new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get recurring sessions that might have occurrences in this range
    const allSessions = await getSessions(session.user.id, startDate, endDate);

    return NextResponse.json(allSessions, { status: 200 });
  } catch (error) {
    console.error("Get class sessions error:", error);
    return NextResponse.json(
      { error: "Failed to get class sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Parse the request body
    const body = await request.json();

    // Validate the input
    if (!body.class_id || !body.start_time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the class exists and belongs to this studio
    const { error: classError } = await supabase
      .from("classes")
      .select("id")
      .eq("id", body.class_id)
      .eq("studio_id", session.user.id)
      .single();

    if (classError) {
      return NextResponse.json(
        { error: "Class not found or access denied" },
        { status: 404 }
      );
    }

    // Create the session
    const sessionData = {
      class_id: body.class_id,
      studio_id: session.user.id,
      start_time: body.start_time,
      is_recurring: body.is_recurring || false,
      recurring_pattern: body.is_recurring
        ? body.recurring_pattern || "weekly"
        : null,
      custom_recurrence: body.custom_recurrence,
    };

    const { data: newSession, error } = await supabase
      .from("class_sessions")
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: "Failed to create class session" },
      { status: 500 }
    );
  }
}

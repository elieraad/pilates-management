import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

    // Get query parameters
    const url = new URL(request.url);
    const available = url.searchParams.get("available") === "true";
    const startDate =
      url.searchParams.get("startDate") || new Date().toISOString();
    const endDate = url.searchParams.get("endDate");

    // Get sessions for this class
    const query = supabase
      .from("class_sessions")
      .select(
        `
        *,
        class:class_id (*),
        bookings_count:bookings(count)
      `
      )
      .eq("class_id", params.id)
      .eq("studio_id", user.id)
      .eq("is_cancelled", false)
      .gte("start_time", startDate);

    if (endDate) {
      query.lte("start_time", endDate);
    }

    const { data, error } = await query.order("start_time", {
      ascending: true,
    });

    if (error) {
      throw error;
    }

    // Process bookings count for each session
    const sessionsWithBookings = data.map((session) => {
      const bookingsCount = session.bookings_count[0]?.count || 0;
      // Check if session is available (has capacity)
      const isAvailable = bookingsCount < session.class.capacity;

      return {
        ...session,
        bookings_count: bookingsCount,
        available_spots: session.class.capacity - bookingsCount,
        is_available: isAvailable,
      };
    });

    // Filter by availability if requested
    const result = available
      ? sessionsWithBookings.filter((s) => s.is_available)
      : sessionsWithBookings;

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Get class sessions error:", error);
    return NextResponse.json(
      { error: "Failed to get class sessions" },
      { status: 500 }
    );
  }
}

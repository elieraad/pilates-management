import { NextRequest, NextResponse } from "next/server";
import { getSessionsUsingClient } from "@/lib/utils/recurring-sessions";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { studioId: string; classId: string } }
) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const sessions = await getSessionsUsingClient(
      supabase,
      params.studioId,
      startDate,
      endDate
    );
    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error("Get public sessions error:", error);
    return NextResponse.json(
      { error: "Failed to get class sessions" },
      { status: 500 }
    );
  }
}

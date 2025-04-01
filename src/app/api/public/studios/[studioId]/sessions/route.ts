import { NextRequest, NextResponse } from "next/server";
import { getSessions } from "@/lib/utils/recurring-sessions";

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

    const sessions = await getSessions(params.studioId, startDate, endDate);
    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error("Get public sessions error:", error);
    return NextResponse.json(
      { error: "Failed to get class sessions" },
      { status: 500 }
    );
  }
}

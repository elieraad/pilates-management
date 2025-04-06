import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "../../../../../middleware/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 bookings per 5 minutes
    const rateLimited = await rateLimit(request, {
      limit: 5,
      window: 300,
      identifier: request.ip,
    });

    if (rateLimited) return rateLimited;

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Parse the request body
    const body = await request.json();

    // Validate the input
    if (
      !body.studio_id ||
      !body.class_session_id ||
      !body.client_name ||
      !body.client_email
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if session exists and get class capacity
    const { data: sessionData, error: sessionError } = await supabase
      .from("class_sessions")
      .select(`*, class:class_id (capacity)`)
      .eq("id", body.class_session_id)
      .eq("studio_id", body.studio_id)
      .eq("is_cancelled", false)
      .single();

    if (sessionError) {
      return NextResponse.json(
        { error: "Class session not found or cancelled" },
        { status: 404 }
      );
    }

    // Use the stored procedure for transaction safety
    const { data: result, error: transactionError } = await supabase.rpc(
      "create_booking_with_capacity_check",
      {
        p_class_session_id: body.class_session_id,
        p_studio_id: body.studio_id,
        p_client_name: body.client_name,
        p_client_email: body.client_email,
        p_client_phone: body.client_phone || null,
        p_status: body.status || "confirmed",
        p_payment_status: body.payment_status || "unpaid",
        p_amount: body.amount,
        p_capacity: sessionData.class.capacity,
        p_session_date: body.sessionDate,
      }
    );

    if (transactionError) {
      // Handle specific error cases
      if (transactionError.message.includes("Class session is full")) {
        return NextResponse.json(
          { error: "Class session is full" },
          { status: 409 }
        );
      } else if (
        transactionError.message.includes("Client already has a booking")
      ) {
        return NextResponse.json(
          { error: "Client already has a booking for this session" },
          { status: 409 }
        );
      }
      throw transactionError;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Booking created successfully",
        booking: result,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Create public booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

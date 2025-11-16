import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "../../../../../middleware/rate-limiter";
import { createClient } from "@supabase/supabase-js";

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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
      .select(`*, class:class_id (capacity, price)`)
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

    // p_class_session_id uuid,
    // p_studio_id uuid,
    // p_client_email text,
    // p_client_name text,
    // p_session_date text, -- Required for recurring sessions
    // p_client_phone text DEFAULT NULL,
    // p_status text DEFAULT 'confirmed',
    // p_payment_status text DEFAULT 'unpaid',
    // p_amount numeric DEFAULT 0

    // Use the stored procedure for transaction safety
    const { data: result, error: transactionError } = await supabase.rpc(
      "create_booking_with_capacity_check",
      {
        p_class_session_id: body.class_session_id,
        p_studio_id: body.studio_id,
        p_client_email: body.client_email,
        p_client_name: body.client_name,
        p_client_phone: body.client_phone || null,
        p_status: "pending",
        p_payment_status: "unpaid",
        p_amount: sessionData.class.price,
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

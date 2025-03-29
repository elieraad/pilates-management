import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
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

    // Check if class session exists and is not cancelled
    const { data: sessionData, error: sessionError } = await supabase
      .from("class_sessions")
      .select(
        `
        *,
        class:class_id (capacity)
      `
      )
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

    // Get current booking count to check capacity
    const { data: bookingsCount, error: countError } = await supabase
      .from("bookings")
      .select("id", { count: "exact" })
      .eq("class_session_id", body.class_session_id)
      .eq("session_date", body.sessionDate)
      .neq("status", "cancelled");

    if (countError) {
      throw countError;
    }

    // Check if session is already full
    if (bookingsCount && bookingsCount.length >= sessionData.class.capacity) {
      return NextResponse.json(
        { error: "Class session is full" },
        { status: 409 }
      );
    }

    // Check if client already has a booking for this session
    const { data: existingBooking, error: existingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("class_session_id", body.class_session_id)
      .eq("session_date", body.sessionDate)
      .eq("client_email", body.client_email)
      .neq("status", "cancelled")
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingBooking) {
      return NextResponse.json(
        { error: "Client already has a booking for this session" },
        { status: 409 }
      );
    }

    // Create the booking
    const { data: newBooking, error: createError } = await supabase
      .from("bookings")
      .insert({
        studio_id: body.studio_id,
        class_session_id: body.class_session_id,
        client_name: body.client_name,
        client_email: body.client_email,
        client_phone: body.client_phone || null,
        status: body.status || "confirmed",
        payment_status: body.payment_status || "unpaid",
        amount: body.amount,
        session_date: body.sessionDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // TODO: we should also:
    // 1. Send a confirmation email to the client
    // 2. Notify the studio about the new booking
    // 3. Potentially integrate with a payment gateway

    return NextResponse.json(
      {
        success: true,
        message: "Booking created successfully",
        booking: newBooking,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create public booking error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}

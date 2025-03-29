import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateLicense } from "@/lib/utils/license-validator";
import { Booking, CreateBookingInput } from "@/types/booking.types";
import { computeBookingsWithSessionDate } from "@/lib/utils/bookings";

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
    const status = url.searchParams.get("status");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const classId = url.searchParams.get("classId");

    // Get all bookings with their session data
    let query = supabase
      .from("bookings")
      .select(
        `
        *,
        class_session:class_session_id (
          *,
          class:class_id (*)
        )
      `
      )
      .eq("studio_id", session.user.id)
      .order("created_at", { ascending: false });

    // Apply filters if provided
    if (status) {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("session_date", startDate);
    }

    if (endDate) {
      query = query.lte("session_date", endDate);
    }

    if (classId) {
      query = query.eq("class_session.class_id", classId);
    }

    const { data: bookings, error } = await query;

    if (error) {
      throw error;
    }

    // Filter out bookings with missing session data
    let validBookings = bookings.filter((b) => b.class_session);

    await computeBookingsWithSessionDate(validBookings);

    // Now get all exceptions for these sessions
    if (validBookings.length > 0) {
      validBookings = validBookings.filter((b: Booking) => {
        let valid = false;

        if (startDate) {
          valid =
            valid ||
            new Date(b.session_date).getTime() >= new Date(startDate).getTime();
        }

        if (endDate) {
          valid =
            valid ||
            new Date(b.session_date).getTime() >= new Date(endDate).getTime();
        }

        return valid;
      });
    }

    return NextResponse.json(validBookings, { status: 200 });
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json(
      { error: "Failed to get bookings" },
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
    const body: CreateBookingInput & { sessionDate?: string } =
      await request.json();

    // Validate the input
    if (!body.class_session_id || !body.client_name || !body.client_email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if class session exists and belongs to this studio
    const { data: sessionData, error: sessionError } = await supabase
      .from("class_sessions")
      .select(
        `
        *,
        class:class_id (capacity)
      `
      )
      .eq("id", body.class_session_id)
      .eq("studio_id", session.user.id)
      .eq("is_cancelled", false)
      .single();

    if (sessionError) {
      return NextResponse.json(
        { error: "Class session not found or cancelled" },
        { status: 404 }
      );
    }

    // Use a transaction to prevent race conditions when checking capacity
    // and creating the booking
    const { data: result, error: transactionError } = await supabase.rpc(
      "create_booking_with_capacity_check",
      {
        p_class_session_id: body.class_session_id,
        p_studio_id: session.user.id,
        p_client_name: body.client_name,
        p_client_email: body.client_email,
        p_client_phone: body.client_phone || null,
        p_status: body.status,
        p_payment_status: body.payment_status,
        p_amount: body.amount,
        p_capacity: sessionData.class.capacity,
        p_session_date: body.sessionDate || null, // Pass the session date for recurring sessions
      }
    );

    if (transactionError) {
      // Check for specific error codes
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

    // Get the newly created booking with related data
    const { data: newBooking, error: fetchError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        class_session:class_session_id (
          *,
          class:class_id (*)
        )
      `
      )
      .eq("id", result.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

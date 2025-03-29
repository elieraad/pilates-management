import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateLicense } from "@/lib/utils/license-validator";

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

    // Get the booking
    const { data: booking, error } = await supabase
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
      .eq("id", params.id)
      .eq("studio_id", session.user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json(
      { error: "Failed to get booking" },
      { status: 500 }
    );
  }
}

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

    // Check if the booking exists and belongs to the studio
    const { error: checkError } = await supabase
      .from("bookings")
      .select("id, status, payment_status")
      .eq("id", params.id)
      .eq("studio_id", session.user.id)
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }
      throw checkError;
    }

    // Parse the request body
    const body = await request.json();

    // Update the booking
    const { data: updatedBooking, error } = await supabase
      .from("bookings")
      .update({
        client_name: body.client_name,
        client_email: body.client_email,
        client_phone: body.client_phone,
        status: body.status,
        payment_status: body.payment_status,
        amount: body.amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("studio_id", session.user.id)
      .select(
        `
        *,
        class_session:class_session_id (
          *,
          class:class_id (*)
        )
      `
      )
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(updatedBooking, { status: 200 });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

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

    // Check if booking exists and belongs to studio
    const { error: checkError } = await supabase
      .from("bookings")
      .select("id")
      .eq("id", params.id)
      .eq("studio_id", session.user.id)
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }
      throw checkError;
    }

    // For data integrity, we'll update the status to cancelled instead of deleting
    const { error } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("studio_id", session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { message: "Booking cancelled successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cancel booking error:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}

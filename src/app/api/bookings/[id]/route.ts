import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateLicense } from "@/lib/utils/license-validator";

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

    // Get the booking with client information
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        client:client_id (
          id,
          name,
          email,
          phone
        ),
        class_session:class_session_id (
          *,
          class:class_id (*)
        )
      `
      )
      .eq("id", params.id)
      .eq("studio_id", user.id)
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

    // Get the existing booking with client info
    const { data: existingBooking, error: fetchError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        client_id,
        status,
        payment_status,
        client:client_id (
          id,
          name,
          email,
          phone
        )
      `
      )
      .eq("id", params.id)
      .eq("studio_id", user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Parse the request body
    const body = await request.json();

    let clientId = existingBooking.client_id;
    const existingClient = existingBooking.client;

    // Handle client information update if provided
    if (body.client.name || body.client.email || body.client.phone) {
      // Check if we need to update the existing client or create a new one
      const clientChanged =
        body.client.name !== existingClient.name ||
        body.client.email !== existingClient.email ||
        body.client.phone !== existingClient.phone;

      if (clientChanged) {
        // First, check if a client already exists for this studio
        const { data: existingClient } = await supabase
          .from("clients")
          .select("id")
          .eq("studio_id", user.id)
          .eq("phone", body.client.phone)
          .eq("email", body.client.email)
          .single();

        if (existingClient) {
          // Update the existing client
          const { error: updateClientError } = await supabase
            .from("clients")
            .update({
              name: body.client.name,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingClient.id);

          if (updateClientError) throw updateClientError;
          clientId = existingClient.id;
        } else {
          // Create a new client
          const { data: newClient, error: createClientError } = await supabase
            .from("clients")
            .insert({
              studio_id: user.id,
              name: body.client.name,
              email: body.client.email,
              phone: body.client.phone || null,
            })
            .select("id")
            .single();

          if (createClientError) throw createClientError;
          clientId = newClient.id;
        }
      }
    }

    // Update the booking
    const { data: updatedBooking, error } = await supabase
      .from("bookings")
      .update({
        client_id: clientId,
        status: body.status,
        payment_status: body.payment_status,
        amount: body.amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("studio_id", user.id)
      .select(
        `
        *,
        client:client_id (
          id,
          name,
          email,
          phone
        ),
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

    // Check if booking exists and belongs to studio
    const { error: checkError } = await supabase
      .from("bookings")
      .select("id")
      .eq("id", params.id)
      .eq("studio_id", user.id)
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
      .eq("studio_id", user.id)
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

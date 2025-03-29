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

    // Get the class
    const { data: classData, error } = await supabase
      .from("classes")
      .select("*")
      .eq("id", params.id)
      .eq("studio_id", session.user.id)
      .eq("is_cancelled", false)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(classData, { status: 200 });
  } catch (error) {
    console.error("Get class error:", error);
    return NextResponse.json({ error: "Failed to get class" }, { status: 500 });
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

    // Check if the class exists and belongs to the studio
    const { error: checkError } = await supabase
      .from("classes")
      .select("id")
      .eq("id", params.id)
      .eq("studio_id", session.user.id)
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }
      throw checkError;
    }

    // Parse the request body
    const body = await request.json();

    // Update the class
    const { data: updatedClass, error } = await supabase
      .from("classes")
      .update({
        name: body.name,
        description: body.description || null,
        duration: body.duration,
        capacity: body.capacity,
        price: body.price,
        instructor: body.instructor,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("studio_id", session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(updatedClass, { status: 200 });
  } catch (error) {
    console.error("Update class error:", error);
    return NextResponse.json(
      { error: "Failed to update class" },
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

    // Check if class exists and belongs to studio
    const { error: checkError } = await supabase
      .from("classes")
      .select("id")
      .eq("id", params.id)
      .eq("studio_id", session.user.id)
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }
      throw checkError;
    }

    // Start a transaction for related operations
    // First, check if there are any bookings for this class
    const { data: existingBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, class_sessions!inner(class_id)")
      .eq("class_sessions.class_id", params.id)
      .eq("studio_id", session.user.id)
      .limit(1);

    if (bookingsError) throw bookingsError;

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete class with existing bookings" },
        { status: 409 }
      );
    }

    // Delete all class sessions for this class
    const { error: sessionsError } = await supabase
      .from("class_sessions")
      .update({
        is_cancelled: true,
      })
      .eq("class_id", params.id);

    if (sessionsError) throw sessionsError;

    // Now delete the class
    const { error: deleteError } = await supabase
      .from("classes")
      .update({
        is_cancelled: true,
      })
      .eq("id", params.id)
      .eq("studio_id", session.user.id);

    if (deleteError) throw deleteError;

    return NextResponse.json(
      { message: "Class deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete class error:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CreateClassInput } from "@/types/class.types";
import { validateLicense } from "@/lib/utils/license-validator";

export async function GET() {
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

    // Get all classes for the studio
    const { data: classes, error } = await supabase
      .from("classes")
      .select("*")
      .eq("studio_id", session.user.id)
      .eq("is_cancelled", false)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(classes, { status: 200 });
  } catch (error) {
    console.error("Get classes error:", error);
    return NextResponse.json(
      { error: "Failed to get classes" },
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
    const body: CreateClassInput = await request.json();

    // Validate the input
    if (
      !body.name ||
      !body.duration ||
      !body.capacity ||
      !body.price ||
      !body.instructor
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the class
    const { data: newClass, error } = await supabase
      .from("classes")
      .insert({
        studio_id: session.user.id,
        name: body.name,
        description: body.description || null,
        duration: body.duration,
        capacity: body.capacity,
        price: body.price,
        instructor: body.instructor,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("Create class error:", error);
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { UpdateStudioInput } from "@/types/studio.types";

export const dynamic = "force-dynamic";

export async function GET() {
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

    // Get the studio profile
    const { data: studio, error } = await supabase
      .from("studios")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(studio, { status: 200 });
  } catch (error) {
    console.error("Get studio profile error:", error);
    return NextResponse.json(
      { error: "Failed to get studio profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    // Parse the request body
    const body: UpdateStudioInput = await request.json();

    // Update the studio profile
    const { data: updatedStudio, error } = await supabase
      .from("studios")
      .update({
        name: body.name,
        address: body.address,
        phone: body.phone,
        description: body.description,
        opening_hours: body.opening_hours,
        logo_url: body.logo_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(updatedStudio, { status: 200 });
  } catch (error) {
    console.error("Update studio profile error:", error);
    return NextResponse.json(
      { error: "Failed to update studio profile" },
      { status: 500 }
    );
  }
}

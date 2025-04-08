// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Create a regular client for public operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Create an admin client with service role for privileged operations
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Parse the request body
    const { email, password, studioData } = await request.json();

    // Check required fields
    if (!email || !password || !studioData.name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Register the user with public client
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          studio_name: studioData.name,
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // 2. Create the studio profile using admin client
    const { error: profileError } = await adminClient.from("studios").insert({
      id: authData.user.id,
      name: studioData.name,
      address: studioData.address || "",
      phone: studioData.phone || "",
      email: email,
      description: studioData.description || "",
      opening_hours: studioData.opening_hours || "",
    });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    // 3. Create a 1-month free license using admin client
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1); // Add 1 month

    const { error: licenseError } = await adminClient.from("licenses").insert({
      studio_id: authData.user.id,
      license_type: "monthly",
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      is_active: true,
      payment_reference: "Welcome Plan",
    });

    if (licenseError) {
      return NextResponse.json(
        { error: licenseError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Registration successful" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}

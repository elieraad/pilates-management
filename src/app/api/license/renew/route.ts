import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CreateLicenseInput } from "@/types/license.types";

export const dynamic = "force-dynamic";

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

    // Parse the request body
    const body: CreateLicenseInput = await request.json();

    if (
      !body.license_type ||
      !["monthly", "yearly"].includes(body.license_type)
    ) {
      return NextResponse.json(
        { error: "Invalid license type" },
        { status: 400 }
      );
    }

    // Calculate license duration based on type
    const now = new Date();
    const startDate = now.toISOString();
    const endDate = new Date(now);

    if (body.license_type === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (body.license_type === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create the new license
    const { data: newLicense, error } = await supabase
      .from("licenses")
      .insert({
        studio_id: session.user.id,
        license_type: body.license_type,
        start_date: startDate,
        end_date: endDate.toISOString(),
        is_active: true,
        payment_reference: body.payment_reference || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Deactivate any previous licenses
    const { error: updateError } = await supabase
      .from("licenses")
      .update({ is_active: false })
      .eq("studio_id", session.user.id)
      .neq("id", newLicense.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(newLicense, { status: 201 });
  } catch (error) {
    console.error("Renew license error:", error);
    return NextResponse.json(
      { error: "Failed to renew license" },
      { status: 500 }
    );
  }
}

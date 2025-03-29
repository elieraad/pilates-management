import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReactNode } from "react";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Check if user is already authenticated
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return <div className="bg-olive-50">{children}</div>;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReactNode } from "react";
import Sidebar from "@/components/ui/sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Check if user is authenticated
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If not authenticated, redirect to login
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="bg-olive-50 min-h-screen">
      <Sidebar />

      <div className="md:ml-64 min-h-screen flex flex-col">
        <main className="flex-1 p-4 md:p-6 mt-16 md:mt-0">{children}</main>
      </div>
    </div>
  );
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReactNode } from "react";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";

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

  // Check license status
  const { data: license, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("studio_id", session.user.id)
    .eq("is_active", true)
    .gt("end_date", new Date().toISOString())
    .limit(1)
    .single();

  // If no active license and not on license page, redirect to license page
  if ((error || !license) && !true) {
    redirect("/settings/license");
  }

  return (
    <div className="bg-olive-50 min-h-screen">
      <Sidebar />

      <div className="flex flex-col min-h-screen main-content">
        <header className="sticky top-0 bg-white border-b border-gray-100 p-4 z-10 md:hidden">
          <div className="flex items-center justify-between">
            <MobileNav />
            {/* Other header content can go here */}
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

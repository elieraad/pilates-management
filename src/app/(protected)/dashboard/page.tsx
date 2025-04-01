import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import UpcomingClasses from "@/components/dashboard/upcoming-classes";
import RecentBookings from "@/components/dashboard/recent-bookings";
import { computeBookingsWithSessionDate } from "@/lib/utils/bookings";
import StatsCards from "@/components/dashboard/stats-cards";

export const metadata = {
  title: "Dashboard | Pilates Studio Management",
  description: "View your studio performance at a glance",
};

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Get the current user's session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  // Get current date for filtering today's classes
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get upcoming classes for today
  const { data: classes } = await supabase
    .from("class_sessions")
    .select(
      `
      id,
      start_time,
      class:class_id (
        id,
        name,
        instructor,
        capacity
      ),
      bookings_count:bookings(count)
    `
    )
    .eq("studio_id", session.user.id)
    .eq("is_cancelled", false)
    .gte("start_time", today.toISOString())
    .lt("start_time", tomorrow.toISOString())
    .order("start_time", { ascending: true });

  const upcomingClasses =
    classes?.map((d) => ({
      ...d,
      bookings_count: d.bookings_count[0].count,
      class: Array.isArray(d.class) ? d.class[0] : d.class,
    })) || [];

  // Get recent bookings
  const { data: recentBookings } = await supabase
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
    .eq("studio_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (recentBookings && recentBookings.length > 0) {
    await computeBookingsWithSessionDate(recentBookings);
  }

  return (
    <div>
      <h1 className="text-2xl font-serif text-olive-900">Dashboard</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-serif text-olive-900 mb-4">
          Studio Overview
        </h2>
        <StatsCards></StatsCards>
      </div>

      <UpcomingClasses classes={upcomingClasses} />

      <RecentBookings bookings={recentBookings || []} />
    </div>
  );
}

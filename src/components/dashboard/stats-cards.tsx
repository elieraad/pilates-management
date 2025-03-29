import { BarChart2, Calendar, DollarSign, Users } from "lucide-react";
import StatsCard from "./stats-card";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { computeBookingsWithSessionDate } from "@/lib/utils/bookings";

export default async function StatsCards() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Get the current user's session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  // Get studio data
  //   const { data: studio } = await supabase
  //     .from("studios")
  //     .select("*")
  //     .eq("id", session.user.id)
  //     .single();

  // Get current date for filtering today's classes
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);


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

  // Get dashboard stats
  const { data: totalBookingsData } = await supabase
    .from("bookings")
    .select("id", { count: "exact" })
    .eq("studio_id", session.user.id);

  const { data: activeClientsData } = await supabase
    .from("bookings")
    .select("client_email", { count: "exact", head: true })
    .eq("studio_id", session.user.id)
    .eq("status", "confirmed")
    .gte(
      "class_session.start_time",
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    );

  const { data: revenueData } = await supabase
    .from("bookings")
    .select("amount")
    .eq("studio_id", session.user.id)
    .eq("payment_status", "paid")
    .gte(
      "created_at",
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    );

  const revenue =
    revenueData?.reduce(
      (sum, booking) => sum + parseFloat(booking.amount),
      0
    ) || 0;

  // Calculate occupancy rate
  const { data: bookedSeats } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("studio_id", session.user.id)
    .eq("status", "confirmed")
    .gte(
      "class_session.start_time",
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    );

  const { data: totalCapacity } = await supabase
    .from("class_sessions")
    .select(
      `
          id,
          class:class_id (
            capacity
          )
        `
    )
    .eq("studio_id", session.user.id)
    .gte(
      "start_time",
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    );

  const totalCapacityCount =
    totalCapacity?.reduce((sum, session) => sum + session.class.capacity, 0) ||
    0;
  const occupancyRate =
    totalCapacityCount > 0
      ? Math.round(((bookedSeats?.length || 0) / totalCapacityCount) * 100)
      : 0;

  // Prepare the stats for display
  const stats = {
    totalBookings: totalBookingsData?.length || 0,
    activeClients: activeClientsData?.length || 0,
    revenue: `${revenue.toFixed(2)}`,
    occupancyRate: `${occupancyRate}%`,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatsCard
        title="Total Bookings"
        value={stats.totalBookings}
        icon={Calendar}
      />
      <StatsCard
        title="Active Clients"
        value={stats.activeClients}
        icon={Users}
      />
      <StatsCard
        title="Monthly Revenue"
        value={stats.revenue}
        icon={DollarSign}
      />
      <StatsCard
        title="Occupancy Rate"
        value={stats.occupancyRate}
        icon={BarChart2}
      />
    </div>
  );
}

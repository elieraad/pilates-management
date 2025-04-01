import { BarChart2, Calendar, DollarSign, Users } from "lucide-react";
import StatsCard from "./stats-card";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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

  // Get current date for filtering
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Define the common studio_id filter used across all queries
  const studioFilter = session.user.id;

  // Execute all database queries in parallel
  const [bookingsResult, classSessionsResult, clientsResult, financialResult] =
    await Promise.all([
      // Query 1: Get booking stats (total, confirmed, cancelled)
      supabase.rpc("get_booking_stats", {
        studio_id_param: studioFilter,
        date_from_param: firstDayOfMonth.toISOString(),
      }),

      // Query 2: Get all class sessions with capacity data
      supabase
        .from("class_sessions")
        .select(
          `
        id,
        class:class_id (
          capacity
        ),
        bookings!inner (
          id,
          status
        )
      `
        )
        .eq("studio_id", studioFilter)
        .gte("start_time", firstDayOfMonth.toISOString()),

      // Query 3: Get unique client count for the month
      supabase
        .from("bookings")
        .select("client_email", { count: "exact", head: true })
        .eq("studio_id", studioFilter)
        .gte("created_at", firstDayOfMonth.toISOString()),

      // Query 4: Get financial data for the month
      supabase
        .from("bookings")
        .select("amount, payment_status")
        .eq("studio_id", studioFilter)
        .eq("payment_status", "paid")
        .gte("created_at", firstDayOfMonth.toISOString()),
    ]);

  // Extract and compute statistics
  const bookingStats = bookingsResult.data || {
    total_count: 0,
    confirmed_count: 0,
  };
  const activeClientsCount = clientsResult.count || 0;

  // Calculate revenue from all paid bookings
  const revenue = (financialResult.data || []).reduce(
    (sum, booking) => sum + parseFloat(booking.amount),
    0
  );

  // Calculate occupancy rate more efficiently
  let bookedSeats = 0;
  let totalCapacity = 0;

  if (classSessionsResult.data) {
    for (const session of classSessionsResult.data) {
      const sessionCapacity =
        (session.class as unknown as { capacity: number }).capacity || 0;

      totalCapacity += sessionCapacity;

      const confirmedBookings = session.bookings.filter(
        (booking) => booking.status === "confirmed"
      ).length;

      bookedSeats += confirmedBookings;
    }
  }

  const occupancyRate =
    totalCapacity > 0 ? Math.round((bookedSeats / totalCapacity) * 100) : 0;

  const stats = {
    totalBookings: bookingStats.total_count || 0,
    activeClients: activeClientsCount,
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

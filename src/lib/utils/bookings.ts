import { cookies } from "next/headers";
import { createClient } from "../supabase/server";

export async function computeBookingsWithSessionDate(
  bookings: {
    class_session_id: string;
    session_date: string;
    class_session: { start_time: string };
  }[]
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Extract all the session IDs from bookings
  const sessionIds = [...new Set(bookings.map((b) => b.class_session_id))];

  // Get all exceptions for these sessions
  const { data: exceptions } = await supabase
    .from("session_exceptions")
    .select("*")
    .in("recurring_session_id", sessionIds);

  // Add exception info to the bookings
  bookings.forEach((booking) => {
    // Find matching exception for this booking's date (if any)
    const bookingDateStr = new Date(booking.session_date)
      .toISOString()
      .split("T")[0];

    // Find matching exception for this booking's date (if any)
    const exception = (exceptions || []).find((e) => {
      const exceptionDateStr = new Date(e.original_date)
        .toISOString()
        .split("T")[0];
      return (
        e.recurring_session_id === booking.class_session_id &&
        exceptionDateStr === bookingDateStr
      );
    });

    const sessionDate = new Date(booking.session_date);
    let modifiedDate = new Date(booking.class_session.start_time);

    if (
      exception &&
      exception.exception_type === "modified" &&
      exception.modified_start_time
    ) {
      // Set the correct time to the booking's session_date
      // This is important for client-side time display
      modifiedDate = new Date(exception.modified_start_time);
    }

    // Update the booking's session_date with the correct time
    sessionDate.setHours(
      modifiedDate.getHours(),
      modifiedDate.getMinutes(),
      modifiedDate.getSeconds(),
      modifiedDate.getMilliseconds()
    );

    booking.session_date = sessionDate.toISOString();
  });
}

export async function getBookingCount(sessionId: string, sessionDate: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: sessionBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, created_at")
    .eq("class_session_id", sessionId)
    .eq("session_date", sessionDate)
    .neq("status", "cancelled");

  if (bookingsError) {
    throw new Error(bookingsError.message);
  }

  return sessionBookings.length;
}

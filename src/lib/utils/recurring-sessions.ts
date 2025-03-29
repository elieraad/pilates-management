import { cookies } from "next/headers";
import { getBookingCount } from "./bookings";
import { createClient } from "../supabase/server";

export function generateOccurrences(
  startDateTime: Date,
  rangeStart: Date,
  rangeEnd: Date,
  pattern: string,
  customOptions: any
): Date[] {
  const occurrences: Date[] = [];

  // For standard patterns
  if (pattern !== "custom") {
    let current = new Date(startDateTime);

    // If start date is before the range, advance to first occurrence in range
    while (current < rangeStart) {
      const next = new Date(current);

      switch (pattern) {
        case "daily":
          next.setDate(next.getDate() + 1);
          break;
        case "weekly":
          next.setDate(next.getDate() + 7);
          break;
        case "biweekly":
          next.setDate(next.getDate() + 14);
          break;
        case "monthly":
          next.setMonth(next.getMonth() + 1);
          break;
      }

      current = next;
    }

    // Generate remaining occurrences in the range
    while (current <= rangeEnd) {
      occurrences.push(new Date(current));

      const next = new Date(current);
      switch (pattern) {
        case "daily":
          next.setDate(next.getDate() + 1);
          break;
        case "weekly":
          next.setDate(next.getDate() + 7);
          break;
        case "biweekly":
          next.setDate(next.getDate() + 14);
          break;
        case "monthly":
          next.setMonth(next.getMonth() + 1);
          break;
      }

      if (next > rangeEnd) break;
      current = next;
    }
  }
  // For custom pattern (specific days of week)
  else if (
    customOptions &&
    customOptions.daysOfWeek &&
    customOptions.daysOfWeek.length > 0
  ) {
    const daysOfWeek = customOptions.daysOfWeek;

    // Start from the range start date
    let current = new Date(rangeStart);
    current.setHours(0, 0, 0, 0);

    // Check each day in the range
    while (current <= rangeEnd) {
      const dayOfWeek = current.getDay();

      // If this day of week is in our pattern
      if (daysOfWeek.includes(dayOfWeek)) {
        // Create a date with the time from the original session
        const occurrence = new Date(current);
        occurrence.setHours(
          startDateTime.getHours(),
          startDateTime.getMinutes(),
          startDateTime.getSeconds(),
          startDateTime.getMilliseconds()
        );

        occurrences.push(occurrence);
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
    }
  }

  return occurrences;
}
export async function getSessions(
  studioId: string,
  startDate: string,
  endDate: string,
  classId?: string
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Step 1: Fetch all recurring sessions in a single query
  let recurringQuery = supabase
    .from("class_sessions")
    .select(`*, class:class_id (*)`)
    .eq("studio_id", studioId)
    .eq("is_recurring", true)
    .eq("is_cancelled", false);

  if (classId) {
    recurringQuery = recurringQuery.eq("class_id", classId);
  }

  // Step 2: Fetch one-time sessions in a single query
  let oneTimeQuery = supabase
    .from("class_sessions")
    .select(`*, class:class_id (*)`)
    .eq("studio_id", studioId)
    .eq("is_recurring", false)
    .eq("is_cancelled", false)
    .gte("start_time", startDate)
    .lte("start_time", endDate);

  if (classId) {
    oneTimeQuery = oneTimeQuery.eq("class_id", classId);
  }

  // Step 3: Fetch all exceptions in a single query
  const exceptionsQuery = supabase
    .from("session_exceptions")
    .select("*")
    .eq("studio_id", studioId)
    .gte("original_date", startDate)
    .lte("original_date", endDate);

  // Run all queries in parallel
  let [
    { data: recurringSessions = [] },
    { data: oneTimeSessions = [] },
    { data: exceptions = [] },
  ] = await Promise.all([recurringQuery, oneTimeQuery, exceptionsQuery]);

  recurringSessions = recurringSessions || [];
  oneTimeSessions = oneTimeSessions || [];
  exceptions = exceptions || [];

  // Step 4: Prepare a list of all potential session dates we need to check
  const allSessionDates = [];
  const expandedSessions = [];

  // Generate all occurrences for recurring sessions
  for (const session of recurringSessions) {
    const occurrences = generateOccurrences(
      new Date(session.start_time),
      new Date(startDate),
      new Date(endDate),
      session.recurring_pattern,
      session.custom_recurrence
    );

    // Map exceptions for this session for quick lookup
    const sessionExceptions = exceptions
      .filter((e) => e.recurring_session_id === session.id)
      .reduce((map, exception) => {
        const dateStr = new Date(exception.original_date).toDateString();
        map[dateStr] = exception;
        return map;
      }, {});

    // Process each occurrence
    for (const date of occurrences) {
      const dateStr = date.toDateString();
      const exception = sessionExceptions[dateStr];

      if (exception) {
        if (exception.exception_type === "cancelled") {
          continue; // Skip cancelled occurrences
        } else if (exception.exception_type === "modified") {
          const sessionDate = exception.modified_start_time.split("T")[0];
          allSessionDates.push({ sessionId: session.id, date: sessionDate });

          expandedSessions.push({
            ...session,
            start_time: exception.modified_start_time,
            original_date: exception.original_date,
            is_exception: true,
            bookings_count: 0, // We'll fill this later
          });
        }
      } else {
        // Regular occurrence
        const originalDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          new Date(session.start_time).getHours(),
          new Date(session.start_time).getMinutes()
        ).toISOString();

        const sessionDate = originalDate.split("T")[0];
        allSessionDates.push({ sessionId: session.id, date: sessionDate });

        expandedSessions.push({
          ...session,
          start_time: originalDate,
          original_date: originalDate,
          bookings_count: 0, // We'll fill this later
        });
      }
    }
  }

  // Add one-time sessions to our processing list
  for (const session of oneTimeSessions) {
    const sessionDate = session.start_time.split("T")[0];
    allSessionDates.push({ sessionId: session.id, date: sessionDate });

    session.original_date = session.start_time;
    session.bookings_count = 0; // We'll fill this later
  }

  // Step 5: Batch fetch all bookings in a single query
  if (allSessionDates.length > 0) {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("class_session_id, session_date, status")
      .eq("studio_id", studioId)
      .neq("status", "cancelled")
      .in("class_session_id", [
        ...new Set(allSessionDates.map((item) => item.sessionId)),
      ])
      .in("session_date", [
        ...new Set(allSessionDates.map((item) => item.date)),
      ]);

    // Count bookings for each session
    if (bookings && bookings.length > 0) {
      // Create a map for quick lookup
      const bookingCounts = new Map();

      bookings.forEach((booking) => {
        const key = `${booking.class_session_id}_${booking.session_date}`;
        bookingCounts.set(key, bookingCounts.get(key) || 0 + 1);
      });

      // Apply counts to expanded sessions
      expandedSessions.forEach((session) => {
        const sessionDate = session.start_time.split("T")[0];
        const key = `${session.id}_${sessionDate}`;
        session.bookings_count = bookingCounts.get(key) || 0;
      });

      // Apply counts to one-time sessions
      oneTimeSessions.forEach((session) => {
        const sessionDate = session.start_time.split("T")[0];
        const key = `${session.id}_${sessionDate}`;
        session.bookings_count = bookingCounts.get(key) || 0;
      });
    }
  }

  // Combine one-time sessions with expanded recurring sessions
  return [...oneTimeSessions, ...expandedSessions];
}

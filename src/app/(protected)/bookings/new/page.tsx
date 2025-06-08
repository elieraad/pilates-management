import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookingCreationForm from "@/components/bookings/booking-creation-form";
import { getBookingCount } from "@/lib/utils/bookings";

export const metadata = {
  title: "Create Booking | Fitness Studio Management",
  description: "Create a new booking for a class session",
};

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: {
    sessionId?: string;
    sessionDate?: string;
    time?: string;
  };
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!searchParams.sessionId) {
    redirect("/bookings");
  }
  // Direct session ID (non-recurring session)
  const { data, error } = await supabase
    .from("class_sessions")
    .select(
      `
        *,
        class:class_id (*)
      `
    )
    .eq("id", searchParams.sessionId)
    .eq("studio_id", user.id)
    .eq("is_cancelled", false)
    .single();

  if (error || !data) {
    redirect("/bookings");
  }

  const sessionData = {
    ...data,
    start_time: data.start_time,
    bookings_count: 0,
    is_exception: false,
  };
  const classData = data.class;

  // Check current bookings count if session is provided
  const currentBookings = await getBookingCount(
    searchParams.sessionId,
    searchParams.sessionDate as string
  );

  return (
    <div>
      <h1 className="text-2xl font-serif text-olive-900">Create Booking</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <BookingCreationForm
          preselectedSessionId={searchParams.sessionId}
          sessionData={sessionData}
          classData={classData}
          currentBookings={currentBookings}
          sessionDate={searchParams.sessionDate as string}
          time={searchParams.time as string}
        />
      </div>
    </div>
  );
}

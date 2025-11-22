import BookingList from "@/app/(protected)/bookings/booking-list";

export const metadata = {
  title: "Bookings | Fitness Studio Management",
  description: "Manage class bookings and clients",
};

export default function BookingsPage() {
  return <BookingList />;
}

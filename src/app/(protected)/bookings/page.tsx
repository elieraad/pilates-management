import BookingList from "@/components/bookings/booking-list";

export const metadata = {
  title: "Bookings | Pilates Studio Management",
  description: "Manage class bookings and clients",
};

export default function BookingsPage() {
  return (
    <div>
      <BookingList />
    </div>
  );
}

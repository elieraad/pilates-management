"use client";

import { useRouter } from "next/navigation";
import { Table, TableRow, TableCell } from "../ui/table";
import { BookingSession } from "@/types/booking.types";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils/date-utils";

type RecentBookingsProps = {
  bookings: BookingSession[];
};

const RecentBookings = ({ bookings }: RecentBookingsProps) => {
  const router = useRouter();

  const renderBookingStatus = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="flex items-center text-green-600">
            <CheckCircle size={14} className="mr-1" />
            Confirmed
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center text-amber-600">
            <Clock size={14} className="mr-1" />
            Pending
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center text-red-600">
            <XCircle size={14} className="mr-1" />
            Cancelled
          </span>
        );
      default:
        return status;
    }
  };

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center p-6 bg-white rounded-lg">
        <p className="text-gray-600">No recent bookings.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-serif text-olive-900">Recent Bookings</h2>
        <button
          className="text-olive-600 text-sm font-medium flex items-center"
          onClick={() => router.push("/bookings")}
        >
          View All Bookings
        </button>
      </div>

      <Table headers={["Client", "Class", "Date & Time", "Status"]}>
        {bookings.slice(0, 3).map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-medium">{booking.client.name}</TableCell>
            <TableCell className="text-gray-600">
              {booking.class_session.class.name}
            </TableCell>
            <TableCell className="text-gray-600">
              {formatDateTime(booking.session_date)}
            </TableCell>
            <TableCell>{renderBookingStatus(booking.status)}</TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
};

export default RecentBookings;

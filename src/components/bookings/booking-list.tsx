"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookings } from "@/lib/hooks/use-bookings";
import { useClasses } from "@/lib/hooks/use-classes";
import { BookingStatus, BookingSession } from "@/types/booking.types";
import { Table, TableRow, TableCell } from "../ui/table";
import {
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Edit,
  Trash2,
  Filter,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils/date-utils";
import Button from "../ui/button";
import Modal from "../ui/modal";
import Select from "../ui/select";
import BookingForm from "./booking-form";
import { DatePicker } from "../ui/date-picker";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import QRScanner from "./qr-code-scanner";

const BookingList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingSession | null>(
    null
  );
  const [confirmCancelModal, setConfirmCancelModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Date handling for pagination
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const storedDate = localStorage.getItem("selectedBookingDate");

    if (storedDate) {
      const parsedDate = new Date(storedDate);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    return new Date();
  });

  useEffect(
    () =>
      localStorage.setItem("selectedBookingDate", selectedDate.toISOString()),
    [selectedDate]
  );

  // Filter states (for local filtering)
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [paymentFilter, setPaymentFilter] = useState("");

  // Format date for display and input
  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dateInputValue = selectedDate.toISOString().split("T")[0];

  // Get the date range for the selected day
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const { useBookingsQuery, useCancelBookingMutation, useBookingQuery } =
    useBookings();
  const { useClassesQuery } = useClasses();

  // Get booking ID from URL if present
  const bookingIdFromUrl = searchParams.get("id");

  // Fetch specific booking if ID is in URL
  const { data: bookingFromUrl, isLoading: isLoadingBookingFromUrl } =
    useBookingQuery(bookingIdFromUrl || "");

  // Auto-open edit modal when booking is loaded from URL
  useEffect(() => {
    if (bookingFromUrl && !showEditBookingModal) {
      setSelectedBooking(bookingFromUrl);
      setShowEditBookingModal(true);
    }
  }, [bookingFromUrl]);

  // Close modal and clear URL parameter
  const handleCloseEditModal = () => {
    setShowEditBookingModal(false);
    setSelectedBooking(null);
    if (bookingIdFromUrl) {
      router.push("/bookings");
    }
  };

  // Handle QR code scan
  const handleQRScan = (bookingId: string) => {
    // Close the scanner
    closeScanner();

    // Navigate to the booking with the ID parameter
    router.push(`/bookings?id=${bookingId}`);
  };

  // In your parent component where you conditionally render QRCodeScanner
  const closeScanner = () => {
    // Stop all streams before unmounting
    document.querySelectorAll("video").forEach((video) => {
      const stream = video.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      }
    });

    // Then hide the scanner
    setShowQRScanner(false);
  };

  // Fetch all bookings for the day
  const { data: bookings, isLoading: isLoadingBookings } = useBookingsQuery(
    undefined, // No server-side status filter
    startOfDay.toISOString(),
    endOfDay.toISOString(),
    undefined // No server-side class filter
  );

  // Fetch classes for the filter dropdown
  const { data: classes } = useClassesQuery();

  const cancelBooking = useCancelBookingMutation();

  function statusMatch(booking: BookingSession, statusFilter: BookingStatus) {
    switch (statusFilter) {
      case "confirmed":
        return (
          !booking.class_session.is_cancelled && booking.status === statusFilter
        );

      case "pending":
        return (
          !booking.class_session.is_cancelled && booking.status === statusFilter
        );
      case "cancelled":
        return (
          booking.class_session.is_cancelled || booking.status === statusFilter
        );
    }
  }

  // Apply local filtering
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    return bookings.filter((booking) => {
      // Search term filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          booking.client.name.toLowerCase().includes(searchLower) ||
          booking.client.email.toLowerCase().includes(searchLower) ||
          booking.class_session.class.name.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Class filter
      if (classFilter && booking.class_session.class_id !== classFilter) {
        return false;
      }

      // Status filter
      if (statusFilter && !statusMatch(booking, statusFilter)) {
        return false;
      }

      // Payment filter
      if (paymentFilter && booking.payment_status !== paymentFilter) {
        return false;
      }

      return true;
    });
  }, [bookings, searchTerm, classFilter, statusFilter, paymentFilter]);

  const handleEditBooking = (booking: BookingSession) => {
    setSelectedBooking(booking);
    setShowEditBookingModal(true);
  };

  const handleCancelBooking = (booking: BookingSession) => {
    setSelectedBooking(booking);
    setConfirmCancelModal(true);
  };

  const confirmCancelBooking = async () => {
    if (selectedBooking) {
      await cancelBooking.mutateAsync(selectedBooking.id);
      setConfirmCancelModal(false);
      setSelectedBooking(null);
    }
  };

  const renderBookingStatus = (booking: BookingSession) => {
    // Check for canceled class session
    if (booking.class_session.is_cancelled) {
      return (
        <span className="flex items-center text-red-600">
          <XCircle size={14} className="mr-1" />
          Session Cancelled
        </span>
      );
    }

    // Check booking status
    switch (booking.status) {
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
        return booking.status;
    }
  };

  const clearFilters = () => {
    setClassFilter("");
    setStatusFilter("");
    setPaymentFilter("");
  };

  const isFiltered =
    classFilter !== "" || statusFilter !== "" || paymentFilter !== "";

  return (
    <div>
      {isLoadingBookingFromUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600 mx-auto mb-4"></div>
            <p className="text-gray-700">Loading booking...</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif text-olive-900">Bookings</h2>
        <Button
          variant="primary"
          size="sm"
          icon={QrCode}
          onClick={() => setShowQRScanner(true)}
          className="shadow-md hover:shadow-lg transition-shadow"
        >
          <span className="hidden sm:inline">Scan QR Code</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <DatePicker
          date={dateInputValue}
          setSelectedDate={(x) => setSelectedDate(x)}
        ></DatePicker>
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center mb-4 gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search bookings..."
                className="w-full p-2 pl-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                size={16}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>

            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={Filter}
              className={isFiltered ? "border-olive-600 bg-olive-50" : ""}
            >
              {showFilters ? "Hide Filters" : "Filters"}
              {isFiltered && (
                <span className="ml-1 bg-olive-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {(classFilter ? 1 : 0) +
                    (statusFilter ? 1 : 0) +
                    (paymentFilter ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>

          {isFiltered && !showFilters && (
            <div className="mb-4 py-2 px-3 bg-olive-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center text-sm text-olive-700">
                <AlertCircle size={16} className="mr-2" />
                <span>
                  Filters applied: {classFilter && "Class"}{" "}
                  {statusFilter && (classFilter ? " • Status" : "Status")}{" "}
                  {paymentFilter &&
                    (classFilter || statusFilter ? " • Payment" : "Payment")}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}

          {showFilters && (
            <div className="bg-olive-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Filter by Class"
                  options={[
                    { value: "", label: "All Classes" },
                    ...(classes || []).map((cls) => ({
                      value: cls.id,
                      label: cls.name,
                    })),
                  ]}
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                />

                <Select
                  label="Filter by Status"
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "confirmed", label: "Confirmed" },
                    { value: "pending", label: "Pending" },
                    { value: "cancelled", label: "Cancelled" },
                  ]}
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as BookingStatus)
                  }
                />

                <Select
                  label="Filter by Payment"
                  options={[
                    { value: "", label: "All Payments" },
                    { value: "paid", label: "Paid" },
                    { value: "unpaid", label: "Unpaid" },
                    { value: "refunded", label: "Refunded" },
                  ]}
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                />
              </div>

              {isFiltered && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          )}

          {isLoadingBookings ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading bookings...</p>
            </div>
          ) : filteredBookings && filteredBookings.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-3">
                Showing {filteredBookings.length}{" "}
                {filteredBookings.length === 1 ? "booking" : "bookings"}
                {isFiltered ? " with current filters" : ""}
              </p>
              <Table
                headers={[
                  "Client",
                  "Contact",
                  "Class",
                  "Date & Time",
                  "Status",
                  "Payment",
                  "Actions",
                ]}
              >
                {filteredBookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className={`hover:bg-olive-50 ${
                      booking.status === "cancelled" ||
                      booking.class_session.is_cancelled
                        ? "bg-gray-50 text-gray-500"
                        : ""
                    }`}
                  >
                    <TableCell className="font-medium">
                      {booking.client.name}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      <div>{booking.client.email}</div>
                      {booking.client.phone && (
                        <Link
                          className="flex horizontal items-center gap-1 font-medium"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`https://wa.me/${booking.client.phone}`}
                        >
                          <div>{booking.client.phone}</div>
                          <MessageCircle color="lightgreen" size={16} />
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {booking.class_session.class.name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      <div>{formatDate(booking.session_date)}</div>
                      <div>{formatTime(booking.session_date)}</div>
                    </TableCell>
                    <TableCell>{renderBookingStatus(booking)}</TableCell>
                    <TableCell>
                      <span
                        className={`text-sm font-medium ${
                          booking.payment_status === "paid"
                            ? "text-green-600"
                            : booking.payment_status === "unpaid"
                            ? "text-amber-600"
                            : "text-gray-500"
                        }`}
                      >
                        {booking.payment_status.charAt(0).toUpperCase() +
                          booking.payment_status.slice(1)}{" "}
                        (${booking.amount})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit}
                          onClick={() => handleEditBooking(booking)}
                          disabled={booking.class_session.is_cancelled}
                        >
                          Edit
                        </Button>
                        {booking.status !== "cancelled" &&
                          !booking.class_session.is_cancelled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              icon={Trash2}
                              onClick={() => handleCancelBooking(booking)}
                            >
                              Cancel
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {isFiltered
                  ? "No bookings found with the current filters"
                  : `No bookings found for ${formattedDate}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner */}
      {showQRScanner && (
        <Modal
          title="Scan Booking QR Code"
          isOpen={showQRScanner}
          onClose={() => closeScanner()}
        >
          <QRScanner onScanSuccess={handleQRScan} />
        </Modal>
      )}

      {/* Edit Booking Modal */}
      <Modal
        isOpen={showEditBookingModal}
        onClose={handleCloseEditModal}
        title="Edit Booking"
      >
        {selectedBooking && (
          <BookingForm
            initialData={selectedBooking}
            onSuccess={handleCloseEditModal}
            onCancel={handleCloseEditModal}
          />
        )}
      </Modal>

      {/* Confirm Cancel Modal */}
      <Modal
        isOpen={confirmCancelModal}
        onClose={() => setConfirmCancelModal(false)}
        title="Cancel Booking"
      >
        <p className="mb-4">
          Are you sure you want to cancel this booking for{" "}
          {selectedBooking?.client.name}?
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setConfirmCancelModal(false)}
            disabled={cancelBooking.isPending}
          >
            No, Keep It
          </Button>
          <Button
            variant="danger"
            isLoading={cancelBooking.isPending}
            onClick={confirmCancelBooking}
          >
            Yes, Cancel Booking
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default BookingList;

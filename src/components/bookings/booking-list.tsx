"use client";

import { useState, useEffect, useMemo } from "react";
import { useBookings } from "@/lib/hooks/use-bookings";
import { useClasses } from "@/lib/hooks/use-classes";
import { BookingStatus, BookingWithClient } from "@/types/booking.types";
import { Table, TableRow, TableCell } from "../ui/table";
import {
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  AlertCircle,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils/date-utils";
import Button from "../ui/button";
import Modal from "../ui/modal";
import Select from "../ui/select";
import BookingForm from "./booking-form";

const BookingList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithClient | null>(null);
  const [confirmCancelModal, setConfirmCancelModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Filter states (for local filtering)
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [paymentFilter, setPaymentFilter] = useState("");

  // Navigation functions for date pagination
  const goToPreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate);
  };

  const goToNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
    setDatePickerOpen(false);
  };

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

  const { useBookingsQuery, useCancelBookingMutation } = useBookings();
  const { useClassesQuery } = useClasses();

  // Fetch all bookings for the day
  const { data: bookings, isLoading: isLoadingBookings } = useBookingsQuery(
    undefined, // No server-side status filter
    startOfDay.toISOString(),
    endOfDay.toISOString(),
    undefined // No server-side class filter
  );

  // Fetch classes for the filter dropdown
  const { data: classes, isLoading: isLoadingClasses } = useClassesQuery();

  const cancelBooking = useCancelBookingMutation();

  function statusMatch(
    booking: BookingWithClient,
    statusFilter: BookingStatus
  ) {
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
          booking.client_name.toLowerCase().includes(searchLower) ||
          booking.client_email.toLowerCase().includes(searchLower) ||
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

  const handleEditBooking = (booking: BookingWithClient) => {
    setSelectedBooking(booking);
    setShowEditBookingModal(true);
  };

  const handleCancelBooking = (booking: BookingWithClient) => {
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

  const renderBookingStatus = (booking: BookingWithClient) => {
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif text-olive-900">Bookings</h2>
      </div>

      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-olive-50 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={goToPreviousDay}
            icon={ChevronLeft}
            size="sm"
          >
            Previous Day
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setDatePickerOpen(!datePickerOpen)}
              className="font-medium"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {formattedDate}
            </Button>

            {datePickerOpen && (
              <div className="absolute top-full mt-1 bg-white shadow-md rounded-md p-2 z-10">
                <input
                  type="date"
                  value={dateInputValue}
                  onChange={handleDateChange}
                  className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-olive-200"
                />
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <Button variant="secondary" size="sm" onClick={goToToday}>
              Today
            </Button>

            <Button
              variant="ghost"
              onClick={goToNextDay}
              icon={ChevronRight}
              size="sm"
            >
              Next Day
            </Button>
          </div>
        </div>

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
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                      {booking.client_name}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      <div>{booking.client_email}</div>
                      <div>{booking.client_phone || ""}</div>
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

      {/* Edit Booking Modal */}
      <Modal
        isOpen={showEditBookingModal}
        onClose={() => setShowEditBookingModal(false)}
        title="Edit Booking"
      >
        {selectedBooking && (
          <BookingForm
            initialData={selectedBooking}
            onSuccess={() => {
              setShowEditBookingModal(false);
              setSelectedBooking(null);
            }}
            onCancel={() => {
              setShowEditBookingModal(false);
              setSelectedBooking(null);
            }}
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
          {selectedBooking?.client_name}?
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

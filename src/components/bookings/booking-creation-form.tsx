"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBookings } from "@/lib/hooks/use-bookings";
import { useClasses } from "@/lib/hooks/use-classes";
import { Class } from "@/types/class.types";
import Input from "../ui/input";
import Select from "../ui/select";
import Button from "../ui/button";
import { formatDate } from "@/lib/utils/date-utils";
import { useToast } from "@/components/ui/toast";

type BookingCreationFormProps = {
  preselectedSessionId: string;
  classData?: Class;
  currentBookings?: number;
  sessionDate: string;
  time: string;
};

const BookingCreationForm = ({
  preselectedSessionId,
  classData,
  currentBookings = 0,
  sessionDate,
  time,
}: BookingCreationFormProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const { useCreateBookingMutation } = useBookings();
  const { useClassesQuery } = useClasses();

  const createBooking = useCreateBookingMutation();
  const allClasses = useClassesQuery();

  const [formData, setFormData] = useState({
    class_id: classData?.id || "",
    class_session_id: preselectedSessionId || "",
    client_name: "",
    client_email: "",
    client_phone: "",
    status: "confirmed",
    payment_status: "paid",
    amount: classData?.price || 0,
    // For recurring sessions
    sessionDate: sessionDate || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFull, setIsFull] = useState(false);

  // Update amount when class or session changes
  useEffect(() => {
    if (formData.class_id && allClasses.data) {
      const selectedClass = allClasses.data.find(
        (c) => c.id === formData.class_id
      );
      if (selectedClass) {
        setFormData((prev) => ({
          ...prev,
          amount: selectedClass.price,
        }));
      }
    }
  }, [formData.class_id, allClasses.data]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.class_id) {
      newErrors.class_id = "Please select a class";
    }

    if (!formData.class_session_id) {
      newErrors.class_session_id = "Please select a session";
    }

    if (!formData.client_name.trim()) {
      newErrors.client_name = "Client name is required";
    }

    if (!formData.client_email.trim()) {
      newErrors.client_email = "Client email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.client_email)) {
      newErrors.client_email = "Please enter a valid email";
    }

    if (formData.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Get the session date from the form data or sessionData
      const sessionDate = formData.sessionDate;

      // Create booking data including the session date
      const bookingData = {
        class_session_id: formData.class_session_id,
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone || undefined,
        status: formData.status as "confirmed" | "pending" | "cancelled",
        payment_status: formData.payment_status as
          | "paid"
          | "unpaid"
          | "refunded",
        amount: Number(formData.amount),
        sessionDate: sessionDate, // Always include the session date
      };

      // Create new booking
      await createBooking.mutateAsync(bookingData);

      // Redirect to classes page
      router.push("/classes");
    } catch (e: unknown) {
      const error = e as Error;
      // Check for potential race condition error
      if (error.message?.includes("Class session is full")) {
        toast({
          title: "Error",
          description:
            "This session is now full. Please select another session.",
          type: "error",
        });
        setIsFull(true);
      } else if (error.message?.includes("Client already has a booking")) {
        toast({
          title: "Error",
          description: "This client already has a booking for this session.",
          type: "error",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create booking",
          type: "error",
        });
      }
    }
  };

  const isLoading = createBooking.isPending || allClasses.isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Session information if preselected */}
      {classData && (
        <div className="bg-olive-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-1">Class Details</h3>
          <p>
            <span className="font-medium">Class:</span> {classData.name}
          </p>
          <p>
            <span className="font-medium">Date & Time:</span>{" "}
            {formatDate(sessionDate) + ", " + time}
          </p>
          <p>
            <span className="font-medium">Instructor:</span>{" "}
            {classData.instructor}
          </p>
          <p>
            <span className="font-medium">Price:</span> $
            {classData.price}
          </p>
          <p>
            <span className="font-medium">Availability:</span>{" "}
            <span className={isFull ? "text-red-600 font-bold" : ""}>
              {currentBookings}/{classData.capacity} spots filled
            </span>
          </p>

          {isFull && (
            <div className="mt-2 bg-red-50 p-3 rounded border border-red-200 text-red-700">
              This session is full. Please select another session.
            </div>
          )}
        </div>
      )}

      {/* Client information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Client Name"
          name="client_name"
          placeholder="e.g. Jessica Miller"
          value={formData.client_name}
          onChange={handleChange}
          error={errors.client_name}
          required
        />

        <Input
          label="Client Email"
          name="client_email"
          type="email"
          placeholder="e.g. client@example.com"
          value={formData.client_email}
          onChange={handleChange}
          error={errors.client_email}
          required
        />
      </div>

      <Input
        label="Client Phone (optional)"
        name="client_phone"
        placeholder="e.g. (555) 123-4567"
        value={formData.client_phone}
        onChange={handleChange}
      />

      {/* Status and payment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Status"
          name="status"
          options={[
            { value: "confirmed", label: "Confirmed" },
            { value: "pending", label: "Pending" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          value={formData.status}
          onChange={handleChange}
        />

        <Select
          label="Payment Status"
          name="payment_status"
          options={[
            { value: "paid", label: "Paid" },
            { value: "unpaid", label: "Unpaid" },
            { value: "refunded", label: "Refunded" },
          ]}
          value={formData.payment_status}
          onChange={handleChange}
        />

        <Input
          label="Amount ($)"
          name="amount"
          type="number"
          step="0.01"
          placeholder="e.g. 25.00"
          value={formData.amount}
          onChange={handleChange}
          error={errors.amount}
          required
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading} disabled={isFull}>
          Create Booking
        </Button>
      </div>
    </form>
  );
};

export default BookingCreationForm;

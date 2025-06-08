"use client";

import { useState, useEffect } from "react";
import { useBookings } from "@/lib/hooks/use-bookings";
import { useClasses } from "@/lib/hooks/use-classes";
import { Class } from "@/types/class.types";
import { BookingSession } from "@/types/booking.types";
import Input from "../ui/input";
import Select from "../ui/select";
import Button from "../ui/button";

type BookingFormProps = {
  initialData: BookingSession;
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedClassId?: string;
  preselectedSessionId?: string;
};

const BookingForm = ({
  initialData,
  onSuccess,
  onCancel,
  preselectedClassId,
  preselectedSessionId,
}: BookingFormProps) => {
  const { useCreateBookingMutation, useUpdateBookingMutation } = useBookings();
  const { useClassesQuery } = useClasses();

  const classes = useClassesQuery();
  const createBooking = useCreateBookingMutation();
  const updateBooking = useUpdateBookingMutation();

  const [formData, setFormData] = useState({
    class_id: preselectedClassId || initialData?.class_session?.class_id || "",
    class_session_id:
      preselectedSessionId || initialData?.class_session_id || "",
    client_name: initialData?.client.name || "",
    client_email: initialData?.client.email || "",
    client_phone: initialData?.client.phone || "",
    status: initialData?.status || "confirmed",
    payment_status: initialData?.payment_status || "paid",
    amount: initialData?.amount || 0,
  });

  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update selected class based on class ID
  useEffect(() => {
    if (formData.class_id && classes.data) {
      const selected = classes.data.find((c) => c.id === formData.class_id);
      setSelectedClass(selected || null);

      // Update amount when class changes
      if (selected && !initialData) {
        setFormData((prev) => ({
          ...prev,
          amount: selected.price,
        }));
      }
    }
  }, [formData.class_id, classes.data, initialData]);

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
      // Update existing booking
      await updateBooking.mutateAsync({
        id: initialData.id,
        data: {
          client: {
            name: formData.client_name,
            email: formData.client_email,
            phone: formData.client_phone,
          },
          status: formData.status as "confirmed" | "pending" | "cancelled",
          payment_status: formData.payment_status as
            | "paid"
            | "unpaid"
            | "refunded",
          amount: Number(formData.amount),
        },
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isLoading =
    createBooking.isPending || updateBooking.isPending || classes.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-olive-50 p-4 rounded-lg mb-4">
        <h3 className="font-medium mb-1">Class Details</h3>
        {selectedClass ? (
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Price:</span> ${selectedClass.price}
            </p>
            <p>
              <span className="font-medium">Duration:</span>{" "}
              {selectedClass.duration} minutes
            </p>
            <p>
              <span className="font-medium">Instructor:</span>{" "}
              {selectedClass.instructor}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Select a class to see details</p>
        )}
      </div>

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
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "Update Booking" : "Create Booking"}
        </Button>
      </div>
    </form>
  );
};

export default BookingForm;

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import {
  Booking,
  BookingSession,
  CreateBookingInput,
} from "@/types/booking.types";

export function useBookings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchBookings = async (
    status?: string,
    startDate?: string,
    endDate?: string,
    classId?: string
  ): Promise<BookingSession[]> => {
    let url = "/api/bookings";
    const params = new URLSearchParams();

    if (status) params.append("status", status);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (classId) params.append("classId", classId);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch bookings");
    }
    return response.json();
  };

  const fetchBooking = async (id: string): Promise<BookingSession> => {
    const response = await fetch(`/api/bookings/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch booking");
    }
    return response.json();
  };

  const createBooking = async (
    data: CreateBookingInput
  ): Promise<BookingSession> => {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create booking");
    }
    return response.json();
  };

  const updateBooking = async (
    id: string,
    data: Partial<Booking>
  ): Promise<BookingSession> => {
    const response = await fetch(`/api/bookings/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update booking");
    }
    return response.json();
  };

  const cancelBooking = async (id: string): Promise<void> => {
    const response = await fetch(`/api/bookings/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to cancel booking");
    }
  };

  // Query hooks
  const useBookingsQuery = (
    status?: string,
    startDate?: string,
    endDate?: string,
    classId?: string
  ) => {
    return useQuery({
      queryKey: ["bookings", status, startDate, endDate, classId],
      queryFn: () => fetchBookings(status, startDate, endDate, classId),
    });
  };

  const useBookingQuery = (id: string) => {
    return useQuery({
      queryKey: ["bookings", id],
      queryFn: () => fetchBooking(id),
      enabled: !!id,
    });
  };

  // Mutation hooks
  const useCreateBookingMutation = () => {
    return useMutation({
      mutationFn: createBooking,
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Booking created successfully",
          type: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
        queryClient.invalidateQueries({ queryKey: ["classSessions"] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create booking",
          type: "error",
        });
      },
    });
  };

  const useUpdateBookingMutation = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Booking> }) =>
        updateBooking(id, data),
      onSuccess: (_, variables) => {
        toast({
          title: "Success",
          description: "Booking updated successfully",
          type: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
        queryClient.invalidateQueries({ queryKey: ["bookings", variables.id] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update booking",
          type: "error",
        });
      },
    });
  };

  const useCancelBookingMutation = () => {
    return useMutation({
      mutationFn: cancelBooking,
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Booking cancelled successfully",
          type: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to cancel booking",
          type: "error",
        });
      },
    });
  };

  return {
    useBookingsQuery,
    useBookingQuery,
    useCreateBookingMutation,
    useUpdateBookingMutation,
    useCancelBookingMutation,
  };
}

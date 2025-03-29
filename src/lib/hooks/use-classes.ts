"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import {
  Class,
  ClassSession,
  CreateClassInput,
  CreateClassSessionInput,
} from "@/types/class.types";

export function useClasses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchClasses = async (): Promise<Class[]> => {
    const response = await fetch("/api/classes");
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch classes");
    }
    return response.json();
  };

  const fetchClass = async (id: string): Promise<Class> => {
    const response = await fetch(`/api/classes/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch class");
    }
    return response.json();
  };

  const fetchClassSessions = async (
    startDate?: string,
    endDate?: string,
    classId?: string
  ): Promise<ClassSession[]> => {
    // Build query parameters for date range
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (classId) params.append("classId", classId);

    const url = `/api/classes/sessions?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch class sessions");
    }

    return response.json();
  };

  const modifySessionOccurrence = async (
    recurringSessionId: string,
    originalDate: string,
    newStartTime: string
  ): Promise<void> => {
    const response = await fetch("/api/classes/sessions/exceptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recurring_session_id: recurringSessionId,
        original_date: originalDate,
        exception_type: "modified",
        modified_start_time: newStartTime,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to modify session occurrence");
    }

    return response.json();
  };

  const cancelSessionOccurrence = async (
    recurringSessionId: string,
    originalDate: string
  ): Promise<void> => {
    const response = await fetch("/api/classes/sessions/exceptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recurring_session_id: recurringSessionId,
        original_date: originalDate,
        exception_type: "cancelled",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete session occurrence");
    }

    return response.json();
  };

  const createClass = async (data: CreateClassInput): Promise<Class> => {
    const response = await fetch("/api/classes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create class");
    }
    return response.json();
  };

  const updateClass = async ({
    id,
    ...data
  }: CreateClassInput & { id: string }): Promise<Class> => {
    const response = await fetch(`/api/classes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update class");
    }
    return response.json();
  };

  const deleteClass = async (id: string): Promise<void> => {
    const response = await fetch(`/api/classes/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete class");
    }
  };

  const createClassSession = async (
    data: CreateClassSessionInput
  ): Promise<ClassSession> => {
    const response = await fetch("/api/classes/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create class session");
    }

    return response.json();
  };

  const updateClassSession = async (
    id: string,
    data: { is_cancelled?: boolean; start_time?: string; cancelAll?: boolean }
  ): Promise<ClassSession> => {
    const response = await fetch(`/api/classes/sessions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update class session");
    }
    return response.json();
  };

  // Query hooks
  const useClassesQuery = () => {
    return useQuery({
      queryKey: ["classes"],
      queryFn: fetchClasses,
    });
  };

  const useClassQuery = (id: string) => {
    return useQuery({
      queryKey: ["classes", id],
      queryFn: () => fetchClass(id),
      enabled: !!id,
    });
  };

  const useClassSessionsQuery = (
    startDate?: string,
    endDate?: string,
    classId?: string
  ) => {
    return useQuery({
      queryKey: ["class-sessions", startDate, endDate, classId],
      queryFn: () => fetchClassSessions(startDate, endDate, classId),
    });
  };

  // New mutation hook for modifying a single occurrence
  const useModifySessionOccurrenceMutation = () => {
    return useMutation({
      mutationFn: ({
        recurringSessionId,
        originalDate,
        newStartTime,
      }: {
        recurringSessionId: string;
        originalDate: string;
        newStartTime: string;
      }) =>
        modifySessionOccurrence(recurringSessionId, originalDate, newStartTime),
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Session occurrence modified successfully",
          type: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to modify session occurrence",
          type: "error",
        });
      },
    });
  };

  // New mutation hook for canceling a single occurrence
  const useCancelSessionOccurrenceMutation = () => {
    return useMutation({
      mutationFn: ({
        recurringSessionId,
        originalDate,
      }: {
        recurringSessionId: string;
        originalDate: string;
      }) => cancelSessionOccurrence(recurringSessionId, originalDate),
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Session occurrence deleted successfully",
          type: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to delete session occurrence",
          type: "error",
        });
      },
    });
  };

  // Mutation hooks
  const useCreateClassMutation = () => {
    return useMutation({
      mutationFn: createClass,
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Class created successfully",
          type: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["classes"] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create class",
          type: "error",
        });
      },
    });
  };

  const useUpdateClassMutation = () => {
    return useMutation({
      mutationFn: updateClass,
      onSuccess: (_, variables) => {
        toast({
          title: "Success",
          description: "Class updated successfully",
          type: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["classes"] });
        queryClient.invalidateQueries({ queryKey: ["classes", variables.id] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update class",
          type: "error",
        });
      },
    });
  };

  const useDeleteClassMutation = () => {
    return useMutation({
      mutationFn: deleteClass,
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Class deleted successfully",
          type: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["classes"] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to delete class",
          type: "error",
        });
      },
    });
  };

  const useCreateClassSessionMutation = () => {
    return useMutation({
      mutationFn: createClassSession,
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Class session(s) created successfully",
          type: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create class session",
          type: "error",
        });
      },
    });
  };

  const useUpdateClassSessionMutation = () => {
    return useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: string;
        data: {
          is_cancelled?: boolean;
          start_time?: string;
          cancelAll?: boolean;
        };
      }) => updateClassSession(id, data),
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Class session updated successfully",
          type: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update class session",
          type: "error",
        });
      },
    });
  };

  // Update an entire recurring session series
  const useUpdateSessionSeriesMutation = () =>
    useMutation({
      mutationFn: async ({
        sessionId,
        updateData,
      }: {
        sessionId: string;
        updateData: {
          start_time?: string;
          recurring_pattern?: string;
          custom_recurrence?: any;
        };
      }) => {
        const response = await fetch(`/api/classes/sessions/${sessionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });
        if (!response.ok) {
          throw new Error("Failed to update session series");
        }
        return response.json();
      },
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Session series updated successfully",
          type: "success",
        });
        queryClient.invalidateQueries({
          queryKey: ["class-sessions"],
          refetchType: "all",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update session series",
          type: "error",
        });
      },
    });

  // Delete an entire recurring session series
  const useDeleteSessionSeriesMutation = () =>
    useMutation({
      mutationFn: async (sessionId: string) => {
        const response = await fetch(`/api/classes/sessions/${sessionId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete session series");
        }
        return response.json();
      },
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Session series deleted successfully",
          type: "success",
        });
        queryClient.invalidateQueries({
          queryKey: ["class-sessions"],
          refetchType: "all",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to delete session series",
          type: "error",
        });
      },
    });

  return {
    useClassesQuery,
    useClassQuery,
    useClassSessionsQuery,
    useCreateClassMutation,
    useUpdateClassMutation,
    useDeleteClassMutation,
    useCreateClassSessionMutation,
    useUpdateClassSessionMutation,
    useModifySessionOccurrenceMutation,
    useCancelSessionOccurrenceMutation,
    useUpdateSessionSeriesMutation,
    useDeleteSessionSeriesMutation,
  };
}

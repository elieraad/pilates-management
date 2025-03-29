"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import { Studio, UpdateStudioInput } from "@/types/studio.types";
import { License, CreateLicenseInput } from "@/types/license.types";

export function useStudio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchStudioProfile = async (): Promise<Studio> => {
    const response = await fetch("/api/studio/profile");
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch studio profile");
    }
    return response.json();
  };

  const updateStudioProfile = async (
    data: UpdateStudioInput
  ): Promise<Studio> => {
    const response = await fetch("/api/studio/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update studio profile");
    }
    return response.json();
  };

  const fetchLicenses = async (): Promise<License[]> => {
    const response = await fetch("/api/license");
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch licenses");
    }
    return response.json();
  };

  const checkLicenseStatus = async (): Promise<{
    active: boolean;
    license?: { type: string; expiresAt: string };
  }> => {
    const response = await fetch("/api/license/check");
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to check license status");
    }
    return response.json();
  };

  const renewLicense = async (data: CreateLicenseInput): Promise<License> => {
    const response = await fetch("/api/license/renew", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to renew license");
    }
    return response.json();
  };

  // Query Hooks
  const useStudioProfileQuery = () => {
    return useQuery({
      queryKey: ["studioProfile"],
      queryFn: fetchStudioProfile,
    });
  };

  const useLicensesQuery = () => {
    return useQuery({
      queryKey: ["licenses"],
      queryFn: fetchLicenses,
    });
  };

  const useLicenseStatusQuery = () => {
    return useQuery({
      queryKey: ["licenseStatus"],
      queryFn: checkLicenseStatus,
    });
  };

  // Mutation Hooks
  const useUpdateStudioProfileMutation = () => {
    return useMutation({
      mutationFn: updateStudioProfile,
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Studio profile updated successfully",
          type: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["studioProfile"] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update studio profile",
          type: "error",
        });
      },
    });
  };

  const useRenewLicenseMutation = () => {
    return useMutation({
      mutationFn: renewLicense,
      onSuccess: () => {
        toast({
          title: "Success",
          description: "License renewed successfully",
          type: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["licenses"] });
        queryClient.invalidateQueries({ queryKey: ["licenseStatus"] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to renew license",
          type: "error",
        });
      },
    });
  };

  return {
    useStudioProfileQuery,
    useLicensesQuery,
    useLicenseStatusQuery,
    useUpdateStudioProfileMutation,
    useRenewLicenseMutation,
  };
}

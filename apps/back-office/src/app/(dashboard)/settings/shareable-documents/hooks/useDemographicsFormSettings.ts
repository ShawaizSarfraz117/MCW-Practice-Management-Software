import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@mcw/ui";
import type { DemographicsFormSettings } from "@mcw/types";

// Hook to manage demographics form settings
export function useDemographicsFormSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch demographics form settings
  const query = useQuery({
    queryKey: ["client-care-settings", "demographicsForm"],
    queryFn: async () => {
      const response = await fetch(
        "/api/client-care-settings?category=demographicsForm",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch demographics form settings");
      }
      const data = await response.json();
      return data.data as DemographicsFormSettings;
    },
  });

  // Update demographics form settings
  const mutation = useMutation({
    mutationFn: async (settings: Partial<DemographicsFormSettings>) => {
      const response = await fetch("/api/client-care-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "demographicsForm",
          settings,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update settings");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["client-care-settings", "demographicsForm"],
      });
      toast({
        title: "Success",
        description: "Demographics form settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateSettings: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

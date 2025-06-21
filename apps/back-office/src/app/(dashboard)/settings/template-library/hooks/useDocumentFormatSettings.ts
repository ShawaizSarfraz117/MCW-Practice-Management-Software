import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@mcw/ui";
import type { DocumentFormatSettings } from "@mcw/types";

// Hook to manage document format settings
export function useDocumentFormatSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch document format settings
  const query = useQuery({
    queryKey: ["client-care-settings", "documentFormat"],
    queryFn: async () => {
      const response = await fetch(
        "/api/client-care-settings?category=documentFormat",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch document format settings");
      }
      const data = await response.json();
      return data.data as DocumentFormatSettings;
    },
  });

  // Update document format settings
  const mutation = useMutation({
    mutationFn: async (settings: Partial<DocumentFormatSettings>) => {
      const response = await fetch("/api/client-care-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "documentFormat",
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
        queryKey: ["client-care-settings", "documentFormat"],
      });
      toast({
        title: "Success",
        description: "Document format settings updated successfully",
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

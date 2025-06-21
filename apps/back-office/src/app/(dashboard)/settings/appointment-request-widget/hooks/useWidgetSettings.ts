import { useQuery } from "@tanstack/react-query";
import { useToast } from "@mcw/ui";
import { useEffect } from "react";
import type { WidgetSettings } from "@mcw/types";

export function useWidgetSettings(): {
  settings: WidgetSettings | null;
  loading: boolean;
} {
  const { toast } = useToast();

  const {
    data: settings,
    isLoading: loading,
    error,
  } = useQuery<WidgetSettings>({
    queryKey: ["client-care-settings", "widget"],
    queryFn: async (): Promise<WidgetSettings> => {
      const response = await fetch("/api/client-care-settings?category=widget");

      if (!response.ok) {
        if (response.status === 404 || response.status === 500) {
          // Return default settings for 404/500 errors
          return {
            general: {
              widgetCode: null,
            },
          };
        }
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();
      // Ensure we have a complete settings structure
      return {
        general: {
          widgetCode: data.data?.general?.widgetCode ?? null,
        },
      };
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Handle errors with useEffect
  useEffect(() => {
    if (error) {
      console.error("Error fetching widget settings:", error);
      toast({
        title: "Error",
        description: "Failed to load widget settings",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return {
    settings: settings ?? null,
    loading,
  } as const;
}

import { useState, useEffect } from "react";
import { useToast } from "@mcw/ui";
import type { WidgetSettings } from "@mcw/types";

export function useWidgetSettings() {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/client-care-settings?category=widget");

      if (!response.ok) {
        if (response.status === 404 || response.status === 500) {
          // Initialize with default settings locally
          const defaultSettings: WidgetSettings = {
            general: {
              widgetCode: null,
            },
          };
          setSettings(defaultSettings);
          return;
        }
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();
      // Ensure we have a complete settings structure
      const completeSettings: WidgetSettings = {
        general: {
          widgetCode: data.data?.general?.widgetCode ?? null,
        },
      };
      setSettings(completeSettings);
    } catch (error) {
      console.error("Error fetching widget settings:", error);
      toast({
        title: "Error",
        description: "Failed to load widget settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
  };
}

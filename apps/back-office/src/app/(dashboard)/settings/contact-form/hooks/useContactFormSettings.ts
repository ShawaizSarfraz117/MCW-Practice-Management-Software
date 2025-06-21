import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@mcw/ui";
import type { ContactFormSettings } from "@mcw/types";

export function useContactFormSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State for staging changes
  const [stagedSettings, setStagedSettings] =
    useState<ContactFormSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings using React Query
  const {
    data: settings,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["client-care-settings", "contactForm"],
    queryFn: async (): Promise<ContactFormSettings> => {
      const response = await fetch(
        "/api/client-care-settings?category=contactForm",
      );

      if (!response.ok) {
        if (response.status === 404 || response.status === 500) {
          // Return default settings for 404/500 errors
          return {
            general: {
              isEnabled: false,
              link: null,
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
          isEnabled: data.data?.general?.isEnabled ?? false,
          link: data.data?.general?.link ?? null,
          widgetCode: data.data?.general?.widgetCode ?? null,
        },
      };
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    onError: (error) => {
      console.error("Error fetching contact form settings:", error);
      toast({
        title: "Error",
        description: "Failed to load contact form settings",
        variant: "destructive",
      });
    },
  });

  // Initialize staged settings when settings are loaded
  useEffect(() => {
    if (settings && !stagedSettings) {
      setStagedSettings(settings);
    }
  }, [settings, stagedSettings]);

  // Track changes whenever stagedSettings differs from settings
  useEffect(() => {
    if (settings && stagedSettings) {
      const detectChanges = (original: unknown, staged: unknown): boolean => {
        if (typeof original !== typeof staged) return true;

        if (original === null && staged === null) return false;
        if (original === undefined && staged === undefined) return false;

        if (original === null || staged === null) return true;
        if (original === undefined || staged === undefined) return true;

        if (typeof original === "object" && typeof staged === "object") {
          const originalObj = original as Record<string, unknown>;
          const stagedObj = staged as Record<string, unknown>;
          const originalKeys = Object.keys(originalObj);
          const stagedKeys = Object.keys(stagedObj);

          if (originalKeys.length !== stagedKeys.length) return true;

          for (const key of originalKeys) {
            if (detectChanges(originalObj[key], stagedObj[key])) return true;
          }

          return false;
        }

        return original !== staged;
      };

      const hasChanges = detectChanges(settings, stagedSettings);
      setHasChanges(hasChanges);
    } else {
      setHasChanges(false);
    }
  }, [settings, stagedSettings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (settingsToSave: ContactFormSettings) => {
      const response = await fetch("/api/client-care-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "contactForm",
          settings: settingsToSave,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update settings");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Update cached data
      queryClient.invalidateQueries({
        queryKey: ["client-care-settings", "contactForm"],
      });

      // Update local state with saved settings
      const savedSettings: ContactFormSettings = {
        general: {
          isEnabled: data.data?.general?.isEnabled ?? false,
          link: data.data?.general?.link ?? null,
          widgetCode: data.data?.general?.widgetCode ?? null,
        },
      };
      setStagedSettings(savedSettings);

      toast({
        title: "Success",
        description: "Contact form settings saved successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error updating contact form settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save contact form settings",
        variant: "destructive",
      });
    },
  });

  // Stage changes without saving
  const stageChanges = (updates: Partial<ContactFormSettings>) => {
    setStagedSettings((current) => {
      if (!current) return current;

      const updatedSettings: ContactFormSettings = {
        general: {
          ...current.general,
          ...(updates.general || {}),
        },
      };

      return updatedSettings;
    });
  };

  // Stage a single setting change
  const stageSetting = (
    section: keyof ContactFormSettings,
    key: string,
    value: unknown,
  ) => {
    if (!stagedSettings) return;

    const updates = {
      [section]: {
        [key]: value,
      },
    } as Partial<ContactFormSettings>;

    stageChanges(updates);
  };

  // Save all staged changes
  const saveChanges = async () => {
    if (!stagedSettings || !hasChanges) return;
    saveMutation.mutate(stagedSettings);
  };

  // Discard staged changes
  const discardChanges = () => {
    setStagedSettings(settings);
  };

  // Convenience method to toggle form
  const toggleForm = (enabled: boolean) => {
    stageSetting("general", "isEnabled", enabled);
  };

  return {
    settings: stagedSettings, // Return staged settings for UI
    loading,
    saving: saveMutation.isPending,
    hasChanges,
    error,
    stageChanges,
    stageSetting,
    saveChanges,
    discardChanges,
    toggleForm,
    refetch: () =>
      queryClient.invalidateQueries({
        queryKey: ["client-care-settings", "contactForm"],
      }),
  };
}

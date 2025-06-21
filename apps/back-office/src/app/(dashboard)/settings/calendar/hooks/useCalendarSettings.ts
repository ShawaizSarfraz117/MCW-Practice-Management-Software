import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@mcw/ui";
import type { CalendarSettings } from "@mcw/types";

const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  display: {
    startTime: "7:00 AM",
    endTime: "11:00 PM",
    viewMode: "week",
    showWeekends: true,
    cancellationNoticeHours: 24,
  },
};

const createCompleteSettings = (
  data: Partial<CalendarSettings> | null | undefined,
): CalendarSettings => ({
  display: {
    startTime:
      data?.display?.startTime || DEFAULT_CALENDAR_SETTINGS.display.startTime,
    endTime:
      data?.display?.endTime || DEFAULT_CALENDAR_SETTINGS.display.endTime,
    viewMode:
      data?.display?.viewMode || DEFAULT_CALENDAR_SETTINGS.display.viewMode,
    showWeekends:
      data?.display?.showWeekends ??
      DEFAULT_CALENDAR_SETTINGS.display.showWeekends,
    cancellationNoticeHours:
      data?.display?.cancellationNoticeHours ||
      DEFAULT_CALENDAR_SETTINGS.display.cancellationNoticeHours,
  },
});

export function useCalendarSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State for staging changes
  const [stagedSettings, setStagedSettings] = useState<CalendarSettings | null>(
    null,
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings using React Query
  const {
    data: settings,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["client-care-settings", "calendar"],
    queryFn: async (): Promise<CalendarSettings> => {
      const response = await fetch(
        "/api/client-care-settings?category=calendar",
      );

      if (!response.ok) {
        if (response.status === 404 || response.status === 500) {
          // Return default settings for 404/500 errors
          return DEFAULT_CALENDAR_SETTINGS;
        }
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();
      return createCompleteSettings(data.data);
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Handle query errors with useEffect
  useEffect(() => {
    if (error) {
      console.error("Error fetching calendar settings:", error);
      toast({
        title: "Error",
        description: "Failed to load calendar settings",
        variant: "destructive",
      });
    }
  }, [error, toast]);

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
    mutationFn: async (settingsToSave: CalendarSettings) => {
      const response = await fetch("/api/client-care-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "calendar",
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
        queryKey: ["client-care-settings", "calendar"],
      });

      // Update local state with saved settings
      const savedSettings = createCompleteSettings(data.data);
      setStagedSettings(savedSettings);

      toast({
        title: "Success",
        description: "Calendar settings saved successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error updating calendar settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save calendar settings",
        variant: "destructive",
      });
    },
  });

  // Stage changes without saving
  const stageChanges = (updates: Partial<CalendarSettings>) => {
    setStagedSettings((current) => {
      if (!current) return current;

      const updatedSettings: CalendarSettings = {
        display: {
          ...current.display,
          ...(updates.display || {}),
        },
      };

      return updatedSettings;
    });
  };

  // Stage a single setting change
  const stageSetting = (
    section: keyof CalendarSettings,
    key: string,
    value: unknown,
  ) => {
    setStagedSettings((current) => {
      if (!current) return current;

      const updates = {
        [section]: {
          ...current[section],
          [key]: value,
        },
      } as Partial<CalendarSettings>;

      return {
        ...current,
        ...updates,
      };
    });
  };

  // Save all staged changes
  const saveChanges = async () => {
    if (!stagedSettings || !hasChanges) return;

    // Ensure complete settings before saving
    const completeSettings = createCompleteSettings(stagedSettings);
    saveMutation.mutate(completeSettings);
  };

  // Discard staged changes
  const discardChanges = () => {
    setStagedSettings(settings || null);
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
    refetch: () =>
      queryClient.invalidateQueries({
        queryKey: ["client-care-settings", "calendar"],
      }),
  };
}

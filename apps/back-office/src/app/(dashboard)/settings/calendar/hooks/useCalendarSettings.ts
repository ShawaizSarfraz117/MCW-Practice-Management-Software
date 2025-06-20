import { useState, useEffect } from "react";
import { useToast } from "@mcw/ui";
import type { CalendarSettings } from "@mcw/types";

export function useCalendarSettings() {
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [stagedSettings, setStagedSettings] = useState<CalendarSettings | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  // Track changes whenever stagedSettings differs from settings
  useEffect(() => {
    if (settings && stagedSettings) {
      // Use a deep comparison function to detect changes
      const detectChanges = (original: unknown, staged: unknown): boolean => {
        // If types are different, there's a change
        if (typeof original !== typeof staged) return true;

        // If both are null or undefined
        if (original === null && staged === null) return false;
        if (original === undefined && staged === undefined) return false;

        // If one is null/undefined and the other isn't
        if (original === null || staged === null) return true;
        if (original === undefined || staged === undefined) return true;

        // For objects, recursively check each property
        if (typeof original === "object" && typeof staged === "object") {
          const originalObj = original as Record<string, unknown>;
          const stagedObj = staged as Record<string, unknown>;
          const originalKeys = Object.keys(originalObj);
          const stagedKeys = Object.keys(stagedObj);

          // If different number of keys, there's a change
          if (originalKeys.length !== stagedKeys.length) return true;

          // Check each key
          for (const key of originalKeys) {
            if (detectChanges(originalObj[key], stagedObj[key])) return true;
          }

          return false;
        }

        // For primitives, direct comparison
        return original !== staged;
      };

      const hasChanges = detectChanges(settings, stagedSettings);
      setHasChanges(hasChanges);
    } else {
      setHasChanges(false);
    }
  }, [settings, stagedSettings]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/client-care-settings?category=calendar",
      );

      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();
      // Ensure we have a complete settings structure
      const completeSettings = {
        display: {
          startTime: data.data?.display?.startTime || "7:00 AM",
          endTime: data.data?.display?.endTime || "11:00 PM",
          viewMode: data.data?.display?.viewMode || "week",
          showWeekends: data.data?.display?.showWeekends ?? true,
          cancellationNoticeHours:
            data.data?.display?.cancellationNoticeHours || 24,
        },
      };
      setSettings(completeSettings);
      setStagedSettings(completeSettings); // Initialize staged settings
    } catch (error) {
      console.error("Error fetching calendar settings:", error);
      toast({
        title: "Error",
        description: "Failed to load calendar settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

    try {
      setSaving(true);

      // Ensure we have complete settings structure before saving
      const completeSettings = {
        display: {
          startTime: stagedSettings?.display?.startTime || "7:00 AM",
          endTime: stagedSettings?.display?.endTime || "11:00 PM",
          viewMode: stagedSettings?.display?.viewMode || "week",
          showWeekends: stagedSettings?.display?.showWeekends ?? true,
          cancellationNoticeHours:
            stagedSettings?.display?.cancellationNoticeHours || 24,
        },
      };

      const response = await fetch("/api/client-care-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "calendar",
          settings: completeSettings,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      const data = await response.json();
      // Ensure we have a complete settings structure from the response
      const savedSettings = {
        display: {
          startTime: data.data?.display?.startTime || "7:00 AM",
          endTime: data.data?.display?.endTime || "11:00 PM",
          viewMode: data.data?.display?.viewMode || "week",
          showWeekends: data.data?.display?.showWeekends ?? true,
          cancellationNoticeHours:
            data.data?.display?.cancellationNoticeHours || 24,
        },
      };
      setSettings(savedSettings);
      setStagedSettings(savedSettings); // Reset staged to match saved

      toast({
        title: "Success",
        description: "Calendar settings saved successfully",
      });
    } catch (error) {
      console.error("Error updating calendar settings:", error);
      toast({
        title: "Error",
        description: "Failed to save calendar settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Discard staged changes
  const discardChanges = () => {
    setStagedSettings(settings);
  };

  return {
    settings: stagedSettings, // Return staged settings for UI
    loading,
    saving,
    hasChanges,
    stageChanges,
    stageSetting,
    saveChanges,
    discardChanges,
    refetch: fetchSettings,
  };
}

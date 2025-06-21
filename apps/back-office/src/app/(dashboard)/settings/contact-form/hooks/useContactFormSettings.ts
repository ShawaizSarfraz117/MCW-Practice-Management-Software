import { useState, useEffect } from "react";
import { useToast } from "@mcw/ui";
import type { ContactFormSettings } from "@mcw/types";

export function useContactFormSettings() {
  const [settings, setSettings] = useState<ContactFormSettings | null>(null);
  const [stagedSettings, setStagedSettings] =
    useState<ContactFormSettings | null>(null);
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

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/client-care-settings?category=contactForm",
      );

      if (!response.ok) {
        if (response.status === 404 || response.status === 500) {
          // Initialize with default settings locally
          const defaultSettings: ContactFormSettings = {
            general: {
              isEnabled: false,
              link: null,
              widgetCode: null,
            },
          };
          setSettings(defaultSettings);
          setStagedSettings(defaultSettings);
          return;
        }
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();
      // Ensure we have a complete settings structure
      const completeSettings: ContactFormSettings = {
        general: {
          isEnabled: data.data?.general?.isEnabled ?? false,
          link: data.data?.general?.link ?? null,
          widgetCode: data.data?.general?.widgetCode ?? null,
        },
      };
      setSettings(completeSettings);
      setStagedSettings(completeSettings);
    } catch (error) {
      console.error("Error fetching contact form settings:", error);
      toast({
        title: "Error",
        description: "Failed to load contact form settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

    try {
      setSaving(true);

      const response = await fetch("/api/client-care-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "contactForm",
          settings: stagedSettings,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      const data = await response.json();
      // Ensure we have a complete settings structure from the response
      const savedSettings: ContactFormSettings = {
        general: {
          isEnabled: data.data?.general?.isEnabled ?? false,
          link: data.data?.general?.link ?? null,
          widgetCode: data.data?.general?.widgetCode ?? null,
        },
      };
      setSettings(savedSettings);
      setStagedSettings(savedSettings);

      toast({
        title: "Success",
        description: "Contact form settings saved successfully",
      });
    } catch (error) {
      console.error("Error updating contact form settings:", error);
      toast({
        title: "Error",
        description: "Failed to save contact form settings",
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

  // Convenience method to toggle form
  const toggleForm = (enabled: boolean) => {
    stageSetting("general", "isEnabled", enabled);
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
    toggleForm,
    refetch: fetchSettings,
  };
}

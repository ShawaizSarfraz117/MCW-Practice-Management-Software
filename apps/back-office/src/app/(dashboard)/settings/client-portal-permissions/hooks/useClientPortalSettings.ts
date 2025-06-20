import { useState, useEffect } from "react";
import { useToast } from "@mcw/ui";
import type { PortalSettings } from "@mcw/types";

export function useClientPortalSettings() {
  const [settings, setSettings] = useState<PortalSettings | null>(null);
  const [stagedSettings, setStagedSettings] = useState<PortalSettings | null>(
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
          const originalKeys = Object.keys(original as Record<string, unknown>);
          const stagedKeys = Object.keys(staged as Record<string, unknown>);

          // If different number of keys, there's a change
          if (originalKeys.length !== stagedKeys.length) return true;

          // Check each key
          for (const key of originalKeys) {
            if (
              detectChanges(
                (original as Record<string, unknown>)[key],
                (staged as Record<string, unknown>)[key],
              )
            )
              return true;
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
      const response = await fetch("/api/client-care-settings?category=portal");

      if (!response.ok) {
        if (response.status === 404 || response.status === 500) {
          // Initialize with default settings locally
          const defaultSettings: PortalSettings = {
            general: {
              isEnabled: false,
              domainUrl: null,
              welcomeMessage: "Welcome to our client portal!",
            },
            appointments: {
              isAppointmentRequestsEnabled: false,
              appointmentStartTimes: null,
              requestMinimumNotice: "24 hours",
              maximumRequestNotice: "30 days",
              allowNewClientsRequest: false,
              requestsFromNewIndividuals: false,
              requestsFromNewCouples: false,
              requestsFromNewContacts: false,
              isPrescreenNewClients: false,
              cardForAppointmentRequest: false,
            },
            documents: {
              isUploadDocumentsAllowed: false,
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
      const completeSettings: PortalSettings = {
        general: {
          isEnabled: data.data?.general?.isEnabled ?? false,
          domainUrl: data.data?.general?.domainUrl ?? null,
          welcomeMessage:
            data.data?.general?.welcomeMessage ??
            "Welcome to our client portal!",
        },
        appointments: {
          isAppointmentRequestsEnabled:
            data.data?.appointments?.isAppointmentRequestsEnabled ?? false,
          appointmentStartTimes:
            data.data?.appointments?.appointmentStartTimes ?? null,
          requestMinimumNotice:
            data.data?.appointments?.requestMinimumNotice ?? "24 hours",
          maximumRequestNotice:
            data.data?.appointments?.maximumRequestNotice ?? "30 days",
          allowNewClientsRequest:
            data.data?.appointments?.allowNewClientsRequest ?? false,
          requestsFromNewIndividuals:
            data.data?.appointments?.requestsFromNewIndividuals ?? false,
          requestsFromNewCouples:
            data.data?.appointments?.requestsFromNewCouples ?? false,
          requestsFromNewContacts:
            data.data?.appointments?.requestsFromNewContacts ?? false,
          isPrescreenNewClients:
            data.data?.appointments?.isPrescreenNewClients ?? false,
          cardForAppointmentRequest:
            data.data?.appointments?.cardForAppointmentRequest ?? false,
        },
        documents: {
          isUploadDocumentsAllowed:
            data.data?.documents?.isUploadDocumentsAllowed ?? false,
        },
      };
      setSettings(completeSettings);
      setStagedSettings(completeSettings); // Initialize staged settings
    } catch (error) {
      console.error("Error fetching client portal settings:", error);
      toast({
        title: "Error",
        description: "Failed to load client portal settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Stage changes without saving
  const stageChanges = (updates: Partial<PortalSettings>) => {
    setStagedSettings((current) => {
      if (!current) return current;

      const updatedSettings: PortalSettings = {
        general: {
          ...current.general,
          ...(updates.general || {}),
        },
        appointments: {
          ...current.appointments,
          ...(updates.appointments || {}),
        },
        documents: {
          ...current.documents,
          ...(updates.documents || {}),
        },
      };

      return updatedSettings;
    });
  };

  // Stage a single setting change
  const stageSetting = (
    section: keyof PortalSettings,
    key: string,
    value: unknown,
  ) => {
    if (!stagedSettings) return;

    const updates = {
      [section]: {
        [key]: value,
      },
    } as Partial<PortalSettings>;

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
          category: "portal",
          settings: stagedSettings,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      const data = await response.json();
      // Ensure we have a complete settings structure from the response
      const savedSettings: PortalSettings = {
        general: {
          isEnabled: data.data?.general?.isEnabled ?? false,
          domainUrl: data.data?.general?.domainUrl ?? null,
          welcomeMessage:
            data.data?.general?.welcomeMessage ??
            "Welcome to our client portal!",
        },
        appointments: {
          isAppointmentRequestsEnabled:
            data.data?.appointments?.isAppointmentRequestsEnabled ?? false,
          appointmentStartTimes:
            data.data?.appointments?.appointmentStartTimes ?? null,
          requestMinimumNotice:
            data.data?.appointments?.requestMinimumNotice ?? "24 hours",
          maximumRequestNotice:
            data.data?.appointments?.maximumRequestNotice ?? "30 days",
          allowNewClientsRequest:
            data.data?.appointments?.allowNewClientsRequest ?? false,
          requestsFromNewIndividuals:
            data.data?.appointments?.requestsFromNewIndividuals ?? false,
          requestsFromNewCouples:
            data.data?.appointments?.requestsFromNewCouples ?? false,
          requestsFromNewContacts:
            data.data?.appointments?.requestsFromNewContacts ?? false,
          isPrescreenNewClients:
            data.data?.appointments?.isPrescreenNewClients ?? false,
          cardForAppointmentRequest:
            data.data?.appointments?.cardForAppointmentRequest ?? false,
        },
        documents: {
          isUploadDocumentsAllowed:
            data.data?.documents?.isUploadDocumentsAllowed ?? false,
        },
      };
      setSettings(savedSettings);
      setStagedSettings(savedSettings); // Reset staged to match saved

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
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

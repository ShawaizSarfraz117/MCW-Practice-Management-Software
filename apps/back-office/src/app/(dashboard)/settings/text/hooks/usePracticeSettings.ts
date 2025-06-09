import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";

type PracticeSettingValue = string | number | boolean | object;
type PracticeSettings = Record<string, PracticeSettingValue>;

export function usePracticeSettings(keys?: string[]) {
  const queryClient = useQueryClient();
  const keysParam = keys ? keys.join(",") : "";

  const { data: settings, isLoading } = useQuery<PracticeSettings>({
    queryKey: ["practiceSettings", keysParam],
    queryFn: async () => {
      const url = keys
        ? `/api/practice-settings?keys=${keysParam}`
        : "/api/practice-settings";

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch practice settings");
      }
      return response.json();
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: Partial<PracticeSettings>) => {
      const response = await fetch("/api/practice-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to update practice settings",
        );
      }

      const result = await response.json();
      return result;
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ["practiceSettings"] });
      toast({
        title: "Success",
        description: "Practice settings updated successfully",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update practice settings",
        variant: "destructive",
      });
    },
  });

  return {
    settings: settings || {},
    isLoading,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
}

// Specific hook for text reminder settings
export function useTextReminderSettings() {
  const { settings, isLoading, updateSettings, isUpdating } =
    usePracticeSettings(["is-text-reminders-enabled", "reminder-duration"]);

  const textSettings = {
    isTextRemindersEnabled:
      (settings["is-text-reminders-enabled"] as boolean) ?? true,
    reminderDuration: (settings["reminder-duration"] as string) ?? "24h",
  };

  const updateTextSettings = (newSettings: {
    isTextRemindersEnabled: boolean;
    reminderDuration: string;
  }) => {
    const payload = {
      "is-text-reminders-enabled": newSettings.isTextRemindersEnabled,
      "reminder-duration": newSettings.reminderDuration,
    };
    updateSettings(payload);
  };

  return {
    settings: textSettings,
    isLoading,
    updateSettings: updateTextSettings,
    isUpdating,
  };
}

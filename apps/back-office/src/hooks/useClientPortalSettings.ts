import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface ClientPortalSettings {
  id: string;
  clinician_id: string;
  website_domain: string;
  allow_appointments: boolean;
  allow_file_uploads: boolean;
  greeting_message: string | null;
  allow_new_clients: boolean;
  allow_individual_clients: boolean;
  allow_couple_clients: boolean;
  allow_contact_clients: boolean;
  show_prescreener: boolean;
  ask_payment_method: boolean;
  require_credit_card: boolean;
  created_at: string;
  updated_at: string;
}

export function useClientPortalSettings() {
  const queryClient = useQueryClient();

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery<ClientPortalSettings>({
    queryKey: ["clientPortalSettings"],
    queryFn: async () => {
      const response = await axios.get("/api/client-portal-settings");
      return response.data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<ClientPortalSettings>) => {
      const response = await axios.put(
        "/api/client-portal-settings",
        newSettings,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientPortalSettings"] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
}

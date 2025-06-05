import { useState, useEffect } from "react";

interface ClientPortalSettings {
  id: string;
  clinician_id: string;
  is_enabled: boolean;
  domain_url: string | null;
  is_appointment_requests_enabled: boolean | null;
  appointment_start_times: string | null;
  request_minimum_notice: string | null;
  maximum_request_notice: string | null;
  allow_new_clients_request: boolean;
  requests_from_new_individuals: boolean;
  requests_from_new_couples: boolean;
  requests_from_new_contacts: boolean;
  is_prescreen_new_clinets: boolean;
  card_for_appointment_request: boolean;
  is_upload_documents_allowed: boolean;
  welcome_message: string | null;
}

interface ApiResponse {
  message: string;
  data: ClientPortalSettings;
}

export function useClientPortalSettings() {
  const [settings, setSettings] = useState<ClientPortalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/client-portal-settings");

      if (!response.ok) {
        if (response.status === 404) {
          // Settings don't exist yet, initialize with defaults
          setSettings(null);
          return;
        }
        throw new Error("Failed to fetch client portal settings");
      }

      const data: ApiResponse = await response.json();
      setSettings(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (
    updates: Partial<Omit<ClientPortalSettings, "id" | "clinician_id">>,
  ) => {
    try {
      setError(null);
      const response = await fetch("/api/client-portal-settings", {
        method: settings ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update client portal settings");
      }

      const data: ApiResponse = await response.json();
      setSettings(data.data);
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
}

import type React from "react";
import { useEffect, useState } from "react";
import {
  ShareDocuments,
  ShareClient,
} from "@/(dashboard)/share-documents/ShareDocuments";
import {
  fetchSingleClientGroup,
  ClientGroupWithMembership,
} from "@/(dashboard)/clients/services/client.service";
import { useMultipleClientEmails } from "@/(dashboard)/calendar/hooks/useClientContact";

interface IntakeFormProps {
  clientGroupId: string;
  onClose: () => void;
  appointmentDate?: Date | string;
  appointmentTime?: string;
  clinicianName?: string;
  locationName?: string;
  appointmentId?: string;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({
  clientGroupId,
  onClose,
  appointmentDate,
  appointmentTime,
  clinicianName,
  locationName,
  appointmentId,
}) => {
  const [clients, setClients] = useState<ShareClient[]>([]);
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);

  // Use the hook to fetch emails for all clients
  const { data: emailMap, isLoading: isLoadingEmails } =
    useMultipleClientEmails(clientIds);

  useEffect(() => {
    let mounted = true;

    // Fetch all clients in the group
    const fetchClients = async () => {
      try {
        const response = await fetchSingleClientGroup({
          id: clientGroupId,
          searchParams: {},
        });

        // Check if component is still mounted before updating state
        if (!mounted) return;

        if (response && typeof response === "object" && "data" in response) {
          const clientGroupData = response.data as ClientGroupWithMembership;

          if (clientGroupData.ClientGroupMembership?.length) {
            // Extract client IDs for email fetching
            const ids = clientGroupData.ClientGroupMembership.map(
              (membership) => membership.Client.id,
            );

            // Check again before state updates
            if (!mounted) return;

            setClientIds(ids);

            // Set basic client data immediately
            const clientsData = clientGroupData.ClientGroupMembership.map(
              (membership) => {
                const client = membership.Client;
                return {
                  id: client.id,
                  name: `${client.legal_first_name || ""} ${client.legal_last_name || ""}`.trim(),
                  email: undefined,
                };
              },
            );

            if (!mounted) return;
            setClients(clientsData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      } finally {
        if (mounted) {
          setIsLoadingGroup(false);
        }
      }
    };

    if (clientGroupId) {
      fetchClients();
    }

    return () => {
      mounted = false;
    };
  }, [clientGroupId]);

  useEffect(() => {
    if (emailMap && clients.length > 0) {
      const updatedClients = clients.map((client) => ({
        ...client,
        email: emailMap.get(client.id) || undefined,
      }));
      setClients(updatedClients);
    }
  }, [emailMap, clients.length]);

  const isLoading = isLoadingGroup || isLoadingEmails;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <ShareDocuments
      appointmentDate={appointmentDate}
      appointmentId={appointmentId}
      appointmentTime={appointmentTime}
      clientGroupId={clientGroupId}
      clients={clients}
      clinicianName={clinicianName}
      context="appointment"
      locationName={locationName}
      showReminders={true}
      onClose={onClose}
    />
  );
};

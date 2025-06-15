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

interface IntakeFormProps {
  clientGroupId: string;
  onClose: () => void;
}

async function getClientEmail(clientId: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/client/contact?clientId=${clientId}`);
    if (response.ok) {
      const result = await response.json();
      const contacts = result.data || [];
      const emailContact = contacts.find(
        (c: { contact_type: string; value: string }) =>
          c.contact_type === "EMAIL",
      );
      return emailContact?.value || null;
    }
  } catch (error) {
    console.error("Failed to fetch client email:", error);
  }
  return null;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({
  clientGroupId,
  onClose,
}) => {
  const [clients, setClients] = useState<ShareClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch all clients in the group
    const fetchClients = async () => {
      try {
        const response = await fetchSingleClientGroup({
          id: clientGroupId,
          searchParams: {},
        });

        if (response && typeof response === "object" && "data" in response) {
          const clientGroupData = response.data as ClientGroupWithMembership;

          if (clientGroupData.ClientGroupMembership?.length) {
            // Get all clients from the group
            const clientsPromises = clientGroupData.ClientGroupMembership.map(
              async (membership) => {
                const client = membership.Client;
                const email = await getClientEmail(client.id);

                return {
                  id: client.id,
                  name: `${client.legal_first_name || ""} ${client.legal_last_name || ""}`.trim(),
                  email: email || undefined,
                };
              },
            );

            const clientsData = await Promise.all(clientsPromises);
            setClients(clientsData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (clientGroupId) {
      fetchClients();
    }
  }, [clientGroupId]);

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
      clients={clients}
      clientGroupId={clientGroupId}
      context="appointment"
      showReminders={true}
      onClose={onClose}
    />
  );
};

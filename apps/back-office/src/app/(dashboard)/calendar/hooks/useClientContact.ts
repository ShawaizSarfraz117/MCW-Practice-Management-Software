import { useQuery } from "@tanstack/react-query";

interface ClientContact {
  id: string;
  contact_type: string;
  value: string;
  is_primary: boolean;
}

interface ClientContactResponse {
  success: boolean;
  data: ClientContact[];
}

async function fetchClientContact(clientId: string): Promise<string | null> {
  const response = await fetch(`/api/client/contact?clientId=${clientId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch client contact: ${response.statusText}`);
  }

  const result: ClientContactResponse = await response.json();
  const contacts = result.data || [];
  const emailContact = contacts.find((c) => c.contact_type === "EMAIL");

  return emailContact?.value || null;
}

export function useClientEmail(clientId: string | undefined) {
  return useQuery({
    queryKey: ["client-email", clientId],
    queryFn: () => fetchClientContact(clientId!),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook to fetch multiple client emails in parallel
export function useMultipleClientEmails(clientIds: string[]) {
  return useQuery({
    queryKey: ["client-emails", clientIds],
    queryFn: async () => {
      const emailPromises = clientIds.map(async (clientId) => {
        try {
          const email = await fetchClientContact(clientId);
          return { clientId, email };
        } catch (error) {
          console.error(`Failed to fetch email for client ${clientId}:`, error);
          return { clientId, email: null };
        }
      });

      const results = await Promise.all(emailPromises);

      // Return a map for easy lookup
      return new Map(results.map(({ clientId, email }) => [clientId, email]));
    },
    enabled: clientIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
}

"use client";

import type React from "react";
import { Button } from "@mcw/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { useQuery } from "@tanstack/react-query";

interface Client {
  id: string;
  legal_first_name: string;
  legal_last_name: string;
  preferred_name: string | null;
  is_active: boolean;
  Clinician: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

interface ClientSelectorProps {
  appointmentDate: string;
  onCreateClient: () => void;
  disabled?: boolean;
  clientId?: string;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  onCreateClient,
  disabled = false,
  clientId,
}) => {
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await fetch("/api/client");
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      return response.json();
    },
  });

  // Get the client name when in view mode
  const selectedClient = clients?.find((client) => client.id === clientId);
  const clientName = selectedClient
    ? selectedClient.preferred_name ||
      `${selectedClient.legal_first_name} ${selectedClient.legal_last_name}`
    : "";

  return (
    <div className="flex items-center gap-2">
      {disabled && clientId ? (
        <div className="flex-1 p-2 border rounded text-sm">
          {isLoading
            ? "Loading client information..."
            : clientName || "No client selected"}
        </div>
      ) : (
        <Select value={clientId}>
          <SelectTrigger className="flex-1">
            <SelectValue
              placeholder={isLoading ? "Loading..." : "Search Client"}
            />
          </SelectTrigger>
          <SelectContent>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.preferred_name ||
                  `${client.legal_first_name} ${client.legal_last_name}`}
                {client.Clinician && (
                  <span className="text-gray-500 text-sm ml-2">
                    (Clinician: {client.Clinician.first_name}{" "}
                    {client.Clinician.last_name})
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {!disabled && (
        <Button
          className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50"
          variant="ghost"
          onClick={onCreateClient}
        >
          + Create client
        </Button>
      )}
    </div>
  );
};

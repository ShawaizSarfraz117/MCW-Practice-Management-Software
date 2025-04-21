"use client";

import { SetStateAction, useState, useEffect } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { Button } from "@mcw/ui";
import { Input } from "@mcw/ui";
import { RadioGroup, RadioGroupItem } from "@mcw/ui";
import { fetchClients } from "../services/client.service";

export interface ClientContact {
  id: string;
  type: string;
  contact_type: string;
  value: string;
}

export interface Client {
  id: string;
  legal_first_name: string;
  legal_last_name: string;
  preferred_name?: string | null;
  ClientContact?: ClientContact[];
}

interface SelectExistingClientProps {
  selectedClient: Client | null;
  onSelect: (client: Client) => void;
  onBack: () => void;
}

export function SelectExistingClient({
  selectedClient,
  onSelect,
  onBack,
}: SelectExistingClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    selectedClient?.id || "client-1",
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getClients = async () => {
      setLoading(true);
      const [response, error] = await fetchClients({});
      if (response && !error) {
        setClients(response.data);
      }
      setLoading(false);
    };

    getClients();
  }, []);

  const getClientName = (client: Client) => {
    return (
      client.preferred_name ||
      `${client.legal_first_name} ${client.legal_last_name}`
    );
  };

  const getContactInfo = (client: Client) => {
    if (!client.ClientContact || client.ClientContact.length === 0) {
      return "";
    }

    // Try to find email first
    const emailContact = client.ClientContact.find(
      (contact) => contact.contact_type === "EMAIL",
    );
    if (emailContact) return emailContact.value;

    // If no email, try to find phone
    const phoneContact = client.ClientContact.find(
      (contact) => contact.contact_type === "PHONE",
    );
    if (phoneContact) return phoneContact.value;

    return "";
  };

  const filteredClients = clients.filter(
    (client) =>
      getClientName(client).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getContactInfo(client).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelect = () => {
    if (selectedClientId) {
      const selectedClient = clients.find(
        (client) => client.id === selectedClientId,
      );
      if (selectedClient) {
        onSelect(selectedClient);
      }
      onBack();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Button className="mr-2" size="icon" variant="ghost" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-medium">
            Select Existing Client or Contact
          </h2>
        </div>
        <Button
          className="bg-[#2d8467] hover:bg-[#236c53]"
          onClick={handleSelect}
        >
          Select
        </Button>
      </div>

      <div className="p-4 overflow-y-auto">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 px-9"
            placeholder="Search Clients and Contacts"
            value={searchQuery}
            onChange={(e: { target: { value: SetStateAction<string> } }) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>

        {loading ? (
          <div className="text-center py-4">Loading clients...</div>
        ) : (
          <RadioGroup
            value={selectedClientId || ""}
            onValueChange={setSelectedClientId}
          >
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <div>
                    <div className="font-medium">{getClientName(client)}</div>
                    <div className="text-sm text-gray-500">
                      {getContactInfo(client)}
                    </div>
                  </div>
                  <RadioGroupItem
                    checked={selectedClientId === client.id}
                    id={client.id}
                    value={client.id}
                  />
                </div>
              ))}
            </div>
          </RadioGroup>
        )}
      </div>
    </div>
  );
}

"use client";

import { SetStateAction, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { Button } from "@mcw/ui";
import { Input } from "@mcw/ui";
import { RadioGroup, RadioGroupItem } from "@mcw/ui";

export interface Client {
  id: string;
  name: string;
  email: string;
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
  console.log("🚀 ~ SelectExistingClient ~ selectedClient:", selectedClient);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    selectedClient?.id || "client-1",
  );

  // Sample client data
  const clients: Client[] = [
    { id: "client-1", name: "Jamie D. Appleseed", email: "alam@mcnultycw.com" },
    { id: "client-2", name: "Karen Appleseed", email: "alam@mcnultycw.com" },
    { id: "client-3", name: "Shawaiz Sarfraz", email: "alam@mcnultycw.com" },
  ];

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()),
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

      <div className="p-4">
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

        <RadioGroup
          value={selectedClientId || ""}
          onValueChange={setSelectedClientId}
        >
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 border-b"
              >
                <div>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-gray-500">{client.email}</div>
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
      </div>
    </div>
  );
}

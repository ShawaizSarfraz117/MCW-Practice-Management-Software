"use client";

import { useState } from "react";
import {
  Button,
  Sheet,
  SheetContent,
  Input,
  RadioGroup,
  RadioGroupItem,
} from "@mcw/ui";
import { Client } from "../../../components/SelectExistingClient";
import { EditClientForm } from "./EditClientForm";
import { ClientFormValues } from "../types";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchClients } from "../../../services/client.service";
import Loading from "@/components/Loading";
import { X } from "lucide-react";

interface ContactAddDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveContact: (contactData: ClientFormValues) => void;
}

type DrawerView = "selection" | "form";

function ClientList({ onSelect }: { onSelect: (client: Client) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const [clientsData, error] = await fetchClients({});
      if (error) throw error;
      return clientsData?.data;
    },
  });

  const clients = data as Client[] | undefined;

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

  const filteredClients = clients?.filter(
    (client) =>
      getClientName(client).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getContactInfo(client).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleClientClick = (client: Client) => {
    setSelectedClientId(client.id);
    onSelect(client);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 px-9 bg-gray-50 border-gray-200"
            placeholder="Search Clients and Contacts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4">
            <Loading />
          </div>
        ) : (
          <RadioGroup
            value={selectedClientId || ""}
            onValueChange={setSelectedClientId}
          >
            <div className="space-y-1">
              {filteredClients?.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50 bg-white transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                  onClick={() => handleClientClick(client)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {getClientName(client)}
                    </div>
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

export function ContactAddDrawer({
  isOpen,
  onClose,
  onSaveContact,
}: ContactAddDrawerProps) {
  const [view, setView] = useState<DrawerView>("selection");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleNewContact = () => {
    setSelectedClient(null);
    setView("form");
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setView("form");
  };

  const handleBackToSelection = () => {
    setView("selection");
    setSelectedClient(null);
  };

  const handleSaveContact = async (contactData: ClientFormValues) => {
    onSaveContact(contactData);
    onClose();
    setView("selection");
    setSelectedClient(null);
  };

  const handleClose = () => {
    onClose();
    setView("selection");
    setSelectedClient(null);
  };

  // Create a proper ClientMembership structure for the selected client
  const createClientMembership = (client: Client) => ({
    client_id: client.id,
    client_group_id: "",
    created_at: new Date(),
    type: "contact",
    role: null,
    is_contact_only: true,
    is_responsible_for_billing: false,
    Client: {
      ...client,
      is_active: true,
      address: null,
      receive_reminders: false,
      has_portal_access: false,
      last_login_at: null,
      is_responsible_for_billing: false,
      date_of_birth: null,
      middle_name: null,
      suffix: null,
      ClientContact:
        client.ClientContact?.map((contact) => ({
          id: contact.id,
          value: contact.value,
          contact_type: contact.contact_type,
          type: contact.type,
          permission: undefined,
          is_primary: false,
        })) || [],
      ClientProfile: undefined,
      ClientAdress: undefined,
    },
  });

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        className="w-full sm:max-w-lg [&>button]:hidden p-2 overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {view === "selection" ? (
          <>
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center">
                <Button
                  className="mr-2"
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    onClose();
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
                <div>
                  <h2 className="text-xl font-semibold">Add Contact</h2>
                  <p className="text-sm text-gray-500">
                    Add a new contact to the client.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleNewContact}
                className="bg-[#2d8467] hover:bg-[#236c53]"
              >
                + New Contact
              </Button>
            </div>
            <ClientList onSelect={handleClientSelect} />
          </>
        ) : (
          <div className="h-full flex flex-col">
            {/* Custom Header for Contact Form */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center">
                <Button
                  className="mr-2"
                  size="icon"
                  variant="ghost"
                  onClick={handleBackToSelection}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Button>
                <h2 className="text-lg font-medium">Create New Contact</h2>
              </div>
              <Button
                form="client-edit-form"
                type="submit"
                className="bg-[#2d8467] hover:bg-[#236c53]"
              >
                Save
              </Button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto">
              <EditClientForm
                clientData={
                  selectedClient ? createClientMembership(selectedClient) : null
                }
                onSave={handleSaveContact}
                type="contact"
                className="border-0"
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

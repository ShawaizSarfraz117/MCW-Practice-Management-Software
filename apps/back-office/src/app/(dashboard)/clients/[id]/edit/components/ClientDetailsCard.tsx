"use client";

import type { ClientMembership } from "./ClientEdit";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  useToast,
} from "@mcw/ui";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { EditClientDrawer } from "./EditClientDrawer";
import { ClientFormValues } from "../types";
import { useUpdateClient } from "@/(dashboard)/clients/services/client.service";

type ClientDetailsRowProps = {
  label: string;
  value: React.ReactNode;
};

const ClientDetailsRow: React.FC<ClientDetailsRowProps> = ({
  label,
  value,
}) => (
  <div className="flex py-3 border-b border-gray-100">
    <div className="w-36 text-gray-600">{label}</div>
    <div className="flex-1">{value}</div>
  </div>
);

export function ClientDetailsCard({ client }: { client: ClientMembership }) {
  const emails = client.Client.ClientContact.filter(
    (contact: { contact_type: string }) => contact.contact_type === "EMAIL",
  );
  const phones = client.Client.ClientContact.filter(
    (contact: { contact_type: string }) => contact.contact_type === "PHONE",
  );

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center border-b justify-between py-2 px-6">
        <h3 className="text-base font-medium">
          {client.Client.legal_first_name} {client.Client.legal_last_name}
        </h3>
        <ManageButton clientData={client} />
      </CardHeader>
      <CardContent className="px-6 pt-0 pb-4">
        <ClientDetailsRow
          label="Phone"
          value={
            phones.length > 0
              ? phones.map((contact: { id: string; value: string }) => (
                  <div key={contact.id} className="flex items-center">
                    <span>{contact.value}</span>
                  </div>
                ))
              : "No phone number listed"
          }
        />
        <ClientDetailsRow
          label="Email"
          value={
            emails.length > 0
              ? emails.map(
                  (contact: {
                    id: string;
                    value: string;
                    is_primary?: boolean;
                  }) => (
                    <div key={contact.id} className="flex items-center">
                      <span>{contact.value}</span>
                      {contact.is_primary && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          Home
                        </span>
                      )}
                    </div>
                  ),
                )
              : "No email listed"
          }
        />
        <ClientDetailsRow
          label="Address"
          value={client.Client.address || "No address listed"}
        />
        <ClientDetailsRow
          label="Reminders"
          value={
            client.Client.receive_reminders
              ? "Will receive appointment reminders"
              : "Will not receive appointment reminders"
          }
        />
        <ClientDetailsRow
          label="Client Portal"
          value={
            client.Client.has_portal_access ? (
              <div className="space-y-2">
                <div className="flex items-center text-green-600">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <span>Has access for this Couple</span>
                </div>
                <div className="text-sm text-gray-500">
                  Last signed in on{" "}
                  {client.Client.last_login_at
                    ? new Date(client.Client.last_login_at).toLocaleDateString()
                    : "Never"}{" "}
                  at{" "}
                  {client.Client.last_login_at
                    ? new Date(client.Client.last_login_at).toLocaleTimeString()
                    : ""}
                </div>
                <div className="flex items-center text-green-600">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <span>Request new appointments for this Couple</span>
                </div>
                <div className="flex items-center text-green-600">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <span>Send and receive secure messages</span>
                </div>
                <div className="flex items-center text-green-600">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <span>Access billing documents for this Couple</span>
                </div>
                <div className="flex items-center text-green-600">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <span>Receive this Couple's announcements</span>
                </div>
              </div>
            ) : (
              "No Client Portal access"
            )
          }
        />
        <ClientDetailsRow
          label="Billing & Payments"
          value={
            client.is_responsible_for_billing
              ? "Responsible for billing"
              : "Not responsible for billing"
          }
        />
      </CardContent>
    </Card>
  );
}

function ManageButton({ clientData }: { clientData: ClientMembership }) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const updateClientMutation = useUpdateClient();
  const { toast } = useToast();

  const handleSaveClient = async (formData: ClientFormValues) => {
    await updateClientMutation.mutateAsync({
      body: { ...formData, id: clientData.Client.id },
    });
    toast({
      title: "Client updated",
      variant: "success",
      description: "Client information updated successfully",
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="flex items-center">
          <Button className="flex items-center" size="sm" variant="outline">
            Manage
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setIsEditDrawerOpen(true)}>
            View/Edit Client Info
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditClientDrawer
        clientData={clientData}
        isOpen={isEditDrawerOpen}
        title={`Edit ${clientData.Client.legal_first_name} ${clientData.Client.legal_last_name}`}
        onClose={() => setIsEditDrawerOpen(false)}
        onSave={handleSaveClient}
      />
    </>
  );
}

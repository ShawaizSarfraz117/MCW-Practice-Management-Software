"use client";

import { ClientMembership } from "@/(dashboard)/clients/types";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mcw/ui";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
// import { EditClientDrawer } from "./EditClientDrawer";

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
    (contact) => contact.contact_type === "EMAIL",
  );
  const phones = client.Client.ClientContact.filter(
    (contact) => contact.contact_type === "PHONE",
  );

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-6">
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
              ? phones.map((contact) => (
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
              ? emails.map((contact) => (
                  <div key={contact.id} className="flex items-center">
                    <span>{contact.value}</span>
                    {contact.is_primary && (
                      <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        Home
                      </span>
                    )}
                  </div>
                ))
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
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
  console.log("🚀 ~ ManageButton ~ clientData:", clientData);
  const [_isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  // const handleSaveClient = async (formData: EditClientFormValues) => {
  //   console.log("Saving client data:", formData);
  //   // In a real app, you would call an API to save the data
  //   // await updateClient(clientData.Client.id, formData);
  // };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center">
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

      {/* <EditClientDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        client={clientData}
        onSave={handleSaveClient}
      /> */}
    </>
  );
}

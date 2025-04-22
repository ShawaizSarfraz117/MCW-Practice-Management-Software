"use client";

import DataTable from "@/components/table/DataTable";
import { Badge } from "@mcw/ui";
import { Client, ClientContact, ClientGroupMembership } from "@prisma/client";

interface ClientTableProps {
  rows: Client[];
  onRowClick: (row: object) => void;
}

// Define the expected shape of client data from the API
interface ClientWithRelations extends Client {
  name: string;
  type: string;
  is_waitlist: boolean;
  ClientGroupMembership: (ClientGroupMembership & {
    ClientGroup: {
      id: string;
      name: string;
      type: string;
    };
    Client: Client & {
      ClientContact: ClientContact[];
    };
  })[];
}

const ClientTable = ({ rows, onRowClick }: ClientTableProps) => {
  const columns = [
    {
      key: "name",
      label: "Name",
      value: "name",
      formatter: (value: unknown) => {
        const row = value as ClientWithRelations;
        return <div className="text-blue-500 hover:underline">{row.name}</div>;
      },
    },
    {
      key: "type",
      label: "Type",
      value: "type",
      formatter: (value: unknown) => {
        const row = value as ClientWithRelations;
        return <div>{row.type}</div>;
      },
    },
    {
      key: "status",
      label: "Status",
      value: "ClientGroupMembership",
      formatter: (value: unknown) => {
        const row = value as ClientWithRelations;
        return (
          <Badge
            className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50"
            variant="outline"
          >
            {row.ClientGroupMembership.length > 0
              ? row.ClientGroupMembership[0].Client.is_active
                ? "Active"
                : "Inactive"
              : "Inactive"}
          </Badge>
        );
      },
    },
    {
      key: "phone",
      label: "Phone",
      value: "ClientContact",
      formatter: (value: unknown) => {
        const row = value as ClientWithRelations;
        // Find the first client membership with a phone contact
        const phoneContact = row.ClientGroupMembership.flatMap((membership) =>
          membership.Client.ClientContact.filter(
            (contact) => contact.contact_type === "PHONE",
          ),
        )[0];

        return <div className="text-gray-500">{phoneContact?.value || ""}</div>;
      },
    },
    {
      key: "email",
      label: "Email",
      value: "ClientContact",
      formatter: (value: unknown) => {
        const row = value as ClientWithRelations;
        // Find the first client membership with an email contact
        const emailContact = row.ClientGroupMembership.flatMap((membership) =>
          membership.Client.ClientContact.filter(
            (contact) => contact.contact_type === "EMAIL",
          ),
        )[0];

        return <div className="text-gray-500">{emailContact?.value || ""}</div>;
      },
    },
    {
      key: "waitlist",
      label: "Waitlist",
      value: "is_waitlist",
      formatter: (value: unknown) => {
        const row = value as ClientWithRelations;
        return (
          <p>
            {row.ClientGroupMembership[0].Client.is_waitlist ? "Yes" : "No"}
          </p>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows as Record<string, unknown>[]}
      onRowClick={onRowClick}
    />
  );
};

export default ClientTable;

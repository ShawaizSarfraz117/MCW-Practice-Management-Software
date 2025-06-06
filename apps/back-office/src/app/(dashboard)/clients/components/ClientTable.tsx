"use client";

import DataTable from "@/components/table/DataTable";
import { Badge } from "@mcw/ui";
import { ClientGroupWithMembership } from "../services/client.service";

interface ClientTableProps {
  rows: ClientGroupWithMembership[];
  onRowClick: (row: object) => void;
}

const ClientTable = ({ rows, onRowClick }: ClientTableProps) => {
  const columns = [
    {
      key: "name",
      label: "Name",
      value: "name",
      formatter: (value: unknown) => {
        const row = value as ClientGroupWithMembership;
        return <div className="text-blue-500 hover:underline">{row.name}</div>;
      },
    },
    {
      key: "type",
      label: "Type",
      value: "type",
      formatter: (value: unknown) => {
        const row = value as ClientGroupWithMembership;
        return <div>{row.type}</div>;
      },
    },
    {
      key: "status",
      label: "Status",
      value: "is_active",
      formatter: (value: unknown) => {
        const row = value as ClientGroupWithMembership;
        return (
          <Badge
            className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50"
            variant="outline"
          >
            {row.is_active ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      key: "phone",
      label: "Phone",
      value: "ClientGroupMembership",
      formatter: (value: unknown) => {
        const row = value as ClientGroupWithMembership;
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
      value: "ClientGroupMembership",
      formatter: (value: unknown) => {
        const row = value as ClientGroupWithMembership;
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
      value: "ClientGroupMembership",
      formatter: (value: unknown) => {
        const row = value as ClientGroupWithMembership;
        return (
          <p>
            {row.ClientGroupMembership[0]?.Client?.is_waitlist ? "Yes" : "No"}
          </p>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows as unknown as Record<string, unknown>[]}
      onRowClick={onRowClick}
    />
  );
};

export default ClientTable;

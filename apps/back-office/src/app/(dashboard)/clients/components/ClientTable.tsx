"use client";

import { Badge } from "@mcw/ui";
import DataTable from "@/components/table/DataTable";
import {
  Client,
  ClientContact,
  ClientGroup,
  ClientGroupMembership,
} from "@prisma/client";

interface ClientTableProps {
  rows: Client[];
  onRowClick: (row: unknown) => void;
}

const ClientTable = ({ rows, onRowClick }: ClientTableProps) => {
  const columns = [
    {
      key: "name",
      label: "Name",
      formatter: (row: {
        legal_first_name: string;
        legal_last_name: string;
      }) => (
        <div>
          {row.legal_first_name} {row.legal_last_name}
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      formatter: (
        row: Client & {
          ClientGroupMembership: (ClientGroupMembership & {
            ClientGroup: ClientGroup;
          })[];
        },
      ) => {
        return (
          <div className="text-gray-500">
            {row.ClientGroupMembership.length > 0
              ? row.ClientGroupMembership[0].ClientGroup.name
              : "No Group"}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      // TODO: Add right type
      formatter: (row: { is_active: boolean }) => (
        <Badge
          className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50"
          variant="outline"
        >
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      formatter: (row: Client & { ClientContact: ClientContact[] }) => {
        return (
          <div className="text-gray-500">
            {
              row.ClientContact.find(
                (contact: ClientContact) => contact.contact_type === "PHONE",
              )?.value
            }
          </div>
        );
      },
    },
    {
      key: "email",
      label: "Email",
      // TODO: Add right type
      formatter: (row: Client & { ClientContact: ClientContact[] }) => {
        return (
          <div className="text-gray-500">
            {
              row.ClientContact.find(
                (contact: ClientContact) => contact.contact_type === "EMAIL",
              )?.value
            }
          </div>
        );
      },
    },
    {
      key: "relationship",
      label: "Relationship",
    },
    {
      key: "waitlist",
      label: "Waitlist",
      formatter: (row: { is_waitlist: boolean }) => (
        <p>{row.is_waitlist ? "Yes" : "No"}</p>
      ),
    },
  ];

  return (
    // TODO: Add right type
    // @ts-expect-error - TODO: Add right type
    <DataTable columns={columns} rows={rows} onRowClick={onRowClick} />
  );
};

export default ClientTable;

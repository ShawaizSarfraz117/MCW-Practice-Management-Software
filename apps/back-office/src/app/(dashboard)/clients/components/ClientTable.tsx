"use client";

import { MoreHorizontal } from "lucide-react";
import { Button, Badge } from "@mcw/ui";
import DataTable from "@/components/table/DataTable";

const rows = [
  {
    id: 1,
    name: "Jamie D. Appleseed",
    type: "Adult",
    status: "Active",
    phone: "7275101326",
    email: "alam@mcnultycw.com",
    relationship: "Clinician: Alam Naqvi",
    waitlist: "No",
  },
  {
    id: 2,
    name: "Jamie D. Appleseed",
    type: "Adult",
    status: "Active",
    phone: "7275101326",
    email: "alam@mcnultycw.com",
    relationship: "Clinician: Alam Naqvi",
    waitlist: "No",
  },
  {
    id: 3,
    name: "Jamie D. Appleseed",
    type: "Adult",
    status: "Active",
    phone: "7275101326",
    email: "alam@mcnultycw.com",
    relationship: "Clinician: Alam Naqvi",
    waitlist: "No",
  },
  {
    id: 4,
    name: "Jamie D. Appleseed",
    type: "Adult",
    status: "Active",
    phone: "7275101326",
    email: "alam@mcnultycw.com",
    relationship: "Clinician: Alam Naqvi",
    waitlist: "No",
  },
];

// TODO: Add right type
const ClientTable = (props: { onRowClick: (id: string) => void }) => {
  const columns = [
    {
      key: "name",
      label: "Name",
    },
    {
      key: "type",
      label: "Type",
    },
    {
      key: "status",
      label: "Status",
      // TODO: Add right type
      formatter: (row: { status: string }) => (
        <Badge
          className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50"
          variant="outline"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "phone",
      label: "Phone",
    },
    {
      key: "email",
      label: "Email",
      // TODO: Add right type
      formatter: (row: { email: string }) => (
        <div className="text-gray-500">{row.email}</div>
      ),
    },
    {
      key: "relationship",
      label: "Relationship",
    },
    {
      key: "waitlist",
      label: "Waitlist",
    },
    {
      key: "actions",
      label: "Actions",
      formatter: () => (
        <Button className="h-8 w-8" size="icon" variant="ghost">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      ),
    },
  ];

  return (
    // TODO: Add right type
    // @ts-expect-error - TODO: Add right type
    <DataTable columns={columns} rows={rows} onRowClick={props.onRowClick} />
  );
};

export default ClientTable;

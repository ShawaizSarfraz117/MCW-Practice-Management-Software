"use client"

import { MoreHorizontal } from "lucide-react"
import { Button, Badge } from "@mcw/ui"
import DataTable from "@/components/table/DataTable"

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
]

const ClientTable = (props: any) => {
  const columns = [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'type',
      label: 'Type',
    },
    {
      key: 'status',
      label: 'Status',
      formatter: (row: any) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50">
          {row.status}
        </Badge>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
    },
    {
      key: 'email',
      label: 'Email',
      formatter: (row: any) => (
        <div className="text-gray-500">
          {row.email}
        </div>
      )
    },
    {
      key: 'relationship',
      label: 'Relationship',
    },
    {
      key: 'waitlist',
      label: 'Waitlist',
    },
    {
      key: "actions",
      label: "Actions",
      formatter: (row: any) => (
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      )
    },
  ]

  return (
    <DataTable columns={columns} rows={rows} title="Clients Data" {...props} />
  )
}

export default ClientTable 
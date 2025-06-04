"use client";

import {
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mcw/ui";
import { MoreHorizontal } from "lucide-react";

// Mock data for the status cards
const statusItems = [
  {
    id: "prospective",
    title: "Prospective clients",
    count: 0,
    highlight: false,
  },
  {
    id: "active",
    title: "Active clients",
    count: 1,
    highlight: false,
  },
  {
    id: "expiring",
    title: "Expiring soon",
    count: 0,
    highlight: false,
  },
  {
    id: "incomplete",
    title: "Documents incomplete",
    count: 0,
    highlight: false,
  },
  {
    id: "completed",
    title: "Documents completed",
    count: 0,
    highlight: false,
  },
];

// Mock data for the filters
const filters = [
  {
    id: "clinicians",
    label: "All clinicians",
    options: ["All clinicians", "Travis McNulty", "Dr. Martin", "Dr. Johnson"],
  },
  {
    id: "client_statuses",
    label: "All client statuses",
    options: [
      "All client statuses",
      "Active",
      "Inactive",
      "Pending",
      "Completed",
    ],
  },
  {
    id: "locations",
    label: "All locations",
    options: ["All locations", "Office A", "Office B", "Remote"],
  },
  {
    id: "document_statuses",
    label: "All document statuses",
    options: ["All document statuses", "Complete", "Incomplete", "Pending"],
  },
  {
    id: "expiring",
    label: "Expiring Soon",
    options: ["Expiring Soon", "Next 7 days", "Next 30 days", "Next 90 days"],
  },
];

// Mock client data
const clients = [
  {
    id: 1,
    name: "Hazel Lopez",
    age: 7,
    isMinor: true,
    guardian: "Katie Lopez",
    clinician: "Travis McNulty",
    appointment: {
      date: "Mon, Mar 10, 2025",
      time: "9:15 AM",
      duration: "60 mins",
    },
    status: "Pending",
    dateReceived: "03/05/2023",
    action: "Accept",
  },
];

export default function PendingRequestView() {
  return (
    <div className="mt-4">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {statusItems.map((item) => (
          <Card
            key={item.id}
            className={`p-4 ${item.highlight ? "bg-blue-100" : "bg-white"}`}
          >
            <h3 className="text-gray-600 text-sm">{item.title}</h3>
            <p className="text-4xl font-bold my-3">{item.count}</p>
            <a href="#" className="text-blue-600 text-sm font-medium">
              View
            </a>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {filters.map((filter) => (
          <div key={filter.id}>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* Client Table */}
      <div className="border rounded-md shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Clinician</TableHead>
              <TableHead>Appointment details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date received</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {client.name}
                      <span className="text-sm text-gray-500 ml-1">
                        (age {client.age})
                      </span>
                    </div>
                    {client.isMinor && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                          Minor
                        </span>
                        <span className="text-sm text-gray-600">
                          {client.guardian}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{client.clinician}</TableCell>
                <TableCell>
                  {client.appointment.date} - {client.appointment.time} (
                  {client.appointment.duration})
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {client.status}
                  </span>
                </TableCell>
                <TableCell>{client.dateReceived}</TableCell>
                <TableCell className="text-right flex items-center justify-end">
                  <button className="text-blue-600 text-sm font-medium mr-2">
                    {client.action}
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

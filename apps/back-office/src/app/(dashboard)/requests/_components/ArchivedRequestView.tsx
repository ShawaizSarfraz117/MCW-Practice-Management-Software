"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import {
  ArchiveIcon,
  CheckCircle2,
  EyeIcon,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useState } from "react";

// Mock data for archived requests
const archivedRequests = [
  {
    id: "REQ-001",
    clientName: "John Smith",
    type: "Medical Records",
    requestDate: "2023-03-10",
    status: "Completed",
    archivedDate: "2023-03-15",
  },
  {
    id: "REQ-002",
    clientName: "Emma Johnson",
    type: "Insurance Verification",
    requestDate: "2023-04-05",
    status: "Rejected",
    archivedDate: "2023-04-08",
  },
  {
    id: "REQ-003",
    clientName: "Michael Brown",
    type: "Prescription Renewal",
    requestDate: "2023-04-15",
    status: "Completed",
    archivedDate: "2023-04-20",
  },
  {
    id: "REQ-004",
    clientName: "Sarah Davis",
    type: "Appointment Reschedule",
    requestDate: "2023-05-01",
    status: "Completed",
    archivedDate: "2023-05-03",
  },
  {
    id: "REQ-005",
    clientName: "David Wilson",
    type: "Billing Inquiry",
    requestDate: "2023-05-10",
    status: "Rejected",
    archivedDate: "2023-05-12",
  },
];

// Mock data for dropdown options - similar to PendingRequestView
const filterOptions = [
  {
    id: "status",
    title: "Status",
    options: ["All", "Completed", "Rejected", "Cancelled"],
  },
  {
    id: "type",
    title: "Request Type",
    options: [
      "All Types",
      "Medical",
      "Insurance",
      "Billing",
      "Appointment",
      "Other",
    ],
  },
  {
    id: "date",
    title: "Archive Date",
    options: [
      "All Time",
      "Last 30 Days",
      "Last 90 Days",
      "Last Year",
      "Custom Range",
    ],
  },
  {
    id: "client",
    title: "Client",
    options: ["All Clients", "Active Clients", "Inactive Clients"],
  },
  {
    id: "sort",
    title: "Sort By",
    options: [
      "Newest First",
      "Oldest First",
      "Client Name (A-Z)",
      "Client Name (Z-A)",
    ],
  },
];

export default function ArchivedRequestView() {
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string>
  >({});

  const handleFilterChange = (filterId: string, value: string) => {
    setSelectedFilters({
      ...selectedFilters,
      [filterId]: value,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return (
          <div className="inline-flex items-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
            </span>
          </div>
        );
      case "Rejected":
        return (
          <div className="inline-flex items-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700">
              <X className="h-3 w-3 mr-1" /> Rejected
            </span>
          </div>
        );
      case "Pending":
        return (
          <div className="inline-flex items-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
              Pending
            </span>
          </div>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-50 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary Card */}

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-medium mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {filterOptions.map((filter) => (
            <div key={filter.id} className="space-y-2">
              <label
                htmlFor={filter.id}
                className="text-sm font-medium text-gray-700"
              >
                {filter.title}
              </label>
              <Select
                value={selectedFilters[filter.id]}
                onValueChange={(value) => handleFilterChange(filter.id, value)}
              >
                <SelectTrigger id={filter.id} className="w-full">
                  <SelectValue placeholder={`Select ${filter.title}`} />
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
      </div>

      {/* Archived Requests Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Archived Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {archivedRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-gray-100 p-3 mb-3">
                      <ArchiveIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No archived requests found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              archivedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.id}</TableCell>
                  <TableCell>{request.clientName}</TableCell>
                  <TableCell>{request.type}</TableCell>
                  <TableCell>{request.requestDate}</TableCell>
                  <TableCell>{request.archivedDate}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="focus:outline-none">
                        <MoreHorizontal className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center">
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

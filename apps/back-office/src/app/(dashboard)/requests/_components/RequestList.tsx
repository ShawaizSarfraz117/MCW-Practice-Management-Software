"use client";

import {
  Badge,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mcw/ui";
import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  MoreHorizontal,
  PlusCircle,
  X,
} from "lucide-react";

interface RequestListProps {
  type: "all" | "pending" | "notifications";
}

// Mock data for the request list
const mockRequests = [
  {
    id: "REQ-001",
    clientName: "John Smith",
    type: "Appointment",
    requestDate: "2023-06-10",
    status: "Pending",
    message: "Requesting an appointment for next week",
  },
  {
    id: "REQ-002",
    clientName: "Emma Johnson",
    type: "Document",
    requestDate: "2023-06-09",
    status: "Completed",
    message: "Need insurance verification form",
  },
  {
    id: "REQ-003",
    clientName: "Michael Brown",
    type: "Billing",
    requestDate: "2023-06-08",
    status: "Pending",
    message: "Question about last invoice",
  },
  {
    id: "REQ-004",
    clientName: "Sarah Davis",
    type: "Information",
    requestDate: "2023-06-07",
    status: "Rejected",
    message: "Inquiry about therapy options",
  },
  {
    id: "REQ-005",
    clientName: "David Wilson",
    type: "Appointment",
    requestDate: "2023-06-06",
    status: "Pending",
    message: "Need to reschedule my appointment",
  },
];

export default function RequestList({ type }: RequestListProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Filter requests based on the type
  const filteredRequests =
    type === "all"
      ? mockRequests
      : type === "pending"
        ? mockRequests.filter((req) => req.status === "Pending")
        : mockRequests.filter((req) => req.status !== "Completed");

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredRequests.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredRequests.map((req) => req.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return (
          <Badge
            className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
            variant="outline"
          >
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        );
      case "Pending":
        return (
          <Badge
            className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1"
            variant="outline"
          >
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case "Rejected":
        return (
          <Badge
            className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1"
            variant="outline"
          >
            <X className="h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div>
      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
          <div className="text-sm">
            <span className="font-medium">{selectedItems.length}</span> items
            selected
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Mark as Complete
            </Button>
            <Button
              className="text-red-600 border-red-200 hover:bg-red-50"
              size="sm"
              variant="outline"
            >
              Reject
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all requests"
                  checked={
                    selectedItems.length === filteredRequests.length &&
                    filteredRequests.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Request ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell className="h-32 text-center" colSpan={8}>
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="text-gray-400 rounded-full bg-gray-100 p-3">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">
                        No requests found
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        No request data available for this category
                      </p>
                    </div>
                    <Button className="gap-1 mt-2" size="sm">
                      <PlusCircle className="h-4 w-4" />
                      Create New Request
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Checkbox
                      aria-label={`Select request ${request.id}`}
                      checked={selectedItems.includes(request.id)}
                      onCheckedChange={() => toggleSelect(request.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{request.id}</TableCell>
                  <TableCell>{request.clientName}</TableCell>
                  <TableCell>{request.type}</TableCell>
                  <TableCell>{request.requestDate}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {request.message}
                  </TableCell>
                  <TableCell>
                    <Button className="h-8 w-8" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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

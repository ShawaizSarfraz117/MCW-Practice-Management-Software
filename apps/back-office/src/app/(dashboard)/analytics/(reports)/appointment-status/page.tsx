"use client";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  SearchSelect,
} from "@mcw/ui";
import {
  Calendar,
  ChevronRight,
  ChevronDown,
  Download,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  Users,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import DateRangePicker from "@/(dashboard)/activity/components/DateRangePicker";
import { useAppointmentStatus } from "@/(dashboard)/analytics/hooks/useAnalytics";
import { useQuery } from "@tanstack/react-query";
import { FETCH } from "@mcw/utils";

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "SHOW":
      return "bg-green-100 text-green-700";
    case "NO_SHOW":
      return "bg-red-100 text-red-700";
    case "CANCELLED":
    case "LATE_CANCELLED":
    case "CLINICIAN_CANCELLED":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// Helper function to format status text
const formatStatus = (status: string) => {
  return status?.replace(/_/g, " ") || "SHOW";
};

export default function AppointmentStatusPage() {
  const today = new Date();
  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };
  const todayStr = formatDate(today);

  const [filters, setFilters] = useState({
    showDatePicker: false,
    fromDate: todayStr,
    toDate: todayStr,
    selectedTimeRange: todayStr,
    selectedClient: "all",
    selectedStatus: "all",
    selectedNote: "all",
    rowsPerPage: "20",
    currentPage: 1,
  });

  // Fetch clients for dropdown
  const { data: clientsData } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const response = await FETCH.get({
        url: "/client",
        searchParams: { pageSize: "100" },
      });
      return response as { data: Array<{ id: string; name: string }> };
    },
  });

  const clientOptions = [
    { label: "All clients", value: "all" },
    ...(clientsData?.data?.map((client) => ({
      label: client.name,
      value: client.id,
    })) || []),
  ];

  const statusOptions = [
    { label: "All statuses", value: "all" },
    { label: "Show", value: "SHOW" },
    { label: "No Show", value: "NO_SHOW" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Late Cancelled", value: "LATE_CANCELLED" },
    { label: "Clinician Cancelled", value: "CLINICIAN_CANCELLED" },
  ];

  const noteOptions = [
    { label: "All notes", value: "all" },
    { label: "With Note", value: "with_note" },
    { label: "No Note", value: "no_note" },
  ];

  // Fetch appointment status data
  const { data, isLoading, error } = useAppointmentStatus({
    startDate: filters.fromDate,
    endDate: filters.toDate,
    clientId:
      filters.selectedClient !== "all" ? filters.selectedClient : undefined,
    status:
      filters.selectedStatus !== "all" ? filters.selectedStatus : undefined,
    noteStatus: filters.selectedNote as "all" | "with_note" | "no_note",
    page: filters.currentPage,
    pageSize: parseInt(filters.rowsPerPage),
  });

  const handleDatePickerApply = (
    startDate: string,
    endDate: string,
    displayOption: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      fromDate: startDate,
      toDate: endDate,
      selectedTimeRange:
        displayOption === "Custom Range"
          ? `${startDate} - ${endDate}`
          : displayOption,
      showDatePicker: false,
      currentPage: 1,
    }));
  };

  const handleDatePickerCancel = () => {
    setFilters((prev) => ({
      ...prev,
      showDatePicker: false,
    }));
  };

  return (
    <div className="h-full">
      <div className="p-6 bg-gray-50 min-h-screen space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link className="hover:text-primary" href="/analytics">
            Analytics
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Appointment Status</span>
        </div>

        {/* Title and Export */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Appointment Status</h1>
            <p className="text-sm text-gray-500">
              Brief view of past appointment statuses.{" "}
              <Link className="text-primary hover:underline" href="#">
                Learn More
              </Link>
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2" variant="outline">
                Export
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative inline-block">
            <Button
              className="bg-green-50 border-green-100 text-green-700 hover:bg-green-100 hover:text-green-800"
              variant="outline"
              onClick={() =>
                setFilters((prev) => ({ ...prev, showDatePicker: true }))
              }
            >
              <Calendar className="w-4 h-4 mr-2" />
              {filters.selectedTimeRange}
            </Button>
            {filters.showDatePicker && (
              <div className="absolute z-50">
                <DateRangePicker
                  initialEndDate={filters.toDate}
                  initialStartDate={filters.fromDate}
                  isOpen={filters.showDatePicker}
                  onApply={handleDatePickerApply}
                  onClose={handleDatePickerCancel}
                />
              </div>
            )}
          </div>
          <div className="w-[200px]">
            <SearchSelect
              searchable
              icon={<Users className="w-4 h-4" />}
              options={clientOptions}
              placeholder="Select client"
              value={filters.selectedClient}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  selectedClient: value,
                  currentPage: 1,
                }))
              }
            />
          </div>
          <div className="w-[160px]">
            <SearchSelect
              searchable
              options={statusOptions}
              placeholder="Select status"
              value={filters.selectedStatus}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  selectedStatus: value,
                  currentPage: 1,
                }))
              }
            />
          </div>
          <div className="w-[160px]">
            <SearchSelect
              searchable
              options={noteOptions}
              placeholder="Select note"
              value={filters.selectedNote}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  selectedNote: value,
                  currentPage: 1,
                }))
              }
            />
          </div>
          <Button className="gap-2" variant="outline">
            More: 1
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs and Table */}
        <Tabs className="w-full" defaultValue="appointments">
          <TabsList className="mb-4">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="client-responsibility">
              Client Responsibility
            </TabsTrigger>
          </TabsList>

          <TabsContent
            className="bg-white rounded-lg border border-gray-200"
            value="appointments"
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date Of Service</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Total Fee</TableHead>
                  <TableHead>Progress Note Status</TableHead>
                  <TableHead>Appointment Status</TableHead>
                  <TableHead>Invoice Status</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Uninvoiced</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Unpaid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center py-8 text-red-600"
                    >
                      Failed to load appointment data
                    </TableCell>
                  </TableRow>
                ) : data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center py-8 text-gray-500"
                    >
                      No appointments found for the selected criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((appointment) => (
                    <TableRow key={appointment.id} className="hover:bg-gray-50">
                      <TableCell>
                        {new Date(
                          appointment.dateOfService,
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-primary hover:underline cursor-pointer">
                        {appointment.client}
                      </TableCell>
                      <TableCell>{appointment.units}</TableCell>
                      <TableCell>{appointment.totalFee}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                            appointment.progressNoteStatus === "NO NOTE"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {appointment.progressNoteStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${getStatusColor(
                            appointment.status,
                          )}`}
                        >
                          {formatStatus(appointment.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                            appointment.invoiceStatus === "PAID"
                              ? "bg-green-100 text-green-700"
                              : appointment.invoiceStatus === "UNPAID"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {appointment.invoiceStatus}
                        </span>
                      </TableCell>
                      <TableCell>{appointment.charge}</TableCell>
                      <TableCell>{appointment.uninvoiced}</TableCell>
                      <TableCell>{appointment.paid}</TableCell>
                      <TableCell>{appointment.unpaid}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Table Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Rows per page</span>
                <Select
                  value={filters.rowsPerPage}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      rowsPerPage: value,
                      currentPage: 1,
                    }))
                  }
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-700">
                  {data
                    ? `${(filters.currentPage - 1) * parseInt(filters.rowsPerPage) + 1}-${Math.min(filters.currentPage * parseInt(filters.rowsPerPage), data.pagination.total)} of ${data.pagination.total}`
                    : "0 of 0"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  disabled={filters.currentPage === 1}
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, currentPage: 1 }))
                  }
                >
                  <ChevronFirst className="w-4 h-4" />
                </Button>
                <Button
                  disabled={filters.currentPage === 1}
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage - 1,
                    }))
                  }
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  disabled={
                    !data || filters.currentPage === data.pagination.totalPages
                  }
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage + 1,
                    }))
                  }
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  disabled={
                    !data || filters.currentPage === data.pagination.totalPages
                  }
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      currentPage: data?.pagination?.totalPages || 1,
                    }))
                  }
                >
                  <ChevronLast className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documentation">
            <div className="h-[200px] flex items-center justify-center text-gray-500">
              Documentation tab content
            </div>
          </TabsContent>

          <TabsContent value="client-responsibility">
            <div className="h-[200px] flex items-center justify-center text-gray-500">
              Client Responsibility tab content
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

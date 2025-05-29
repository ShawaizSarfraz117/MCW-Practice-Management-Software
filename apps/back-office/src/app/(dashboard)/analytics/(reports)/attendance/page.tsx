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
  AlertCircle,
  Users,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import DateRangePicker from "../../../activity/components/DateRangePicker";

type Appointment = {
  id: string;
  clientName: string;
  dateOfService: string;
  status: string;
};

const mockData: Appointment[] = [
  {
    id: "1",
    clientName: "Shawaiz Sarfraz",
    dateOfService: "04/16/2025",
    status: "Show",
  },
  {
    id: "2",
    clientName: "Shawaiz Sarfraz",
    dateOfService: "04/18/2025",
    status: "Show",
  },
  {
    id: "3",
    clientName: "Shawaiz Sarfraz & Mrs Shawaiz",
    dateOfService: "04/16/2025",
    status: "Show",
  },
];

export default function AttendancePage() {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const today = new Date();
  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };
  const todayStr = formatDate(today);
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [selectedTimeRange, setSelectedTimeRange] = useState(todayStr);
  const [selectedClient, setSelectedClient] = useState("All clients");
  const [selectedStatus, setSelectedStatus] = useState("All statuses");
  const clientOptions = [
    "All clients",
    "Shawaiz Sarfraz",
    "Shawaiz Sarfraz & Mrs Shawaiz",
  ];
  const statusOptions = ["All statuses", "Show", "No Show", "Cancelled"];
  const [rowsPerPage, setRowsPerPage] = useState("10");

  const handleDatePickerApply = (
    startDate: string,
    endDate: string,
    displayOption: string,
  ) => {
    setFromDate(startDate);
    setToDate(endDate);
    setSelectedTimeRange(
      displayOption === "Custom Range"
        ? `${startDate} - ${endDate}`
        : displayOption,
    );
    setShowDatePicker(false);
  };

  const handleDatePickerCancel = () => {
    setShowDatePicker(false);
  };

  return (
    <div className="h-full">
      <div className="p-6 bg-gray-50 min-h-screen space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/analytics" className="hover:text-primary">
            Analytics
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Attendance</span>
        </div>

        {/* Title and Export */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Attendance</h1>
            <p className="text-sm text-gray-500">
              Broad view of past appointment statuses.{" "}
              <Link href="#" className="text-primary hover:underline">
                Learn More
              </Link>
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
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

        {/* Warning Banner */}
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div className="space-y-1">
              <h3 className="font-medium text-orange-900">
                Group appointment data coming soon
              </h3>
              <p className="text-orange-700">
                Currently, this report only includes data from individual
                appointments and couple appointments.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative inline-block">
            <Button
              variant="outline"
              className="bg-green-50 border-green-100 text-green-700 hover:bg-green-100 hover:text-green-800"
              onClick={() => setShowDatePicker(true)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {selectedTimeRange}
            </Button>
            {showDatePicker && (
              <div className="absolute z-50">
                <DateRangePicker
                  isOpen={showDatePicker}
                  onClose={() => setShowDatePicker(false)}
                  onApply={handleDatePickerApply}
                  onCancel={handleDatePickerCancel}
                  initialStartDate={fromDate}
                  initialEndDate={toDate}
                />
              </div>
            )}
          </div>
          <div className="w-[200px]">
            <SearchSelect
              options={clientOptions.map((client) => ({
                label: client,
                value: client,
              }))}
              value={selectedClient}
              onValueChange={setSelectedClient}
              placeholder="Select client"
              searchable
              icon={<Users className="w-4 h-4" />}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                {selectedStatus}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {statusOptions.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className="cursor-pointer"
                >
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Client</TableHead>
                <TableHead>Date of service</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((appointment) => (
                <TableRow key={appointment.id} className="hover:bg-gray-50">
                  <TableCell className="text-primary hover:underline cursor-pointer">
                    {appointment.clientName}
                  </TableCell>
                  <TableCell>{appointment.dateOfService}</TableCell>
                  <TableCell className="text-green-600">
                    {appointment.status}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Table Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Rows per page</span>
              <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-700">1-3 of 3</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" disabled>
                <ChevronFirst className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" disabled>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" disabled>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" disabled>
                <ChevronLast className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

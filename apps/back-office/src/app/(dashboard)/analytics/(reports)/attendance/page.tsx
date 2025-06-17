"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mcw/ui";
import { ChevronDown, Download, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  useAttendanceData,
  exportAttendanceData,
  useClientGroups,
} from "@/(dashboard)/analytics/services/attendance.service";
import AttendanceFilters, {
  AttendanceFilterState,
} from "./components/AttendanceFilters";
import AttendanceTable from "./components/AttendanceTable";
import AttendancePagination from "./components/AttendancePagination";
import AttendanceSummary from "./components/AttendanceSummary";

export default function AttendancePage() {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const todayStr = formatDate(today);
  const thirtyDaysAgoStr = formatDate(thirtyDaysAgo);
  const defaultTimeRange = `${thirtyDaysAgoStr} - ${todayStr}`;

  const [filters, setFilters] = useState<AttendanceFilterState>({
    showDatePicker: false,
    fromDate: thirtyDaysAgoStr,
    toDate: todayStr,
    selectedTimeRange: defaultTimeRange,
    selectedClient: "All clients",
    selectedStatus: "All statuses",
    rowsPerPage: "10",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);

  const { data: clientGroupsData } = useClientGroups();

  // Create a map of client names to group IDs
  const clientNameToGroupId = new Map<string, string>();
  const clientOptionsData: string[] = [];

  if (clientGroupsData?.data) {
    clientGroupsData.data.forEach((group) => {
      // Get the primary client's name from the group
      const primaryMember =
        group.ClientGroupMembership.find((m) => !m.is_contact_only) ||
        group.ClientGroupMembership[0];
      if (primaryMember?.Client) {
        const client = primaryMember.Client;
        const name = `${client.legal_first_name} ${client.legal_last_name}`;
        clientNameToGroupId.set(name, group.id);
        clientOptionsData.push(name);
      }
    });

    // Sort client names alphabetically
    clientOptionsData.sort((a, b) => a.localeCompare(b));
  }

  const clientOptions = ["All clients", ...clientOptionsData];

  // Prepare API filters
  const apiFilters = {
    startDate: filters.fromDate,
    endDate: filters.toDate,
    clientGroupId:
      filters.selectedClient === "All clients"
        ? "all"
        : clientNameToGroupId.get(filters.selectedClient) || "all",
    status:
      filters.selectedStatus === "All statuses"
        ? "all"
        : filters.selectedStatus.toLowerCase().replace(" ", "_"),
    page: currentPage,
    limit: pageLimit,
  };

  const {
    data: attendanceData,
    isLoading,
    error,
  } = useAttendanceData(apiFilters);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.fromDate,
    filters.toDate,
    filters.selectedClient,
    filters.selectedStatus,
  ]);

  const statusOptions = [
    "All statuses",
    "Show",
    "No Show",
    "Cancelled",
    "Late Cancelled",
    "Clinician Cancelled",
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit: number) => {
    setPageLimit(limit);
    setCurrentPage(1);
  };

  const handleExport = async (format: "csv" | "excel") => {
    try {
      const blob = await exportAttendanceData(format, apiFilters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      const extension = format === "excel" ? "xlsx" : format;
      a.download = `attendance-report.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
      // Could add toast notification here
    }
  };

  return (
    <div className="h-full">
      <div className="p-6 bg-gray-50 min-h-screen space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Attendance</h1>
            <p className="text-sm text-gray-500">
              Broad view of past appointment statuses.{" "}
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
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <Download className="w-4 h-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="space-y-1">
                <h3 className="font-medium text-red-900">Error loading data</h3>
                <p className="text-red-700">
                  {error instanceof Error
                    ? error.message
                    : "Failed to load attendance data"}
                </p>
              </div>
            </div>
          </div>
        )}

        <AttendanceFilters
          clientOptions={clientOptions}
          filters={filters}
          setFilters={setFilters}
          statusOptions={statusOptions}
        />

        {attendanceData && (
          <AttendanceSummary
            isLoading={isLoading}
            summary={attendanceData.summary}
          />
        )}

        <AttendanceTable
          data={attendanceData?.data || []}
          isLoading={isLoading}
        />

        {attendanceData && (
          <div className="bg-white rounded-lg border border-gray-200">
            <AttendancePagination
              pagination={attendanceData.pagination}
              onLimitChange={handleLimitChange}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

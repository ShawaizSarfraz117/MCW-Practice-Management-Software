"use client";

import { Download, ChevronDown } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@mcw/ui";
import { useState } from "react";
import {
  useAppointmentStatus,
  exportAppointmentStatus,
} from "@/(dashboard)/analytics/services/appointment-status.service";
import AppointmentStatusTable from "./components/AppointmentStatusTable";
import AppointmentStatusFilters from "./components/AppointmentStatusFilters";
import AppointmentStatusPagination from "./components/AppointmentStatusPagination";

export default function AppointmentStatusPage() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // First day of current month

  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const todayStr = formatDate(today);
  const startOfMonthStr = formatDate(startOfMonth);

  const [filters, setFilters] = useState({
    showDatePicker: false,
    startDate: startOfMonthStr,
    endDate: todayStr,
    selectedTimeRange: `${startOfMonthStr} - ${todayStr}`,
    selectedClient: "",
    page: 1,
    limit: 25,
  });

  const { data: appointmentData, isLoading } = useAppointmentStatus({
    startDate: filters.startDate,
    endDate: filters.endDate,
    page: filters.page,
    limit: filters.limit,
    clientGroupId: filters.selectedClient || undefined,
  });

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleItemsPerPageChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleExport = async (format: "csv" | "excel") => {
    try {
      const blob = await exportAppointmentStatus(format, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        clientGroupId: filters.selectedClient || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extension = format === "excel" ? "xlsx" : format;
      a.download = `appointment-status-${filters.startDate}-to-${filters.endDate}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.log("🚀 ~ handleExport ~ error:", error);
    }
  };

  return (
    <div className="min-h-full bg-gray-50/50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            Appointment Status
          </h1>
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

        {/* Filters */}
        <AppointmentStatusFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        {/* Main Content */}
        <div>
          <AppointmentStatusTable
            data={appointmentData?.data || []}
            isLoading={isLoading}
          />

          {/* Pagination */}
          {appointmentData && appointmentData.pagination.totalPages > 1 && (
            <AppointmentStatusPagination
              currentPage={appointmentData.pagination.page}
              totalPages={appointmentData.pagination.totalPages}
              totalItems={appointmentData.pagination.total}
              itemsPerPage={appointmentData.pagination.limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

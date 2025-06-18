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
  useOutstandingBalances,
  exportOutstandingBalances,
} from "@/(dashboard)/analytics/services/outstanding-balances.service";
import OutstandingBalancesTable from "./components/OutstandingBalancesTable";
import OutstandingBalancesFilters from "./components/OutstandingBalancesFilters";
import OutstandingBalancesPagination from "./components/OutstandingBalancesPagination";

export default function OutstandingBalancesPage() {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1); // January 1st of current year

  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const todayStr = formatDate(today);
  const startOfYearStr = formatDate(startOfYear);

  const [filters, setFilters] = useState({
    showDatePicker: false,
    startDate: startOfYearStr,
    endDate: todayStr,
    selectedTimeRange: `${startOfYearStr} - ${todayStr}`,
    page: 1,
    limit: 10,
  });

  const { data: balanceData, isLoading } = useOutstandingBalances({
    startDate: filters.startDate,
    endDate: filters.endDate,
    page: filters.page,
    limit: filters.limit,
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
      const blob = await exportOutstandingBalances(format, {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extension = format === "excel" ? "xlsx" : format;
      a.download = `outstanding-balances-${filters.startDate}-to-${filters.endDate}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(`Failed to export ${format.toUpperCase()}:`, error);
      // You might want to show a toast notification here
    }
  };

  return (
    <div className="min-h-full bg-gray-50/50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            Outstanding Balances
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
        <OutstandingBalancesFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        {/* Table */}
        <div>
          <OutstandingBalancesTable
            data={balanceData?.data || []}
            isLoading={isLoading}
            totals={
              balanceData?.totals || {
                servicesProvided: 0,
                uninvoiced: 0,
                invoiced: 0,
                clientPaid: 0,
                clientBalance: 0,
              }
            }
          />

          {/* Pagination */}
          {balanceData && balanceData.pagination.totalPages > 1 && (
            <OutstandingBalancesPagination
              currentPage={balanceData.pagination.page}
              itemsPerPage={balanceData.pagination.limit}
              totalItems={balanceData.pagination.total}
              totalPages={balanceData.pagination.totalPages}
              onItemsPerPageChange={handleItemsPerPageChange}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

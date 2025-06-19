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
  useIncomeData,
  useClinicians,
  exportIncomeData,
} from "@/(dashboard)/analytics/services/income.service";
import IncomeTable from "./components/IncomeTable";
import IncomeFilters from "./components/IncomeFilters";

export default function IncomePage() {
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
    clinicianId: undefined as string | undefined,
    page: 1,
    limit: 20,
  });

  const { data: incomeData, isLoading } = useIncomeData({
    startDate: filters.startDate,
    endDate: filters.endDate,
    clinicianId: filters.clinicianId,
    page: filters.page,
    limit: filters.limit,
  });

  const { data: cliniciansData } = useClinicians();

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleExport = async (format: "csv" | "excel") => {
    try {
      const blob = await exportIncomeData(format, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        clinicianId: filters.clinicianId,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extension = format === "excel" ? "xlsx" : format;
      a.download = `income-report-${filters.startDate}-to-${filters.endDate}.${extension}`;
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
          <h1 className="text-2xl font-semibold text-gray-900">Income</h1>
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
        <IncomeFilters
          clinicians={cliniciansData || []}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        {/* Table */}
        <IncomeTable
          data={incomeData?.data || []}
          isLoading={isLoading}
          totals={
            incomeData?.totals || {
              clientPayments: 0,
              grossIncome: 0,
              netIncome: 0,
              clinicianCut: 0,
            }
          }
        />
      </div>
    </div>
  );
}

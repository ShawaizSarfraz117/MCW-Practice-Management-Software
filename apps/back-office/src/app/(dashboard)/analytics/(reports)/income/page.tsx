"use client";

import { Calendar, ChevronRight, Download, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@mcw/ui";
import Link from "next/link";
import DateRangePicker from "@/(dashboard)/activity/components/DateRangePicker";
import { useState } from "react";

export default function IncomePage() {
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
    <div className="min-h-full bg-gray-50/50">
      <div className="p-6 space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/analytics" className="text-gray-500 hover:text-primary">
            Analytics
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-500" />
          <span className="text-gray-900">Income</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Income</h1>
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

        {/* Date Range */}
        <div className="relative inline-block">
          <button
            className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-md"
            onClick={() => setShowDatePicker(true)}
          >
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{selectedTimeRange}</span>
          </button>
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

        {/* Table */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-gray-200 hover:bg-transparent">
                <TableHead className="text-gray-500">Date</TableHead>
                <TableHead className="text-left text-gray-500">
                  Client payments
                </TableHead>
                <TableHead className="text-left text-gray-500">
                  Gross income
                </TableHead>
                <TableHead className="text-left text-gray-500">
                  Net income
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-gray-50 hover:bg-gray-50 border-gray-200">
                <TableCell className="font-medium text-gray-900">
                  Totals
                </TableCell>
                <TableCell className="text-left font-medium text-gray-900">
                  $40
                </TableCell>
                <TableCell className="text-left font-medium text-gray-900">
                  $40
                </TableCell>
                <TableCell className="text-left font-medium text-gray-900">
                  $40
                </TableCell>
              </TableRow>
              <TableRow className="border-gray-200">
                <TableCell className="text-gray-500">04/21/2025</TableCell>
                <TableCell className="text-left text-gray-500">--</TableCell>
                <TableCell className="text-left text-gray-500">--</TableCell>
                <TableCell className="text-left text-gray-500">--</TableCell>
              </TableRow>
              <TableRow className="border-gray-200">
                <TableCell className="text-gray-500">04/16/2025</TableCell>
                <TableCell className="text-left text-gray-500">$20</TableCell>
                <TableCell className="text-left text-gray-500">$20</TableCell>
                <TableCell className="text-left text-gray-500">$20</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

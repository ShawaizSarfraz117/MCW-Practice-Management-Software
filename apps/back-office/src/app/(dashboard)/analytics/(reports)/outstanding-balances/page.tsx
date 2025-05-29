"use client";

import {
  Button,
  Card,
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
} from "@mcw/ui";
import {
  Calendar,
  ChevronRight,
  Download,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import DateRangePicker from "@/(dashboard)/activity/components/DateRangePicker";

type ClientBalance = {
  id: string;
  clientName: string;
  servicesProvided: number;
  uninvoiced: string;
  invoiced: number;
  clientPaid: string | number;
  clientBalance: number;
};

const mockData: ClientBalance[] = [
  {
    id: "1",
    clientName: "Jamie D. Appleseed",
    servicesProvided: 200,
    uninvoiced: "--",
    invoiced: 350,
    clientPaid: "--",
    clientBalance: 650,
  },
  {
    id: "2",
    clientName: "Shawaiz Sarfraz",
    servicesProvided: 200,
    uninvoiced: "--",
    invoiced: 190,
    clientPaid: 40,
    clientBalance: 350,
  },
  {
    id: "3",
    clientName: "Shawaiz Sarfraz & Mrs Shawaiz",
    servicesProvided: 100,
    uninvoiced: "--",
    invoiced: 100,
    clientPaid: "--",
    clientBalance: 100,
  },
];

export default function OutstandingBalancesPage() {
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
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
          <span className="text-gray-900">Outstanding Balances</span>
        </div>

        {/* Title and Actions */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Outstanding Balances</h1>
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

        {/* Date Filter */}
        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            className="bg-green-50 border-green-100 text-green-700 hover:bg-green-100 hover:text-green-800"
          >
            More: 1
          </Button>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Client</TableHead>
                <TableHead>Services provided</TableHead>
                <TableHead>
                  Uninvoiced
                  <span className="inline-block ml-1 text-gray-400">ⓘ</span>
                </TableHead>
                <TableHead>Invoiced</TableHead>
                <TableHead>Client paid</TableHead>
                <TableHead>
                  Client balance
                  <span className="inline-block ml-1 text-gray-400">ⓘ</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((client) => (
                <TableRow key={client.id} className="hover:bg-gray-50">
                  <TableCell className="text-primary hover:underline cursor-pointer">
                    {client.clientName}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(client.servicesProvided)}
                  </TableCell>
                  <TableCell>{client.uninvoiced}</TableCell>
                  <TableCell>{formatCurrency(client.invoiced)}</TableCell>
                  <TableCell>
                    {typeof client.clientPaid === "number"
                      ? formatCurrency(client.clientPaid)
                      : client.clientPaid}
                  </TableCell>
                  <TableCell className="text-primary">
                    {formatCurrency(client.clientBalance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
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
              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                <ChevronFirst className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                <ChevronLast className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

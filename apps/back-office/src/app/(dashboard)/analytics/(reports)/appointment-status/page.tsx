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
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Appointment = {
  id: string;
  dateOfService: string;
  client: string;
  billingCode: string;
  ratePerUnit: string;
  units: number;
  totalFee: string;
  progressNoteStatus: string;
  status: string;
  charge: string;
  uninvoiced: string;
  paid: string;
  unpaid: string;
};

const mockData: Appointment[] = [
  {
    id: "1",
    dateOfService: "04/10/2025",
    client: "Shawaiz Sarfraz",
    billingCode: "90834",
    ratePerUnit: "$100",
    units: 1,
    totalFee: "$100",
    progressNoteStatus: "NO NOTE",
    status: "UNPAID",
    charge: "$100",
    uninvoiced: "--",
    paid: "--",
    unpaid: "$100",
  },
  {
    id: "2",
    dateOfService: "04/10/2025",
    client: "Shawaiz Sarfraz & Mrs Shawaiz",
    billingCode: "90834",
    ratePerUnit: "$100",
    units: 1,
    totalFee: "$100",
    progressNoteStatus: "NO NOTE",
    status: "UNPAID",
    charge: "$100",
    uninvoiced: "--",
    paid: "--",
    unpaid: "$100",
  },
  {
    id: "3",
    dateOfService: "04/10/2025",
    client: "Shawaiz Sarfraz",
    billingCode: "90834",
    ratePerUnit: "$100",
    units: 1,
    totalFee: "$100",
    progressNoteStatus: "NO NOTE",
    status: "UNPAID",
    charge: "$100",
    uninvoiced: "--",
    paid: "--",
    unpaid: "$100",
  },
];

export default function AppointmentStatusPage() {
  const [dateRange, _setDateRange] = useState("04/01/2025 - 04/21/2025");
  const [rowsPerPage, setRowsPerPage] = useState("10");

  return (
    <div className="h-full">
      <div className="p-6 bg-gray-50 min-h-screen space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/analytics" className="hover:text-primary">
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

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="bg-green-50 border-green-100 text-green-700 hover:bg-green-100 hover:text-green-800"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {dateRange}
          </Button>
          <Button variant="outline" className="gap-2">
            <Users className="w-4 h-4" />
            All clients
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="gap-2">
            All
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="gap-2">
            All Notes
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="gap-2">
            More: 1
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs and Table */}
        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="client-responsibility">
              Client Responsibility
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="appointments"
            className="bg-white rounded-lg border border-gray-200"
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date Of Service</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Billing Code</TableHead>
                  <TableHead>Rate Per Unit</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Total Fee</TableHead>
                  <TableHead>Progress Note Status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Uninvoiced</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Unpaid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.map((appointment) => (
                  <TableRow key={appointment.id} className="hover:bg-gray-50">
                    <TableCell>{appointment.dateOfService}</TableCell>
                    <TableCell className="text-primary hover:underline cursor-pointer">
                      {appointment.client}
                    </TableCell>
                    <TableCell>{appointment.billingCode}</TableCell>
                    <TableCell>{appointment.ratePerUnit}</TableCell>
                    <TableCell>{appointment.units}</TableCell>
                    <TableCell>{appointment.totalFee}</TableCell>
                    <TableCell className="text-red-500">
                      {appointment.progressNoteStatus}
                    </TableCell>
                    <TableCell className="text-red-500">
                      {appointment.status}
                    </TableCell>
                    <TableCell>{appointment.charge}</TableCell>
                    <TableCell>{appointment.uninvoiced}</TableCell>
                    <TableCell>{appointment.paid}</TableCell>
                    <TableCell>{appointment.unpaid}</TableCell>
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

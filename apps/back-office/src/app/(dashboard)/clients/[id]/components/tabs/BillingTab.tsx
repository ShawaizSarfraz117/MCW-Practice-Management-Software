import { useState } from "react";
import { fetchAppointments } from "@/(dashboard)/clients/services/client.service";
import { Button } from "@mcw/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mcw/ui";
import { DateRangePicker } from "@mcw/ui";
import { DateRange } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";
import Loading from "@/components/Loading";
import { format } from "date-fns";

// Type definitions
type Invoice = {
  id: string;
  invoice_number: string;
};

type Appointment = {
  id: string;
  start_date: Date | string;
  appointment_fee: number | string;
  Invoice?: Invoice[];
};

export default function BillingTab() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 8), // Jan 8, 2025
    to: new Date(2025, 8, 6), // Sep 6, 2025
  });

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", dateRange],
    queryFn: () =>
      fetchAppointments({
        searchParams: {
          startDate: dateRange?.from?.toISOString(),
          endDate: dateRange?.to?.toISOString(),
        },
      }),
  });

  // Type assertion
  const appointments = data as Appointment[] | undefined;

  if (isLoading)
    return <Loading fullScreen message="Loading appointments..." />;

  return (
    <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
      {/* Date Range and Filter */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <DateRangePicker
            className="w-full sm:w-[280px] h-9 bg-white border-[#e5e7eb]"
            value={dateRange}
            onChange={setDateRange}
          />
          <Select defaultValue="billable">
            <SelectTrigger className="w-full sm:w-[150px] h-9 bg-white border-[#e5e7eb]">
              <SelectValue placeholder="Billable Items" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="billable">Billable Items</SelectItem>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="invoices">Invoices</SelectItem>
              <SelectItem value="payments">Payments</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-[#2d8467] hover:bg-[#236c53]">New</Button>
      </div>

      {/* Billing Table */}
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[120px] font-medium">Date</TableHead>
              <TableHead className="font-medium">Details</TableHead>
              <TableHead className="font-medium">Fee</TableHead>
              <TableHead className="font-medium">Client</TableHead>
              <TableHead className="font-medium">Write-Off</TableHead>
              <TableHead className="font-medium" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments && appointments?.length > 0 ? (
              appointments?.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">
                    {format(new Date(appointment.start_date), "MMM d")}
                  </TableCell>
                  <TableCell>
                    {appointment.Invoice?.map((invoice) => (
                      <div key={invoice.id}>
                        <div>{invoice.invoice_number}</div>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>${appointment.appointment_fee}</TableCell>
                  <TableCell>$100</TableCell>
                  <TableCell>--</TableCell>
                  <TableCell>
                    <div className="flex justify-between items-center">
                      <span className="text-red-500 text-sm">Unpaid</span>
                      <Button className="text-blue-500" variant="link">
                        Manage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center" colSpan={6}>
                  No appointments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

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
import { InvoiceDialog } from "../InvoiceDialogue";
import {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
} from "next/navigation";

// Type definitions
type Invoice = {
  id: string;
  invoice_number: string;
  amount: number;
  Payment?: {
    amount: string;
  }[];
};

type Appointment = {
  id: string;
  start_date: Date | string;
  appointment_fee: number | string;
  Invoice?: Invoice[];
};

export default function BillingTab({
  addPaymentModalOpen,
  invoiceDialogOpen,
  setInvoiceDialogOpen,
}: {
  addPaymentModalOpen: boolean;
  invoiceDialogOpen: boolean;
  setInvoiceDialogOpen: (invoiceDialogOpen: boolean) => void;
}) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 8), // Jan 8, 2025
    to: new Date(2025, 8, 6), // Sep 6, 2025
  });
  const [statusFilter, setStatusFilter] = useState<string>("billable");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();

  const { data, isLoading } = useQuery({
    queryKey: [
      "appointments",
      dateRange,
      statusFilter,
      addPaymentModalOpen,
      invoiceDialogOpen,
    ],
    queryFn: () =>
      fetchAppointments({
        searchParams: {
          clientGroupId: params.id,
          startDate: dateRange?.from?.toISOString(),
          endDate: dateRange?.to?.toISOString(),
          status: statusFilter !== "billable" ? statusFilter : undefined,
        },
      }),
  });

  // Type assertion
  const appointments = data as Appointment[] | undefined;

  const handleInvoiceClick = (invoiceId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    // Set or update the tab parameter
    params.set("type", "invoice");
    params.set("invoiceId", invoiceId);

    // Update the URL without refreshing the page
    router.push(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
    setInvoiceDialogOpen(true);
  };

  const onOpenChange = (invoiceDialogOpen: boolean) => {
    setInvoiceDialogOpen(invoiceDialogOpen);
    if (!invoiceDialogOpen) {
      router.push(`${pathname}?tab=${searchParams.get("tab")}`);
    }
  };

  return (
    <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
      <InvoiceDialog open={invoiceDialogOpen} onOpenChange={onOpenChange} />
      {/* Date Range and Filter */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <DateRangePicker
            className="w-full sm:w-[280px] h-9 bg-white border-[#e5e7eb]"
            value={dateRange}
            onChange={setDateRange}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 bg-white border-[#e5e7eb]">
              <SelectValue placeholder="Billable Items" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="billable">All Items</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="UNPAID">Unpaid</SelectItem>
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
            {isLoading ? (
              <TableRow>
                <TableCell className="h-24" colSpan={6}>
                  <div className="flex justify-center items-center">
                    <Loading message="Loading appointments..." />
                  </div>
                </TableCell>
              </TableRow>
            ) : appointments && appointments?.length > 0 ? (
              appointments?.map((appointment) => {
                const invoice = appointment.Invoice?.[0];
                const invoiceAmount = invoice?.amount || 0;
                const totalPaid =
                  invoice?.Payment?.reduce(
                    (sum: number, payment) => sum + parseFloat(payment.amount),
                    0,
                  ) || 0;
                const unpaidAmount = invoiceAmount - totalPaid;

                return (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">
                      {format(new Date(appointment.start_date), "MMM d")}
                    </TableCell>
                    <TableCell>
                      {appointment.Invoice?.map((invoice) => (
                        <button
                          key={invoice.id}
                          className="text-blue-500 hover:underline text-sm mt-1"
                          onClick={() => handleInvoiceClick(invoice.id)}
                        >
                          Invoice # {invoice.invoice_number}
                        </button>
                      ))}
                    </TableCell>
                    <TableCell>${appointment.appointment_fee}</TableCell>
                    <TableCell>
                      {unpaidAmount > 0 && (
                        <div className="flex justify-between items-center">
                          ${unpaidAmount}{" "}
                          <span className="text-sm text-red-500">Unpaid</span>
                        </div>
                      )}
                      {totalPaid > 0 && (
                        <div className="flex justify-between items-center mt-2">
                          ${totalPaid}{" "}
                          <span className="text-sm text-green-500">Paid</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>--</TableCell>
                    <TableCell>
                      <div className="flex justify-between items-center">
                        <Button className="text-blue-500" variant="link">
                          Manage
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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

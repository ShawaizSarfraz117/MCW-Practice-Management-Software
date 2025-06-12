/* eslint-disable max-lines */
import { useState } from "react";
import {
  createInvoice,
  fetchAppointments,
  updateAppointment,
} from "@/(dashboard)/clients/services/client.service";
import { Button } from "@mcw/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mcw/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Loading from "@/components/Loading";
import { format } from "date-fns";
import { InvoiceDialog } from "../InvoiceDialogue";
import { EditAppointmentForm } from "./EditAppointmentForm";
import {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
} from "next/navigation";
import { ChevronDown } from "lucide-react";
import { toast } from "@mcw/ui";
import { SuperbillModal } from "../SuperbillModal";
import { SuperbillDialog } from "../SuperbillDialog";
import { StatementModal } from "../StatementModal";
import DateRangePicker from "@/(dashboard)/activity/components/DateRangePicker";
import { createStatement } from "@/(dashboard)/clients/services/documents.service";

interface StatementResponse {
  id: string;
  statement_number: number;
  [key: string]: unknown;
}

// Type definitions
type Invoice = {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  type?: string;
  Payment?: {
    amount: string;
  }[];
};

type Appointment = {
  id: string;
  start_date: Date | string;
  title: string;
  appointment_fee: number | string;
  service_id?: string;
  client_group_id?: string;
  write_off?: number;
  clinician_id?: string;
  Invoice: Invoice[];
  adjustable_amount?: number | string;
  Superbill?: {
    id: string;
    superbill_number: string;
  };
};

// eslint-disable-next-line max-lines-per-function
export default function BillingTab({
  addPaymentModalOpen,
  invoiceDialogOpen,
  setInvoiceDialogOpen,
  fetchInvoicesData,
  superbillDialogOpen,
  setSuperbillDialogOpen,
}: {
  addPaymentModalOpen: boolean;
  invoiceDialogOpen: boolean;
  setInvoiceDialogOpen: (invoiceDialogOpen: boolean) => void;
  fetchInvoicesData: () => Promise<void>;
  superbillDialogOpen: boolean;
  setSuperbillDialogOpen: (superbillDialogOpen: boolean) => void;
}) {
  const [dateRangePickerOpen, setDateRangePickerOpen] = useState(false);
  const [selectedDateRangeDisplay, setSelectedDateRangeDisplay] =
    useState<string>("All time");
  const [customDateRange, setCustomDateRange] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("billable");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [superbillModalOpen, setSuperbillModalOpen] = useState(false);
  // const [statementModalOpen, setStatementModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();

  const { data, isLoading } = useQuery({
    queryKey: [
      "appointments",
      selectedDateRangeDisplay,
      statusFilter,
      startDate,
      endDate,
      addPaymentModalOpen,
      invoiceDialogOpen,
    ],
    queryFn: () => {
      const searchParams: Record<string, string> = {
        clientGroupId: params.id as string,
        include: "Superbill",
      };

      if (startDate && endDate) {
        searchParams.startDate = startDate;
        searchParams.endDate = endDate;
      }

      if (statusFilter && statusFilter !== "billable") {
        searchParams.status = statusFilter;
      }

      return fetchAppointments({ searchParams });
    },
  });

  const queryClient = useQueryClient();

  // Type assertion
  const appointments = data as Appointment[] | undefined;

  const handleInvoiceClick = (type: string, invoiceId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    params.set(type === "invoice" ? "invoiceId" : "superbillId", invoiceId);

    router.push(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  const onOpenChange = (invoiceDialogOpen: boolean) => {
    setInvoiceDialogOpen(invoiceDialogOpen);
    if (!invoiceDialogOpen) {
      router.push(`${pathname}?tab=${searchParams.get("tab")}`);
    }
  };

  const onSuperbillOpenChange = (open: boolean) => {
    setSuperbillDialogOpen(open);
    if (!open) {
      router.push(`${pathname}?tab=${searchParams.get("tab")}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingAppointment(null);
  };

  const handleSaveEdit = async (values: {
    writeOff: string;
    serviceId: string;
    fee: string;
  }) => {
    if (!editingAppointment) return;

    setIsSaving(true);
    const [_, error] = await updateAppointment({
      body: {
        appointment_id: editingAppointment.id,
        writeOff: values.writeOff || null,
        fee: values.fee || null,
        serviceId: values.serviceId,
      },
      id: editingAppointment.id,
    });

    if (!error) {
      toast({
        description: "Appointment updated",
        variant: "success",
      });
      setEditingAppointment(null);
      // Refresh appointments data
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
      fetchInvoicesData();
    }
    setIsSaving(false);
  };

  const handleCreateInvoice = async (appointmentId: string) => {
    const appointment = appointments?.find((app) => app.id === appointmentId);
    if (!appointment) return;

    const [invoice, error] = await createInvoice({
      body: {
        appointment_id: appointmentId,
        client_group_id: appointment.client_group_id,
        clinician_id: appointment.clinician_id || null,
        amount: appointment.appointment_fee,
        invoice_type:
          appointment?.Invoice?.length > 0 ? "adjustment" : "invoice",
      },
    });

    if (!error) {
      toast({
        description: "Invoice created",
        variant: "success",
      });

      handleInvoiceClick("invoice", invoice?.id || "");
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
      fetchInvoicesData();
    }
  };

  const handleAddPayment = (appointmentId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", "payment");
    params.set("appointmentId", appointmentId);

    router.push(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleCreateStatement = async () => {
    try {
      const [response, error] = await createStatement({
        body: {
          client_group_id: params.id,
          start_date: new Date(
            new Date().setMonth(new Date().getMonth() - 1),
          ).toISOString(),
          end_date: new Date().toISOString(),
        },
      });

      if (!error && response) {
        const statementResponse = response as StatementResponse;
        if (statementResponse.id) {
          toast({
            description: "Statement created",
            variant: "success",
          });

          // Open the statement modal with the created statement ID
          const urlParams = new URLSearchParams(searchParams.toString());
          urlParams.set("statementId", statementResponse.id);
          router.push(`${pathname}?${urlParams.toString()}`, {
            scroll: false,
          });
        }
      } else {
        toast({
          description: "Failed to create statement",
          variant: "destructive",
        });
      }
    } catch (_error) {
      toast({
        description: "Failed to create statement",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
      {invoiceDialogOpen && (
        <InvoiceDialog open={invoiceDialogOpen} onOpenChange={onOpenChange} />
      )}
      {superbillModalOpen && (
        <SuperbillModal
          clientId={params.id as string}
          open={superbillModalOpen}
          onOpenChange={setSuperbillModalOpen}
          onSave={(superbillId) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("type", "superbill");
            params.set("superbillId", superbillId);
            router.push(`${window.location.pathname}?${params.toString()}`, {
              scroll: false,
            });
            setSuperbillDialogOpen(true);
          }}
        />
      )}
      {superbillDialogOpen && (
        <SuperbillDialog
          open={superbillDialogOpen}
          onOpenChange={onSuperbillOpenChange}
        />
      )}
      <StatementModal />
      {/* Date Range and Filter */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 relative">
          <div
            className="w-auto h-9 bg-white border-[#e5e7eb] border rounded cursor-pointer flex items-center px-3 text-sm whitespace-nowrap"
            onClick={() => setDateRangePickerOpen(true)}
          >
            {selectedDateRangeDisplay === "Custom Range"
              ? customDateRange
              : selectedDateRangeDisplay}
          </div>
          <DateRangePicker
            isOpen={dateRangePickerOpen}
            onApply={(_startDate, _endDate, displayOption) => {
              setSelectedDateRangeDisplay(displayOption);
              setStartDate(_startDate);
              setEndDate(_endDate);
              if (displayOption === "Custom Range") {
                setCustomDateRange(`${_startDate} - ${_endDate}`);
              }
              setDateRangePickerOpen(false);
            }}
            onCancel={() => setDateRangePickerOpen(false)}
            onClose={() => setDateRangePickerOpen(false)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 bg-white border-[#e5e7eb]">
              <SelectValue placeholder="Billable Items" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="billable">All Items</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="UNPAID">Unpaid</SelectItem>
              <SelectItem value="UNINVOICED">Uninvoiced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-[#2d8467] hover:bg-[#236c53] flex items-center gap-1">
              New <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSuperbillModalOpen(true)}>
              Superbill
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCreateStatement()}>
              Statement
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Billing Table */}
      <div>
        {/* Table Header */}
        <div className="grid grid-cols-6 pb-2 text-sm font-medium text-gray-600">
          <div className="px-4">Date</div>
          <div className="px-4">Details</div>
          <div className="px-4">Fee</div>
          <div className="px-4">Client</div>
          <div className="px-4">Write-Off</div>
          <div className="px-4" />
        </div>

        {/* Table Rows - Each in its own bordered container */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="border border-[#e5e7eb] rounded-md bg-white h-24">
              <div className="flex justify-center items-center h-full">
                <Loading message="Loading appointments..." />
              </div>
            </div>
          ) : appointments && appointments?.length > 0 ? (
            appointments.map((appointment) => {
              const totalPaid =
                appointment?.Invoice?.reduce(
                  (sum: number, invoice: Invoice) => {
                    const invoicePaid =
                      invoice.Payment?.reduce(
                        (paymentSum, payment) =>
                          paymentSum + Number(payment.amount),
                        0,
                      ) || 0;
                    return sum + invoicePaid;
                  },
                  0,
                ) || 0;
              const totalUnpaid =
                appointment?.Invoice?.reduce(
                  (sum: number, invoice: Invoice) => {
                    if (invoice.status === "UNPAID") {
                      const invoiceAmount = Number(invoice.amount);
                      const invoicePaid =
                        invoice.Payment?.reduce(
                          (paymentSum, payment) =>
                            paymentSum + Number(payment.amount),
                          0,
                        ) || 0;
                      return sum + (invoiceAmount - invoicePaid);
                    }
                    return sum;
                  },
                  0,
                ) || 0;
              const isEditing = editingAppointment?.id === appointment.id;

              return (
                <div
                  key={appointment.id}
                  className="border border-[#e5e7eb] rounded-md bg-white"
                >
                  {/* Regular Row */}
                  <div className="grid grid-cols-6">
                    <div className="px-4 py-4 font-medium">
                      {format(new Date(appointment.start_date), "MMM dd")}
                    </div>
                    <div className="px-4 py-4">{appointment.title}</div>
                    <div className="px-4 py-4">
                      ${appointment.appointment_fee}
                    </div>
                    <div className="px-4 py-4">
                      {totalUnpaid > 0 && (
                        <div className="flex items-center gap-2">
                          ${totalUnpaid}
                          <span className="text-sm text-red-500">Unpaid</span>
                        </div>
                      )}
                      {totalPaid > 0 && (
                        <div className="flex items-center gap-3">
                          ${totalPaid}
                          <span className="text-sm text-green-500">Paid</span>
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-4">
                      {appointment.write_off
                        ? "$" + (appointment.write_off || "--")
                        : "--"}
                    </div>
                    <div className="px-4 py-2 flex justify-end">
                      {!isEditing && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              className="text-blue-500 flex items-center gap-1"
                              variant="link"
                            >
                              Manage <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => setEditingAppointment(appointment)}
                            >
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAddPayment(appointment.id)}
                            >
                              Add Payment
                            </DropdownMenuItem>
                            {(appointment.adjustable_amount != "0" &&
                              appointment.adjustable_amount !== null) ||
                            appointment.Invoice.length == 0 ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleCreateInvoice(appointment.id)
                                }
                              >
                                Create Invoice
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <EditAppointmentForm
                      appointment={appointment}
                      isSaving={isSaving}
                      onCancel={handleCancelEdit}
                      onSave={handleSaveEdit}
                    />
                  )}
                  {appointment.Invoice?.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 m-1 inline-block bg-gray-100 text-blue-500 py-1 text-xs rounded mt-1 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleInvoiceClick("invoice", inv.id)}
                    >
                      {`INV #${inv.invoice_number}`}
                    </div>
                  ))}
                  {appointment.Superbill && (
                    <div
                      className="p-4 m-1 inline-block bg-gray-100 text-blue-500 py-1 text-xs rounded mt-1 cursor-pointer hover:bg-gray-200"
                      onClick={() =>
                        handleInvoiceClick(
                          "superbill",
                          appointment.Superbill?.id || "",
                        )
                      }
                    >
                      {`SB #${appointment.Superbill.superbill_number}`}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="border border-[#e5e7eb] rounded-md bg-white p-4 text-center">
              No appointments found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

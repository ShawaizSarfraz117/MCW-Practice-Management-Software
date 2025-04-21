/* eslint-disable max-lines-per-function */
import { X, ChevronDown } from "lucide-react";
import { Dialog, DialogContent } from "@mcw/ui";
import { Button } from "@mcw/ui";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { fetchInvoices } from "@/(dashboard)/clients/services/client.service";
import Loading from "@/components/Loading";
import { Invoice } from "@prisma/client";

// Extended Invoice type with relations
interface ExtendedInvoice extends Invoice {
  Payment?: Array<{
    id: string;
    amount: string;
  }>;
  ClientGroup?: {
    name?: string;
    type: string;
    ClientGroupMembership: Array<{
      Client: {
        legal_first_name?: string;
        legal_last_name?: string;
        ClientContact: Array<{
          id: string;
          value?: string;
        }>;
      };
    }>;
  };
  Clinician?: {
    first_name?: string;
    last_name?: string;
    User?: {
      email?: string;
    };
  };
  items?: Array<{
    id: string;
    date?: Date | string;
    description?: string;
    amount?: number | string;
  }>;
  created_at?: Date;
  provider?: {
    name?: string;
  };
  client?: {
    name?: string;
  };
  Appointment?: {
    start_date?: Date | string;
    title?: string;
  };
}

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDialog({ open, onOpenChange }: InvoiceDialogProps) {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");
  const [invoice, setInvoice] = useState<ExtendedInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const params = useParams();
  const totalPaid =
    invoice?.Payment?.reduce(
      (sum: number, payment) => sum + parseFloat(payment.amount),
      0,
    ) || 0;

  // Convert Decimal to number for calculation
  const invoiceAmount = invoice?.amount ? Number(invoice.amount) : 0;
  const unpaidAmount = invoiceAmount - totalPaid;

  useEffect(() => {
    if (open && invoiceId) {
      const fetchInvoiceData = async () => {
        setIsLoading(true);
        try {
          const [data, err] = await fetchInvoices({
            searchParams: { id: invoiceId, clientGroupId: params.id },
          });
          if (err instanceof Error) {
            setError(err);
          } else if (data) {
            // Handle data as object, not array
            setInvoice(data as unknown as ExtendedInvoice);
          }
        } catch (e) {
          setError(e instanceof Error ? e : new Error("Unknown error"));
        } finally {
          setIsLoading(false);
        }
      };

      fetchInvoiceData();
    }
  }, [open, invoiceId]);

  const handleAddPayment = () => {
    onOpenChange(false);
    if (invoice) {
      const params = new URLSearchParams(searchParams.toString());
      // Set or update the tab parameter
      params.set("type", "payment");
      params.set("invoiceId", invoice.id);
      router.push(`${window.location.pathname}?${params.toString()}`, {
        scroll: false,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-screen flex flex-col p-0 m-0 rounded-none border-0 [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center">
            <button className="mr-4" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5 text-gray-500" />
            </button>
            <h1 className="text-xl font-medium">
              {invoice
                ? `Invoice #${invoice.invoice_number} for ${invoice.ClientGroup?.ClientGroupMembership[0]?.Client?.legal_first_name || "Client"}`
                : "Invoice Details"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button className="flex items-center gap-1" variant="outline">
              More
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              className="bg-[#2dbf2d] hover:bg-[#25a825]"
              onClick={handleAddPayment}
            >
              Add payment
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 bg-[#f9fafb] p-6 overflow-auto flex justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center w-full">
              <Loading message="Loading invoice details..." />
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-md max-w-4xl w-full p-8 flex justify-center items-center">
              <p className="text-red-500">
                Error loading invoice: {error.message}
              </p>
            </div>
          ) : invoice ? (
            <div className="bg-white rounded-lg shadow-md max-w-4xl w-full p-8">
              <div className="flex justify-between mb-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">From</p>
                    <p className="font-medium">
                      {invoice.provider?.name ||
                        invoice.Clinician?.first_name ||
                        "Provider"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Invoice</p>
                  </div>
                </div>
                <div className="w-24 h-24 bg-[#d9d9d9] rounded-full flex items-center justify-center">
                  <span className="text-sm text-gray-600">LOGO</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Bill To
                  </p>
                  <p className="font-medium">
                    {invoice.ClientGroup?.ClientGroupMembership[0]?.Client
                      ?.legal_first_name || "Client"}{" "}
                    {invoice.ClientGroup?.ClientGroupMembership[0]?.Client
                      ?.legal_last_name || ""}
                  </p>
                  {invoice.ClientGroup?.ClientGroupMembership[0]?.Client?.ClientContact?.map(
                    (contact) => (
                      <p key={contact.id} className="text-sm">
                        {contact?.value || "N/A"}
                      </p>
                    ),
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Invoice
                  </p>
                  <p className="font-medium">#{invoice.invoice_number}</p>
                  <p className="text-sm">
                    Issued:{" "}
                    {invoice.issued_date
                      ? new Date(invoice.issued_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p className="text-sm">
                    Due:{" "}
                    {invoice.due_date
                      ? new Date(invoice.due_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Client
                  </p>
                  <p className="font-medium">
                    {invoice.ClientGroup?.ClientGroupMembership[0]?.Client
                      ?.legal_first_name || "Client"}{" "}
                    {invoice.ClientGroup?.ClientGroupMembership[0]?.Client
                      ?.legal_last_name || ""}
                  </p>
                  {invoice.ClientGroup?.ClientGroupMembership[0]?.Client?.ClientContact?.map(
                    (contact) => (
                      <p key={contact.id} className="text-sm">
                        {contact?.value || "N/A"}
                      </p>
                    ),
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Provider
                  </p>
                  <p className="font-medium">
                    {invoice.Clinician?.first_name || "Provider"}{" "}
                    {invoice.Clinician?.last_name || ""}
                  </p>
                  <p className="text-sm">
                    {invoice.Clinician?.User?.email || "N/A"}
                  </p>
                </div>
              </div>

              {/* Invoice Table */}
              <div className="mb-8">
                <div className="grid grid-cols-12 border-b border-gray-200 pb-2 mb-2">
                  <div className="col-span-3 text-sm font-medium text-gray-600">
                    Date
                  </div>
                  <div className="col-span-6 text-sm font-medium text-gray-600">
                    Description
                  </div>
                  <div className="col-span-3 text-sm font-medium text-gray-600 text-right">
                    Amount
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-gray-100 py-3">
                  <div className="col-span-3 text-sm">
                    {invoice.Appointment?.start_date
                      ? new Date(
                          invoice.Appointment.start_date,
                        ).toLocaleDateString()
                      : "N/A"}
                  </div>
                  <div className="col-span-6 text-sm">
                    {invoice.Appointment?.title || "N/A"}
                  </div>
                  <div className="col-span-3 text-sm text-right">
                    ${String(invoice.amount) || "0.00"}
                  </div>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="font-medium">Subtotal</div>
                  <div className="text-right">
                    ${String(invoice.amount) || "0.00"}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Total</div>
                  <div className="text-right">
                    ${String(invoice.amount) || "0.00"}
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="font-medium">Amount Paid</div>
                  <div className="text-right">${totalPaid || "0.00"}</div>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <div className="font-medium">Balance</div>
                  <div className="text-right text-xl font-bold">
                    ${(unpaidAmount || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md max-w-4xl w-full p-8">
              <p className="text-center text-gray-500">No invoice selected</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { X, ChevronDown, Printer, Download, Pencil, Save } from "lucide-react";
import { Dialog, DialogContent } from "@mcw/ui";
import { Button } from "@mcw/ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@mcw/ui";
import { Input } from "@mcw/ui";
import { Textarea } from "@mcw/ui";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import {
  fetchInvoices,
  updateInvoice,
} from "@/(dashboard)/clients/services/client.service";
import {
  printInvoice,
  downloadInvoiceAsPdf,
} from "@/(dashboard)/clients/utils/printUtils";
import Loading from "@/components/Loading";
import { Invoice } from "@prisma/client";

// Extended Invoice type with relations
interface ExtendedInvoice extends Invoice {
  Payment?: Array<{
    id: string;
    amount: string;
    credit_applied: string;
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
  client_info: string | null;
  provider_info: string | null;
  service_description: string | null;
  notes: string | null;
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState<{
    clientName: string;
    clientContact: string;
    providerName: string;
    providerEmail: string;
    issuedDate: string;
    dueDate: string;
    description: string;
  }>({
    clientName: "",
    clientContact: "",
    providerName: "",
    providerEmail: "",
    issuedDate: "",
    dueDate: "",
    description: "",
  });
  const router = useRouter();
  const params = useParams();
  const invoiceContentRef = useRef<HTMLDivElement>(null);

  const totalPaid =
    invoice?.Payment?.reduce(
      (sum: number, payment) => sum + parseFloat(payment.amount),
      0,
    ) || 0;

  const creditApplied =
    invoice?.Payment?.reduce(
      (sum: number, payment) => sum + parseFloat(payment.credit_applied),
      0,
    ) || 0;

  // Convert Decimal to number for calculation
  const invoiceAmount = invoice?.amount ? Number(invoice.amount) : 0;
  const unpaidAmount = invoiceAmount - totalPaid - creditApplied;

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
            const invoiceData = data as unknown as ExtendedInvoice;
            setInvoice(invoiceData);

            // Initialize edited data with current values
            const clientInfo = invoiceData.client_info
              ? invoiceData.client_info
              : invoiceData.ClientGroup?.ClientGroupMembership[0]?.Client
                    ?.legal_first_name
                ? `${invoiceData.ClientGroup?.ClientGroupMembership[0]?.Client?.legal_first_name || ""} ${invoiceData.ClientGroup?.ClientGroupMembership[0]?.Client?.legal_last_name || ""}\n${invoiceData.ClientGroup?.ClientGroupMembership[0]?.Client?.ClientContact?.[0]?.value || ""}`.trim()
                : "";

            const providerInfo = invoiceData.provider_info
              ? invoiceData.provider_info
              : invoiceData.Clinician?.first_name
                ? `${invoiceData.Clinician?.first_name || ""} ${invoiceData.Clinician?.last_name || ""}\n${invoiceData.Clinician?.User?.email || ""}`.trim()
                : "";

            setEditedData({
              clientName: clientInfo,
              clientContact: "",
              providerName: providerInfo,
              providerEmail: "",
              issuedDate: invoiceData.issued_date
                ? new Date(invoiceData.issued_date).toISOString().split("T")[0]
                : "",
              dueDate: invoiceData.due_date
                ? new Date(invoiceData.due_date).toISOString().split("T")[0]
                : "",
              description: invoiceData.Appointment?.title || "",
            });
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

  const handlePrint = () => {
    printInvoice(invoiceContentRef, { invoiceNumber: invoice?.invoice_number });
  };

  const handleDownload = () => {
    downloadInvoiceAsPdf(invoiceContentRef, {
      invoiceNumber: invoice?.invoice_number,
    });
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    const [_, err] = await updateInvoice({
      body: {
        id: invoice?.id,
        client_info: editedData.clientName,
        provider_info: editedData.providerName,
        service_description: editedData.description,
        issued_date: editedData.issuedDate,
        due_date: editedData.dueDate,
      },
    });
    if (err instanceof Error) {
      setError(err);
    }
    setIsEditMode(false);
    setIsLoading(false);
  };

  const handleCancel = () => {
    setIsEditMode(false);
  };

  const handleInputChange = (field: keyof typeof editedData, value: string) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
            {!isEditMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex items-center gap-1" variant="outline">
                    More
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  className="flex items-center gap-1"
                  disabled={isLoading}
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </>
            ) : (
              invoice?.status === "UNPAID" && (
                <Button onClick={handleAddPayment}>Add payment</Button>
              )
            )}
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
            <div
              ref={invoiceContentRef}
              className="bg-white rounded-lg shadow-md h-max max-h-fit max-w-4xl w-full p-8"
            >
              <div className="flex justify-between items-start mb-8 header-section">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">From</p>
                    <p className="font-medium">
                      {invoice.provider?.name ||
                        invoice.Clinician?.first_name ||
                        "MCW Admin"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Invoice</p>
                  </div>
                </div>
                {invoice.status === "PAID" && (
                  <div className="border-2 border-green-500 text-green-500 px-4 py-1 text-2xl font-medium rounded">
                    PAID
                  </div>
                )}
                <div className="w-24 h-24 bg-[#d9d9d9] rounded-full flex items-center justify-center logo-container">
                  <span className="text-sm text-gray-600">LOGO</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 info-grid">
                <div className="info-section">
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
                <div className="info-section">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Invoice
                  </p>
                  <p className="font-medium">#{invoice.invoice_number}</p>
                  <div className="text-sm">
                    Issued:{" "}
                    {isEditMode ? (
                      <Input
                        className="mt-1 w-full"
                        type="date"
                        value={editedData.issuedDate}
                        onChange={(e) =>
                          handleInputChange("issuedDate", e.target.value)
                        }
                      />
                    ) : editedData.issuedDate ? (
                      new Date(editedData.issuedDate).toLocaleDateString()
                    ) : (
                      "N/A"
                    )}
                  </div>
                  <div className="text-sm">
                    Due:{" "}
                    {isEditMode ? (
                      <Input
                        className="mt-1 w-full"
                        type="date"
                        value={editedData.dueDate}
                        onChange={(e) =>
                          handleInputChange("dueDate", e.target.value)
                        }
                      />
                    ) : editedData.dueDate ? (
                      new Date(editedData.dueDate).toLocaleDateString()
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 info-grid">
                <div className="info-section">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Client
                  </p>
                  {isEditMode ? (
                    <div className="space-y-2">
                      <Textarea
                        className="w-full"
                        placeholder="Client Name and Contact Information"
                        rows={3}
                        value={editedData.clientName}
                        onChange={(e) =>
                          handleInputChange("clientName", e.target.value)
                        }
                      />
                    </div>
                  ) : (
                    <>
                      {editedData.clientName?.split("\n").map((line, index) => (
                        <p
                          key={index}
                          className={index === 0 ? "font-sm" : "text-sm"}
                        >
                          {line || "N/A"}
                        </p>
                      )) || <p className="font-sm">Client</p>}
                    </>
                  )}
                </div>
                <div className="info-section">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Provider
                  </p>
                  {isEditMode ? (
                    <div className="space-y-2">
                      <Textarea
                        className="w-full"
                        placeholder="Provider Name and Email"
                        rows={3}
                        value={editedData.providerName}
                        onChange={(e) =>
                          handleInputChange("providerName", e.target.value)
                        }
                      />
                    </div>
                  ) : (
                    <>
                      {editedData.providerName
                        ?.split("\n")
                        .map((line, index) => (
                          <p
                            key={index}
                            className={index === 0 ? "font-sm" : "text-sm"}
                          >
                            {line || "N/A"}
                          </p>
                        )) || <p className="font-sm">Provider</p>}
                    </>
                  )}
                </div>
              </div>

              {/* Invoice Table */}
              <div className="mb-4">
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
                    {isEditMode ? (
                      <Input
                        className="w-full"
                        placeholder="Description"
                        value={editedData.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                      />
                    ) : (
                      editedData.description || "N/A"
                    )}
                  </div>
                  <div className="col-span-3 text-sm text-right">
                    ${String(invoice.amount) || "0.00"}
                  </div>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="space-y-2 border-gray-100 summary-section">
                <div className="flex justify-between summary-row">
                  <div className="font-medium">Subtotal</div>
                  <div className="text-right">
                    {Number(invoice.amount).toFixed(2)}
                  </div>
                </div>
                {creditApplied > 0 && (
                  <div className="flex justify-between summary-row">
                    <div className="font-medium">Credit Applied</div>
                    <div className="text-right">
                      -{Number(creditApplied).toFixed(2)}
                    </div>
                  </div>
                )}
                <div className="flex justify-between summary-row">
                  <div className="font-medium">Total</div>
                  <div className="text-right">
                    {(
                      Number(invoice.amount) - Number(creditApplied || 0)
                    ).toFixed(2)}
                  </div>
                </div>
                <div className="flex justify-between summary-row">
                  <div className="font-medium">Amount Paid</div>
                  <div className="text-right">{totalPaid.toFixed(2)}</div>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 summary-row total">
                  <div className="font-medium">Balance</div>
                  <div className="text-right text-xl font-bold">
                    ${(Math.abs(unpaidAmount) || 0).toFixed(2)}
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

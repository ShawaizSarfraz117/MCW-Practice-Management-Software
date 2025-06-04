/* eslint-disable max-lines-per-function */
"use client";
import { X, Printer, Download, Mail, Trash2 } from "lucide-react";
import { Button } from "@mcw/ui";
import { Dialog, DialogContent } from "@mcw/ui";
import { format } from "date-fns";
import { useRef, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { fetchInvoices } from "@/(dashboard)/clients/services/client.service";
import Loading from "@/components/Loading";

interface Appointment {
  id: string;
  start_date?: string | Date;
  title?: string;
  fee?: number;
  appointment_fee?: number | string;
  paid?: string;
}

interface Provider {
  name: string;
  address1: string;
  address2: string;
  email: string;
  license: string;
}

interface Superbill {
  id: string;
  invoice_number: string;
  amount: number | string;
  status: string;
  type: string;
  created_at?: string | Date;
  paid_amount?: number | string;
  appointments?: Appointment[];
  provider?: Provider;
  ClientGroup?: {
    name?: string;
    ClientGroupMembership: Array<{
      Client: {
        legal_first_name?: string;
        legal_last_name?: string;
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
}

interface SuperbillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuperbillDialog({ open, onOpenChange }: SuperbillDialogProps) {
  const [superbill, setSuperbill] = useState<Superbill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const superbillContentRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");

  // Fetch superbill data when the dialog opens
  useEffect(() => {
    if (open && invoiceId) {
      const fetchSuperbillData = async () => {
        setIsLoading(true);
        try {
          const [data, err] = await fetchInvoices({
            searchParams: { id: invoiceId, clientGroupId: params.id },
          });
          if (err instanceof Error) {
            setError(err);
          } else if (data) {
            // Handle data as object
            const superbillData = data as unknown as Superbill;
            setSuperbill(superbillData);
          }
        } catch (e) {
          setError(e instanceof Error ? e : new Error("Unknown error"));
        } finally {
          setIsLoading(false);
        }
      };

      fetchSuperbillData();
    }
  }, [open, invoiceId, params.id]);

  // Create client name from the data
  const clientName = superbill?.ClientGroup?.ClientGroupMembership[0]?.Client
    ?.legal_first_name
    ? `${superbill.ClientGroup.ClientGroupMembership[0].Client.legal_first_name || ""} ${superbill.ClientGroup.ClientGroupMembership[0].Client.legal_last_name || ""}`.trim()
    : "Client";

  // Provider details
  const provider = superbill?.provider || {
    name: superbill?.Clinician?.first_name
      ? `${superbill.Clinician.first_name || ""} ${superbill.Clinician.last_name || ""}`.trim()
      : "Provider",
    address1: "Va 13",
    address2: "Carolina, PR 00983-232323",
    email: superbill?.Clinician?.User?.email || "provider@example.com",
    license: "LMFT #1234",
  };

  const handlePrint = () => {
    if (superbillContentRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Superbill for ${clientName}</title>
              <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                th { font-weight: bold; }
                .text-right { text-align: right; }
              </style>
            </head>
            <body>
              <div class="container">
                ${superbillContentRef.current.innerHTML}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
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
            <h1 className="text-xl font-medium">Superbill for {clientName}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={handlePrint}>
              <Printer className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost">
              <Download className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost">
              <Mail className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost">
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Superbill Content */}
        <div className="flex-1 bg-[#f9fafb] p-6 overflow-auto flex justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center w-full">
              <Loading message="Loading superbill details..." />
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-md max-w-4xl w-full p-8 flex justify-center items-center">
              <p className="text-red-500">
                Error loading superbill: {error.message}
              </p>
            </div>
          ) : superbill ? (
            <div
              ref={superbillContentRef}
              className="bg-white rounded-lg shadow-md h-max max-h-fit max-w-4xl w-full p-8"
            >
              {/* From Section */}
              <div className="mb-8">
                <p className="text-gray-600 mb-1">From</p>
                <p className="font-medium">{provider.name}</p>
                <p>{provider.address1}</p>
                <p>{provider.address2}</p>
              </div>

              {/* Statement Title */}
              <h1 className="text-xl font-bold mb-8">
                Statement for Insurance Reimbursement
              </h1>

              {/* To and Statement Details */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-gray-600 mb-1">To</p>
                  <p className="font-medium">{clientName}</p>

                  <div className="mt-4">
                    <p className="text-gray-600 mb-1">Client</p>
                    <p className="font-medium">{clientName}</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-gray-600 mb-1">Responsible party</p>
                    <p className="font-medium">{clientName}</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600 mb-1">Statement</p>
                  <p className="font-medium">
                    #{superbill.invoice_number || "0018"}
                  </p>
                  <p>
                    Issued:{" "}
                    {superbill.created_at
                      ? format(new Date(superbill.created_at), "MM/dd/yyyy")
                      : "05/03/2025"}
                  </p>

                  <div className="mt-4">
                    <p className="text-gray-600 mb-1">Provider</p>
                    <p className="font-medium">{provider.name}</p>
                    <p>{provider.email}</p>
                    <p>License: {provider.license}</p>
                  </div>
                </div>
              </div>

              {/* Services Table */}
              <table className="w-full mb-8 border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-left py-2 px-4">POS</th>
                    <th className="text-left py-2 px-4">Service</th>
                    <th className="text-left py-2 px-4">DX</th>
                    <th className="text-left py-2 px-4">Description</th>
                    <th className="text-right py-2 px-4">Units</th>
                    <th className="text-right py-2 px-4">Fee</th>
                    <th className="text-right py-2 px-4">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {superbill.appointments?.map((appointment, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-2 px-4">
                        {appointment.start_date
                          ? format(
                              new Date(appointment.start_date),
                              "MM/dd/yyyy",
                            )
                          : "--"}
                      </td>
                      <td className="py-2 px-4">02</td>
                      <td className="py-2 px-4">90834</td>
                      <td className="py-2 px-4">-</td>
                      <td className="py-2 px-4">
                        {appointment.title || "Psychotherapy, 45 min"}
                      </td>
                      <td className="text-right py-2 px-4">1</td>
                      <td className="text-right py-2 px-4">
                        ${appointment.fee || appointment.appointment_fee || 150}
                      </td>
                      <td className="text-right py-2 px-4">
                        ${appointment.paid || "100.00 CR"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5}></td>
                    <td
                      colSpan={2}
                      className="text-right py-2 px-4 font-medium"
                    >
                      Total Fees
                    </td>
                    <td className="text-right py-2 px-4">
                      ${superbill.amount || "150.00"}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={5}></td>
                    <td
                      colSpan={2}
                      className="text-right py-2 px-4 font-medium"
                    >
                      Total Paid
                    </td>
                    <td className="text-right py-2 px-4">
                      -${superbill.paid_amount || "100.00"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md max-w-4xl w-full p-8">
              <p className="text-center text-gray-500">No superbill selected</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

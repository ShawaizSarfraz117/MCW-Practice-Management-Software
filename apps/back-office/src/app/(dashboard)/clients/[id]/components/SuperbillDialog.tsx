/* eslint-disable max-lines-per-function */
"use client";
import { X, Printer, Download, Mail, Trash2 } from "lucide-react";
import { Button } from "@mcw/ui";
import { Dialog, DialogContent } from "@mcw/ui";
import { format } from "date-fns";
import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { fetchSingleSuperbill } from "@/(dashboard)/clients/services/documents.service";
import Loading from "@/components/Loading";

interface Appointment {
  id: string;
  type: string;
  title?: string | null;
  is_all_day: boolean;
  start_date: string;
  end_date: string;
  location_id: string;
  created_by: string;
  status: string;
  clinician_id: string;
  appointment_fee: string;
  service_id: string;
  is_recurring: boolean;
  recurring_rule?: string | null;
  cancel_appointments?: string | null;
  notify_cancellation?: string | null;
  recurring_appointment_id?: string | null;
  client_group_id: string;
  adjustable_amount: string;
  superbill_id: string;
  write_off?: string | null;
  PracticeService: {
    id: string;
    type: string;
    rate: string;
    code: string;
    description: string;
    duration: number;
    color?: string | null;
    allow_new_clients: boolean;
    available_online: boolean;
    bill_in_units: boolean;
    block_after: number;
    block_before: number;
    is_default: boolean;
    require_call: boolean;
  };
  Location: {
    id: string;
    name: string;
    address: string;
    is_active: boolean;
    city?: string | null;
    color?: string | null;
    state?: string | null;
    street?: string | null;
    zip?: string | null;
  };
}

interface Superbill {
  id: string;
  superbill_number: number;
  client_group_id: string;
  issued_date: string;
  provider_name: string;
  provider_email: string;
  provider_license?: string | null;
  client_name: string;
  status: string;
  created_at: string;
  created_by?: string | null;
  is_exported: boolean;
  Appointment: Appointment[];
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
  const searchParams = useSearchParams();
  const superbillId = searchParams.get("superbillId");

  // Fetch superbill data when the dialog opens
  useEffect(() => {
    if (open && superbillId) {
      const fetchSuperbillData = async () => {
        setIsLoading(true);
        try {
          const [data, err] = await fetchSingleSuperbill({
            searchParams: { id: superbillId },
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
  }, [open, superbillId]);

  // Create client name from the data
  const clientName = superbill?.client_name || "Client";

  // Provider details
  const provider = {
    name: superbill?.provider_name || "Provider",
    address1: "Va 13",
    address2: "Carolina, PR 00983-232323",
    email: superbill?.provider_email || "provider@example.com",
    license: superbill?.provider_license || "LMFT #1234",
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
                    #{superbill.superbill_number || "0018"}
                  </p>
                  <p>
                    Issued:{" "}
                    {superbill.issued_date
                      ? format(new Date(superbill.issued_date), "MM/dd/yyyy")
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
                  {superbill.Appointment?.map((appointment) => {
                    const totalPaid =
                      Number(appointment.appointment_fee) -
                      Number(appointment.adjustable_amount || 0);
                    return (
                      <tr
                        key={appointment.id}
                        className="border-b border-gray-200"
                      >
                        <td className="py-2 px-4">
                          {format(
                            new Date(appointment.start_date),
                            "MM/dd/yyyy",
                          )}
                        </td>
                        <td className="py-2 px-4">
                          {appointment.Location?.name?.includes("Telehealth")
                            ? "02"
                            : "11"}
                        </td>
                        <td className="py-2 px-4">
                          {appointment.PracticeService?.code || "90834"}
                        </td>
                        <td className="py-2 px-4">-</td>
                        <td className="py-2 px-4">
                          {appointment.PracticeService?.description ||
                            appointment.PracticeService?.type ||
                            "Psychotherapy"}
                        </td>
                        <td className="text-right py-2 px-4">1</td>
                        <td className="text-right py-2 px-4">
                          ${appointment.appointment_fee}
                        </td>
                        <td className="text-right py-2 px-4">
                          ${totalPaid.toFixed(2)} CR
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} />
                    <td
                      className="text-right py-2 px-4 font-medium"
                      colSpan={2}
                    >
                      Total Fees
                    </td>
                    <td className="text-right py-2 px-4">
                      $
                      {superbill.Appointment?.reduce(
                        (sum, app) => sum + Number(app.appointment_fee),
                        0,
                      ).toFixed(2) || "0.00"}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={5} />
                    <td
                      className="text-right py-2 px-4 font-medium"
                      colSpan={2}
                    >
                      Total Paid
                    </td>
                    <td className="text-right py-2 px-4">
                      -$
                      {superbill.Appointment?.reduce(
                        (sum, app) =>
                          sum +
                          (Number(app.appointment_fee) -
                            Number(app.adjustable_amount || 0)),
                        0,
                      ).toFixed(2) || "0.00"}
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

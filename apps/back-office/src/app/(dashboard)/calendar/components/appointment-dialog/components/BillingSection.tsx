"use client";

import { Button } from "@mcw/ui";
import { useRouter } from "next/navigation";

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
}

interface BillingSectionProps {
  appointmentData?: {
    id?: string;
    client_group_id?: string;
    ClientGroup?: { id: string };
    Invoice?: Invoice[];
  } | null;
  appointmentFee?: number;
  clientBalance: number;
  isCreatingInvoice: boolean;
  onCreateInvoice: () => void;
  onAddPayment: () => void;
}

export function BillingSection({
  appointmentData,
  appointmentFee,
  clientBalance,
  isCreatingInvoice,
  onCreateInvoice,
  onAddPayment,
}: BillingSectionProps) {
  const router = useRouter();

  if (!appointmentData) {
    return null;
  }

  const invoices = appointmentData?.Invoice;
  const hasInvoices =
    invoices && Array.isArray(invoices) && invoices.length > 0;
  const allPaid =
    hasInvoices && invoices.every((inv: Invoice) => inv.status === "PAID");
  const hasUnpaid =
    hasInvoices && invoices.some((inv: Invoice) => inv.status !== "PAID");

  const handleInvoiceClick = (inv: Invoice) => {
    const clientGroupId =
      appointmentData?.client_group_id || appointmentData?.ClientGroup?.id;
    if (clientGroupId) {
      router.push(
        `/clients/${clientGroupId}?tab=billing&type=invoice&invoiceId=${inv.id}`,
      );
    }
  };

  return (
    <>
      <div className="pb-4 border-b">
        <div className="flex justify-between items-center">
          <p className="font-medium text-[15px] text-[#717171]">Billing</p>
          <p className="text-[14px] text-[#717171]">Self-pay</p>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-[15px] text-[#717171]">Appointment Total</p>
          <p className="text-[14px] text-[#717171]">${appointmentFee || 0}</p>
        </div>
        {/* Show invoice number if exists */}
        {hasInvoices && (
          <div className="flex items-center gap-2 mt-2">
            {invoices.map((inv: Invoice) => (
              <span
                key={inv.id}
                className="inline-block bg-gray-100 text-blue-500 px-2 py-1 text-xs rounded cursor-pointer hover:bg-gray-200"
                onClick={() => handleInvoiceClick(inv)}
              >
                {inv.invoice_number}
              </span>
            ))}
            {/* Show appropriate status based on invoice payment status */}
            {allPaid ? (
              <span className="text-sm text-green-500">Paid</span>
            ) : hasInvoices &&
              invoices.some((inv: Invoice) => inv.status === "PAID") ? (
              <span className="text-sm text-yellow-600">Partially Paid</span>
            ) : (
              <span className="text-sm text-red-500">Unpaid</span>
            )}
          </div>
        )}
      </div>

      <div className="pb-4">
        {/* Check invoice status to determine what to show */}
        {(() => {
          if (hasInvoices && hasUnpaid) {
            // Show Add Payment button only if there are unpaid invoices
            return (
              <div className="w-full">
                <Button
                  className="w-full bg-[#2d8467] hover:bg-[#236c53] text-white rounded-[5px] py-2"
                  onClick={onAddPayment}
                >
                  Add Payment
                </Button>
              </div>
            );
          } else if (hasInvoices && allPaid) {
            // Show that payment is complete
            return (
              <p className="text-[14px] text-green-600 font-medium">
                ✓ Payment Complete
              </p>
            );
          } else {
            // Show Create Invoice option
            return (
              <p
                className="text-[14px] text-[#0a96d4] cursor-pointer hover:underline"
                onClick={onCreateInvoice}
              >
                {isCreatingInvoice ? "Creating..." : "Create Invoice"}
              </p>
            );
          }
        })()}
        <p className="text-[14px] text-[#717171] underline pt-3 ">
          Client Balance: ${clientBalance.toFixed(2)}
        </p>
      </div>
    </>
  );
}

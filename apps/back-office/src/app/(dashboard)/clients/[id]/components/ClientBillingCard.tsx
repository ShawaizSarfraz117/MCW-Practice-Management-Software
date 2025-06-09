import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@mcw/ui";
import { InvoiceWithPayments } from "./ClientProfile";

interface ClientBillingCardProps {
  invoices: InvoiceWithPayments[];
  credit: number;
  onAddPayment: () => void;
}

export function ClientBillingCard({
  invoices,
  onAddPayment,
  credit,
}: ClientBillingCardProps) {
  // Collapsible section states
  const [clientBalanceCollapsed, setClientBalanceCollapsed] = useState(false);

  const totalUnpaid = invoices.reduce(
    (sum, invoice) =>
      invoice.status === "UNPAID" ? sum + Number(invoice.amount) : sum,
    0,
  );
  const totalUninvoiced = invoices.reduce(
    (sum, invoice) =>
      invoice.Appointment?.adjustable_amount
        ? sum + Number(invoice.Appointment.adjustable_amount)
        : sum,
    0,
  );

  const totalInvoiceAmount = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount),
    0,
  );

  const totalPaymentsAmount = invoices.reduce((sum, invoice) => {
    const invoicePayments =
      invoice.Payment?.reduce(
        (paymentSum, payment) => paymentSum + Number(payment.amount),
        0,
      ) || 0;
    return sum + invoicePayments;
  }, 0);

  const remainingBalance = totalInvoiceAmount - totalPaymentsAmount;
  return (
    <div className="p-4 sm:p-6 border border-[#e5e7eb] rounded-md mb-4">
      {/* Client Billing */}
      <div className="mb-8">
        <h3 className="font-medium mb-4">Client billing</h3>

        <div
          className="flex justify-between mb-2 items-center cursor-pointer"
          onClick={() => setClientBalanceCollapsed(!clientBalanceCollapsed)}
        >
          <div className="text-sm flex items-center">
            {clientBalanceCollapsed ? (
              <ChevronUp className="h-4 w-4 mr-1" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-1" />
            )}
            Client balance
          </div>
          <div className="text-sm font-medium text-red-500">
            ${remainingBalance.toFixed(2)}
          </div>
        </div>

        {!clientBalanceCollapsed && (
          <div className="ml-5 border-l pl-3 mb-2">
            <div className="flex justify-between mb-2">
              <div className="text-sm text-blue-500">Payments</div>
              <div className="text-sm font-medium">
                ${totalPaymentsAmount.toFixed(2)}
              </div>
            </div>
            <div className="flex justify-between mb-2">
              <div className="text-sm text-blue-500">Invoices</div>
              <div className="text-sm font-medium">
                ${totalInvoiceAmount.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mb-2 items-center">
          <div className="text-sm flex items-center">
            Unallocated (
            {invoices.filter((invoice) => invoice.status === "CREDIT").length})
          </div>
          <div className="text-sm font-medium">
            ${Number(credit).toFixed(2)}
          </div>
        </div>

        <div className="flex justify-between mb-2 items-center">
          <div className="text-sm flex items-center">
            Unpaid invoices (
            {invoices.filter((invoice) => invoice.status === "UNPAID")
              ?.length || 0}
            )
          </div>
          <div className="text-sm font-medium">${totalUnpaid.toFixed(2)}</div>
        </div>
        {totalUninvoiced > 0 && (
          <div className="flex justify-between mb-2 items-center">
            <div className="text-sm flex items-center">Uninvoiced</div>
            <div className="text-sm font-medium">
              ${totalUninvoiced.toFixed(2)}
            </div>
          </div>
        )}

        <Button
          className="w-full bg-[#2d8467] hover:bg-[#236c53]"
          disabled={invoices.length === 0}
          onClick={onAddPayment}
        >
          Add Payment
        </Button>
      </div>
    </div>
  );
}

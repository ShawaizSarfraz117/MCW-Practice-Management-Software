import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@mcw/ui";
import { InvoiceWithPayments } from "./ClientProfile";

interface ClientBillingCardProps {
  invoices: InvoiceWithPayments[];
  totalInvoiceAmount: number;
  totalPaymentsAmount: number;
  remainingBalance: number;
  onAddPayment: () => void;
}

export function ClientBillingCard({
  invoices,
  totalInvoiceAmount,
  totalPaymentsAmount,
  remainingBalance,
  onAddPayment,
}: ClientBillingCardProps) {
  // Collapsible section states
  const [clientBalanceCollapsed, setClientBalanceCollapsed] = useState(false);
  const [unallocatedCollapsed, setUnallocatedCollapsed] = useState(false);

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

        <div
          className="flex justify-between mb-2 items-center cursor-pointer"
          onClick={() => setUnallocatedCollapsed(!unallocatedCollapsed)}
        >
          <div className="text-sm flex items-center">
            {unallocatedCollapsed ? (
              <ChevronUp className="h-4 w-4 mr-1" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-1" />
            )}
            Unallocated (1)
          </div>
        </div>

        {!unallocatedCollapsed && (
          <div className="ml-5 border-l pl-3 mb-2">
            <div className="flex justify-between mb-2">
              <div className="text-sm text-blue-500">
                Unpaid invoices (
                {invoices.filter((invoice) => invoice.status === "UNPAID")
                  ?.length || 0}
                )
              </div>
              <div className="text-sm font-medium">
                ${remainingBalance.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <Button
          className="w-full bg-[#2d8467] hover:bg-[#236c53]"
          onClick={onAddPayment}
        >
          Add Payment
        </Button>
      </div>

      {/* Client Info */}
      <div>
        <div className="flex justify-between mb-4">
          <h3 className="font-medium">Client info</h3>
          <button className="text-blue-500 hover:underline text-sm">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

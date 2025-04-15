import { useState } from "react";
import { Input } from "@mcw/ui";
import { Checkbox } from "@mcw/ui";
import { InvoiceWithPayments } from "./ClientProfile";
import { formatDate } from "@mcw/utils";

interface SelectInvoicesProps {
  invoices: InvoiceWithPayments[];
  selectedInvoices: string[];
  invoiceAmounts: Record<string, string>;
  applyCredit: boolean;
  total: number;
  onInvoiceSelection: (invoiceId: string, checked: boolean) => void;
  onAmountChange: (invoiceId: string, amount: string) => void;
  onApplyCreditChange: (checked: boolean) => void;
  onPaymentAmountChange: (amount: string) => void;
}

export function SelectInvoices({
  invoices,
  selectedInvoices,
  invoiceAmounts,
  applyCredit,
  total,
  onInvoiceSelection,
  onAmountChange,
  onApplyCreditChange,
  onPaymentAmountChange,
}: SelectInvoicesProps) {
  const [showAllInvoices, setShowAllInvoices] = useState(false);

  // Calculate remaining amount (invoice amount - sum of payments)
  const calculateRemainingAmount = (invoice: InvoiceWithPayments): number => {
    const totalAmount = Number(invoice.amount);
    const totalPaid =
      invoice.Payment?.reduce((sum, payment) => {
        return sum + Number(payment.amount);
      }, 0) || 0;
    return totalAmount - totalPaid;
  };

  return (
    <div className="mb-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white mr-2">
          <span>1</span>
        </div>
        <h3 className="text-lg font-medium">
          Select invoices and confirm payment amount
        </h3>
      </div>

      <p className="text-gray-600 mb-4">
        You can make partial payments on new invoices
      </p>

      <div className="bg-gray-100 rounded-md p-4">
        <div className="grid grid-cols-4 gap-4 mb-2 font-medium text-sm">
          <div>Invoice</div>
          <div>Status</div>
          <div>Balance</div>
          <div>Amount</div>
        </div>

        {/* Display first invoice or all invoices based on state */}
        {(showAllInvoices ? invoices : invoices.slice(0, 1)).map(
          (invoice, index) => {
            const remainingAmount = calculateRemainingAmount(invoice);

            return (
              <div
                key={index}
                className="grid grid-cols-4 gap-4 items-center py-2 border-b border-gray-200"
              >
                <div className="flex items-center">
                  <Checkbox
                    checked={selectedInvoices.includes(invoice.id)}
                    className="mr-2"
                    id={`invoice-${index}`}
                    onCheckedChange={(checked) =>
                      onInvoiceSelection(invoice.id, checked as boolean)
                    }
                  />
                  <div>
                    <div>Invoice # {invoice.invoice_number}</div>
                    <div className="text-gray-500 text-sm">
                      {invoice.issued_date
                        ? formatDate(new Date(invoice.issued_date))
                        : ""}
                    </div>
                  </div>
                </div>
                <div className="text-red-500">{invoice.status}</div>
                <div>${remainingAmount.toFixed(2)}</div>
                <div>
                  <Input
                    className="w-full"
                    value={invoiceAmounts[invoice.id] || "0"}
                    onChange={(e) => onAmountChange(invoice.id, e.target.value)}
                  />
                </div>
              </div>
            );
          },
        )}

        {/* Toggle button for showing/hiding invoices */}
        {invoices.length > 1 && (
          <button
            className="text-blue-500 hover:underline text-sm mt-4"
            onClick={() => setShowAllInvoices(!showAllInvoices)}
          >
            {showAllInvoices
              ? "Hide"
              : `Show additional unpaid invoices (${invoices.length - 1})`}
          </button>
        )}

        <div className="mt-6 space-y-2 border-t pt-4">
          <div className="flex justify-between">
            <div>Subtotal</div>
            <div>${total.toFixed(2)}</div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Checkbox
                checked={applyCredit}
                className="mr-2"
                id="apply-credit"
                onCheckedChange={(checked) =>
                  onApplyCreditChange(checked as boolean)
                }
              />
              <label htmlFor="apply-credit">Apply available credit ($0)</label>
            </div>
            <div>{applyCredit ? "$0" : "--"}</div>
          </div>
          <div className="flex justify-between font-medium">
            <div>Payment amount</div>
            <div>
              <Input
                className="w-24"
                value={applyCredit ? (total - 0).toFixed(2) : total.toFixed(2)}
                onChange={(e) => onPaymentAmountChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

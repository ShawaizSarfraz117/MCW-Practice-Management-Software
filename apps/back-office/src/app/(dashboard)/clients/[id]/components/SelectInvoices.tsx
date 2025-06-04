import { useState, useEffect } from "react";
import { Input } from "@mcw/ui";
import { Checkbox } from "@mcw/ui";
import { InvoiceWithPayments } from "./ClientProfile";
import { formatDate } from "@mcw/utils";
import { calculateRemainingAmount } from "./AddPaymentModal";

interface SelectInvoicesProps {
  invoices: InvoiceWithPayments[];
  selectedInvoices: string[];
  invoiceAmounts: Record<string, string>;
  applyCredit: boolean;
  total: number;
  credit: number;
  onInvoiceSelection: (invoiceId: string, checked: boolean) => void;
  onAmountChange: (invoiceId: string, amount: string) => void;
  onApplyCreditChange: (checked: boolean) => void;
  onPaymentAmountChange: (amount: string) => void;
  onErrorMessagesUpdate?: (errors: Record<string, string>) => void;
}

export function SelectInvoices({
  invoices,
  selectedInvoices,
  invoiceAmounts,
  applyCredit,
  total,
  credit,
  onInvoiceSelection,
  onAmountChange,
  onApplyCreditChange,
  onPaymentAmountChange: _onPaymentAmountChange,
  onErrorMessagesUpdate,
}: SelectInvoicesProps) {
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>(
    {},
  );

  // Set showAllInvoices to true if selected invoice is not the first one
  useEffect(() => {
    if (invoices.length > 0 && selectedInvoices.length > 0) {
      const firstInvoiceId = invoices[0]?.id;
      if (selectedInvoices[0] !== firstInvoiceId) {
        setShowAllInvoices(true);
      }
    }
  }, [invoices, selectedInvoices]);

  // Update parent component with error messages whenever they change
  useEffect(() => {
    onErrorMessagesUpdate?.(errorMessages);
  }, [errorMessages, onErrorMessagesUpdate]);

  // Validate and handle amount change
  const handleAmountChange = (invoiceId: string, value: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    const remainingAmount = invoice ? calculateRemainingAmount(invoice) : 0;

    // Remove non-numeric characters except decimal point
    const sanitizedValue = value.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    const parts = sanitizedValue.split(".");
    const cleanValue =
      parts.length > 1
        ? parts[0] + "." + parts.slice(1).join("")
        : sanitizedValue;

    const amount = Number(cleanValue);
    const newErrorMessages = { ...errorMessages };

    if (isNaN(amount)) {
      newErrorMessages[invoiceId] = "Please enter a valid amount";
    } else if (amount < 0) {
      newErrorMessages[invoiceId] = "Amount can't be negative";
    } else if (amount > remainingAmount) {
      newErrorMessages[invoiceId] =
        `Amount can't be greater than $${remainingAmount.toFixed(2)}`;
    } else {
      delete newErrorMessages[invoiceId];
    }

    setErrorMessages(newErrorMessages);
    onAmountChange(invoiceId, cleanValue);
  };

  // Calculate credit to apply (not exceeding total)
  const creditToApply = Math.min(credit, total);

  // Calculate final payment amount
  const finalPaymentAmount = Math.max(
    total - (applyCredit ? creditToApply : 0),
    0,
  );

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
          <div>Details</div>
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
                    <div>{invoice.invoice_number}</div>
                  </div>
                </div>
                <div>
                  {invoice.issued_date
                    ? formatDate(new Date(invoice.issued_date))
                    : ""}
                  <div className="text-gray-500 text-sm">
                    {invoice.type === "ADJUSTMENT" ? "Fee Adjustment" : ""}
                  </div>
                </div>
                <div>${remainingAmount.toFixed(2)}</div>
                <div>
                  <Input
                    className={`w-full ${errorMessages[invoice.id] ? "border-red-500" : ""}`}
                    value={invoiceAmounts[invoice.id] || "0"}
                    onChange={(e) =>
                      handleAmountChange(invoice.id, e.target.value)
                    }
                  />
                  {errorMessages[invoice.id] && (
                    <div className="text-red-500 text-xs mt-1">
                      {errorMessages[invoice.id]}
                    </div>
                  )}
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
              <label className="cursor-pointer" htmlFor="apply-credit">
                Apply available credit (${Number(credit).toFixed(2)})
              </label>
            </div>
            <div>{applyCredit ? `-$${creditToApply.toFixed(2)}` : "--"}</div>
          </div>
          <div className="flex justify-between font-medium">
            <div>Payment amount</div>
            <div>${finalPaymentAmount.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

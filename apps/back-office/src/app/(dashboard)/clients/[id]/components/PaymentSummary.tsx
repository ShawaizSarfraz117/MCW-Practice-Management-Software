import { Button } from "@mcw/ui";
import { InvoiceWithPayments } from "./ClientProfile";

interface PaymentSummaryProps {
  selectedInvoices: string[];
  invoices: InvoiceWithPayments[];
  invoiceAmounts: Record<string, string>;
  applyCredit: boolean;
  credit: number;
  total: number;
  isSubmitting: boolean;
  onSubmitPayment: () => void;
  errorMessages?: Record<string, string>;
}

export function PaymentSummary({
  selectedInvoices,
  invoices,
  invoiceAmounts,
  applyCredit,
  credit,
  total,
  isSubmitting,
  onSubmitPayment,
  errorMessages = {},
}: PaymentSummaryProps) {
  // Calculate credit to apply (not exceeding total)
  const creditToApply = Math.min(credit, total);

  // Calculate final payment amount
  const finalPaymentAmount = Math.max(
    total - (applyCredit ? creditToApply : 0),
    0,
  );

  // Check if there are any validation errors
  const hasValidationErrors = Object.keys(errorMessages).length > 0;

  // Determine if we're using credit only (no additional payment)
  const isCreditOnly =
    applyCredit && finalPaymentAmount === 0 && creditToApply > 0;

  return (
    <div className="w-80 border-l p-6 bg-white overflow-y-auto">
      <h3 className="font-medium mb-4">Summary</h3>

      <div className="space-y-4">
        {selectedInvoices.map((invId, index) => {
          const invoice = invoices.find((inv) => inv.id === invId);
          return invoice ? (
            <div key={index} className="flex justify-between">
              <div>{invoice.invoice_number}</div>
              <div>${invoiceAmounts[invoice.id] || "0"}</div>
            </div>
          ) : null;
        })}

        <div className="flex justify-between pt-4 border-t">
          <div>Subtotal</div>
          <div>${total.toFixed(2)}</div>
        </div>

        {applyCredit && creditToApply > 0 && (
          <div className="flex justify-between text-green-600">
            <div>Available credit applied</div>
            <div>-${creditToApply.toFixed(2)}</div>
          </div>
        )}

        <div className="flex justify-between font-medium">
          <div>Total payment</div>
          <div>${finalPaymentAmount.toFixed(2)}</div>
        </div>

        <Button
          className="w-full bg-green-500 hover:bg-green-600"
          disabled={
            isSubmitting || selectedInvoices.length === 0 || hasValidationErrors
          }
          onClick={onSubmitPayment}
        >
          {isSubmitting
            ? "Processing..."
            : isCreditOnly
              ? "Allocate credit"
              : `Add $${finalPaymentAmount.toFixed(2)} payment`}
        </Button>
      </div>
    </div>
  );
}

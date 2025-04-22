import { Button } from "@mcw/ui";
import { InvoiceWithPayments } from "./ClientProfile";

interface PaymentSummaryProps {
  selectedInvoices: string[];
  invoices: InvoiceWithPayments[];
  invoiceAmounts: Record<string, string>;
  applyCredit: boolean;
  total: number;
  isSubmitting: boolean;
  onSubmitPayment: () => void;
}

export function PaymentSummary({
  selectedInvoices,
  invoices,
  invoiceAmounts,
  applyCredit,
  total,
  isSubmitting,
  onSubmitPayment,
}: PaymentSummaryProps) {
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

        <div className="flex justify-between font-medium">
          <div>Total payment</div>
          <div>${applyCredit ? (total - 0).toFixed(2) : total.toFixed(2)}</div>
        </div>

        <Button
          className="w-full bg-green-500 hover:bg-green-600"
          disabled={isSubmitting || selectedInvoices.length === 0}
          onClick={onSubmitPayment}
        >
          {isSubmitting
            ? "Processing..."
            : `Add $${applyCredit ? (total - 0).toFixed(2) : total.toFixed(2)} payment`}
        </Button>
      </div>
    </div>
  );
}

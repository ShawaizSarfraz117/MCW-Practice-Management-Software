/* eslint-disable max-lines-per-function */
"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@mcw/ui";
import { Dialog, DialogContent } from "@mcw/ui";
import { useToast } from "@mcw/ui";
import {
  fetchInvoices,
  createPayment,
} from "@/(dashboard)/clients/services/client.service";
import { useParams, useRouter } from "next/navigation";
import { InvoiceWithPayments } from "./ClientProfile";
import { SelectInvoices } from "./SelectInvoices";
import { PaymentMethodSelection } from "./PaymentMethodSelection";
import { PaymentSummary } from "./PaymentSummary";

interface AddPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  fetchInvoicesData: () => Promise<void>;
}

export function AddPaymentModal({
  open,
  onOpenChange,
  clientName,
  fetchInvoicesData,
}: AddPaymentModalProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [_paymentAmount, setPaymentAmount] = useState("200");
  const [paymentMethod, setPaymentMethod] = useState("check");
  const [checkNumber, setCheckNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState("2025-03-27");
  const [applyCredit, setApplyCredit] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceWithPayments[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceAmounts, setInvoiceAmounts] = useState<Record<string, string>>(
    {},
  );

  const { id } = useParams();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const fetchInvoicesData = async () => {
      const [invoices, error] = await fetchInvoices({
        searchParams: { clientGroupId: id, status: "UNPAID" },
      });
      if (!error && invoices?.length) {
        setInvoices(invoices as InvoiceWithPayments[]);
        const invoiceId = searchParams.get("invoiceId");
        setSelectedInvoices(invoiceId ? [invoiceId] : [invoices[0].id]);
        // Initialize invoice amounts with remaining balances
        const initialAmounts: Record<string, string> = {};
        invoices.forEach((invoice) => {
          const remainingAmount = calculateRemainingAmount(
            invoice as InvoiceWithPayments,
          );
          initialAmounts[invoice.id] = remainingAmount.toString();
        });
        setInvoiceAmounts(initialAmounts);
      }
    };
    fetchInvoicesData();
  }, [id, searchParams]);

  // Calculate remaining amount (invoice amount - sum of payments)
  const calculateRemainingAmount = (invoice: InvoiceWithPayments): number => {
    const totalAmount = Number(invoice.amount);
    const totalPaid =
      invoice.Payment?.reduce((sum, payment) => {
        return sum + Number(payment.amount);
      }, 0) || 0;
    return totalAmount - totalPaid;
  };

  // Calculate total based on selected invoices
  const calculateTotal = () => {
    return selectedInvoices.reduce((total, invId) => {
      const invoice = invoices.find((inv) => inv.id === invId);
      if (!invoice) return total;
      return total + Number(invoiceAmounts[invoice.id] || 0);
    }, 0);
  };

  const total = calculateTotal();

  // Toggle invoice selection
  const toggleInvoiceSelection = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices([...selectedInvoices, invoiceId]);
    } else {
      setSelectedInvoices(selectedInvoices.filter((id) => id !== invoiceId));
    }
  };

  // Handle amount change for a specific invoice
  const handleAmountChange = (invoiceId: string, amount: string) => {
    setInvoiceAmounts({
      ...invoiceAmounts,
      [invoiceId]: amount,
    });
  };

  // Handle payment submission
  const handleSubmitPayment = async () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select at least one invoice to make a payment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // For each selected invoice, create a payment
      for (const invoiceId of selectedInvoices) {
        const invoice = invoices.find((inv) => inv.id === invoiceId);

        if (invoice) {
          const paymentData = {
            invoice_id: invoice.id,
            amount: Number(invoiceAmounts[invoice.id] || 0),
            status: "completed",
            transaction_id: paymentMethod === "check" ? checkNumber : undefined,
            response: JSON.stringify({
              payment_method: paymentMethod,
              payment_date: paymentDate,
            }),
          };

          const [_, error] = await createPayment({ body: paymentData });
          fetchInvoicesData();
          if (error) {
            throw error;
          }
        }
      }

      toast({
        title: "Payment successful",
        description: `Payment of $${applyCredit ? (total - 0).toFixed(2) : total.toFixed(2)} was successfully processed.`,
        variant: "success",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description:
          "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close with URL cleanup
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && searchParams.has("invoiceId")) {
      // Remove invoiceId from URL when closing modal
      router.replace(
        `${window.location.pathname}?tab=${searchParams.get("tab")}`,
      );
    }
    onOpenChange(isOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-full w-full h-screen p-0 m-0 rounded-none [&>button]:hidden">
          <div className="flex flex-col h-full overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center">
                <Button
                  className="mr-2"
                  size="icon"
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-medium">
                  Add Payment for {clientName}
                </h2>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 h-[calc(100vh-65px)] overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {/* Step 1: Select invoices */}
                  <SelectInvoices
                    applyCredit={applyCredit}
                    invoiceAmounts={invoiceAmounts}
                    invoices={invoices}
                    selectedInvoices={selectedInvoices}
                    total={total}
                    onAmountChange={handleAmountChange}
                    onApplyCreditChange={setApplyCredit}
                    onInvoiceSelection={toggleInvoiceSelection}
                    onPaymentAmountChange={setPaymentAmount}
                  />

                  {/* Step 2: Choose payment method */}
                  <PaymentMethodSelection
                    checkNumber={checkNumber}
                    paymentDate={paymentDate}
                    paymentMethod={paymentMethod}
                    onCheckNumberChange={setCheckNumber}
                    onPaymentDateChange={setPaymentDate}
                    onPaymentMethodChange={setPaymentMethod}
                  />
                </div>
              </div>

              {/* Right sidebar - Summary */}
              <PaymentSummary
                applyCredit={applyCredit}
                invoiceAmounts={invoiceAmounts}
                invoices={invoices}
                isSubmitting={isSubmitting}
                selectedInvoices={selectedInvoices}
                total={total}
                onSubmitPayment={handleSubmitPayment}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

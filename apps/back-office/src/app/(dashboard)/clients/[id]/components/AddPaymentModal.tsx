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

export const calculateRemainingAmount = (
  invoice: InvoiceWithPayments,
): number => {
  const totalAmount = Number(invoice.amount);
  const creditApplied =
    invoice.Payment?.reduce((sum, payment) => {
      return sum + Number(payment.credit_applied);
    }, 0) || 0;

  const totalPaid =
    invoice.Payment?.reduce((sum, payment) => {
      return sum + Number(payment.amount);
    }, 0) || 0;
  return totalAmount - totalPaid - creditApplied;
};

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
  const [credit, setCredit] = useState(0);
  const [invoices, setInvoices] = useState<InvoiceWithPayments[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceAmounts, setInvoiceAmounts] = useState<Record<string, string>>(
    {},
  );
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>(
    {},
  );

  const { id } = useParams();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get("appointmentId");

  useEffect(() => {
    const fetchInvoicesForPayment = async () => {
      const [response, error] = await fetchInvoices({
        searchParams: {
          clientGroupId: id,
          status: "UNPAID",
          appointmentId: appointmentId,
        },
      });

      if (!error && response) {
        const invoiceResponse = response as InvoiceWithPayments[];
        if (invoiceResponse.length > 0) {
          setCredit(invoiceResponse[0].ClientGroup.available_credit || 0);
          setInvoices(invoiceResponse);

          const invoiceId = searchParams.get("invoiceId");
          setSelectedInvoices(
            invoiceId ? [invoiceId] : [invoiceResponse[0].id],
          );

          // Initialize invoice amounts with remaining balances
          const initialAmounts: Record<string, string> = {};
          invoiceResponse.forEach((invoice) => {
            const remainingAmount = calculateRemainingAmount(invoice);
            initialAmounts[invoice.id] = remainingAmount.toString();
          });
          setInvoiceAmounts(initialAmounts);
        }
      }
    };

    fetchInvoicesForPayment();
  }, [id, searchParams, appointmentId]);

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

  const handleErrorMessagesUpdate = (errors: Record<string, string>) => {
    setErrorMessages(errors);
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
      // Calculate credit to apply (not exceeding total)
      const totalAmount = calculateTotal();
      const creditToApply = Math.min(credit, totalAmount);
      const finalPaymentAmount = Math.max(
        totalAmount - (applyCredit ? creditToApply : 0),
        0,
      );

      // Create filtered invoices with payment amounts
      const invoiceWithPayment = invoices
        .filter((inv) => selectedInvoices.includes(inv.id))
        .map((inv) => ({
          id: inv.id,
          amount: Number(invoiceAmounts[inv.id] || 0),
        }));

      // Prepare and process payment data
      if (invoiceWithPayment.length > 0) {
        const paymentData = {
          status: "completed",
          invoiceWithPayment,
          client_group_id: invoices[0].client_group_id,
          transaction_id: paymentMethod === "check" ? checkNumber : undefined,
          response: JSON.stringify({
            payment_method: paymentMethod,
            payment_date: paymentDate,
          }),
          applyCredit: applyCredit,
          credit_applied: applyCredit ? creditToApply : 0,
        };
        const [_, error] = await createPayment({ body: paymentData });
        if (error) throw error;

        // Update UI based on whether it's a credit-only payment or regular payment
        if (finalPaymentAmount <= 0 && applyCredit && creditToApply > 0) {
          toast({
            title: "Credit allocated",
            description: `$${creditToApply.toFixed(2)} in credit has been successfully applied.`,
            variant: "success",
          });
        } else {
          toast({
            title: "Payment successful",
            description: `Payment of $${finalPaymentAmount.toFixed(2)} was successfully processed.`,
            variant: "success",
          });
        }

        fetchInvoicesData();
        onOpenChange(false);
      }
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
    if (!isOpen) {
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
                    credit={credit}
                    invoiceAmounts={invoiceAmounts}
                    invoices={invoices}
                    selectedInvoices={selectedInvoices}
                    total={total}
                    onAmountChange={handleAmountChange}
                    onApplyCreditChange={setApplyCredit}
                    onErrorMessagesUpdate={handleErrorMessagesUpdate}
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
                credit={credit}
                errorMessages={errorMessages}
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

/* eslint-disable max-lines-per-function */
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@mcw/ui";
import { Input } from "@mcw/ui";
import { RadioGroup, RadioGroupItem } from "@mcw/ui";
import { Label } from "@mcw/ui";
import { Checkbox } from "@mcw/ui";
import { Dialog, DialogContent } from "@mcw/ui";

interface Invoice {
  id: string;
  date: string;
  description: string;
  type: string;
  balance: string;
  amount: string;
}

interface AddPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
}

export function AddPaymentModal({
  open,
  onOpenChange,
  clientName,
}: AddPaymentModalProps) {
  // Sample invoices data
  const allInvoices: Invoice[] = [
    {
      id: "INV #12",
      date: "03/24/2025",
      description: "Professional Services",
      type: "Self-pay",
      balance: "200",
      amount: "200",
    },
    {
      id: "INV #11",
      date: "03/24/2025",
      description: "Professional Services",
      type: "Self-pay",
      balance: "200",
      amount: "200",
    },
    {
      id: "INV #10",
      date: "03/24/2025",
      description: "Professional Services",
      type: "Self-pay",
      balance: "200",
      amount: "200",
    },
    {
      id: "INV #9",
      date: "03/24/2025",
      description: "Professional Services",
      type: "Self-pay",
      balance: "200",
      amount: "200",
    },
  ];

  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([
    "INV #12",
  ]);
  const [__paymentAmount, setPaymentAmount] = useState("200");
  const [paymentMethod, setPaymentMethod] = useState("check");
  const [paymentDate, setPaymentDate] = useState("2025-03-27");
  const [checkNumber, setCheckNumber] = useState("1234");
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const [applyCredit, setApplyCredit] = useState(false);

  // Calculate total based on selected invoices
  const calculateTotal = () => {
    return selectedInvoices.reduce((total, invId) => {
      const invoice = allInvoices.find((inv) => inv.id === invId);
      return total + (invoice ? Number.parseFloat(invoice.amount) : 0);
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
    allInvoices.map((inv) => {
      if (inv.id === invoiceId) {
        return { ...inv, amount };
      }
      return inv;
    });
    // This would normally update the state, but for this example we're just logging
    console.log("Updated invoice amount", invoiceId, amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full h-screen p-0 m-0 rounded-none [&>button]:hidden">
        <div className="flex flex-col h-full overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <Button
                className="mr-2"
                size="icon"
                variant="ghost"
                onClick={() => onOpenChange(false)}
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
                      <div>Type</div>
                      <div>Balance</div>
                      <div>Amount</div>
                    </div>

                    {/* Display first invoice or all invoices based on state */}
                    {(showAllInvoices
                      ? allInvoices
                      : allInvoices.slice(0, 1)
                    ).map((invoice, index) => (
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
                              toggleInvoiceSelection(
                                invoice.id,
                                checked as boolean,
                              )
                            }
                          />
                          <div>
                            <div>{invoice.id}</div>
                            <div className="text-gray-500 text-sm">
                              {invoice.date} {invoice.description}
                            </div>
                          </div>
                        </div>
                        <div>{invoice.type}</div>
                        <div>${invoice.balance}</div>
                        <div>
                          <Input
                            className="w-full"
                            value={invoice.amount}
                            onChange={(e) =>
                              handleAmountChange(invoice.id, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    ))}

                    {/* Toggle button for showing/hiding invoices */}
                    <button
                      className="text-blue-500 hover:underline text-sm mt-4"
                      onClick={() => setShowAllInvoices(!showAllInvoices)}
                    >
                      {showAllInvoices
                        ? "Hide"
                        : `Show additional unpaid invoices (${allInvoices.length - 1})`}
                    </button>

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
                              setApplyCredit(checked as boolean)
                            }
                          />
                          <label htmlFor="apply-credit">
                            Apply available credit ($100)
                          </label>
                        </div>
                        <div>{applyCredit ? "-$100.00" : "--"}</div>
                      </div>
                      <div className="flex justify-between font-medium">
                        <div>Payment amount</div>
                        <div>
                          <Input
                            className="w-24"
                            value={
                              applyCredit
                                ? (total - 100).toFixed(2)
                                : total.toFixed(2)
                            }
                            onChange={(e) => setPaymentAmount(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Choose payment method */}
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white mr-2">
                      <span>2</span>
                    </div>
                    <h3 className="text-lg font-medium">
                      Choose payment method
                    </h3>
                  </div>

                  <p className="text-gray-600 mb-4">
                    A payment method is required
                  </p>

                  <div className="bg-gray-100 rounded-md p-4">
                    <RadioGroup
                      className="space-y-4"
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="card" value="card" />
                        <Label className="flex items-center" htmlFor="card">
                          <span className="mr-2">Online card on file</span>
                          <div className="flex space-x-1">
                            <div className="w-6 h-4 bg-black rounded" />
                            <div className="w-6 h-4 bg-blue-500 rounded" />
                            <div className="w-6 h-4 bg-gray-500 rounded" />
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="cash" value="cash" />
                        <Label htmlFor="cash">Cash</Label>
                      </div>

                      {paymentMethod === "cash" && (
                        <div className="pl-6">
                          <div className="mb-2">
                            <Label
                              className="block mb-1"
                              htmlFor="cash-payment-date"
                            >
                              Payment Date
                            </Label>
                            <Input
                              className="w-48"
                              id="cash-payment-date"
                              type="date"
                              value={paymentDate}
                              onChange={(e) => setPaymentDate(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="check" value="check" />
                        <Label htmlFor="check">Check</Label>
                      </div>

                      {paymentMethod === "check" && (
                        <div className="pl-6 flex">
                          <div>
                            <Label
                              className="block mb-1"
                              htmlFor="check-payment-date"
                            >
                              Payment Date
                            </Label>
                            <Input
                              className="w-48"
                              id="check-payment-date"
                              type="date"
                              value={paymentDate}
                              onChange={(e) => setPaymentDate(e.target.value)}
                            />
                          </div>
                          <div className="ml-4">
                            <Label
                              className="block mb-1"
                              htmlFor="check-number"
                            >
                              Check Number
                            </Label>
                            <Input
                              className="w-48"
                              id="check-number"
                              placeholder="Ex. 1234"
                              value={checkNumber}
                              onChange={(e) => setCheckNumber(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="external" value="external" />
                        <div>
                          <Label htmlFor="external">External card</Label>
                          <p className="text-sm text-gray-500">
                            Record a payment collected using an external payment
                            processor
                          </p>
                        </div>
                      </div>

                      {paymentMethod === "external" && (
                        <div className="pl-6">
                          <div className="mb-2">
                            <Label
                              className="block mb-1"
                              htmlFor="external-payment-date"
                            >
                              Payment Date
                            </Label>
                            <Input
                              className="w-48"
                              id="external-payment-date"
                              type="date"
                              value={paymentDate}
                              onChange={(e) => setPaymentDate(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </div>

            {/* Right sidebar - Summary */}
            <div className="w-80 border-l p-6 bg-white overflow-y-auto">
              <h3 className="font-medium mb-4">Summary</h3>

              <div className="space-y-4">
                {selectedInvoices.map((invId, index) => {
                  const invoice = allInvoices.find((inv) => inv.id === invId);
                  return invoice ? (
                    <div key={index} className="flex justify-between">
                      <div>{invoice.id}</div>
                      <div>${invoice.amount}</div>
                    </div>
                  ) : null;
                })}

                <div className="flex justify-between pt-4 border-t">
                  <div>Subtotal</div>
                  <div>${total.toFixed(2)}</div>
                </div>

                <div className="flex justify-between font-medium">
                  <div>Total payment</div>
                  <div>
                    ${applyCredit ? (total - 100).toFixed(2) : total.toFixed(2)}
                  </div>
                </div>

                <Button className="w-full bg-green-500 hover:bg-green-600">
                  Add $
                  {applyCredit ? (total - 100).toFixed(2) : total.toFixed(2)}{" "}
                  payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

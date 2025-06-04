"use client";
import { useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mcw/ui";
import { X } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const [paymentDate, setPaymentDate] = useState("2025-02-09");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [invoiceChecked, setInvoiceChecked] = useState(true);
  const [creditChecked, setCreditChecked] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("$100");

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-auto [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-[#e5e7eb]">
          <Button
            className="mr-3"
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
          <DialogTitle className="text-xl">
            Add Payment for Jamie D. Appleseed
          </DialogTitle>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-row md:flex-row gap-6">
            <div className="flex-1">
              {/* Step 1 */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#dbeafe] text-[#2563eb] text-sm font-medium">
                    1
                  </div>
                  <h3 className="text-lg font-semibold">
                    Select invoices and confirm payment amount
                  </h3>
                </div>

                <p className="text-[#6b7280] mb-4">
                  You can make partial payments on new invoices
                </p>

                <div className="bg-[#f9fafb] rounded-md p-4 mb-4">
                  <Table className="mb-4">
                    <TableHeader>
                      <TableRow className="border-b border-[#e5e7eb]">
                        <TableHead className="w-10" />
                        <TableHead className="text-left py-2 text-sm font-medium text-[#6b7280]">
                          Invoice
                        </TableHead>
                        <TableHead className="text-left py-2 text-sm font-medium text-[#6b7280]">
                          Details
                        </TableHead>
                        <TableHead className="text-left py-2 text-sm font-medium text-[#6b7280]">
                          Type
                        </TableHead>
                        <TableHead className="text-right py-2 text-sm font-medium text-[#6b7280]">
                          Balance
                        </TableHead>
                        <TableHead className="text-right py-2 text-sm font-medium text-[#6b7280]">
                          Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="py-3">
                          <Checkbox
                            checked={invoiceChecked}
                            className="rounded border-[#d1d5db] text-[#2563eb]"
                            onCheckedChange={(checked) =>
                              setInvoiceChecked(checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="py-3 text-sm text-[#2563eb]">
                          INV #4
                        </TableCell>
                        <TableCell className="py-3 text-sm text-[#374151]">
                          02/07/2025 Professional Services
                        </TableCell>
                        <TableCell className="py-3 text-sm text-[#374151]">
                          Self-pay
                        </TableCell>
                        <TableCell className="py-3 text-sm text-right text-[#374151]">
                          $100
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <Input
                            className="w-24 px-3 py-1 text-right border border-[#e5e7eb] rounded-md text-sm"
                            type="text"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  <Button className="text-[#2563eb] text-sm" variant="link">
                    Show additional unpaid invoices (3)
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-medium">$100</span>
                  </div>

                  <div className="flex items-center">
                    <Checkbox
                      checked={creditChecked}
                      className="rounded border-[#d1d5db] mr-2"
                      id="credit"
                      onCheckedChange={(checked) =>
                        setCreditChecked(checked as boolean)
                      }
                    />
                    <Label className="text-sm text-[#374151]" htmlFor="credit">
                      Apply available credit ($100)
                    </Label>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium">Payment amount</span>
                    <Input
                      className="w-32 px-3 py-1 text-right border border-[#e5e7eb] rounded-md"
                      type="text"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#dbeafe] text-[#2563eb] text-sm font-medium">
                    2
                  </div>
                  <h3 className="text-lg font-semibold">
                    Choose payment method
                  </h3>
                </div>

                <p className="text-[#6b7280] mb-4">
                  A payment method is required
                </p>

                <div className="bg-[#f9fafb] rounded-md p-4 space-y-4">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <div className="flex items-center">
                      <RadioGroupItem className="mr-2" id="card" value="card" />
                      <Label className="flex items-center" htmlFor="card">
                        <span className="mr-2">Online card on file</span>
                        <div className="flex">
                          <span className="bg-[#1f2937] text-white text-xs px-1 rounded mr-1">
                            VISA
                          </span>
                          <span className="bg-[#ea580c] text-white text-xs px-1 rounded mr-1">
                            MC
                          </span>
                          <span className="bg-[#3b82f6] text-white text-xs px-1 rounded">
                            AMEX
                          </span>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-start">
                      <RadioGroupItem
                        className="mr-2 mt-1"
                        id="cash"
                        value="cash"
                      />
                      <div className="flex-1">
                        <Label className="block mb-2" htmlFor="cash">
                          Cash
                        </Label>
                        {paymentMethod === "cash" && (
                          <div>
                            <Label
                              className="block text-sm text-[#6b7280] mb-1"
                              htmlFor="paymentDate"
                            >
                              Payment Date
                            </Label>
                            <Input
                              className="px-3 py-2 border border-[#e5e7eb] rounded-md w-48"
                              id="paymentDate"
                              type="date"
                              value={paymentDate}
                              onChange={(e) => setPaymentDate(e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <RadioGroupItem
                        className="mr-2"
                        id="check"
                        value="check"
                      />
                      <Label htmlFor="check">Check</Label>
                    </div>

                    <div className="flex items-start">
                      <RadioGroupItem
                        className="mr-2 mt-1"
                        id="external"
                        value="external"
                      />
                      <div>
                        <Label className="block" htmlFor="external">
                          External card
                        </Label>
                        <p className="text-sm text-[#6b7280]">
                          Record a payment collected using an external payment
                          processor
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="basis-1/3">
              <div className="border border-[#e5e7eb] rounded-md p-4">
                <h4 className="font-medium mb-4">Summary</h4>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm">INV #4</span>
                    <span className="text-sm">$100</span>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-[#e5e7eb]">
                    <span className="font-medium">Subtotal</span>
                    <span>$100</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">Total payment</span>
                    <span>$100</span>
                  </div>
                </div>

                <Button className="w-full bg-[#2d8467] text-white py-3 rounded-md font-medium">
                  Add $100 payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

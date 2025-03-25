"use client";

import { X } from "lucide-react";
import { useState } from "react";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-[#e5e7eb]">
          <button
            className="text-[#6b7280] hover:text-[#374151] mr-3"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">
            Add Payment for Jamie D. Appleseed
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
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
                  <table className="w-full mb-4">
                    <thead>
                      <tr className="border-b border-[#e5e7eb]">
                        <th className="text-left py-2 w-10" />
                        <th className="text-left py-2 text-sm font-medium text-[#6b7280]">
                          Invoice
                        </th>
                        <th className="text-left py-2 text-sm font-medium text-[#6b7280]">
                          Details
                        </th>
                        <th className="text-left py-2 text-sm font-medium text-[#6b7280]">
                          Type
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-[#6b7280]">
                          Balance
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-[#6b7280]">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-3">
                          <input
                            checked={invoiceChecked}
                            className="rounded border-[#d1d5db] text-[#2563eb]"
                            type="checkbox"
                            onChange={(e) =>
                              setInvoiceChecked(e.target.checked)
                            }
                          />
                        </td>
                        <td className="py-3 text-sm text-[#2563eb]">INV #4</td>
                        <td className="py-3 text-sm text-[#374151]">
                          02/07/2025 Professional Services
                        </td>
                        <td className="py-3 text-sm text-[#374151]">
                          Self-pay
                        </td>
                        <td className="py-3 text-sm text-right text-[#374151]">
                          $100
                        </td>
                        <td className="py-3 text-right">
                          <input
                            className="w-24 px-3 py-1 text-right border border-[#e5e7eb] rounded-md text-sm"
                            type="text"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <button className="text-[#2563eb] text-sm hover:underline">
                    Show additional unpaid invoices (3)
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-medium">$100</span>
                  </div>

                  <div className="flex items-center">
                    <input
                      checked={creditChecked}
                      className="rounded border-[#d1d5db] mr-2"
                      id="credit"
                      type="checkbox"
                      onChange={(e) => setCreditChecked(e.target.checked)}
                    />
                    <label className="text-sm text-[#374151]" htmlFor="credit">
                      Apply available credit ($100)
                    </label>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium">Payment amount</span>
                    <input
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
                  <div className="flex items-center">
                    <input
                      checked={paymentMethod === "card"}
                      className="mr-2"
                      id="card"
                      name="paymentMethod"
                      type="radio"
                      value="card"
                      onChange={() => setPaymentMethod("card")}
                    />
                    <label className="flex items-center" htmlFor="card">
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
                    </label>
                  </div>

                  <div className="flex items-start">
                    <input
                      checked={paymentMethod === "cash"}
                      className="mr-2 mt-1"
                      id="cash"
                      name="paymentMethod"
                      type="radio"
                      value="cash"
                      onChange={() => setPaymentMethod("cash")}
                    />
                    <div className="flex-1">
                      <label className="block mb-2" htmlFor="cash">
                        Cash
                      </label>
                      {paymentMethod === "cash" && (
                        <div>
                          <label
                            className="block text-sm text-[#6b7280] mb-1"
                            htmlFor="paymentDate"
                          >
                            Payment Date
                          </label>
                          <input
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
                    <input
                      checked={paymentMethod === "check"}
                      className="mr-2"
                      id="check"
                      name="paymentMethod"
                      type="radio"
                      value="check"
                      onChange={() => setPaymentMethod("check")}
                    />
                    <label htmlFor="check">Check</label>
                  </div>

                  <div className="flex items-start">
                    <input
                      checked={paymentMethod === "external"}
                      className="mr-2 mt-1"
                      id="external"
                      name="paymentMethod"
                      type="radio"
                      value="external"
                      onChange={() => setPaymentMethod("external")}
                    />
                    <div>
                      <label className="block" htmlFor="external">
                        External card
                      </label>
                      <p className="text-sm text-[#6b7280]">
                        Record a payment collected using an external payment
                        processor
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="w-full md:w-80 shrink-0">
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

                <button className="w-full bg-[#2d8467] text-white py-3 rounded-md font-medium">
                  Add $100 payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

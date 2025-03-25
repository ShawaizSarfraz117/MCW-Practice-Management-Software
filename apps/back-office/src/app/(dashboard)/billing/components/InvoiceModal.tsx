"use client";

import { X, ChevronDown } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the PaymentModal to prevent context provider conflicts
const PaymentModal = dynamic(
  () => import("./PaymentModal").then((mod) => mod.PaymentModal),
  {
    ssr: false,
  },
);

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceModal({ isOpen, onClose }: InvoiceModalProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const openPaymentModal = () => setIsPaymentModalOpen(true);
  const closePaymentModal = () => setIsPaymentModalOpen(false);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#e5e7eb]">
            <div className="flex items-center gap-3">
              <button
                className="text-[#6b7280] hover:text-[#374151]"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold">
                Invoice for Jamie D. Appleseed
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1 px-4 py-2 border border-[#e5e7eb] rounded-md text-[#374151]">
                <span>More</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                className="bg-[#2d8467] text-white px-4 py-2 rounded-md"
                onClick={openPaymentModal}
              >
                Add Payment
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* From */}
            <div>
              <p className="text-[#6b7280] mb-1">From</p>
              <p className="text-[#1f2937] font-medium">Alam Naqvi</p>
            </div>

            {/* Invoice Title */}
            <h3 className="text-2xl font-semibold text-[#1f2937]">Invoice</h3>

            {/* Bill To and Invoice Info */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-[#6b7280] mb-2">Bill To</p>
                <div className="space-y-1">
                  <p className="text-[#1f2937] font-medium">
                    Jamie D. Appleseed
                  </p>
                  <p className="text-[#374151]">123 Main Street</p>
                  <p className="text-[#374151]">Anytown, CA 12345</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <p className="text-[#6b7280]">Invoice</p>
                  <p className="text-[#1f2937] font-medium">#4</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[#6b7280]">Issued:</p>
                  <p className="text-[#1f2937]">02/07/2025</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[#6b7280]">Due:</p>
                  <p className="text-[#1f2937]">03/09/2025</p>
                </div>
              </div>
            </div>

            {/* Client and Provider Info */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-[#6b7280] mb-2">Client</p>
                <div className="space-y-1">
                  <p className="text-[#1f2937] font-medium">
                    Jamie D. Appleseed
                  </p>
                  <p className="text-[#374151]">7275101326</p>
                  <p className="text-[#374151]">alam@mcnultycw.com</p>
                </div>
              </div>
              <div>
                <p className="text-[#6b7280] mb-2">Provider</p>
                <div className="space-y-1">
                  <p className="text-[#1f2937] font-medium">Alam Naqvi</p>
                  <p className="text-[#374151]">alam@mcnultycw.com</p>
                </div>
              </div>
            </div>

            {/* Services Table */}
            <div className="border border-[#e5e7eb] rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
                      Description
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[#6b7280]">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#e5e7eb]">
                    <td className="py-3 px-4 text-sm text-[#374151]">
                      02/07/2025
                    </td>
                    <td className="py-3 px-4 text-sm text-[#374151]">
                      Professional Services
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-[#374151]">
                      $100.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="flex flex-col items-end space-y-2 pt-4">
              <div className="flex justify-between w-48">
                <p className="text-[#6b7280]">Subtotal</p>
                <p className="text-[#1f2937]">100.00</p>
              </div>
              <div className="flex justify-between w-48">
                <p className="text-[#6b7280]">Total</p>
                <p className="text-[#1f2937]">100.00</p>
              </div>
              <div className="flex justify-between w-48">
                <p className="text-[#6b7280]">Amount Paid</p>
                <p className="text-[#1f2937]">0.00</p>
              </div>
              <div className="flex justify-between w-48 border-t border-[#e5e7eb] pt-2 font-medium">
                <p className="text-[#1f2937]">Balance</p>
                <p className="text-[#1f2937]">$100.00</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal isOpen={isPaymentModalOpen} onClose={closePaymentModal} />
      )}
    </>
  );
}

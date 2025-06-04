"use client";

import { X, ChevronDown } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@mcw/ui";

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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-auto [&>button]:hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#e5e7eb]">
            <div className="flex items-center gap-3">
              <Button
                className="text-[#6b7280] hover:text-[#374151]"
                size="icon"
                variant="ghost"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
              <DialogTitle className="text-xl font-semibold">
                Invoice for Jamie D. Appleseed
              </DialogTitle>
            </div>
            <div className="flex items-center gap-3">
              <Button className="flex items-center gap-1" variant="outline">
                <span>More</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                className="bg-[#2d8467] text-white"
                onClick={openPaymentModal}
              >
                Add Payment
              </Button>
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
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                    <TableHead className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
                      Date
                    </TableHead>
                    <TableHead className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
                      Description
                    </TableHead>
                    <TableHead className="text-right py-3 px-4 text-sm font-medium text-[#6b7280]">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-b border-[#e5e7eb]">
                    <TableCell className="py-3 px-4 text-sm text-[#374151]">
                      02/07/2025
                    </TableCell>
                    <TableCell className="py-3 px-4 text-sm text-[#374151]">
                      Professional Services
                    </TableCell>
                    <TableCell className="py-3 px-4 text-sm text-right font-medium text-[#374151]">
                      $100.00
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal isOpen={isPaymentModalOpen} onClose={closePaymentModal} />
      )}
    </>
  );
}

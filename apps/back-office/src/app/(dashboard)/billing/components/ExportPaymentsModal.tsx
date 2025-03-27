"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Button, Label, RadioGroup, RadioGroupItem } from "@mcw/ui";

interface ExportPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportPaymentsModal({
  isOpen,
  onClose,
}: ExportPaymentsModalProps) {
  const [dateOption, setDateOption] = useState("last");
  const [exportFormat, setExportFormat] = useState("quickbooks");

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb]">
          <h2 className="text-2xl font-semibold text-[#111827]">
            Export payments
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Date Range Options */}
          <div className="space-y-4">
            <RadioGroup
              className="space-y-4"
              value={dateOption}
              onValueChange={setDateOption}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem
                  className="w-5 h-5 text-[#2563eb] border-[#d1d5db] focus:ring-[#2563eb]"
                  id="lastExport"
                  value="last"
                />
                <Label className="text-lg text-[#111827]" htmlFor="lastExport">
                  Since last export
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <RadioGroupItem
                  className="w-5 h-5 text-[#2563eb] border-[#d1d5db] focus:ring-[#2563eb]"
                  id="selectDate"
                  value="select"
                />
                <Label className="text-lg text-[#111827]" htmlFor="selectDate">
                  Select date range
                </Label>
                <div
                  className={`ml-2 px-4 py-2 bg-[#eff6ff] text-[#2563eb] rounded-md ${dateOption !== "select" ? "opacity-50" : ""}`}
                >
                  01/11/2025 - 02/09/2025
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Separator */}
          <div className="border-t border-[#e5e7eb]" />

          {/* Export Format Options */}
          <div className="space-y-4">
            <RadioGroup
              className="space-y-4"
              value={exportFormat}
              onValueChange={setExportFormat}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem
                  className="w-5 h-5 text-[#2563eb] border-[#d1d5db] focus:ring-[#2563eb]"
                  id="quickbooks"
                  value="quickbooks"
                />
                <Label className="text-lg text-[#111827]" htmlFor="quickbooks">
                  Quickbooks
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <RadioGroupItem
                  className="w-5 h-5 text-[#2563eb] border-[#d1d5db] focus:ring-[#2563eb]"
                  id="csv"
                  value="csv"
                />
                <Label className="text-lg text-[#111827]" htmlFor="csv">
                  CSV
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-[#e5e7eb]">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default">Export</Button>
        </div>
      </div>
    </div>
  );
}

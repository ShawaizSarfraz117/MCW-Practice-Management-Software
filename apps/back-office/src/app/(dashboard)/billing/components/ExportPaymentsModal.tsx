"use client";

import { X } from "lucide-react";
import { useState } from "react";

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
          <button
            className="text-[#9ca3af] hover:text-[#374151]"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Date Range Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                checked={dateOption === "last"}
                className="w-5 h-5 text-[#2563eb] border-[#d1d5db] focus:ring-[#2563eb]"
                id="lastExport"
                name="dateRange"
                type="radio"
                value="last"
                onChange={() => setDateOption("last")}
              />
              <label className="text-lg text-[#111827]" htmlFor="lastExport">
                Since last export
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                checked={dateOption === "select"}
                className="w-5 h-5 text-[#2563eb] border-[#d1d5db] focus:ring-[#2563eb]"
                id="selectDate"
                name="dateRange"
                type="radio"
                value="select"
                onChange={() => setDateOption("select")}
              />
              <label className="text-lg text-[#111827]" htmlFor="selectDate">
                Select date range
              </label>
              <div
                className={`ml-2 px-4 py-2 bg-[#eff6ff] text-[#2563eb] rounded-md ${dateOption !== "select" ? "opacity-50" : ""}`}
              >
                01/11/2025 - 02/09/2025
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-[#e5e7eb]" />

          {/* Export Format Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                checked={exportFormat === "quickbooks"}
                className="w-5 h-5 text-[#2563eb] border-[#d1d5db] focus:ring-[#2563eb]"
                id="quickbooks"
                name="exportFormat"
                type="radio"
                value="quickbooks"
                onChange={() => setExportFormat("quickbooks")}
              />
              <label className="text-lg text-[#111827]" htmlFor="quickbooks">
                Quickbooks
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                checked={exportFormat === "csv"}
                className="w-5 h-5 text-[#2563eb] border-[#d1d5db] focus:ring-[#2563eb]"
                id="csv"
                name="exportFormat"
                type="radio"
                value="csv"
                onChange={() => setExportFormat("csv")}
              />
              <label className="text-lg text-[#111827]" htmlFor="csv">
                CSV
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-[#e5e7eb]">
          <button
            className="px-5 py-2 text-[#374151] font-medium rounded-md hover:bg-[#f3f4f6]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="px-5 py-2 bg-[#2d8467] text-white font-medium rounded-md hover:bg-[#2d8467]/90">
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

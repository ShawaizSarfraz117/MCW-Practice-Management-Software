"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the modal to prevent context provider conflicts
const ExportPaymentsModal = dynamic(
  () =>
    import("./components/ExportPaymentsModal").then(
      (mod) => mod.ExportPaymentsModal,
    ),
  {
    ssr: false,
  },
);

export default function BillingDashboard() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const openExportModal = () => setIsExportModalOpen(true);
  const closeExportModal = () => setIsExportModalOpen(false);

  return (
    <>
      {/* Date Range */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-sm text-[#6b7280] border border-[#e5e7eb] rounded-md px-3 py-2">
          <Calendar className="w-4 h-4" />
          <span>01/11/2025 - 02/09/2025</span>
        </div>
        <button
          className="flex items-center gap-2 text-[#2d8467] text-sm font-medium"
          onClick={openExportModal}
        >
          <DownloadIcon className="w-4 h-4" />
          Export Payments
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#e5e7eb] rounded-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
                Date
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
                Type
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
            {[...Array(9)].map((_, index) => (
              <tr
                key={`activity-${index}`}
                className="border-b border-[#e5e7eb] last:border-b-0"
              >
                <td className="py-3 px-4 text-sm text-[#374151]">2/7/2025</td>
                <td className="py-3 px-4 text-sm">
                  <a className="text-[#2563eb] hover:underline" href="#">
                    Invoice for Jamie D. Appleseed
                  </a>
                </td>
                <td className="py-3 px-4 text-sm text-[#374151]">
                  {index % 3 === 0 ? (
                    <span className="text-[#2563eb]">INV #4</span>
                  ) : index % 3 === 1 ? (
                    <span>90834 Psychotherapy, 45 mins</span>
                  ) : index === 6 ? (
                    <span>Cash</span>
                  ) : (
                    <span className="text-[#2563eb]">INV #4</span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-right font-medium text-[#374151]">
                  {index === 7 ? "+$100" : "$100"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Export Payments Modal */}
      {isExportModalOpen && (
        <ExportPaymentsModal
          isOpen={isExportModalOpen}
          onClose={closeExportModal}
        />
      )}
    </>
  );
}

function DownloadIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

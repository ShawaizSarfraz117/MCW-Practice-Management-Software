"use client";

import { useState } from "react";
import { Calendar, Search, FileText, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the modal to prevent context provider conflicts
const InvoiceModal = dynamic(
  () => import("../components/InvoiceModal").then((mod) => mod.InvoiceModal),
  {
    ssr: false,
  },
);

export default function BillingDocumentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3">
          <div className="relative w-[230px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] w-4 h-4" />
            <input
              className="w-full pl-10 pr-3 py-2 rounded-md border border-[#e5e7eb] text-sm focus:outline-none focus:ring-1 focus:ring-[#2d8467]"
              placeholder="Search"
              type="text"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-[#6b7280] border border-[#e5e7eb] rounded-md px-3 py-2">
            <Calendar className="w-4 h-4" />
            <span>01/11/2025 - 02/09/2025</span>
          </div>
          <button className="flex items-center gap-1 text-sm border border-[#e5e7eb] rounded-md px-3 py-2">
            <span>View all</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <button className="flex items-center gap-2 text-[#2d8467] text-sm font-medium border border-[#e5e7eb] rounded-md px-3 py-2">
          <FileText className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#e5e7eb] rounded-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <th className="py-3 px-4 text-sm font-medium text-[#6b7280] w-10">
                <input className="rounded border-[#d1d5db]" type="checkbox" />
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
                Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
                Type
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
                Delivery method
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
                Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#6b7280]">
                Date created
              </th>
            </tr>
          </thead>
          <tbody>
            {documentData.map((doc, index) => (
              <tr
                key={`doc-${index}`}
                className="border-b border-[#e5e7eb] last:border-b-0"
              >
                <td className="py-3 px-4">
                  <input className="rounded border-[#d1d5db]" type="checkbox" />
                </td>
                <td className="py-3 px-4 text-sm">
                  <button
                    className="text-[#2563eb] hover:underline text-left"
                    onClick={openModal}
                  >
                    Jamie D. Appleseed
                  </button>
                </td>
                <td className="py-3 px-4 text-sm text-[#374151]">{doc.type}</td>
                <td className="py-3 px-4 text-sm text-[#374151]">Manual</td>
                <td className="py-3 px-4 text-sm text-[#dc2626]">Not sent</td>
                <td className="py-3 px-4 text-sm text-[#374151]">{doc.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice Modal */}
      {isModalOpen && (
        <InvoiceModal isOpen={isModalOpen} onClose={closeModal} />
      )}
    </>
  );
}

// Sample document data
const documentData = [
  { type: "INV #4", date: "2/8/2025 12:44 am" },
  { type: "SB #0001", date: "2/6/2025 1:07 pm" },
  { type: "STMT #0001", date: "2/6/2025 1:07 pm" },
  { type: "INV #4", date: "2/8/2025 12:44 am" },
  { type: "SB #0001", date: "2/6/2025 1:07 pm" },
  { type: "STMT #0001", date: "2/6/2025 1:07 pm" },
  { type: "STMT #0001", date: "2/6/2025 1:07 pm" },
];

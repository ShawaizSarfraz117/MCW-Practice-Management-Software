"use client";
import React from "react";
import { X } from "lucide-react";

interface DocumentationHistorySidebarProps {
  open: boolean;
  onClose: () => void;
}

const docs = [
  {
    date: "APR 1",
    items: [
      {
        title: "Discharge Summary Note",
        subtitle: "Initial diagnosis\nDiagnosis...",
      },
      {
        title: "Diagnosis and treatment plan",
        subtitle: "Diagnosis: F411 - Generalized anxiety disorder",
      },
      {
        title: "Mental Status Exam",
        subtitle: "Appearance: Normal\nDress: Appropriate...",
      },
    ],
  },
  {
    date: "MAR 15",
    items: [{ title: "GAD-7", subtitle: "Score\n14 (Moderate)" }],
  },
  // ...add more as needed
];

const DocumentationHistorySidebar: React.FC<
  DocumentationHistorySidebarProps
> = ({ open, onClose }) => {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-lg z-50 transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ minWidth: 380 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="font-semibold text-lg">Documentation history</div>
        <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="px-6 py-4">
        <button className="w-full bg-[#2d8467] text-white font-semibold rounded py-2 mb-4">
          View current treatment plan
        </button>
        <div className="flex gap-2 mb-4">
          <select className="border rounded px-2 py-1 text-sm">
            <option>All Time</option>
          </select>
          <select className="border rounded px-2 py-1 text-sm">
            <option>All Items</option>
          </select>
        </div>
        <div className="overflow-y-auto max-h-[70vh] pr-2">
          {docs.map((section) => (
            <div key={section.date} className="mb-6">
              <div className="text-xs text-gray-400 font-semibold mb-2">
                {section.date}
              </div>
              {section.items.map((item, i) => (
                <div key={i} className="mb-3">
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-600 whitespace-pre-line">
                    {item.subtitle}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div className="text-xs text-gray-400 mt-8">
            There are no more items for Jamie D. Appleseed in the selected time
            period.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationHistorySidebar;

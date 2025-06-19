"use client";

export function PrintStyles() {
  return (
    <style global jsx>{`
      @media print {
        @page {
          size: A4;
          margin: 0.75in;
        }

        /* Hide non-printable elements */
        .print\\:hidden {
          display: none !important;
        }

        /* Reset background colors */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body {
          font-size: 12pt;
          line-height: 1.6;
          font-family: Arial, sans-serif;
        }

        /* Container styling */
        .print-content {
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Hide screen-only elements */
        .bg-gray-50,
        .min-h-screen {
          background: none !important;
          min-height: auto !important;
          padding: 0 !important;
        }

        /* Header styling - combine client info sections */
        .bg-white.rounded-lg.shadow-sm:first-child {
          box-shadow: none !important;
          border: none !important;
          margin-bottom: 20px !important;
          padding: 0 !important;
          border-bottom: 2px solid #1f2937 !important;
          padding-bottom: 15px !important;
        }

        /* Assessment header with buttons - hide buttons, keep info */
        .bg-white.rounded-lg.shadow-sm:nth-child(2) {
          box-shadow: none !important;
          border: none !important;
          background: #f9fafb !important;
          padding: 15px !important;
          margin-bottom: 30px !important;
          border-radius: 6px !important;
        }

        /* Score cards - side by side layout */
        .grid.grid-cols-1.lg\\:grid-cols-2 {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 20px !important;
          margin-bottom: 30px !important;
        }

        /* Individual score cards */
        .grid .shadow-sm {
          box-shadow: none !important;
          border: 1px solid #e5e7eb !important;
          padding: 20px !important;
          background: white !important;
        }

        /* Score visualization adjustments */
        .relative.w-48.h-48 {
          width: 120px !important;
          height: 120px !important;
          margin: 0 auto !important;
        }

        /* Questions table */
        table {
          page-break-inside: avoid;
          width: 100% !important;
          border-collapse: collapse !important;
          margin-bottom: 20px !important;
        }

        /* Table headers */
        thead th {
          background-color: #f9fafb !important;
          font-weight: 600 !important;
          padding: 12px 8px !important;
          border-bottom: 2px solid #e5e7eb !important;
        }

        /* Table cells */
        tbody td {
          padding: 12px 8px !important;
          border-bottom: 1px solid #e5e7eb !important;
          vertical-align: top !important;
        }

        /* Question number styling */
        .min-w-\\[20px\\] {
          font-weight: 600 !important;
          color: #374151 !important;
        }

        /* Page breaks */
        .print-page-break {
          page-break-before: always;
        }

        /* Sources section */
        .space-y-4 > div:last-child .bg-gray-50 {
          background-color: #f9fafb !important;
          padding: 15px !important;
          border-radius: 6px !important;
          margin-top: 20px !important;
          font-size: 12px !important;
          color: #6b7280 !important;
        }

        /* Remove shadows and unnecessary borders */
        .shadow-sm,
        .shadow {
          box-shadow: none !important;
        }

        /* Ensure text is readable */
        .text-gray-600,
        .text-gray-700 {
          color: #374151 !important;
        }

        .text-sm {
          font-size: 14px !important;
        }

        .text-xs {
          font-size: 12px !important;
        }

        /* Adjust padding for print */
        .p-6 {
          padding: 20px !important;
        }

        .py-4 {
          padding-top: 12px !important;
          padding-bottom: 12px !important;
        }

        .px-4 {
          padding-left: 8px !important;
          padding-right: 8px !important;
        }

        /* Typography adjustments */
        h1 {
          font-size: 24px !important;
          font-weight: 700 !important;
          margin: 0 0 10px 0 !important;
        }

        h2 {
          font-size: 20px !important;
          font-weight: 600 !important;
          margin: 0 0 8px 0 !important;
        }

        h3 {
          font-size: 18px !important;
          font-weight: 600 !important;
          margin: 0 0 15px 0 !important;
        }

        /* Score display specific */
        .text-4xl {
          font-size: 48px !important;
          font-weight: 700 !important;
          color: #1f2937 !important;
        }

        /* Hide unnecessary UI elements */
        button,
        .cursor-pointer {
          cursor: default !important;
        }

        /* Ensure proper spacing between sections */
        .space-y-6 > * {
          margin-bottom: 30px !important;
        }

        /* Print-specific layout fixes */
        .flex.items-center.justify-between {
          display: block !important;
        }

        .flex.items-center.gap-4 {
          display: block !important;
        }

        /* Scoring interpretation card specific styling */
        .flex.items-center.gap-2 {
          display: block !important;
          margin-bottom: 10px !important;
        }

        /* Help icons - hide in print */
        .lucide-help-circle {
          display: none !important;
        }
      }
    `}</style>
  );
}

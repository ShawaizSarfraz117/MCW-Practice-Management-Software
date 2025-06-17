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
        }

        /* Ensure proper page breaks */
        table {
          page-break-inside: avoid;
        }

        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }

        thead {
          display: table-header-group;
        }

        /* Page breaks */
        .print-page-break {
          page-break-before: always;
        }

        /* Remove shadows and borders for cleaner print */
        .shadow-sm,
        .shadow {
          box-shadow: none !important;
          border: 1px solid #e5e7eb !important;
        }

        /* Ensure text is readable */
        .text-gray-600,
        .text-gray-700 {
          color: #374151 !important;
        }

        /* Reduce padding for print */
        .p-6 {
          padding: 1rem !important;
        }

        .py-4 {
          padding-top: 0.5rem !important;
          padding-bottom: 0.5rem !important;
        }

        /* Fix flex layouts */
        .flex {
          display: block !important;
        }

        .justify-between {
          text-align: left !important;
        }

        .items-center {
          align-items: flex-start !important;
        }
      }
    `}</style>
  );
}

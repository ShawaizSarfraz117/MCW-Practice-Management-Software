import { RefObject } from "react";

interface PrintInvoiceOptions {
  invoiceNumber?: string;
}

/**
 * Prints an invoice by opening a new window with formatted content
 * @param contentRef Reference to the HTML element containing invoice content
 * @param options Additional options like invoice number
 */
export const printInvoice = (
  contentRef: RefObject<HTMLDivElement>,
  options: PrintInvoiceOptions = {},
): void => {
  if (!contentRef.current) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const content = contentRef.current.innerHTML;
  const { invoiceNumber } = options;

  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice ${invoiceNumber ? `#${invoiceNumber}` : ""}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 0.5in;
            }
            body {
              font-family: Arial, sans-serif;
              color: #333;
              line-height: 1.5;
            }
          }
          body {
            font-family: Arial, sans-serif;
            color: #333;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            background-color: #fff;
          }
          .invoice-container {
            box-shadow: none;
            border: 1px solid #ddd;
            padding: 40px;
            margin-bottom: 20px;
          }
          .header-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          .logo-container {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background-color: #d9d9d9;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          .info-section h4 {
            color: #666;
            font-size: 0.85rem;
            margin-bottom: 8px;
            font-weight: 500;
          }
          .info-section p {
            margin: 0 0 5px 0;
          }
          .invoice-table-container {
            width: 100%;
            margin-bottom: 30px;
          }
          .invoice-table-header {
            display: grid;
            grid-template-columns: 1fr 3fr 1fr;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .invoice-table-header > div {
            font-weight: 500;
            color: #666;
            font-size: 0.85rem;
          }
          .invoice-table-header > div:last-child {
            text-align: right;
          }
          .invoice-table-row {
            display: grid;
            grid-template-columns: 1fr 3fr 1fr;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .invoice-table-row > div:last-child {
            text-align: right;
          }
          .invoice-table {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
          }
          .summary-section {
            width: 100%;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .summary-row.total {
            font-weight: 700;
            font-size: 1.2rem;
            padding-top: 10px;
            border-top: 1px solid #ddd;
          }
          .text-right { text-align: right; }
          .font-medium { font-weight: 500; }
          .font-bold { font-weight: 700; }
          .section-title { 
            font-size: 1.1rem;
            margin-bottom: 15px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          ${content}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onfocus = function() { window.close(); }
            }, 500);
          }
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};

/**
 * Initiates a PDF download of an invoice by opening a print dialog
 * where the user can select "Save as PDF"
 * @param contentRef Reference to the HTML element containing invoice content
 * @param options Additional options like invoice number
 */
export const downloadInvoiceAsPdf = (
  contentRef: RefObject<HTMLDivElement>,
  options: PrintInvoiceOptions = {},
): void => {
  if (!contentRef.current) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const content = contentRef.current.innerHTML;
  const { invoiceNumber } = options;

  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice ${invoiceNumber ? `#${invoiceNumber}` : ""}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 0.5in;
            }
            body {
              font-family: Arial, sans-serif;
              color: #333;
              line-height: 1.5;
            }
          }
          body {
            font-family: Arial, sans-serif;
            color: #333;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            background-color: #fff;
          }
          .invoice-container {
            box-shadow: none;
            border: 1px solid #ddd;
            padding: 40px;
            margin-bottom: 20px;
          }
          .header-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          .logo-container {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background-color: #d9d9d9;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          .info-section h4 {
            color: #666;
            font-size: 0.85rem;
            margin-bottom: 8px;
            font-weight: 500;
          }
          .info-section p {
            margin: 0 0 5px 0;
          }
          .invoice-table-container {
            width: 100%;
            margin-bottom: 30px;
          }
          .invoice-table-header {
            display: grid;
            grid-template-columns: 1fr 3fr 1fr;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .invoice-table-header > div {
            font-weight: 500;
            color: #666;
            font-size: 0.85rem;
          }
          .invoice-table-header > div:last-child {
            text-align: right;
          }
          .invoice-table-row {
            display: grid;
            grid-template-columns: 1fr 3fr 1fr;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .invoice-table-row > div:last-child {
            text-align: right;
          }
          .invoice-table {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
          }
          .summary-section {
            width: 100%;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .summary-row.total {
            font-weight: 700;
            font-size: 1.2rem;
            padding-top: 10px;
            border-top: 1px solid #ddd;
          }
          .text-right { text-align: right; }
          .font-medium { font-weight: 500; }
          .font-bold { font-weight: 700; }
          .section-title { 
            font-size: 1.1rem;
            margin-bottom: 15px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          ${content}
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
};

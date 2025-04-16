import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { Badge } from "@mcw/ui";
import { InvoiceWithPayments } from "./ClientProfile";

interface InvoicesDocumentsCardProps {
  invoices: InvoiceWithPayments[];
  onInvoiceClick: () => void;
}

const formatDate = (date: Date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

export function InvoicesDocumentsCard({
  invoices,
  onInvoiceClick,
}: InvoicesDocumentsCardProps) {
  const [invoicesCollapsed, setInvoicesCollapsed] = useState(false);

  return (
    <div className="p-4 sm:p-6 border border-[#e5e7eb] rounded-md">
      {/* Invoices Section */}
      <div className="mb-6">
        <div
          className="flex justify-between items-center mb-2 cursor-pointer"
          onClick={() => setInvoicesCollapsed(!invoicesCollapsed)}
        >
          <h3 className="font-medium">Invoices</h3>
          {invoicesCollapsed ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>

        {!invoicesCollapsed && (
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div key={invoice.id}>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-blue-500">
                    <Link
                      href={`${window.location.pathname}?invoiceId=${invoice.id}`}
                      onClick={onInvoiceClick}
                    >
                      {invoice.invoice_number}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`bg-red-500 text-white text-xs ${invoice.status === "PAID" ? "bg-green-500" : ""}`}
                    >
                      {invoice.status}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      {formatDate(invoice.issued_date)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billing Documents Section */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <h3 className="font-medium">Billing documents</h3>
            <Info className="h-4 w-4 text-gray-400 ml-1" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-sm text-blue-500">SB #0001</div>
            <div className="text-xs text-gray-500">02/01 - 02/05/2025</div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-blue-500">STMT #0001</div>
            <div className="text-xs text-gray-500">02/01 - 02/06/2025</div>
          </div>
        </div>
      </div>
    </div>
  );
}

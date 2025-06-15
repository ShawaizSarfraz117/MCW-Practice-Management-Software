import { format } from "date-fns";
import Loading from "@/components/Loading";
import { ClientGroup } from "@/types/entities/client";
import Link from "next/link";

interface BillingDocument {
  id: string;
  documentType: string;
  name: string;
  date: string;
  number: string;
  status: string;
  total: number;
  clientGroupName: string;
  clientGroupId: string;
  ClientGroup?: ClientGroup;
}

interface BillingDocumentsTableProps {
  documents: BillingDocument[];
  selectedDocumentIds: Set<string>;
  isLoading: boolean;
  error: unknown;
  isFetchingNextPage: boolean;
  lastElementRef: (node: HTMLTableRowElement | null) => void;
  onSelectAll: (checked: boolean) => void;
  onSelectDocument: (id: string, checked: boolean) => void;
}

export default function BillingDocumentsTable({
  documents,
  selectedDocumentIds,
  isLoading,
  error,
  isFetchingNextPage,
  lastElementRef,
  onSelectAll,
  onSelectDocument,
}: BillingDocumentsTableProps) {
  const allSelected =
    documents.length > 0 &&
    documents.every((doc) => selectedDocumentIds.has(doc.id));
  const someSelected = documents.some((doc) => selectedDocumentIds.has(doc.id));

  // Get client name from ClientGroup data
  const getClientName = (doc: BillingDocument) => {
    try {
      // Parse ClientGroup if it's a string
      const clientGroup =
        typeof doc.ClientGroup === "string"
          ? JSON.parse(doc.ClientGroup)
          : doc.ClientGroup;

      if (clientGroup?.ClientGroupMembership?.[0]?.Client) {
        const client = clientGroup.ClientGroupMembership[0].Client;
        return `${client.first_name || client.legal_first_name || ""} ${client.last_name || client.legal_last_name || ""}`.trim();
      }
    } catch (e) {
      console.error("Error parsing ClientGroup:", e);
    }
    return doc.clientGroupName || "Unknown";
  };

  // Format document type for display
  const formatDocumentType = (type: string, number: string) => {
    switch (type) {
      case "invoice":
        return `INV #${number}`;
      case "superbill":
        return `SB #${number}`;
      case "statement":
        return `STMT #${number}`;
      default:
        return number;
    }
  };

  // Format status for display
  const formatStatus = (isExported: boolean) => {
    return isExported ? "Exported" : "Not sent";
  };

  // Get status color
  const getStatusColor = (isExported: boolean) => {
    return isExported ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="border border-[#e5e7eb] rounded-md overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
            <th className="py-3 px-4 text-sm font-medium text-[#6b7280] w-10">
              <input
                className="rounded border-[#d1d5db]"
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = !allSelected && someSelected;
                  }
                }}
              />
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
          {isLoading ? (
            <tr>
              <td colSpan={6} className="py-8">
                <Loading message="Loading billing documents..." />
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-red-500">
                {error instanceof Error
                  ? error.message
                  : "Failed to load documents"}
              </td>
            </tr>
          ) : documents.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-gray-500">
                No billing documents found
              </td>
            </tr>
          ) : (
            documents.map((doc, index) => (
              <tr
                key={doc.id}
                ref={
                  index === documents.length - 1 ? lastElementRef : undefined
                }
                className="border-b border-[#e5e7eb] last:border-b-0 hover:bg-gray-50"
              >
                <td className="py-3 px-4">
                  <input
                    checked={selectedDocumentIds.has(doc.id)}
                    className="rounded border-[#d1d5db]"
                    type="checkbox"
                    onChange={(e) => onSelectDocument(doc.id, e.target.checked)}
                  />
                </td>
                <td className="py-3 px-4 text-sm">
                  <Link
                    className="text-[#2563eb] hover:underline text-left"
                    href={`/clients/${doc.clientGroupId}?tab=overview`}
                  >
                    {getClientName(doc)}
                  </Link>
                </td>
                <td className="py-3 px-4 text-sm text-[#374151]">
                  <Link
                    className="text-[#2563eb] hover:underline text-left"
                    href={`/clients/${doc.clientGroupId}?tab=billing&type=${doc.documentType}&${doc.documentType === "invoice" ? "invoiceId" : doc.documentType === "superbill" ? "superbillId" : "statementId"}=${doc.id}`}
                  >
                    {formatDocumentType(doc.documentType, doc.number)}
                  </Link>
                </td>
                <td className="py-3 px-4 text-sm text-[#374151]">Manual</td>
                <td
                  className={`py-3 px-4 text-sm ${getStatusColor(doc.status === "EXPORTED")}`}
                >
                  {formatStatus(doc.status === "EXPORTED")}
                </td>
                <td className="py-3 px-4 text-sm text-[#374151]">
                  {format(new Date(doc.date), "M/d/yyyy h:mm a")}
                </td>
              </tr>
            ))
          )}
          {isFetchingNextPage && (
            <tr>
              <td colSpan={6} className="py-4">
                <Loading message="Loading more..." />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

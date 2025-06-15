/* eslint-disable max-lines-per-function */
"use client";

import { useState, useRef, useCallback } from "react";
import { FileText } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useToast } from "@mcw/ui";
import { showErrorToast } from "@mcw/utils";
import BillingDocumentsTable from "./components/BillingDocumentsTable";
import BillingDocumentsFilters from "./components/BillingDocumentsFilters";
import { ClientGroup } from "@/types/entities/client";

type DocumentType = "invoice" | "superbill" | "statement" | "all";

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

interface BillingDocumentsResponse {
  data: BillingDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function BillingDocumentsPage() {
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [dateRangePickerOpen, setDateRangePickerOpen] = useState(false);
  const [selectedDateRangeDisplay, setSelectedDateRangeDisplay] =
    useState<string>("All time");
  const [customDateRange, setCustomDateRange] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { toast } = useToast();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery<BillingDocumentsResponse>({
    queryKey: [
      "billing-documents",
      searchQuery,
      documentType,
      startDate,
      endDate,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: "20",
        includeClientGroup: "true",
      });

      if (searchQuery) {
        // Search by client group name
        params.append("clientGroupName", searchQuery);
      }

      if (documentType !== "all") {
        params.append("type", JSON.stringify([documentType]));
      }

      if (startDate) {
        params.append("startDate", startDate.toISOString());
      }

      if (endDate) {
        params.append("endDate", endDate.toISOString());
      }

      const response = await fetch(`/api/billing-documents?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch billing documents");
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const lastElementRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (isLoading || isFetchingNextPage) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const handleDateRangeChange = (start?: Date, end?: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(documents.map((doc) => doc.id));
      setSelectedDocumentIds(allIds);
    } else {
      setSelectedDocumentIds(new Set());
    }
  };

  // Handle individual checkbox
  const handleSelectDocument = (documentId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedDocumentIds);
    if (checked) {
      newSelectedIds.add(documentId);
    } else {
      newSelectedIds.delete(documentId);
    }
    setSelectedDocumentIds(newSelectedIds);
  };

  // Export selected documents
  const handleExportPDF = async () => {
    if (selectedDocumentIds.size === 0) {
      toast({
        title: "No documents selected",
        description: "Please select at least one document to export",
        variant: "destructive",
      });
      return;
    }

    try {
      // Group selected IDs by document type
      const selectedByType: Record<string, string[]> = {
        invoices: [],
        statements: [],
        superbills: [],
      };

      documents.forEach((doc) => {
        if (selectedDocumentIds.has(doc.id)) {
          if (doc.documentType === "invoice") {
            selectedByType.invoices.push(doc.id);
          } else if (doc.documentType === "statement") {
            selectedByType.statements.push(doc.id);
          } else if (doc.documentType === "superbill") {
            selectedByType.superbills.push(doc.id);
          }
        }
      });

      const response = await fetch("/api/billing-documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedByType),
      });

      if (!response.ok) {
        throw new Error("Failed to export documents");
      }

      const result = await response.json();

      toast({
        title: "Export successful",
        description: result.message,
      });

      // Clear selection after export
      setSelectedDocumentIds(new Set());
    } catch (error) {
      showErrorToast(toast, error);
    }
  };

  // Flatten all pages data
  const documents = data?.pages?.flatMap((page) => page.data) || [];

  return (
    <div className="relative overflow-visible">
      <div className="flex justify-between items-center mb-6">
        <BillingDocumentsFilters
          customDateRange={customDateRange}
          dateRangePickerOpen={dateRangePickerOpen}
          documentType={documentType}
          searchQuery={searchQuery}
          selectedDateRangeDisplay={selectedDateRangeDisplay}
          setCustomDateRange={setCustomDateRange}
          setDateRangePickerOpen={setDateRangePickerOpen}
          setDocumentType={setDocumentType}
          setSearchQuery={setSearchQuery}
          setSelectedDateRangeDisplay={setSelectedDateRangeDisplay}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Export Button */}
        <button
          className="flex items-center gap-2 text-[#2d8467] text-sm font-medium border border-[#e5e7eb] rounded-md px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
          disabled={selectedDocumentIds.size === 0}
          onClick={handleExportPDF}
        >
          <FileText className="w-4 h-4" />
          Export PDF{" "}
          {selectedDocumentIds.size > 0 && `(${selectedDocumentIds.size})`}
        </button>
      </div>

      {/* Table */}
      <BillingDocumentsTable
        documents={documents}
        error={error}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        lastElementRef={lastElementRef}
        selectedDocumentIds={selectedDocumentIds}
        onSelectAll={handleSelectAll}
        onSelectDocument={handleSelectDocument}
      />
    </div>
  );
}

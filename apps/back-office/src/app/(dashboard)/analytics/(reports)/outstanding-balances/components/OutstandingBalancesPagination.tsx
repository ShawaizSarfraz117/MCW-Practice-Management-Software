"use client";

import { Button } from "@mcw/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface OutstandingBalancesPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
}

export default function OutstandingBalancesPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: OutstandingBalancesPaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">Rows per page</span>
        <select
          className="border border-gray-300 rounded px-3 py-1 text-sm"
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span className="text-sm text-gray-700">
          {startItem}-{endItem} of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          disabled={currentPage === 1}
          size="sm"
          variant="outline"
          onClick={() => onPageChange(1)}
        >
          First
        </Button>
        <Button
          disabled={currentPage === 1}
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          disabled={currentPage === totalPages}
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          disabled={currentPage === totalPages}
          size="sm"
          variant="outline"
          onClick={() => onPageChange(totalPages)}
        >
          Last
        </Button>
      </div>
    </div>
  );
}

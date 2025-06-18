"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AttendancePaginationProps {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function AttendancePagination({
  pagination,
  onPageChange,
  onLimitChange,
}: AttendancePaginationProps) {
  const { page, limit, total, totalPages } = pagination;

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Rows per page</span>
        <Select
          value={limit.toString()}
          onValueChange={(value) => onLimitChange(parseInt(value, 10))}
        >
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-700">
          {startItem}-{endItem} of {total}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          disabled={page === 1}
          size="icon"
          variant="ghost"
          onClick={() => onPageChange(1)}
        >
          <ChevronFirst className="w-4 h-4" />
        </Button>
        <Button
          disabled={page === 1}
          size="icon"
          variant="ghost"
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          disabled={page === totalPages}
          size="icon"
          variant="ghost"
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          disabled={page === totalPages}
          size="icon"
          variant="ghost"
          onClick={() => onPageChange(totalPages)}
        >
          <ChevronLast className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

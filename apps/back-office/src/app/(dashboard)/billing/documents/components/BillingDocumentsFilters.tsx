import { Calendar, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import DateRangePicker from "@/(dashboard)/activity/components/DateRangePicker";

type DocumentType = "invoice" | "superbill" | "statement" | "all";

interface BillingDocumentsFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  documentType: DocumentType;
  setDocumentType: (value: DocumentType) => void;
  dateRangePickerOpen: boolean;
  setDateRangePickerOpen: (value: boolean) => void;
  selectedDateRangeDisplay: string;
  setSelectedDateRangeDisplay: (value: string) => void;
  customDateRange: string;
  setCustomDateRange: (value: string) => void;
  onDateRangeChange: (start?: Date, end?: Date) => void;
}

export default function BillingDocumentsFilters({
  searchQuery,
  setSearchQuery,
  documentType,
  setDocumentType,
  dateRangePickerOpen,
  setDateRangePickerOpen,
  selectedDateRangeDisplay,
  setSelectedDateRangeDisplay,
  customDateRange,
  setCustomDateRange,
  onDateRangeChange,
}: BillingDocumentsFiltersProps) {
  return (
    <div className="flex gap-3 items-center">
      {/* Search Input */}
      <div className="relative w-[230px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] w-4 h-4" />
        <input
          className="w-full pl-10 pr-3 py-2 rounded-md border border-[#e5e7eb] text-sm focus:outline-none focus:ring-1 focus:ring-[#2d8467]"
          placeholder="Search by client name"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Date Range Picker */}
      <div className="relative z-50">
        <div
          className="flex items-center gap-2 text-sm text-[#6b7280] border border-[#e5e7eb] rounded-md px-3 py-2 cursor-pointer hover:bg-gray-50"
          onClick={() => setDateRangePickerOpen(true)}
        >
          <Calendar className="w-4 h-4" />
          <span>
            {selectedDateRangeDisplay === "Custom Range"
              ? customDateRange
              : selectedDateRangeDisplay}
          </span>
        </div>
        <DateRangePicker
          isOpen={dateRangePickerOpen}
          onApply={(_startDate, _endDate, displayOption) => {
            setSelectedDateRangeDisplay(displayOption);
            if (displayOption === "Custom Range") {
              setCustomDateRange(`${_startDate} - ${_endDate}`);
            }

            // For "All time", don't set any date filter
            if (displayOption === "All time") {
              onDateRangeChange(undefined, undefined);
            } else {
              // Parse dates and call the handler
              const start = _startDate ? new Date(_startDate) : undefined;
              const end = _endDate ? new Date(_endDate) : undefined;
              onDateRangeChange(start, end);
            }

            setDateRangePickerOpen(false);
          }}
          onCancel={() => setDateRangePickerOpen(false)}
          onClose={() => setDateRangePickerOpen(false)}
        />
      </div>

      {/* Document Type Filter */}
      <Select
        value={documentType}
        onValueChange={(value) => setDocumentType(value as DocumentType)}
      >
        <SelectTrigger className="w-[150px] h-9 bg-white border-[#e5e7eb]">
          <SelectValue placeholder="View all" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">View all</SelectItem>
          <SelectItem value="statement">Statements</SelectItem>
          <SelectItem value="superbill">Superbills</SelectItem>
          <SelectItem value="invoice">Invoices</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

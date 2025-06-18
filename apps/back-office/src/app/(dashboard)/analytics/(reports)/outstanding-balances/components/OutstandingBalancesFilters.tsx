"use client";

import { Calendar } from "lucide-react";
import DateRangePicker from "@/(dashboard)/activity/components/DateRangePicker";

interface OutstandingBalancesFiltersProps {
  filters: {
    showDatePicker: boolean;
    startDate: string;
    endDate: string;
    selectedTimeRange: string;
  };
  onFiltersChange: (
    filters: Partial<OutstandingBalancesFiltersProps["filters"]>,
  ) => void;
}

export default function OutstandingBalancesFilters({
  filters,
  onFiltersChange,
}: OutstandingBalancesFiltersProps) {
  const handleDatePickerApply = (
    startDate: string,
    endDate: string,
    displayOption: string,
  ) => {
    onFiltersChange({
      startDate,
      endDate,
      selectedTimeRange:
        displayOption === "Custom Range"
          ? `${startDate} - ${endDate}`
          : displayOption,
      showDatePicker: false,
    });
  };

  const handleDatePickerCancel = () => {
    onFiltersChange({ showDatePicker: false });
  };

  return (
    <div className="flex items-center gap-4">
      {/* Date Range Picker */}
      <div className="relative inline-block">
        <button
          className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 transition-colors"
          onClick={() => onFiltersChange({ showDatePicker: true })}
        >
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">
            {filters.selectedTimeRange}
          </span>
        </button>
        {filters.showDatePicker && (
          <div className="absolute z-50">
            <DateRangePicker
              initialEndDate={filters.endDate}
              initialStartDate={filters.startDate}
              isOpen={filters.showDatePicker}
              onApply={handleDatePickerApply}
              onClose={handleDatePickerCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
}

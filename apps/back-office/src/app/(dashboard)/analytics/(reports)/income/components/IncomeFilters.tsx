"use client";

import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import DateRangePicker from "@/(dashboard)/activity/components/DateRangePicker";
import { IncomeFilters } from "@/(dashboard)/analytics/services/income.service";

interface IncomeFiltersProps {
  filters: IncomeFilters & {
    showDatePicker: boolean;
    selectedTimeRange: string;
  };
  onFiltersChange: (
    filters: Partial<
      IncomeFilters & { showDatePicker: boolean; selectedTimeRange: string }
    >,
  ) => void;
  clinicians?: Array<{
    id: string;
    first_name: string;
    last_name: string;
  }>;
}

export default function IncomeFiltersComponent({
  filters,
  onFiltersChange,
  clinicians = [],
}: IncomeFiltersProps) {
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

      {/* Clinician Filter */}
      {clinicians.length > 0 && (
        <Select
          value={filters.clinicianId || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              clinicianId: value === "all" ? undefined : value,
              page: 1, // Reset to first page when filter changes
            })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Clinicians" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clinicians</SelectItem>
            {clinicians.map((clinician) => (
              <SelectItem key={clinician.id} value={clinician.id}>
                {clinician.first_name} {clinician.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

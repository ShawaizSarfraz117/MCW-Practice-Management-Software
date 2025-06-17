"use client";

import { useState } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SearchSelect,
} from "@mcw/ui";
import { Calendar, ChevronDown, Users, Filter } from "lucide-react";
import DateRangePicker from "@/(dashboard)/activity/components/DateRangePicker";

export interface AttendanceFilterState {
  showDatePicker: boolean;
  fromDate: string;
  toDate: string;
  selectedTimeRange: string;
  selectedClient: string;
  selectedStatus: string;
  rowsPerPage: string;
}

interface AttendanceFiltersProps {
  filters: AttendanceFilterState;
  setFilters: React.Dispatch<React.SetStateAction<AttendanceFilterState>>;
  clientOptions: string[];
  statusOptions: string[];
}

export default function AttendanceFilters({
  filters,
  setFilters,
  clientOptions,
  statusOptions,
}: AttendanceFiltersProps) {
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const handleDatePickerApply = (
    startDate: string,
    endDate: string,
    displayOption: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      fromDate: startDate,
      toDate: endDate,
      selectedTimeRange:
        displayOption === "Custom Range"
          ? `${startDate} - ${endDate}`
          : displayOption,
      showDatePicker: false,
    }));
  };

  const handleDatePickerCancel = () => {
    setFilters((prev) => ({
      ...prev,
      showDatePicker: false,
    }));
  };

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative inline-block">
        <Button
          className="bg-green-50 border-green-100 text-green-700 hover:bg-green-100 hover:text-green-800"
          variant="outline"
          onClick={() =>
            setFilters((prev) => ({ ...prev, showDatePicker: true }))
          }
        >
          <Calendar className="w-4 h-4 mr-2" />
          {filters.selectedTimeRange}
        </Button>
        {filters.showDatePicker && (
          <div className="absolute z-50">
            <DateRangePicker
              initialEndDate={filters.toDate}
              initialStartDate={filters.fromDate}
              isOpen={filters.showDatePicker}
              onApply={handleDatePickerApply}
              onClose={handleDatePickerCancel}
            />
          </div>
        )}
      </div>
      <div className="w-[200px]">
        <SearchSelect
          searchable
          icon={<Users className="w-4 h-4" />}
          options={clientOptions
            .filter((client) =>
              client.toLowerCase().includes(clientSearchTerm.toLowerCase()),
            )
            .map((client) => ({
              label: client,
              value: client,
            }))}
          placeholder="Select client"
          value={filters.selectedClient}
          onSearch={setClientSearchTerm}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, selectedClient: value }))
          }
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="gap-2" variant="outline">
            <Filter className="w-4 h-4" />
            {filters.selectedStatus}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {statusOptions.map((status) => (
            <DropdownMenuItem
              key={status}
              className="cursor-pointer"
              onClick={() =>
                setFilters((prev) => ({ ...prev, selectedStatus: status }))
              }
            >
              {status}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

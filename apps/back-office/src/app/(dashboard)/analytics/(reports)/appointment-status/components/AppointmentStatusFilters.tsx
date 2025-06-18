"use client";

import { useState } from "react";
import { Calendar, Users } from "lucide-react";
import { SearchSelect } from "@mcw/ui";
import DateRangePicker from "@/(dashboard)/activity/components/DateRangePicker";
import { useClientGroups } from "@/(dashboard)/analytics/services/appointment-status.service";

interface AppointmentStatusFiltersProps {
  filters: {
    showDatePicker: boolean;
    startDate: string;
    endDate: string;
    selectedTimeRange: string;
    selectedClient: string;
  };
  onFiltersChange: (
    filters: Partial<AppointmentStatusFiltersProps["filters"]>,
  ) => void;
}

export default function AppointmentStatusFilters({
  filters,
  onFiltersChange,
}: AppointmentStatusFiltersProps) {
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const { data: clientGroupsData, isLoading: isLoadingClients } =
    useClientGroups();

  // Create client options the same way as attendance
  const clientOptionsData: string[] = [];
  const clientNameToGroupId = new Map<string, string>();

  if (clientGroupsData?.data) {
    clientGroupsData.data.forEach((group) => {
      // Get all non-contact members and join their names with &
      const nonContactMembers = group.ClientGroupMembership.filter(
        (m) => !m.is_contact_only,
      );
      if (nonContactMembers.length > 0) {
        const clientNames = nonContactMembers
          .map((member) => {
            const client = member.Client;
            return `${client.legal_first_name} ${client.legal_last_name}`;
          })
          .join(" & ");
        clientNameToGroupId.set(clientNames, group.id);
        clientOptionsData.push(clientNames);
      }
    });

    // Sort client names alphabetically
    clientOptionsData.sort((a, b) => a.localeCompare(b));
  }
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
    <div className="flex flex-wrap gap-2">
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

      {/* Client Filter */}
      <div className="w-[200px]">
        <SearchSelect
          searchable
          icon={<Users className="w-4 h-4" />}
          options={[
            { label: "All Clients", value: "" },
            ...clientOptionsData
              .filter((client) =>
                client.toLowerCase().includes(clientSearchTerm.toLowerCase()),
              )
              .map((client) => ({
                label: client,
                value: clientNameToGroupId.get(client) || "",
              })),
          ]}
          placeholder={
            isLoadingClients ? "Loading clients..." : "Select client"
          }
          value={filters.selectedClient}
          onSearch={setClientSearchTerm}
          onValueChange={(value) => onFiltersChange({ selectedClient: value })}
        />
      </div>
    </div>
  );
}

import {
  Input,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Select,
  DateRangePicker,
} from "@mcw/ui";
import { Search } from "lucide-react";

interface ActivityFiltersProps {
  onSearch: (value: string) => void;
  onDateRangeChange: (from: Date | undefined, to: Date | undefined) => void;
  onEventTypeChange: (type: string) => void;
  onToggleDetails: () => void;
}

export function ActivityFilters({
  onSearch,
  onDateRangeChange,
  onEventTypeChange,
  onToggleDetails,
}: ActivityFiltersProps) {
  return (
    <div className="flex items-center justify-between border rounded-md p-4">
      <div className="flex items-center gap-4 flex-1">
        {/* Search Input */}
        <div className="relative w-[230px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            aria-label="Search activities"
            className="pl-9 px-9 h-10 bg-white border-[#e5e7eb]"
            placeholder="Search"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {/* All Events Select */}
        <Select defaultValue="all-events" onValueChange={onEventTypeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-events">All Events</SelectItem>
            <SelectItem value="appointments">Appointments</SelectItem>
            <SelectItem value="payments">Payments</SelectItem>
            <SelectItem value="client-updates">Client Updates</SelectItem>
          </SelectContent>
        </Select>

        {/* All Time Select with Calendar */}
        <DateRangePicker handleApplyCustomRange={onDateRangeChange} />
      </div>

      {/* Hide Details Link */}
      <button
        type="button"
        onClick={onToggleDetails}
        className="text-green-600 hover:text-green-700 text-sm font-medium"
      >
        Hide details
      </button>
    </div>
  );
}

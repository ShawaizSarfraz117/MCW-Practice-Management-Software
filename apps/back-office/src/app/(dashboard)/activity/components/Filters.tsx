"use client";

import { Search, ChevronDown } from "lucide-react";
import {
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mcw/ui";
import DateRangePicker from "./DateRangePicker";
import { useState, useEffect } from "react";

export interface FiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedClient: string;
  setSelectedClient: (client: string) => void;
  selectedTimeRange: string;
  setSelectedTimeRange: (range: string) => void;
  selectedEventType: string;
  setSelectedEventType: (eventType: string) => void;
  fromDate: string;
  setFromDate: (date: string) => void;
  toDate: string;
  setToDate: (date: string) => void;
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
}

export default function Filters({
  searchQuery,
  setSearchQuery,
  selectedClient,
  setSelectedClient,
  selectedTimeRange,
  setSelectedTimeRange,
  selectedEventType,
  setSelectedEventType,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  showDetails,
  setShowDetails,
}: FiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [teamMembers, setTeamMembers] = useState<
    { id: string; fullName: string }[]
  >([]);
  const [_loadingTeamMembers, setLoadingTeamMembers] = useState(true);

  // Fetch team members on component mount
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch("/api/activity?type=team-members");
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data);
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
      } finally {
        setLoadingTeamMembers(false);
      }
    };
    fetchTeamMembers();
  }, []);

  // Build team member options from fetched data
  const teamMemberOptions = [
    "All Team Members",
    ...teamMembers.map((member) => member.fullName),
  ];
  const eventTypeOptions = [
    "All Events",
    "Notes",
    "Diagnosis and Treatment plans",
    "Billing Documents",
  ];

  // Helper function to format and manage date display
  const formatDateDisplay = (start: string, end: string) => {
    // If dates are the same, just show one date
    if (start === end) {
      return start;
    }

    // For custom date ranges, make the display more compact
    return `${start} - ${end}`;
  };

  // Handle date picker apply
  const handleDatePickerApply = (
    startDate: string,
    endDate: string,
    displayOption: string,
  ) => {
    setFromDate(startDate);
    setToDate(endDate);

    if (displayOption === "Custom Range") {
      setSelectedTimeRange(formatDateDisplay(startDate, endDate));
    } else {
      setSelectedTimeRange(displayOption);
    }

    setShowDatePicker(false);
  };

  // Handle date picker cancel - reset to defaults
  const handleDatePickerCancel = () => {
    setFromDate("");
    setToDate("");
    setSelectedTimeRange("All Time");
  };

  return (
    <div className="border-b p-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative w-60">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="!pl-8 h-10 bg-white border border-gray-200 rounded-md w-full"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-4 py-2 h-10 border border-gray-200 rounded-md text-gray-800 font-normal flex items-center justify-between w-56">
              <span className="truncate">{selectedClient}</span>
              <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {teamMemberOptions.map((member) => (
              <DropdownMenuItem
                key={member}
                className="hover:bg-[#D1E4DE] focus:bg-[#D1E4DE] cursor-pointer"
                onClick={() => setSelectedClient(member)}
              >
                {member}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Time Range Dropdown with Custom DatePicker */}
        <div className="relative">
          <DropdownMenu open={showDatePicker} onOpenChange={setShowDatePicker}>
            <DropdownMenuTrigger asChild>
              <button
                className="px-4 py-2 h-10 bg-white border border-gray-200 rounded-md text-gray-800 font-normal flex items-center justify-between w-auto min-w-[180px] max-w-[250px]"
                title={selectedTimeRange} // Add tooltip to show full date range on hover
              >
                <span className="truncate mr-2 text-sm">
                  {selectedTimeRange}
                </span>
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <div className="absolute z-50">
              <DateRangePicker
                initialEndDate={toDate}
                initialStartDate={fromDate}
                isOpen={showDatePicker}
                onApply={handleDatePickerApply}
                onCancel={handleDatePickerCancel}
                onClose={() => setShowDatePicker(false)}
              />
            </div>
          </DropdownMenu>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-4 py-2 h-10 bg-white border border-gray-200 rounded-md text-gray-800 font-normal flex items-center justify-between w-44">
              <span>{selectedEventType}</span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {eventTypeOptions.map((eventType) => (
              <DropdownMenuItem
                key={eventType}
                className="hover:bg-[#D1E4DE] focus:bg-[#D1E4DE] cursor-pointer"
                onClick={() => setSelectedEventType(eventType)}
              >
                {eventType}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto">
          <button
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide details" : "Show details"}
          </button>
        </div>
      </div>
    </div>
  );
}

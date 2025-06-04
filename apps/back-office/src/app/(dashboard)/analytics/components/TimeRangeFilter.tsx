"use client";

import { useState } from "react";
import { Button } from "@mcw/ui";
import DateRangePicker from "@/(dashboard)/activity/components/DateRangePicker";

const timeRanges = [
  "This month",
  "Last 30 days",
  "Last month",
  "This year",
  "Custom",
];

export function TimeRangeFilter({
  selectedRange,
  onChange,
  customRange,
  onCustomRangeChange,
}: {
  selectedRange: string;
  onChange: (range: string) => void;
  customRange?: { startDate: string; endDate: string };
  onCustomRangeChange?: (range: { startDate: string; endDate: string }) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const handleButtonClick = (label: string) => {
    onChange(label);
    if (label === "Custom") {
      setShowPicker(true);
    } else {
      setShowPicker(false);
    }
  };

  const handleApply = (start: string, end: string, _displayOption?: string) => {
    setShowPicker(false);
    if (onCustomRangeChange) {
      onCustomRangeChange({ startDate: start, endDate: end });
    }
  };

  return (
    <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-lg relative">
      <div className="flex gap-2">
        {timeRanges.map((label) => (
          <Button
            key={label}
            className={
              selectedRange === label
                ? "bg-emerald-100/50 text-emerald-700"
                : "text-gray-500"
            }
            variant={selectedRange === label ? "ghost" : "ghost"}
            onClick={() => handleButtonClick(label)}
          >
            {label}
          </Button>
        ))}
        {selectedRange === "Custom" && showPicker && (
          <div className="absolute left-0 top-full z-50 mt-2">
            <DateRangePicker
              initialEndDate={customRange?.endDate}
              initialStartDate={customRange?.startDate}
              isOpen={showPicker}
              onApply={handleApply}
              onClose={() => setShowPicker(false)}
            />
          </div>
        )}
      </div>
      <div className="bg-emerald-100/50 text-emerald-700 px-4 py-2 rounded-lg text-sm whitespace-nowrap">
        Projected: $100 • 4 appointments • 1 client
      </div>
    </div>
  );
}

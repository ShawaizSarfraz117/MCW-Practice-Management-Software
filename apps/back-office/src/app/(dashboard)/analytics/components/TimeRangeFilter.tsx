"use client";

import { Button } from "@mcw/ui";

const timeRanges = [
  { label: "This month", active: true },
  { label: "Last 30 days", active: false },
  { label: "Last month", active: false },
  { label: "This year", active: false },
  { label: "Custom", active: false },
];

export function TimeRangeFilter() {
  return (
    <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-lg">
      <div className="flex gap-2">
        {timeRanges.map((range) => (
          <Button
            key={range.label}
            variant={range.active ? "ghost" : "ghost"}
            className={
              range.active
                ? "bg-emerald-100/50 text-emerald-700"
                : "text-gray-500"
            }
          >
            {range.label}
          </Button>
        ))}
      </div>
      <div className="bg-emerald-100/50 text-emerald-700 px-4 py-2 rounded-lg text-sm whitespace-nowrap">
        Projected: $100 • 4 appointments • 1 client
      </div>
    </div>
  );
}

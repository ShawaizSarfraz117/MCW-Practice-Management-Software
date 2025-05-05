"use client";

import type * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css"; // Import the default styles

import { cn } from "@mcw/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ..._props
}: CalendarProps) {
  return (
    <DayPicker
      className={cn("ui-p-3", className)}
      classNames={{
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          return orientation === "left" ? (
            <ChevronLeft className="ui-h-4 ui-w-4" />
          ) : (
            <ChevronRight className="ui-h-4 ui-w-4" />
          );
        },
      }}
      showOutsideDays={showOutsideDays}
      {..._props}
      styles={{
        table: { width: "100%" },
        head_cell: { width: "48px" },
        cell: { width: "48px", padding: "2px" },
      }}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

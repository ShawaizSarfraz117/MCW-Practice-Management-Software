"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@mcw/utils";
import { Button } from "@mcw/ui";
import { Calendar } from "@mcw/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@mcw/ui";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (date: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = "Select date range",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const formattedDate = React.useMemo(() => {
    if (!value?.from) {
      return placeholder;
    }

    if (value.to) {
      return `${format(value.from, "MM/dd/yyyy")} - ${format(value.to, "MM/dd/yyyy")}`;
    }

    return format(value.from, "MM/dd/yyyy");
  }, [value, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "w-full justify-start text-left font-normal rounded-none border-gray-200",
            !value?.from && "text-muted-foreground",
            className,
          )}
          variant="outline"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formattedDate}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0 rounded-none">
        <Calendar
          initialFocus
          defaultMonth={value?.from}
          mode="range"
          numberOfMonths={2}
          selected={value}
          onSelect={onChange}
        />
      </PopoverContent>
    </Popover>
  );
}

"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@mcw/utils";
import { Button } from "@mcw/ui";
import { Calendar } from "@mcw/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@mcw/ui";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  className?: string;
  onInteractiveClick?: (e: React.MouseEvent) => void;
}

export function DatePicker({
  value,
  onChange,
  className,
  onInteractiveClick,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "ui-w-full ui-justify-start ui-text-left ui-font-normal ui-rounded-none ui-border-gray-200",
            !value && "ui-text-muted-foreground",
            className,
          )}
          variant="outline"
          onClick={onInteractiveClick}
        >
          <CalendarIcon className="ui-mr-2 ui-h-4 ui-w-4" />
          {value ? format(value, "MM/dd/yyyy") : "MM/DD/YYYY"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="ui-w-auto ui-p-0 ui-rounded-none"
        onClick={onInteractiveClick}
      >
        <Calendar
          initialFocus
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

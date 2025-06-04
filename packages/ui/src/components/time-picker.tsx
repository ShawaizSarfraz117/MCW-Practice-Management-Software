"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@mcw/utils";
import { Button } from "@mcw/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@mcw/ui";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@mcw/ui";

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  className?: string;
  onInteractiveClick?: (e: React.MouseEvent) => void;
  disabledOptions?: (time: string) => boolean;
  disablePastTimes?: boolean;
  format?: "12h" | "24h";
}

export function TimePicker({
  value,
  onChange,
  className,
  onInteractiveClick,
  disabledOptions,
  format = "12h",
  // disablePastTimes = false,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const times = React.useMemo(() => {
    const items: string[] = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) {
        if (format === "24h") {
          // 24-hour format (00:00, 00:30, 01:00, etc.)
          items.push(
            `${i.toString().padStart(2, "0")}:${j.toString().padStart(2, "0")}`,
          );
        } else {
          // 12-hour format (12:00 AM, 12:30 AM, 1:00 AM, etc.)
          const hour = i % 12 || 12;
          const period = i < 12 ? "AM" : "PM";
          items.push(`${hour}:${j.toString().padStart(2, "0")} ${period}`);
        }
      }
    }
    return items;
  }, [format]);

  // Function to check if a time is before current time
  // const isTimeBeforeNow = (time: string) => {
  //   if (!disablePastTimes) return false;

  //   const now = new Date();
  //   const [hours, minutes, period] = time.match(/(\d+):(\d+) (AM|PM)/)?.slice(1) || [];

  //   let timeHours = parseInt(hours);
  //   const timeMinutes = parseInt(minutes);

  //   // Convert to 24-hour format
  //   if (period === 'PM' && timeHours !== 12) timeHours += 12;
  //   if (period === 'AM' && timeHours === 12) timeHours = 0;

  //   const currentHours = now.getHours();
  //   const currentMinutes = now.getMinutes();

  //   // Compare hours first
  //   if (timeHours < currentHours) return true;
  //   if (timeHours > currentHours) return false;

  //   // If hours are equal, compare minutes
  //   return timeMinutes < currentMinutes;
  // };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn(
            "w-full justify-start text-left font-normal rounded-none border-gray-200",
            !value && "text-muted-foreground",
            className,
          )}
          role="combobox"
          variant="outline"
          onClick={onInteractiveClick}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || "Select time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-0 rounded-none"
        onClick={onInteractiveClick}
      >
        <Command>
          <CommandInput
            className="h-9 rounded-none"
            placeholder="Search time..."
          />
          <CommandList>
            <CommandEmpty>No time found.</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-auto">
              {times.map((time) => {
                const isDisabled = disabledOptions?.(time) ?? false;
                const isSelected = time === value;
                return (
                  <CommandItem
                    key={time}
                    className={cn(
                      "rounded-none",
                      isDisabled &&
                        "opacity-50 cursor-not-allowed pointer-events-none blur-[0.5px] text-gray-400",
                      isSelected &&
                        "bg-[#16A34A]/10 text-[#16A34A] font-medium",
                    )}
                    value={time}
                    disabled={isDisabled}
                    onSelect={() => {
                      if (!isDisabled) {
                        onChange?.(time);
                        setOpen(false);
                      }
                    }}
                  >
                    {time}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

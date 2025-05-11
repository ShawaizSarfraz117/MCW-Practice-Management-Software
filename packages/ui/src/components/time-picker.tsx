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
  selectedDate?: Date;
}

export function TimePicker({
  value,
  onChange,
  className,
  onInteractiveClick,
  selectedDate,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const times = React.useMemo(() => {
    const items: string[] = [];
    // const now = new Date();
    // const isToday = selectedDate &&
    //   selectedDate.getDate() === now.getDate() &&
    //   selectedDate.getMonth() === now.getMonth() &&
    //   selectedDate.getFullYear() === now.getFullYear();

    // Parse the current selected time if it exists
    let selectedHour = 0;
    let selectedMinute = 0;
    if (value) {
      const match = value.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hour = parseInt(match[1]);
        const minute = parseInt(match[2]);
        const period = match[3].toUpperCase();

        // Convert to 24-hour format
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        selectedHour = hour;
        selectedMinute = minute;
      }
    }

    // const currentHour = now.getHours();
    // const currentMinute = now.getMinutes();

    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) {
        // If we have a selected time, only show times after it
        if (
          value &&
          (i < selectedHour || (i === selectedHour && j < selectedMinute))
        ) {
          continue;
        }

        const hour = i % 12 || 12;
        const period = i < 12 ? "AM" : "PM";
        items.push(`${hour}:${j.toString().padStart(2, "0")} ${period}`);
      }
    }
    return items;
  }, [selectedDate, value]);

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
              {times.map((time) => (
                <CommandItem
                  key={time}
                  className="rounded-none"
                  value={time}
                  onSelect={() => {
                    onChange?.(time);
                    setOpen(false);
                  }}
                >
                  {time}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
}

export function TimePicker({
  value,
  onChange,
  className,
  onInteractiveClick,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const times = React.useMemo(() => {
    const items: string[] = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) {
        const hour = i % 12 || 12;
        const period = i < 12 ? "AM" : "PM";
        items.push(`${hour}:${j.toString().padStart(2, "0")} ${period}`);
      }
    }
    return items;
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn(
            "ui-w-full ui-justify-start ui-text-left ui-font-normal ui-rounded-none ui-border-gray-200",
            !value && "ui-text-muted-foreground",
            className,
          )}
          role="combobox"
          variant="outline"
          onClick={onInteractiveClick}
        >
          <Clock className="ui-mr-2 ui-h-4 ui-w-4" />
          {value || "Select time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="ui-w-[200px] ui-p-0 ui-rounded-none"
        onClick={onInteractiveClick}
      >
        <Command>
          <CommandInput
            className="ui-h-9 ui-rounded-none"
            placeholder="Search time..."
          />
          <CommandList>
            <CommandEmpty>No time found.</CommandEmpty>
            <CommandGroup className="ui-max-h-[200px] ui-overflow-auto">
              {times.map((time) => (
                <CommandItem
                  key={time}
                  className="ui-rounded-none"
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

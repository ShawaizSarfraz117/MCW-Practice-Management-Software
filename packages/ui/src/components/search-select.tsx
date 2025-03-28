"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@mcw/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@mcw/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@mcw/ui";

interface SearchSelectProps {
  options: { label: string; value: string }[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  showCreateOption?: boolean;
  onCreateOption?: () => void;
  className?: string;
  icon?: React.ReactNode;
  onInteractiveClick?: (e: React.MouseEvent) => void;
}

export function SearchSelect({
  options,
  value,
  onValueChange,
  placeholder = "Search...",
  showCreateOption,
  onCreateOption,
  className,
  icon,
  onInteractiveClick,
}: SearchSelectProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex w-full items-center gap-2 rounded-none border border-gray-300 bg-background px-2 py-2 text-sm",
              className,
            )}
            onClick={onInteractiveClick}
          >
            {icon}
            {value
              ? options.find((option) => option.value === value)?.label
              : placeholder}
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0 rounded-none"
          onClick={onInteractiveClick}
        >
          <Command>
            <CommandInput
              placeholder={placeholder}
              className="border-0 py-3 focus:ring-0"
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onValueChange?.(option.value);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {showCreateOption && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCreateOption?.();
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 px-3 text-sm font-medium text-[#16A34A]"
        >
          + Create client
        </button>
      )}
    </div>
  );
}

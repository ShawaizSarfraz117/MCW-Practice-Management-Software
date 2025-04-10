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
  searchable?: boolean;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (term: string) => void;
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
  searchable = false,
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onSearch,
}: SearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const handleSelect = React.useCallback(
    (currentValue: string) => {
      onValueChange?.(currentValue);
      setOpen(false);
      setSearchTerm("");
    },
    [onValueChange],
  );

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
            onClick={(e) => {
              e.preventDefault();
              setOpen(!open);
              if (onInteractiveClick) onInteractiveClick(e);
            }}
          >
            {icon}
            <span className="flex-1 text-left truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0 rounded-none"
          align="start"
          sideOffset={4}
        >
          <Command className="overflow-hidden" shouldFilter={false}>
            {searchable && (
              <CommandInput
                placeholder={`Search ${placeholder.toLowerCase()}`}
                value={searchTerm}
                onValueChange={handleSearch}
                className="border-0 py-3 focus:ring-0"
              />
            )}
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              {showPagination && totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-2 py-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (currentPage > 1) onPageChange?.(currentPage - 1);
                    }}
                    disabled={currentPage === 1}
                    className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (currentPage < totalPages)
                        onPageChange?.(currentPage + 1);
                    }}
                    disabled={currentPage === totalPages}
                    className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
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

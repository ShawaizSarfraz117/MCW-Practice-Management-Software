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
    <div className="ui-relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            aria-expanded={open}
            className={cn(
              "ui-flex ui-w-full ui-items-center ui-gap-2 ui-rounded-none ui-border ui-border-gray-300 ui-bg-background ui-px-2 ui-py-2 ui-text-sm",
              className,
            )}
            role="combobox"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setOpen(!open);
              if (onInteractiveClick) onInteractiveClick(e);
            }}
          >
            {icon}
            <span className="ui-flex-1 ui-text-left ui-truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown className="ui-ml-auto ui-h-4 ui-w-4 ui-shrink-0 ui-opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="ui-w-[--radix-popover-trigger-width] ui-p-0 ui-rounded-none"
          sideOffset={4}
        >
          <Command className="ui-overflow-hidden" shouldFilter={false}>
            {searchable && (
              <CommandInput
                className="ui-border-0 ui-py-3 focus:ui-ring-0"
                placeholder={`Search ${placeholder.toLowerCase()}`}
                value={searchTerm}
                onValueChange={handleSearch}
              />
            )}
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    className="ui-cursor-pointer data-[selected=true]:ui-bg-accent data-[selected=true]:ui-text-accent-foreground"
                    value={option.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => handleSelect(option.value)}
                  >
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              {showPagination && totalPages > 1 && (
                <div className="ui-flex ui-items-center ui-justify-between ui-border-t ui-border-gray-200 ui-px-2 ui-py-2">
                  <button
                    className="ui-text-sm ui-text-gray-500 hover:ui-text-gray-700 disabled:ui-opacity-50"
                    disabled={currentPage === 1}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (currentPage > 1) onPageChange?.(currentPage - 1);
                    }}
                  >
                    Previous
                  </button>
                  <span className="ui-text-sm ui-text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="ui-text-sm ui-text-gray-500 hover:ui-text-gray-700 disabled:ui-opacity-50"
                    disabled={currentPage === totalPages}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (currentPage < totalPages)
                        onPageChange?.(currentPage + 1);
                    }}
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
          className="ui-absolute ui-right-0 ui-top-1/2 ui--translate-y-1/2 ui-px-3 ui-text-sm ui-font-medium ui-text-[#16A34A]"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCreateOption?.();
          }}
        >
          + Create client
        </button>
      )}
    </div>
  );
}

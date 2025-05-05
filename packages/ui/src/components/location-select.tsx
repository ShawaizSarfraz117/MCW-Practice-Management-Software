"use client";

import * as React from "react";
import { ChevronDown, MapPin, Search, Video } from "lucide-react";
import { Button } from "@mcw/ui";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@mcw/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@mcw/ui";
import { Checkbox } from "@mcw/ui";

interface Location {
  label: string;
  value: string;
  type?: "physical" | "virtual" | "unassigned";
}

interface LocationSelectProps {
  options: Location[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export function LocationSelect({
  options,
  selected,
  onChange,
}: LocationSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredOptions = React.useMemo(() => {
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [options, searchQuery]);

  const selectedItems = React.useMemo(
    () => options.filter((option) => selected.includes(option.value)),
    [options, selected],
  );

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const getLocationIcon = (type?: Location["type"]) => {
    switch (type) {
      case "virtual":
        return <Video className="ui-h-4 ui-w-4 ui-text-blue-500" />;
      case "unassigned":
        return null;
      default:
        return <MapPin className="ui-h-4 ui-w-4 ui-text-emerald-500" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="ui-w-[130px] ui-justify-between ui-text-sm ui-font-normal"
          role="combobox"
          variant="outline"
        >
          <div className="ui-flex ui-items-center ui-gap-2 ui-truncate">
            <span className="ui-truncate">
              {selectedItems.length === options.length
                ? "All locations"
                : selectedItems.length === 0
                  ? "No location"
                  : `${selectedItems.length} locations`}
            </span>
          </div>
          <ChevronDown className="ui-h-4 ui-w-4 ui-opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="ui-w-[320px] ui-p-0">
        <Command>
          <div className="ui-flex ui-items-center ui-border-b ui-px-3">
            <Search className="ui-h-4 ui-w-4 ui-shrink-0 ui-opacity-50" />
            <input
              className="ui-flex ui-h-10 ui-w-full ui-rounded-md ui-bg-transparent ui-py-3 ui-px-2 ui-text-sm ui-outline-none placeholder:ui-text-muted-foreground disabled:ui-cursor-not-allowed disabled:ui-opacity-50"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                className="ui-flex ui-items-center ui-gap-2 ui-px-3"
                onSelect={() => {
                  const allValues = options.map((option) => option.value);
                  onChange(selected.length === options.length ? [] : allValues);
                }}
              >
                <Checkbox
                  checked={selected.length === options.length}
                  className="ui-border-muted data-[state=checked]:ui-border-primary data-[state=checked]:ui-bg-primary"
                />
                <span>All locations</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  className="ui-flex ui-items-center ui-gap-2 ui-px-3"
                  onSelect={() => toggleOption(option.value)}
                >
                  <Checkbox
                    checked={selected.includes(option.value)}
                    className="ui-border-muted data-[state=checked]:ui-border-primary data-[state=checked]:ui-bg-primary"
                  />
                  {getLocationIcon(option.type)}
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

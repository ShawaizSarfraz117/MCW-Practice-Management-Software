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
        return <Video className="h-4 w-4 text-blue-500" />;
      case "unassigned":
        return null;
      default:
        return <MapPin className="h-4 w-4 text-emerald-500" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="w-[130px] h-8 justify-between text-sm font-normal"
          role="combobox"
          variant="outline"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="truncate">
              {selectedItems.length === options.length
                ? "All locations"
                : selectedItems.length === 0
                  ? "No location"
                  : `${selectedItems.length} locations`}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] p-0">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 px-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                className="flex items-center gap-2 px-3"
                onSelect={() => {
                  const allValues = options.map((option) => option.value);
                  onChange(selected.length === options.length ? [] : allValues);
                }}
              >
                <Checkbox
                  checked={selected.length === options.length}
                  className="border-muted data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                />
                <span>All locations</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  className="flex items-center gap-2 px-3"
                  onSelect={() => toggleOption(option.value)}
                >
                  <Checkbox
                    checked={selected.includes(option.value)}
                    className="border-muted data-[state=checked]:border-primary data-[state=checked]:bg-primary"
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

"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
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

interface Option {
  label: string;
  value: string;
  avatar?: string;
  group?: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  groups?: { [key: string]: string };
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  groups,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const groupedOptions = React.useMemo(() => {
    if (!groups) return { ungrouped: options };
    return options.reduce(
      (acc, option) => {
        const group = option.group || "ungrouped";
        if (!acc[group]) acc[group] = [];
        acc[group].push(option);
        return acc;
      },
      {} as { [key: string]: Option[] },
    );
  }, [options, groups]);

  const filteredOptions = React.useMemo(() => {
    const filtered = { ...groupedOptions };
    Object.keys(filtered).forEach((group) => {
      filtered[group] = filtered[group].filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    });
    return filtered;
  }, [groupedOptions, searchQuery]);

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

  const toggleGroup = (groupKey: string) => {
    const groupOptions = groupedOptions[groupKey];
    const groupValues = groupOptions.map((option) => option.value);
    const allSelected = groupValues.every((value) => selected.includes(value));

    if (allSelected) {
      onChange(selected.filter((value) => !groupValues.includes(value)));
    } else {
      const newSelected = [...new Set([...selected, ...groupValues])];
      onChange(newSelected);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="w-[200px] h-8 justify-between text-sm font-normal"
          role="combobox"
          variant="outline"
        >
          <div className="flex items-center gap-2 truncate">
            {selectedItems.length > 0 ? (
              <>
                <span className="truncate">
                  {selectedItems.length === 1
                    ? selectedItems[0].label
                    : `${selectedItems.length} team members selected`}
                </span>
              </>
            ) : (
              placeholder
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
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
                <span>All team members</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            {Object.entries(filteredOptions).map(
              ([groupKey, groupOptions]) =>
                groupOptions.length > 0 && (
                  <CommandGroup
                    key={groupKey}
                    heading={
                      groups && groupKey !== "ungrouped" ? (
                        <div className="flex items-center justify-between px-3 py-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {groups[groupKey]}
                          </span>
                          <button
                            className="text-xs text-primary hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleGroup(groupKey);
                            }}
                          >
                            Select all
                          </button>
                        </div>
                      ) : null
                    }
                  >
                    {groupOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        className="flex items-center gap-2 px-3"
                        onSelect={() => toggleOption(option.value)}
                      >
                        <Checkbox
                          checked={selected.includes(option.value)}
                          className="border-muted data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                        />
                        <span>{option.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ),
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

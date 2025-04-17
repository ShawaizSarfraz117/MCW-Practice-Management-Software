"use client";

import { useId, useState } from "react";
import {
  endOfMonth,
  endOfYear,
  format,
  isSameDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { ChevronDown } from "lucide-react";
import { Label } from "./label";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { DateRange } from "react-day-picker";
import { cn } from "@mcw/utils";
import { Calendar } from "./calendar";
import { Input } from "./input";
import { PopoverClose } from "@radix-ui/react-popover";

function DateRangePicker({
  handleApplyCustomRange,
}: {
  handleApplyCustomRange: (
    from: Date | undefined,
    to: Date | undefined,
  ) => void;
}) {
  const id = useId();
  const today = new Date();

  const dateRangePresets = [
    {
      label: "Last 30 days",
      duration: {
        from: subDays(today, 29),
        to: today,
      },
    },
    {
      label: "This Month",
      duration: {
        from: startOfMonth(today),
        to: today,
      },
    },
    {
      label: "Last Month",
      duration: {
        from: startOfMonth(subMonths(today, 1)),
        to: endOfMonth(subMonths(today, 1)),
      },
    },
    {
      label: "This Year",
      duration: {
        from: startOfYear(today),
        to: today,
      },
    },
    {
      label: "Last Year",
      duration: {
        from: startOfYear(subYears(today, 1)),
        to: endOfYear(subYears(today, 1)),
      },
    },
    {
      label: "Custom Range",
    },
  ];

  const [month, setMonth] = useState(today);
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  return (
    <div className="*:not-first:mt-2">
      <Label className="sr-only" htmlFor={id}>
        Select a date range for filtering
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
              !date && "text-muted-foreground",
            )}
            id={id}
            variant={"outline"}
          >
            <span className={cn("truncate", !date && "text-muted-foreground")}>
              {date?.from ? (
                date.to && !isSameDay(date.from, date.to) ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                "All Time"
              )}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors"
              size={16}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto flex flex-col gap-4">
          <div className="flex max-sm:flex-col">
            <div className="relative py-4 max-sm:order-1 max-sm:border-t sm:w-32">
              <div className="h-full sm:border-e">
                <div className="flex flex-col px-2 gap-2">
                  <Button
                    className="w-full justify-start px-2 text-muted-foreground/80 hover:text-white hover:bg-accent-foreground"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDate(undefined);
                      setMonth(today);
                    }}
                  >
                    All Time
                  </Button>
                  {dateRangePresets?.length &&
                    dateRangePresets.map((item) => (
                      <Button
                        key={item.label}
                        className="w-full justify-start px-2 text-muted-foreground/80 hover:text-white hover:bg-accent-foreground"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setDate(item?.duration || undefined);
                          setMonth(item?.duration?.to || today);
                        }}
                      >
                        {item?.label}
                      </Button>
                    ))}
                </div>
              </div>
            </div>
            <Calendar
              className="p-2"
              mode="range"
              month={month}
              numberOfMonths={2}
              selected={date}
              onMonthChange={setMonth}
              onSelect={(newDate) => {
                if (newDate) {
                  setDate(newDate);
                }
              }}
            />
          </div>
          <div className="flex gap-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Label>From</Label>
              <Input
                disabled
                value={date?.from ? format(date?.from, "LLL dd, y") : ""}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>To</Label>
              <Input
                disabled
                value={date?.to ? format(date?.to, "LLL dd, y") : ""}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <PopoverClose>
              <Button
                onClick={() => {
                  handleApplyCustomRange(date?.from, date?.to);
                }}
              >
                Apply
              </Button>
            </PopoverClose>
            <PopoverClose>
              <Button variant="outline">Cancel</Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DateRangePicker };

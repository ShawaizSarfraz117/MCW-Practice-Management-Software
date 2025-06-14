"use client";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { cn } from "@mcw/utils";
import { addDays } from "date-fns";
import { DatePicker } from "@mcw/ui";
import { Input } from "@mcw/ui";

interface RecurringControlProps {
  startDate: Date;
  visible: boolean;
  open: boolean;
  onRecurringChange: (values: {
    frequency: string;
    period: string;
    selectedDays: string[];
    monthlyPattern?: string;
    endType: string;
    endValue: string | undefined;
  }) => void;
  initialValues?: {
    frequency?: string;
    period?: string;
    selectedDays?: string[];
    monthlyPattern?: string;
    endType?: string;
    endValue?: string;
  };
}

const weekdays = [
  { short: "S", full: "Sunday", value: "SU" },
  { short: "M", full: "Monday", value: "MO" },
  { short: "T", full: "Tuesday", value: "TU" },
  { short: "W", full: "Wednesday", value: "WE" },
  { short: "T", full: "Thursday", value: "TH" },
  { short: "F", full: "Friday", value: "FR" },
  { short: "S", full: "Saturday", value: "SA" },
];
export function RecurringControl({
  startDate,
  visible,
  open,
  onRecurringChange,
  initialValues,
}: RecurringControlProps) {
  const [frequency, setFrequency] = useState(initialValues?.frequency || "1");
  const [period, setPeriod] = useState(initialValues?.period || "WEEKLY");
  const [selectedDays, setSelectedDays] = useState<string[]>(
    initialValues?.selectedDays || [],
  );
  const [endType, setEndType] = useState(initialValues?.endType || "After");
  const [endCount, setEndCount] = useState(
    initialValues?.endType === "After" && initialValues?.endValue
      ? initialValues.endValue
      : "1",
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialValues?.endType === "On Date" && initialValues?.endValue
      ? new Date(initialValues.endValue)
      : undefined,
  );
  const [monthlyPattern, setMonthlyPattern] = useState<string>(
    initialValues?.monthlyPattern || "onDateOfMonth",
  );

  // Update state when initialValues change
  useEffect(() => {
    if (initialValues) {
      setFrequency(initialValues.frequency || "1");
      setPeriod(initialValues.period || "WEEKLY");
      setSelectedDays(initialValues.selectedDays || []);
      setEndType(initialValues.endType || "After");
      if (initialValues.endType === "After" && initialValues.endValue) {
        setEndCount(initialValues.endValue);
      }
      if (initialValues.endType === "On Date" && initialValues.endValue) {
        setEndDate(new Date(initialValues.endValue));
      }
      if (initialValues.monthlyPattern) {
        setMonthlyPattern(initialValues.monthlyPattern);
      }
    }
  }, [initialValues]);

  const getMonthlyOptions = (date: Date) => {
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay();
    const weekNumber = Math.ceil(dayOfMonth / 7);
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const getOrdinalSuffix = (num: number) => {
      const j = num % 10;
      const k = num % 100;
      if (j === 1 && k !== 11) return "st";
      if (j === 2 && k !== 12) return "nd";
      if (j === 3 && k !== 13) return "rd";
      return "th";
    };
    const isLastWeekdayOfMonth = (date: Date) => {
      const temp = new Date(date);
      temp.setDate(date.getDate() + 7);
      return temp.getMonth() !== date.getMonth();
    };
    const options = [
      { value: "onDateOfMonth", label: `On day ${dayOfMonth}` },
      {
        value: "onWeekDayOfMonth",
        label: `On the ${weekNumber}${getOrdinalSuffix(weekNumber)} ${dayNames[dayOfWeek]}`,
      },
    ];
    if (isLastWeekdayOfMonth(date)) {
      options.push({
        value: "onLastWeekDayOfMonth",
        label: `On the last ${dayNames[dayOfWeek]}`,
      });
    }
    return options;
  };
  useEffect(() => {
    if (startDate && !initialValues?.selectedDays?.length) {
      const dayOfWeek = startDate.getDay();
      setSelectedDays([weekdays[dayOfWeek].value]);
    }
    if (startDate && !initialValues?.endValue) {
      setEndDate(addDays(startDate, 25));
    }
  }, [startDate, initialValues]);
  useEffect(() => {
    if (open) {
      setFrequency("1");
      setPeriod("WEEKLY");
      setEndType("After");
      setEndCount("1");
      setMonthlyPattern("onDateOfMonth");
      if (startDate) {
        const dayOfWeek = startDate.getDay();
        setSelectedDays([weekdays[dayOfWeek].value]);
        setEndDate(addDays(startDate, 25));
      }
    } else if (!initialValues) {
      setSelectedDays([]);
      setEndDate(undefined);
    }
  }, [open, startDate]);
  useEffect(() => {
    if (visible) {
      onRecurringChange({
        frequency,
        period,
        selectedDays,
        monthlyPattern: period === "MONTHLY" ? monthlyPattern : undefined,
        endType,
        endValue: endType === "After" ? endCount : endDate?.toISOString(),
      });
    }
  }, [
    frequency,
    period,
    selectedDays,
    monthlyPattern,
    endType,
    endCount,
    endDate,
    visible,
    onRecurringChange,
  ]);
  if (!visible) return null;
  return (
    <div className="space-y-4 mt-2">
      <div className="flex items-center gap-2">
        <div className="w-32">
          <span className="text-sm w-12">Every</span>
          <div className="flex-1 flex w-full items-center gap-2">
            {period !== "YEARLY" && (
              <Input
                className="w-32 h-[37px]"
                max="99"
                min="1"
                type="number"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              />
            )}
          </div>
        </div>
        <div className="w-full">
          <span className="text-sm w-12">Repeat</span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WEEKLY">week</SelectItem>
              <SelectItem value="MONTHLY">month</SelectItem>
              <SelectItem value="YEARLY">year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {period === "WEEKLY" && (
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-1">
            {weekdays.map((day) => (
              <button
                key={day.value}
                aria-label={day.full}
                className={cn(
                  "flex-1 h-8 text-sm rounded-none border border-gray-200",
                  selectedDays.includes(day.value) &&
                    "bg-[#16A34A] text-white border-[#16A34A]",
                )}
                type="button"
                onClick={() => {
                  setSelectedDays((prev) =>
                    prev.includes(day.value)
                      ? prev.filter((d) => d !== day.value)
                      : [...prev, day.value],
                  );
                }}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>
      )}
      {period === "MONTHLY" && (
        <div className="flex items-center gap-2">
          <span className="text-sm w-12" />
          <Select value={monthlyPattern} onValueChange={setMonthlyPattern}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getMonthlyOptions(startDate).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="w-full">
          <span className="text-sm">Ends</span>
          <Select value={endType} onValueChange={setEndType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="After">after</SelectItem>
              <SelectItem value="On Date">on date</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {endType === "After" ? (
          <div className="w-40 shrink-0">
            <span className="text-sm">events</span>
            <Input
              className="w-full h-[37px]"
              max="99"
              min="1"
              type="number"
              value={endCount}
              onChange={(e) => setEndCount(e.target.value)}
            />
          </div>
        ) : (
          <div className="w-40 shrink-0">
            <DatePicker
              className="flex-1"
              value={endDate}
              onChange={(date) => setEndDate(date)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import type * as React from "react";
import { cn } from "@mcw/utils";
import { format } from "date-fns";
import { Input } from "@mcw/ui";

interface TimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  showTime?: boolean;
  className?: string;
}

export function DateTimePicker({
  date,
  setDate,
  showTime = true,
  className,
}: TimePickerProps) {
  // Format the date for display
  const formattedDate = date ? format(date, "MM/dd/yyyy") : "";
  const formattedTime = date ? format(date, "hh:mm a") : "";

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!date) {
      setDate(new Date());
      return;
    }

    const [month, day, year] = e.target.value.split("/").map(Number);
    const newDate = new Date(date);
    newDate.setFullYear(year);
    newDate.setMonth(month - 1);
    newDate.setDate(day);
    setDate(newDate);
  };

  // Handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!date) {
      return;
    }

    const timeStr = e.target.value;
    const [time, period] = timeStr.split(" ");
    const timeParts = time.split(":").map(Number);
    let hoursVal = timeParts[0];
    const minutesVal = timeParts[1];

    if (period === "PM" && hoursVal !== 12) {
      hoursVal += 12;
    }
    if (period === "AM" && hoursVal === 12) {
      hoursVal = 0;
    }

    const newDate = new Date(date);
    newDate.setHours(hoursVal);
    newDate.setMinutes(minutesVal);
    setDate(newDate);
  };

  return (
    <Input
      className={cn("text-sm rounded-none", className)}
      placeholder={showTime ? "12:00 PM" : "MM/DD/YYYY"}
      type="text"
      value={showTime ? formattedTime : formattedDate}
      onChange={showTime ? handleTimeChange : handleDateChange}
    />
  );
}

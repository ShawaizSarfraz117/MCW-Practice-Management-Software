"use client";

import { DatePicker, TimePicker } from "@mcw/ui";
import { useAvailabilityFormContext } from "../context/FormContext";
import { differenceInDays } from "date-fns";

interface DateTimeControlsProps {
  id: string;
}

export function DateTimeControls({ id: _ }: DateTimeControlsProps) {
  const { form, forceUpdate, duration } = useAvailabilityFormContext();
  const allDay = form.getFieldValue<boolean>("allDay");
  const startDate = form.getFieldValue<Date>("startDate");
  const endDate = form.getFieldValue<Date>("endDate");
  const startTime = form.getFieldValue<string>("startTime");

  const handleDateChange = (
    field: "startDate" | "endDate",
    date: Date | undefined,
  ) => {
    if (!date) return;

    if (field === "startDate") {
      form.setFieldValue("startDate", date);
      form.setFieldValue("endDate", date);
    } else {
      if (form.getFieldValue("allDay")) {
        form.setFieldValue("endDate", date);
      } else {
        form.setFieldValue("endDate", form.getFieldValue("startDate"));
      }
    }
    forceUpdate();
  };

  const handleTimeChange = (field: "startTime" | "endTime", time: string) => {
    form.setFieldValue(field, time);
    forceUpdate();
  };

  // Function to check if a time is after the start time
  const isTimeAfterStart = (time: string) => {
    if (!startTime) return true;

    // Handle both 12-hour format (1:00 PM) and 24-hour format (13:00)
    let startHour24: number, startMinute: number;
    let endHour24: number, endMinute: number;

    if (startTime.includes(" ")) {
      // 12-hour format
      const [startHour, startMin, startPeriod] =
        startTime.match(/(\d+):(\d+) (AM|PM)/)?.slice(1) || [];
      startHour24 = parseInt(startHour);
      startMinute = parseInt(startMin);
      if (startPeriod === "PM" && startHour24 !== 12) startHour24 += 12;
      if (startPeriod === "AM" && startHour24 === 12) startHour24 = 0;
    } else {
      // 24-hour format
      const [startHour, startMin] = startTime.split(":").map(Number);
      startHour24 = startHour;
      startMinute = startMin;
    }

    if (time.includes(" ")) {
      // 12-hour format
      const [endHour, endMin, endPeriod] =
        time.match(/(\d+):(\d+) (AM|PM)/)?.slice(1) || [];
      endHour24 = parseInt(endHour);
      endMinute = parseInt(endMin);
      if (endPeriod === "PM" && endHour24 !== 12) endHour24 += 12;
      if (endPeriod === "AM" && endHour24 === 12) endHour24 = 0;
    } else {
      // 24-hour format
      const [endHour, endMin] = time.split(":").map(Number);
      endHour24 = endHour;
      endMinute = endMin;
    }

    // Compare times
    if (startHour24 !== endHour24) {
      return endHour24 > startHour24;
    }

    return endMinute > startMinute;
  };

  if (allDay) {
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <DatePicker
          className="border-gray-200"
          value={startDate as Date}
          onChange={(date) => {
            handleDateChange("startDate", date);
          }}
        />
        <span className="text-sm text-gray-500">to</span>
        <div className="flex items-center gap-2">
          <DatePicker
            className="border-gray-200"
            value={endDate as Date}
            onChange={(date) => {
              handleDateChange("endDate", date);
            }}
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {differenceInDays(
              (endDate as Date) || new Date(),
              (startDate as Date) || new Date(),
            )}{" "}
            days
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <DatePicker
        className="border-gray-200"
        value={startDate as Date}
        onChange={(date) => {
          handleDateChange("startDate", date);
        }}
      />
      <div className="flex items-center gap-2">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center flex-1">
          <TimePicker
            data-timepicker
            className="border-gray-200"
            value={form.getFieldValue<string>("startTime")}
            format="12h"
            onChange={(time) => {
              handleTimeChange("startTime", time);
              // Reset end time if it's before the new start time
              const currentEndTime = form.getFieldValue<string>("endTime");
              if (currentEndTime && !isTimeAfterStart(currentEndTime)) {
                form.setFieldValue("endTime", "");
              }
            }}
            disablePastTimes={true}
          />
          <span className="text-sm text-gray-500">to</span>
          <TimePicker
            data-timepicker
            className="border-gray-200"
            value={form.getFieldValue<string>("endTime")}
            format="24h"
            onChange={(time) => {
              if (isTimeAfterStart(time)) {
                handleTimeChange("endTime", time);
              }
            }}
            disabledOptions={(time) => !isTimeAfterStart(time)}
            disablePastTimes={true}
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {duration}
        </span>
      </div>
    </div>
  );
}

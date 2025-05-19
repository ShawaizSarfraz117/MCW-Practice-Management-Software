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

    const [startHour, startMinute, startPeriod] =
      startTime.match(/(\d+):(\d+) (AM|PM)/)?.slice(1) || [];
    const [endHour, endMinute, endPeriod] =
      time.match(/(\d+):(\d+) (AM|PM)/)?.slice(1) || [];

    if (!startHour || !endHour) return true;

    let start24 = parseInt(startHour);
    let end24 = parseInt(endHour);

    // Convert to 24-hour format
    if (startPeriod === "PM" && start24 !== 12) start24 += 12;
    if (startPeriod === "AM" && start24 === 12) start24 = 0;
    if (endPeriod === "PM" && end24 !== 12) end24 += 12;
    if (endPeriod === "AM" && end24 === 12) end24 = 0;

    // Compare times
    if (start24 !== end24) {
      return end24 > start24;
    }

    return parseInt(endMinute) > parseInt(startMinute);
  };

  if (allDay) {
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <DatePicker
          className="border-gray-200"
          value={startDate as Date}
          onChange={(date) => {
            handleDateChange("startDate", date);
            forceUpdate(); // Ensure UI updates
          }}
        />
        <span className="text-sm text-gray-500">to</span>
        <div className="flex items-center gap-2">
          <DatePicker
            className="border-gray-200"
            value={endDate as Date}
            onChange={(date) => {
              handleDateChange("endDate", date);
              forceUpdate(); // Ensure UI updates
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
          forceUpdate(); // Ensure UI updates
        }}
      />
      <div className="flex items-center gap-2">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center flex-1">
          <TimePicker
            data-timepicker
            className="border-gray-200"
            value={form.getFieldValue<string>("startTime")}
            onChange={(time) => {
              handleTimeChange("startTime", time);
              // Reset end time if it's before the new start time
              const currentEndTime = form.getFieldValue<string>("endTime");
              if (currentEndTime && !isTimeAfterStart(currentEndTime)) {
                form.setFieldValue("endTime", "");
              }
              forceUpdate(); // Ensure UI updates
            }}
            disablePastTimes={true}
          />
          <span className="text-sm text-gray-500">to</span>
          <TimePicker
            data-timepicker
            className="border-gray-200"
            value={form.getFieldValue<string>("endTime")}
            onChange={(time) => {
              if (isTimeAfterStart(time)) {
                handleTimeChange("endTime", time);
              }
              forceUpdate(); // Ensure UI updates
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

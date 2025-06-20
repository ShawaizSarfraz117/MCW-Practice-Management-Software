"use client";

import { Checkbox, DatePicker, TimePicker } from "@mcw/ui";
import { useFormContext } from "../context/FormContext";
import { differenceInDays } from "date-fns";

interface DateTimeControlsProps {
  id: string;
}

export function DateTimeControls({ id: _ }: DateTimeControlsProps) {
  const { form, forceUpdate, duration } = useFormContext();
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

    const timeToMinutes = (timeStr: string): number => {
      const time12Regex = /^(\d{1,2}):([0-5][0-9])\s*(AM|PM)$/i;
      const time24Regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

      if (time12Regex.test(timeStr)) {
        const match = timeStr.match(time12Regex);
        if (!match) return 0;

        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const period = match[3].toUpperCase();

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        return hours * 60 + minutes;
      } else if (time24Regex.test(timeStr)) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
      }

      return 0;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(time);

    return endMinutes > startMinutes;
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
            ) + 1}{" "}
            day
            {differenceInDays(
              (endDate as Date) || new Date(),
              (startDate as Date) || new Date(),
            ) +
              1 !==
            1
              ? "s"
              : ""}
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
            disablePastTimes={true}
            format="12h"
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
          />
          <span className="text-sm text-gray-500">to</span>
          <TimePicker
            data-timepicker
            className="border-gray-200"
            disabledOptions={(time) => !isTimeAfterStart(time)}
            disablePastTimes={true}
            format="12h"
            value={form.getFieldValue<string>("endTime")}
            onChange={(time) => {
              if (isTimeAfterStart(time)) {
                handleTimeChange("endTime", time);
              }
              forceUpdate(); // Ensure UI updates
            }}
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {duration}
        </span>
      </div>
    </div>
  );
}

interface CheckboxControlProps {
  id: string;
  field: string;
  label: string;
}

export function CheckboxControl({ id, field, label }: CheckboxControlProps) {
  const { form, forceUpdate } = useFormContext();

  const handleCheckboxChange = (checked: boolean) => {
    form.setFieldValue(field, checked);
    forceUpdate();
  };

  return (
    <div className="flex items-start space-x-2">
      <Checkbox
        checked={!!form.getFieldValue(field)}
        className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
        id={id}
        onCheckedChange={(checked) => handleCheckboxChange(!!checked)}
      />
      <label
        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1"
        htmlFor={id}
      >
        {label}
      </label>
    </div>
  );
}

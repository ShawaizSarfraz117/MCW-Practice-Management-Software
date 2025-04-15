"use client";

import { Checkbox, DatePicker, TimePicker } from "@mcw/ui";
import { useFormContext } from "../context/form-context";
import { differenceInDays } from "date-fns";

interface DateTimeControlsProps {
  id: string;
}

export function DateTimeControls({ id: _ }: DateTimeControlsProps) {
  const { form, forceUpdate, duration } = useFormContext();
  const allDay = form.getFieldValue("allDay");
  const startDate = form.getFieldValue("startDate");
  const endDate = form.getFieldValue("endDate");

  const handleDateChange = (
    field: "startDate" | "endDate",
    date: Date | undefined,
  ) => {
    if (!date) return;

    if (field === "startDate") {
      // When start date changes, update both start and end date
      form.setFieldValue("startDate", date);
      form.setFieldValue("endDate", date);
    } else {
      // For end date, we only allow changing if it's an all-day event
      if (form.getFieldValue("allDay")) {
        form.setFieldValue("endDate", date);
      } else {
        // For regular appointments, end date must match start date
        form.setFieldValue("endDate", form.getFieldValue("startDate"));
      }
    }
    forceUpdate(); // Ensure UI updates
  };

  const handleTimeChange = (field: "startTime" | "endTime", time: string) => {
    form.setFieldValue(field, time);
    forceUpdate(); // Force re-render to ensure UI updates
  };

  if (allDay) {
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <DatePicker
          className="border-gray-200"
          value={startDate}
          onChange={(date) => {
            handleDateChange("startDate", date);
            forceUpdate(); // Ensure UI updates
          }}
        />
        <span className="text-sm text-gray-500">to</span>
        <div className="flex items-center gap-2">
          <DatePicker
            className="border-gray-200"
            value={endDate}
            onChange={(date) => {
              handleDateChange("endDate", date);
              forceUpdate(); // Ensure UI updates
            }}
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {differenceInDays(endDate || new Date(), startDate || new Date())}{" "}
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
        value={startDate}
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
            value={form.getFieldValue("startTime")}
            onChange={(time) => {
              handleTimeChange("startTime", time);
              forceUpdate(); // Ensure UI updates
            }}
          />
          <span className="text-sm text-gray-500">to</span>
          <TimePicker
            data-timepicker
            className="border-gray-200"
            value={form.getFieldValue("endTime")}
            onChange={(time) => {
              handleTimeChange("endTime", time);
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
        checked={form.getFieldValue(field)}
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

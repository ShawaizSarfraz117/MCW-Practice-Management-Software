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
    // Get the current values
    const currentStartTime = form.getFieldValue<string>("startTime");
    const currentEndTime = form.getFieldValue<string>("endTime");

    // Create a new time data object
    const timeData = {
      startTime: field === "startTime" ? time : currentStartTime,
      endTime: field === "endTime" ? time : currentEndTime,
    };

    // Store the updated time data
    window.sessionStorage.setItem("selectedTimeSlot", JSON.stringify(timeData));

    // Update the form value
    form.setFieldValue(field, time);

    // Force update to refresh the UI
    forceUpdate();
  };

  // Helper function to parse time string to raw values
  // const parseTimeToRaw = (timeStr: string) => {
  //   try {
  //     const [time, period] = timeStr.split(" ");
  //     const [hours, minutes] = time.split(":").map(Number);
  //     let hours24 = hours;

  //     if (period === "PM" && hours !== 12) hours24 += 12;
  //     if (period === "AM" && hours === 12) hours24 = 0;

  //     return {
  //       hours: hours24,
  //       minutes
  //     };
  //   } catch (error) {
  //     console.error("Error parsing time:", error);
  //     return {
  //       hours: 0,
  //       minutes: 0
  //     };
  //   }
  // };

  if (allDay) {
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <DatePicker
          className="border-gray-200"
          value={startDate as Date}
          onChange={(date) => {
            handleDateChange("startDate", date);
            forceUpdate();
          }}
        />
        <span className="text-sm text-gray-500">to</span>
        <div className="flex items-center gap-2">
          <DatePicker
            className="border-gray-200"
            value={endDate as Date}
            onChange={(date) => {
              handleDateChange("endDate", date);
              forceUpdate();
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
          forceUpdate();
        }}
      />
      <div className="flex items-center gap-2">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center flex-1">
          <TimePicker
            data-timepicker
            className="border-gray-200"
            value={form.getFieldValue<string>("startTime")}
            onChange={(time) => handleTimeChange("startTime", time)}
          />
          <span className="text-sm text-gray-500">to</span>
          <TimePicker
            data-timepicker
            className="border-gray-200"
            value={form.getFieldValue<string>("endTime")}
            onChange={(time) => handleTimeChange("endTime", time)}
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {duration}
        </span>
      </div>
    </div>
  );
}

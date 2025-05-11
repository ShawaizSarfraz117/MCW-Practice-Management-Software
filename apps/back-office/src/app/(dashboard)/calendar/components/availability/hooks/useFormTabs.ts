import { useState } from "react";
import { AvailabilityFormValues } from "../types";
// import { format } from "date-fns";
import React from "react";

type TabType = "availability" | "other"; // Extend as needed

export function useFormTabs(
  effectiveClinicianId?: string | null,
  selectedDate?: Date | null,
) {
  // Tab state (if you want to support multiple types)
  const [activeTab, setActiveTab] = useState<TabType>("availability");
  const [_updateCounter, setUpdateCounter] = useState(0);

  // Get initial time from session storage if available
  const getInitialTime = () => {
    if (typeof window === "undefined") {
      return {
        startTime: "09:00 AM",
        endTime: "10:00 AM",
      };
    }

    const selectedTimeSlotData =
      window.sessionStorage.getItem("selectedTimeSlot");

    if (selectedTimeSlotData) {
      try {
        const timeData = JSON.parse(selectedTimeSlotData);

        // If we have raw time values, use them to create the formatted time
        if (timeData.rawStartTime && timeData.rawEndTime) {
          const formatTimeFromRaw = (rawTime: {
            hours: number;
            minutes: number;
          }) => {
            const period = rawTime.hours >= 12 ? "PM" : "AM";
            const displayHours = rawTime.hours % 12 || 12;
            return `${displayHours.toString().padStart(2, "0")}:${rawTime.minutes.toString().padStart(2, "0")} ${period}`;
          };

          return {
            startTime: formatTimeFromRaw(timeData.rawStartTime),
            endTime: formatTimeFromRaw(timeData.rawEndTime),
          };
        }

        // Fallback to formatted times if available
        if (timeData.startTime && timeData.endTime) {
          return {
            startTime: timeData.startTime,
            endTime: timeData.endTime,
          };
        }
      } catch (error) {
        console.error("Error parsing time data:", error);
      }
    }

    // Default to 9 AM - 10 AM if no valid stored time
    return {
      startTime: "09:00 AM",
      endTime: "10:00 AM",
    };
  };

  // Get the initial time values
  const initialTimes = React.useMemo(() => getInitialTime(), []);

  // Default values for a new availability form
  const [availabilityFormValues, setAvailabilityFormValues] =
    useState<AvailabilityFormValues>(() => ({
      title: "",
      startDate: selectedDate || new Date(),
      endDate: selectedDate || new Date(),
      startTime: initialTimes.startTime,
      endTime: initialTimes.endTime,
      allDay: false,
      type: "availability",
      clinician: effectiveClinicianId || "",
      location: "video",
      allowOnlineRequests: false,
      isRecurring: false,
      recurringRule: undefined,
      selectedServices: [],
    }));

  // Add more form values for other tabs if needed
  // const [otherFormValues, setOtherFormValues] = useState<OtherFormValues>({ ... });

  // Force re-render to ensure UI updates
  const forceUpdate = () => {
    setUpdateCounter((prev) => prev + 1);
  };

  return {
    activeTab,
    setActiveTab,
    availabilityFormValues,
    setAvailabilityFormValues,
    // otherFormValues,
    // setOtherFormValues,
    forceUpdate,
  };
}

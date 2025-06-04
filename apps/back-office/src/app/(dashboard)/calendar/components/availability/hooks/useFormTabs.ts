import { useState } from "react";
import { AvailabilityFormValues } from "../types";

type TabType = "availability" | "other"; // Extend as needed

export function useFormTabs(
  effectiveClinicianId?: string | null,
  selectedDate?: Date | null,
) {
  // Tab state (if you want to support multiple types)
  const [activeTab, setActiveTab] = useState<TabType>("availability");
  const [_updateCounter, setUpdateCounter] = useState(0);

  // Default values for a new availability form
  const [availabilityFormValues, setAvailabilityFormValues] =
    useState<AvailabilityFormValues>({
      title: "",
      startDate: selectedDate || new Date(),
      endDate: selectedDate || new Date(),
      startTime: "09:00 AM",
      endTime: "10:00 AM",
      allDay: false,
      type: "availability",
      clinician: effectiveClinicianId || "",
      location: "video",
      allowOnlineRequests: false,
      isRecurring: false,
      recurringRule: undefined,
      selectedServices: [],
    });

  // Add more form values for other tabs if needed
  // const [otherFormValues, setOtherFormValues] = useState<OtherFormValues>({ ... });

  // Force re-render to ensure UI updates
  const forceUpdate = () => setUpdateCounter((prev) => prev + 1);

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

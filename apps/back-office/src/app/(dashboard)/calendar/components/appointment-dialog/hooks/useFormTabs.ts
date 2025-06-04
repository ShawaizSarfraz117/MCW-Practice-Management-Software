"use client";

import { useState } from "react";
import { FormValues } from "../types";

export function useFormTabs(
  effectiveClinicianId: string | null | undefined,
  selectedDate?: Date | null,
) {
  const [activeTab, setActiveTab] = useState<"appointment" | "event" | "out">(
    "appointment",
  );
  const [_updateCounter, setUpdateCounter] = useState(0);

  // Default appointment form values
  const [appointmentFormValues, setAppointmentFormValues] =
    useState<FormValues>({
      type: "appointment",
      eventName: "",
      clientType: "individual",
      clientGroup: "",
      clinician: effectiveClinicianId || "",
      selectedServices: [{ serviceId: "", fee: 0 }],
      startDate: selectedDate || new Date(),
      endDate: selectedDate || new Date(),
      startTime: "12:00 PM",
      endTime: "12:50 PM",
      location: "sp",
      recurring: false,
      allDay: false,
      cancelAppointments: true,
      notifyClients: true,
    });

  // Default event form values
  const [eventFormValues, setEventFormValues] = useState<FormValues>({
    type: "event",
    eventName: "",
    clientType: "individual",
    clientGroup: "",
    clinician: effectiveClinicianId || "",
    selectedServices: [],
    startDate: selectedDate || new Date(),
    endDate: selectedDate || new Date(),
    startTime: "12:00 PM",
    endTime: "12:50 PM",
    location: "sp",
    recurring: false,
    allDay: false,
    cancelAppointments: false,
    notifyClients: false,
  });

  // Force re-render to ensure UI updates
  const forceUpdate = () => setUpdateCounter((prev) => prev + 1);

  return {
    activeTab,
    setActiveTab,
    appointmentFormValues,
    setAppointmentFormValues,
    eventFormValues,
    setEventFormValues,
    forceUpdate,
  };
}

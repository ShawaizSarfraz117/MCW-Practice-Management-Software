"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { UseAppointmentDataProps } from "../types";

export function useAppointmentData({
  open,
  selectedDate,
  effectiveClinicianId,
  appointmentData,
  setAppointmentFormValues,
  setEventFormValues,
  setActiveTab,
  form,
}: UseAppointmentDataProps) {
  // Set initial form values when dialog opens
  useEffect(() => {
    if (open && !appointmentData) {
      // Check if there's a selected time slot in session storage
      const selectedTimeSlotData =
        window.sessionStorage.getItem("selectedTimeSlot");
      let startTime, endTime;

      if (selectedTimeSlotData) {
        const timeData = JSON.parse(selectedTimeSlotData);

        // Use the stored times directly
        startTime = timeData.startTime;
        endTime = timeData.endTime;
      } else {
        // Default times if no selection was made
        const now = new Date();
        const formatTime = (date: Date) => {
          const hours = date.getHours();
          const minutes = date.getMinutes();
          const period = hours >= 12 ? "PM" : "AM";
          const displayHours = hours % 12 || 12;
          return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
        };
        startTime = formatTime(now);
        endTime = formatTime(new Date(now.getTime() + 60 * 60 * 1000)); // 1 hour later
      }

      // Initialize appointment form values
      const formValues = {
        type: "appointment" as const,
        eventName: "",
        clientType: "individual" as const,
        client: "",
        clinician: effectiveClinicianId || "",
        selectedServices: [{ serviceId: "", fee: 0 }],
        startDate: selectedDate ? selectedDate : new Date(),
        endDate: selectedDate ? selectedDate : new Date(),
        startTime,
        endTime,
        location: "sp",
        recurring: false,
        allDay: false,
        cancelAppointments: true,
        notifyClients: true,
      };

      // Update form values
      setAppointmentFormValues(formValues);
      form.reset(formValues);

      // Initialize event form values with the same time
      const eventFormValues = {
        type: "event" as const,
        eventName: "",
        clientType: "individual" as const,
        client: "",
        clinician: effectiveClinicianId || "",
        selectedServices: [],
        startDate: selectedDate ? selectedDate : new Date(),
        endDate: selectedDate ? selectedDate : new Date(),
        startTime: startTime,
        endTime: endTime,
        location: "sp",
        recurring: false,
        allDay: false,
        cancelAppointments: false,
        notifyClients: false,
      };

      setEventFormValues(eventFormValues);

      // Clear session storage after use
      if (selectedTimeSlotData) {
        window.sessionStorage.removeItem("selectedTimeSlot");
      }
    }
  }, [
    open,
    selectedDate,
    effectiveClinicianId,
    setAppointmentFormValues,
    setEventFormValues,
    appointmentData,
    form,
  ]);

  // Handle viewing/editing existing appointment data
  useEffect(() => {
    if (appointmentData && open) {
      const parseDateTime = (dateString: string) => {
        const date = new Date(dateString);
        // Adjust for timezone offset
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset);
      };

      // Format dates from appointment data
      const startDate = appointmentData.start_date
        ? parseDateTime(appointmentData.start_date)
        : new Date();

      const endDate = appointmentData.end_date
        ? parseDateTime(appointmentData.end_date)
        : new Date();

      // Format times
      const startTime = format(startDate, "h:mm a");
      const endTime = format(endDate, "h:mm a");

      // Determine appointment type
      const rawType = appointmentData.type?.toLowerCase() || "appointment";
      const type = (rawType === "event" ? "event" : "appointment") as
        | "appointment"
        | "event";

      // Set active tab based on appointment type
      setActiveTab(type);

      // Ensure clientType is properly typed
      const clientType = (
        appointmentData.client_type === "group" ? "group" : "individual"
      ) as "individual" | "group";

      // Create form values from appointment data
      const formValues = {
        type,
        eventName: appointmentData.title || "",
        clientType,
        client: appointmentData.client_id || "",
        clinician: appointmentData.clinician_id || effectiveClinicianId || "",
        selectedServices: appointmentData.services?.map((s) => ({
          serviceId: s.id,
          fee: s.rate || 0,
        })) || [{ serviceId: "", fee: 0 }],
        startDate: startDate,
        endDate: endDate,
        startTime: startTime,
        endTime: endTime,
        status: appointmentData.status || "pending",
        location: appointmentData.location_id || "",
        recurring: appointmentData.is_recurring || false,
        allDay: appointmentData.is_all_day || false,
        cancelAppointments: true,
        notifyClients: true,
      };
      // Update form values based on type
      if (type === "appointment") {
        setAppointmentFormValues(formValues);
      } else if (type === "event") {
        setEventFormValues(formValues);
      }

      // Reset the form with the appointment data
      form.reset(formValues);
    }
  }, [
    appointmentData,
    open,
    form,
    setAppointmentFormValues,
    setEventFormValues,
    setActiveTab,
    effectiveClinicianId,
  ]);
}

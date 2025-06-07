"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { UseAppointmentDataProps } from "../types";
import { parseRecurringRule } from "@/(dashboard)/calendar/utils/recurringRuleUtils";

export function useAppointmentData({
  open,
  selectedDate,
  effectiveClinicianId,
  isViewMode,
  appointmentData,
  setAppointmentFormValues,
  setEventFormValues,
  setActiveTab,
  form,
}: UseAppointmentDataProps) {
  useEffect(() => {
    if (!open) return;

    // Get the selected time from session storage
    const selectedTimeSlot = window.sessionStorage.getItem("selectedTimeSlot");
    let startTime = "12:00 PM";
    let endTime = "12:50 PM";
    let startDate = selectedDate || new Date();
    let endDate = selectedDate || new Date();

    if (selectedTimeSlot) {
      try {
        const timeData = JSON.parse(selectedTimeSlot);

        // Use the stored times directly since they're already in local timezone
        startTime = timeData.startTime;
        endTime = timeData.endTime;

        // Convert stored ISO strings back to local dates
        if (timeData.startDate) {
          const date = new Date(timeData.startDate);
          const userTimezoneOffset = date.getTimezoneOffset() * 60000;
          startDate = new Date(date.getTime() + userTimezoneOffset);
        }
        if (timeData.endDate) {
          const date = new Date(timeData.endDate);
          const userTimezoneOffset = date.getTimezoneOffset() * 60000;
          endDate = new Date(date.getTime() + userTimezoneOffset);
        }
      } catch (error) {
        console.error("Error parsing selected time slot:", error);
      }
    }

    if (isViewMode && appointmentData) {
      // ... existing view mode code ...
    } else {
      // Set default values for new appointment
      const defaultAppointmentValues = {
        type: "appointment" as const,
        eventName: "",
        clientType: "individual" as "individual" | "group",
        clientGroup: "",
        clinician: effectiveClinicianId || "",
        selectedServices: [{ serviceId: "", fee: 0 }],
        startDate: startDate,
        endDate: endDate,
        startTime: startTime,
        endTime: endTime,
        location: "sp",
        recurring: false,
        allDay: false,
        cancelAppointments: true,
        notifyClients: true,
      };

      const defaultEventValues = {
        type: "event" as const,
        eventName: "",
        clientType: "individual" as "individual" | "group",
        clientGroup: "",
        clinician: effectiveClinicianId || "",
        selectedServices: [],
        startDate: startDate,
        endDate: endDate,
        startTime: startTime,
        endTime: endTime,
        location: "sp",
        recurring: false,
        allDay: false,
        cancelAppointments: false,
        notifyClients: false,
      };

      setAppointmentFormValues(defaultAppointmentValues);
      setEventFormValues(defaultEventValues);
      form.reset(defaultAppointmentValues);
    }
  }, [open, selectedDate, effectiveClinicianId, isViewMode, appointmentData]);

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

      // Parse recurring info if present
      const recurringInfo =
        appointmentData.is_recurring && appointmentData.recurring_rule
          ? parseRecurringRule(appointmentData.recurring_rule) || undefined
          : undefined;

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
        recurringInfo: recurringInfo,
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

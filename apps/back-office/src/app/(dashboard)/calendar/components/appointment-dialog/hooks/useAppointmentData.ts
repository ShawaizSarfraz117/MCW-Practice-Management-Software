"use client";

import { useEffect } from "react";
import { format, addMinutes } from "date-fns";
import { UseAppointmentDataProps } from "../Types";

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
  // Set initial form values when dialog opens
  useEffect(() => {
    if (open) {
      // Check if there's a selected time slot in session storage
      const selectedTimeSlotData =
        window.sessionStorage.getItem("selectedTimeSlot");
      let startTime, endTime;

      if (selectedTimeSlotData) {
        const { startTime: selectedStart, endTime: selectedEnd } =
          JSON.parse(selectedTimeSlotData);
        startTime = selectedStart;
        endTime = selectedEnd;
        // Clear the session storage after use
        window.sessionStorage.removeItem("selectedTimeSlot");
      } else {
        // Default times if no selection was made
        startTime = format(new Date(), "h:mm a");
        endTime = format(addMinutes(new Date(), 30), "h:mm a");
      }

      // Initialize appointment form values
      setAppointmentFormValues({
        type: "appointment",
        eventName: "",
        clientType: "individual",
        client: "",
        clinician: effectiveClinicianId || "",
        selectedServices: [{ serviceId: "", fee: 0 }],
        startDate: selectedDate ? selectedDate : new Date(),
        endDate: selectedDate ? selectedDate : new Date(),
        startTime: startTime,
        endTime: endTime,
        location: "sp",
        recurring: false,
        allDay: false,
        cancelAppointments: true,
        notifyClients: true,
      });

      // Initialize event form values
      setEventFormValues({
        type: "event",
        eventName: "",
        clientType: "individual",
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
      });
    }
  }, [
    open,
    selectedDate,
    effectiveClinicianId,
    setAppointmentFormValues,
    setEventFormValues,
  ]);

  // Handle viewing/editing existing appointment data
  useEffect(() => {
    if (isViewMode && appointmentData && open) {
      // Format dates from appointment data
      const startDate = appointmentData.start_date
        ? new Date(appointmentData.start_date)
        : new Date();

      const endDate = appointmentData.end_date
        ? new Date(appointmentData.end_date)
        : new Date();

      // Format times
      const startTime = format(startDate, "h:mm a");
      const endTime = format(endDate, "h:mm a");

      // Determine appointment type
      const type = appointmentData.type || "appointment";

      // Set active tab based on appointment type
      setActiveTab(type as "appointment" | "event");

      // Create form values from appointment data
      const formValues = {
        type: type,
        eventName: appointmentData.title || "",
        clientType: "individual",
        client: appointmentData.client_id || "",
        clinician: appointmentData.clinician_id || "",
        selectedServices:
          appointmentData.services?.map((s) => ({
            serviceId: s.id,
            fee: s.rate || 0,
          })) || [],
        startDate: startDate,
        endDate: endDate,
        startTime: startTime,
        endTime: endTime,
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
    isViewMode,
    appointmentData,
    open,
    form,
    setAppointmentFormValues,
    setEventFormValues,
    setActiveTab,
  ]);
}

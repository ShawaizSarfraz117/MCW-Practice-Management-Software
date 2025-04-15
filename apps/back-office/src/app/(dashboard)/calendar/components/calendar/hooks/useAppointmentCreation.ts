"use client";

import { useCallback } from "react";
import { Session } from "next-auth";
import { FormValues, RecurringInfo } from "../types";
import { getISODateTime } from "../utils/date-utils";

export function useAppointmentCreation(
  setApiError: (error: string | null) => void,
) {
  // Helper function to create appointment with API
  const createAppointment = useCallback(
    async (
      values: FormValues,
      session: Session | null,
      selectedResource?: string | null,
      clientName?: string,
    ) => {
      // Reset error state
      setApiError(null);

      // Get formatted start and end dates, handling all-day events
      const startDateTime = getISODateTime(
        values.startDate,
        values.allDay ? "start" : values.startTime,
        values.allDay,
      );
      const endDateTime = getISODateTime(
        values.endDate,
        values.allDay ? "end" : values.endTime,
        values.allDay,
      );

      // Parse recurring information if it exists in the form values
      const recurringInfo = values.recurringInfo as RecurringInfo | undefined;

      // Format recurring rule in RFC5545 format (iCalendar standard)
      let recurringRule = null;
      if (values.recurring && recurringInfo) {
        // Build the recurring rule in RFC5545 format
        // Basic format: FREQ=DAILY|WEEKLY|MONTHLY;INTERVAL=n;BYDAY=MO,TU,WE;COUNT=n;UNTIL=date
        const parts = [`FREQ=${recurringInfo.period}`];

        // Add interval (frequency)
        if (recurringInfo.frequency && parseInt(recurringInfo.frequency) > 1) {
          parts.push(`INTERVAL=${recurringInfo.frequency}`);
        }

        // Add weekdays for weekly recurrence
        if (
          recurringInfo.period === "WEEKLY" &&
          recurringInfo.selectedDays?.length > 0
        ) {
          parts.push(`BYDAY=${recurringInfo.selectedDays.join(",")}`);
        }

        // Add monthly pattern if specified
        if (
          recurringInfo.period === "MONTHLY" &&
          recurringInfo.monthlyPattern
        ) {
          if (recurringInfo.monthlyPattern === "onDateOfMonth") {
            // Use BYMONTHDAY for same day each month
            const dayOfMonth = values.startDate.getDate();
            parts.push(`BYMONTHDAY=${dayOfMonth}`);
          } else if (recurringInfo.monthlyPattern === "onWeekDayOfMonth") {
            // Use BYDAY with ordinal for same weekday each month (e.g., 2nd Monday)
            const dayOfWeek = values.startDate.getDay();
            const weekNumber = Math.ceil(values.startDate.getDate() / 7);
            const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
            parts.push(`BYDAY=${weekNumber}${days[dayOfWeek]}`);
          } else if (recurringInfo.monthlyPattern === "onLastWeekDayOfMonth") {
            // Use BYDAY with -1 for last weekday of month
            const dayOfWeek = values.startDate.getDay();
            const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
            parts.push(`BYDAY=-1${days[dayOfWeek]}`);
          }
        }

        // Add end condition
        if (recurringInfo.endType === "After" && recurringInfo.endValue) {
          parts.push(`COUNT=${recurringInfo.endValue}`);
        } else if (
          recurringInfo.endType === "On Date" &&
          recurringInfo.endValue
        ) {
          // Format the end date as YYYYMMDD for UNTIL
          const endDate = new Date(recurringInfo.endValue);
          const year = endDate.getFullYear();
          const month = String(endDate.getMonth() + 1).padStart(2, "0");
          const day = String(endDate.getDate()).padStart(2, "0");
          parts.push(`UNTIL=${year}${month}${day}T235959Z`);
        }

        recurringRule = parts.join(";");
        console.log("Generated recurring rule:", recurringRule);
      }

      // Create API payload
      const appointmentData = {
        type: values.type || "APPOINTMENT",
        title:
          values.type === "event"
            ? values.eventName || "Event"
            : values.client
              ? `Appointment with ${clientName || "Client"}`
              : "New Appointment",
        is_all_day: values.allDay || false,
        start_date: startDateTime,
        end_date: endDateTime,
        location_id: values.location || "",
        client_id: values.client || null,
        clinician_id: values.clinician || selectedResource || "",
        created_by: session?.user?.id || "", // Current user as creator
        status: "SCHEDULED",
        is_recurring: values.recurring || false,
        recurring_rule: recurringRule,
        service_id: values.selectedServices?.[0]?.serviceId || null,
        appointment_fee: values.selectedServices?.[0]?.fee || null,
      };

      console.log("Submitting appointment with dates:", {
        original: {
          startDate: values.startDate,
          startTime: values.startTime,
          endDate: values.endDate,
          endTime: values.endTime,
          isAllDay: values.allDay,
          recurring: values.recurring,
          recurringRule,
        },
        formatted: {
          startDateTime,
          endDateTime,
        },
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        browserTime: new Date().toString(),
      });

      // Save to API
      try {
        const response = await fetch("/api/appointment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(appointmentData),
        });

        if (!response.ok) {
          // Try to parse error message from response
          let errorMessage = "Failed to create appointment";
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (_e) {
            // If we can't parse error JSON, use status text
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const createdAppointment = await response.json();
        console.log("Appointment created:", createdAppointment);

        // Handle recurring appointments - API may return an array of appointments
        const appointments = Array.isArray(createdAppointment)
          ? createdAppointment
          : [createdAppointment];

        // Return the new appointments
        return appointments.map((appointment) => ({
          id: appointment.id,
          resourceId: appointment.clinician_id || "",
          title: appointment.title,
          start: appointment.start_date,
          end: appointment.end_date,
          location: appointment.location_id || "",
        }));
      } catch (error: unknown) {
        console.error("Error creating appointment:", error);
        // Set error message for display
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setApiError(errorMessage);

        // Show error notification to user with time zone info to help debugging
        const timeZoneInfo = `Browser timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
        alert(`Error: ${errorMessage}\n\n${timeZoneInfo}`);
        return [];
      }
    },
    [],
  );

  return { createAppointment };
}

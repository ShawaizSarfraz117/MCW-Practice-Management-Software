"use client";

import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { FormValues } from "../types";
import { useAppointmentCreation } from "./useAppointmentCreation";
import { useAppointmentDetails } from "./useAppointmentDetails";

export function useAppointmentHandler() {
  const [apiError, setApiError] = useState<string | null>(null);
  const { data: session } = useSession();
  const appointmentFormRef = useRef<FormValues | null>(null);

  const { createAppointment } = useAppointmentCreation(setApiError);
  const { fetchAppointmentDetails } = useAppointmentDetails(setApiError);

  // Function to handle appointment submission
  const handleAppointmentSubmit = useCallback(
    async (callback?: () => void) => {
      // Get form values from the dialog's form state
      if (appointmentFormRef.current) {
        // Create a new appointment from the form data
        const values = appointmentFormRef.current;

        try {
          // If client is specified, first get client details to use proper name in title
          if (values.client) {
            // Fetch client info to get their name
            try {
              const response = await fetch(`/api/client?id=${values.client}`);
              if (!response.ok) {
                throw new Error("Failed to fetch client information");
              }
              const clientData = await response.json();

              // Create title with actual client name
              const clientName =
                clientData.legal_first_name && clientData.legal_last_name
                  ? `${clientData.legal_first_name} ${clientData.legal_last_name}`
                  : "Client";

              // Create appointment with proper client name in title
              const createdAppointments = await createAppointment(
                values,
                session,
                clientName,
              );

              // Check if any appointment has the "New Client" tag
              if (createdAppointments && createdAppointments.length > 0) {
                const hasNewClientTag = createdAppointments.some(
                  (appointment: {
                    AppointmentTag?: Array<{ Tag?: { name?: string } }>;
                  }) =>
                    appointment.AppointmentTag?.some(
                      (tag: { Tag?: { name?: string } }) =>
                        tag.Tag?.name === "New Client",
                    ),
                );

                if (hasNewClientTag) {
                  // Return data indicating this is a new client appointment
                  return {
                    appointments: createdAppointments,
                    isNewClient: true,
                    clientName,
                    clientEmail: clientData.email || "",
                  };
                }
              }

              return { appointments: createdAppointments, isNewClient: false };
            } catch (error) {
              console.error("Error fetching client details:", error);
              // Continue with generic title if client fetch fails
              const createdAppointments = await createAppointment(
                values,
                session,
              );
              return { appointments: createdAppointments, isNewClient: false };
            }
          } else {
            // No client specified, just create the appointment with default title
            const createdAppointments = await createAppointment(
              values,
              session,
            );
            return { appointments: createdAppointments, isNewClient: false };
          }
        } catch (err) {
          console.error("Error preparing appointment data:", err);
          return { appointments: [], isNewClient: false };
        }
      }

      // Call the callback if provided
      if (callback) callback();

      // Return empty result if no form data
      return { appointments: [], isNewClient: false };
    },
    [session, createAppointment],
  );

  return {
    appointmentFormRef,
    apiError,
    setApiError,
    handleAppointmentSubmit,
    fetchAppointmentDetails,
  };
}

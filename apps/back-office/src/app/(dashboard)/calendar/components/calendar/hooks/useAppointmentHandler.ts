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
    async (callback?: () => void, selectedResource?: string | null) => {
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
              await createAppointment(
                values,
                session,
                selectedResource,
                clientName,
              );
            } catch (error) {
              console.error("Error fetching client details:", error);
              // Continue with generic title if client fetch fails
              await createAppointment(values, session, selectedResource);
            }
          } else {
            // No client specified, just create the appointment with default title
            await createAppointment(values, session, selectedResource);
          }
        } catch (err) {
          console.error("Error preparing appointment data:", err);
        }
      }

      // Call the callback if provided
      if (callback) callback();
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

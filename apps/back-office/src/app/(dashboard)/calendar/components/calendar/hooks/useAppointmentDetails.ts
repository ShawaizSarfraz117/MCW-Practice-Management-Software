"use client";

import { useCallback } from "react";

export function useAppointmentDetails(
  setApiError: (error: string | null) => void,
) {
  // Function to fetch appointment details by ID
  const fetchAppointmentDetails = useCallback(async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointment?id=${appointmentId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          `Error ${response.status}: Failed to fetch appointment details`;
        console.error(errorMessage);
        setApiError(errorMessage);

        // Show a user-friendly error message
        alert(`Could not load appointment details. ${errorMessage}`);
        return null;
      }

      const appointmentData = await response.json();
      return appointmentData;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching appointment details:", error);
      setApiError(`Failed to load appointment details: ${errorMessage}`);

      // Show a user-friendly error message
      alert(`Could not load appointment details. Please try again.`);
      return null;
    }
  }, []);

  return { fetchAppointmentDetails };
}

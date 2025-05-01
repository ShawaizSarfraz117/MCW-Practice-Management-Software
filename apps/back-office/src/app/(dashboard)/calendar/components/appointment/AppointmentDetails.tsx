"use client";

import type React from "react";
import {
  FormLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@mcw/ui";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface Location {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
}

interface AppointmentData {
  id?: string;
  title?: string;
  type?: string;
  location_id?: string;
  client_id?: string;
  clinician_id?: string;
  is_all_day?: boolean;
  notes?: string;
  start_date?: string;
  end_date?: string;
}

interface AppointmentDetailsProps {
  selectedDate: Date;
  selectedTime: string;
  appointmentData?: AppointmentData;
  isViewMode?: boolean;
}

// Custom hook to get clinician data for the current user (like in appointment-dialog.tsx)
function useClinicianData() {
  const { data: session, status: sessionStatus } = useSession();
  // Use roles array for checks
  const isAdmin = session?.user?.roles?.includes("ADMIN") || false;
  const isClinician = session?.user?.roles?.includes("CLINICIAN") || false;
  const userId = session?.user?.id;

  const [userClinicianId, setUserClinicianId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClinicianId = async () => {
      if (!isClinician || !userId || sessionStatus !== "authenticated") {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get the clinician record associated with this user ID
        const response = await fetch(`/api/clinician?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.id) {
            setUserClinicianId(data.id);
          } else {
            setError("Clinician record found but missing ID");
          }
        } else {
          setError("Failed to fetch clinician data");
        }
      } catch (error) {
        console.error("Error fetching clinician ID:", error);
        setError("An error occurred while fetching clinician data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicianId();
  }, [userId, isClinician, sessionStatus]);

  // Only proceed with API calls once session is loaded and clinician ID is resolved if needed
  const shouldFetchData =
    sessionStatus === "authenticated" &&
    (!isClinician || (isClinician && userClinicianId !== null));

  return {
    clinicianId: userClinicianId,
    isAdmin,
    isClinician,
    userId,
    isLoading: isLoading || sessionStatus === "loading",
    error,
    sessionStatus,
    shouldFetchData,
  };
}

export const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  selectedDate,
  selectedTime,
  appointmentData,
  isViewMode = false,
}) => {
  const formattedDate = format(selectedDate, "MMMM d, yyyy");

  // Use the custom hook to get clinician data
  const {
    clinicianId: effectiveClinicianId,
    isAdmin,
    isClinician,
    isLoading: isLoadingClinicianData,
    shouldFetchData,
    sessionStatus,
  } = useClinicianData();

  // State to track selected values when in view mode
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Effect to set values from appointment data
  useEffect(() => {
    if (isViewMode && appointmentData) {
      // Set the location
      if (appointmentData.location_id) {
        setSelectedLocation(appointmentData.location_id);
      }

      // Set notes if available
      if (appointmentData.notes) {
        setNotes(appointmentData.notes);
      }
    }
  }, [isViewMode, appointmentData]);

  // Fetch locations with role-based permissions
  const { data: locations = [], isLoading: isLoadingLocations } = useQuery<
    Location[]
  >({
    queryKey: ["locations", effectiveClinicianId, isAdmin, isClinician],
    queryFn: async () => {
      let url = "/api/location";

      // If user is a clinician and not an admin, fetch only assigned locations
      if (isClinician && !isAdmin && effectiveClinicianId) {
        url += `?clinicianId=${effectiveClinicianId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }
      return response.json();
    },
    enabled: shouldFetchData, // Only run query when session is loaded
  });

  // Show loading state if waiting for clinician data
  if (
    isLoadingClinicianData ||
    (isClinician && !effectiveClinicianId && sessionStatus === "authenticated")
  ) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#16A34A] mx-auto mb-4" />
          <p className="text-gray-500">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <FormLabel className="text-sm">Date</FormLabel>
          <div className="border rounded-none p-2 text-sm bg-gray-50">
            {formattedDate}
          </div>
        </div>
        <div className="space-y-2">
          <FormLabel className="text-sm">Time</FormLabel>
          <div className="border rounded-none p-2 text-sm bg-gray-50">
            {selectedTime}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <FormLabel className="text-sm">Location</FormLabel>
        {isViewMode ? (
          <div className="border rounded-none p-2 text-sm bg-gray-50">
            {locations.find((l) => l.id === selectedLocation)?.name ||
              "No location selected"}
          </div>
        ) : (
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="rounded-none">
              <SelectValue
                placeholder={
                  isLoadingLocations ? "Loading..." : "Select location"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {locations?.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <FormLabel className="text-sm">Notes</FormLabel>
        {isViewMode ? (
          <div className="border rounded-none p-2 text-sm bg-gray-50 min-h-[80px] whitespace-pre-wrap">
            {notes || "No notes available"}
          </div>
        ) : (
          <Textarea
            className="w-full h-20 border rounded-none p-2 text-sm resize-none"
            placeholder="Add notes about this appointment..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        )}
      </div>
    </div>
  );
};

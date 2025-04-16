"use client";

import type React from "react";
// import { MainSidebar } from "./components/main-sidebar";
import { CalendarView } from "./components/calendar/calendar";
import { CreateClientForm } from "./components/client/CreateClientForm";
import { useState, useEffect } from "react";
import { IntakeForm } from "./components/intake/IntakeForm";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

// Types for API responses
type Clinician = {
  id: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  User: {
    email: string;
  };
};

type Location = {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
};

// New type for appointments
type Appointment = {
  id: string;
  type: string;
  title: string;
  is_all_day: boolean;
  start_date: string;
  end_date: string;
  location_id: string;
  client_id?: string;
  clinician_id?: string;
  status: string;
  is_recurring: boolean;
  Client?: {
    id: string;
    legal_first_name: string;
    legal_last_name: string;
    preferred_name?: string;
  };
  Clinician?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  Location?: {
    id: string;
    name: string;
    address: string;
  };
};

// Custom hook to get clinician data for the current user
function useClinicianData() {
  const { data: session, status: sessionStatus } = useSession();
  const isAdmin = session?.user?.isAdmin || false;
  const isClinician = session?.user?.isClinician || false;
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

// Helper function to determine location type
function determineLocationType(
  address: string,
): "physical" | "virtual" | "unassigned" {
  if (address.toLowerCase().includes("telehealth")) {
    return "virtual";
  }
  if (address.toLowerCase().includes("unassigned")) {
    return "unassigned";
  }
  return "physical";
}

const CalendarPage: React.FC = () => {
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [showIntakeForm, setShowIntakeForm] = useState(false);

  // Use the custom hook to get clinician data
  const {
    clinicianId: effectiveClinicianId,
    isAdmin,
    isClinician,
    isLoading: isLoadingClinicianData,
    shouldFetchData,
    sessionStatus,
  } = useClinicianData();

  // Get date range for current month (for initial load)
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Format dates for API
  const apiStartDate = startOfMonth.toISOString().split("T")[0];
  const apiEndDate = endOfMonth.toISOString().split("T")[0];

  // Fetch clinicians with role-based permissions
  const { data: cliniciansData = [], isLoading: isLoadingClinicians } =
    useQuery<Clinician[]>({
      queryKey: ["clinicians", effectiveClinicianId, isAdmin, isClinician],
      queryFn: async () => {
        let url = "/api/clinician";

        // If user is a clinician and not an admin, fetch only self
        if (isClinician && !isAdmin && effectiveClinicianId) {
          url += `?id=${effectiveClinicianId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch clinicians");
        }
        const data = await response.json();
        // Ensure we always return an array
        return Array.isArray(data) ? data : [data];
      },
      enabled: shouldFetchData, // Only run query when session is loaded
    });

  // Fetch locations with role-based permissions
  const { data: locationsData = [], isLoading: isLoadingLocations } = useQuery<
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

  // Fetch appointments with role-based permissions
  const { data: appointmentsData = [], isLoading: isLoadingAppointments } =
    useQuery<Appointment[]>({
      queryKey: [
        "appointments",
        effectiveClinicianId,
        isAdmin,
        isClinician,
        apiStartDate,
        apiEndDate,
      ],
      queryFn: async () => {
        let url =
          "/api/appointment?startDate=" +
          apiStartDate +
          "&endDate=" +
          apiEndDate;

        // If user is a clinician and not an admin, fetch only their appointments
        if (isClinician && !isAdmin && effectiveClinicianId) {
          url += `&clinicianId=${effectiveClinicianId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }
        return response.json();
      },
      enabled: shouldFetchData, // Only run query when session is loaded
    });

  // Transform API data to match the format expected by CalendarView
  const formattedClinicians = Array.isArray(cliniciansData)
    ? cliniciansData.map((clinician) => ({
        value: clinician.id,
        label: `${clinician.first_name} ${clinician.last_name}`,
        group: "clinicians",
      }))
    : [];

  const formattedLocations = Array.isArray(locationsData)
    ? locationsData.map((location) => ({
        value: location.id,
        label: location.name,
        type: determineLocationType(location.address),
      }))
    : [];

  // Format appointments for the calendar
  const formattedAppointments = Array.isArray(appointmentsData)
    ? appointmentsData.map((appointment) => {
        // Create proper title with client name if available
        let title = appointment.title;

        // If the title contains "Appointment with Client" but we have client data
        if (title.includes("Appointment with") && appointment.Client) {
          const clientName =
            appointment.Client.legal_first_name &&
            appointment.Client.legal_last_name
              ? `${appointment.Client.legal_first_name} ${appointment.Client.legal_last_name}`
              : appointment.Client.preferred_name || "Client";

          title = `Appointment with ${clientName}`;
        }

        return {
          id: appointment.id,
          resourceId: appointment.clinician_id || "",
          title: title,
          start: appointment.start_date,
          end: appointment.end_date,
          location: appointment.location_id,
          allDay: appointment.is_all_day,
          status: appointment.status,
        };
      })
    : [];

  const handleCreateClient = (date: string, time: string) => {
    setAppointmentDate(`${date} at ${time}`);
    setShowCreateClient(true);
  };

  const handleAppointmentDone = () => {
    setShowCreateClient(false);
    setShowIntakeForm(true);
  };

  // Show loading state if waiting for clinician data or API data
  if (
    isLoadingClinicianData ||
    (isClinician &&
      !effectiveClinicianId &&
      sessionStatus === "authenticated") ||
    (shouldFetchData &&
      (isLoadingClinicians || isLoadingLocations || isLoadingAppointments))
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#16A34A] mx-auto mb-4" />
          <p className="text-gray-500">Loading calendar data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* <MainSidebar /> */}
      <div className="flex-1">
        <CalendarView
          initialClinicians={formattedClinicians}
          initialEvents={formattedAppointments}
          initialLocations={formattedLocations}
          onAppointmentDone={handleAppointmentDone}
          onCreateClient={handleCreateClient}
        />

        {showCreateClient && (
          <CreateClientForm
            appointmentDate={appointmentDate}
            onClose={() => setShowCreateClient(false)}
          />
        )}
        {showIntakeForm && (
          <IntakeForm
            clientEmail="almir@example.com"
            clientName="Almir Kazacic"
            onClose={() => setShowIntakeForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CalendarPage;

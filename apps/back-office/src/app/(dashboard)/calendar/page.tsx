/* eslint-disable max-lines-per-function */
"use client";

import type React from "react";
// import { MainSidebar } from "./components/main-sidebar";
import { CalendarView } from "./components/calendar/calendar";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { CreateClientDrawer } from "../clients/components/CreateClientDrawer";
import {
  fetchClientGroups,
  ClientGroupWithMembership,
} from "../clients/services/client.service";
import type {
  CalendarClinician,
  CalendarLocation,
  CalendarAppointment,
  CalendarAvailability,
} from "@mcw/types";

// Custom hook to get clinician data for the current user
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
          if (data?.id) {
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
  const queryClient = useQueryClient();
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [_appointmentDate, setAppointmentDate] = useState("");

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
    useQuery<CalendarClinician[]>({
      queryKey: ["clinicians", effectiveClinicianId, isAdmin, isClinician],
      queryFn: async () => {
        let url = "/api/clinician";

        // If user is a clinician and not an admin, fetch only self using userId
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
    CalendarLocation[]
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
    useQuery<CalendarAppointment[]>({
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

  // Fetch availabilities with role-based permissions
  const { data: availabilitiesData = [], isLoading: isLoadingAvailabilities } =
    useQuery<CalendarAvailability[]>({
      queryKey: [
        "availabilities",
        effectiveClinicianId,
        isAdmin,
        isClinician,
        apiStartDate,
        apiEndDate,
      ],
      queryFn: async () => {
        let url =
          "/api/availability?startDate=" +
          apiStartDate +
          "&endDate=" +
          apiEndDate;

        // If user is a clinician and not an admin, fetch only their availabilities
        if (isClinician && !isAdmin && effectiveClinicianId) {
          url += `&clinicianId=${effectiveClinicianId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch availabilities");
        }
        return response.json();
      },
      enabled: shouldFetchData, // Only run query when session is loaded
    });

  // Add event listener to refresh availabilities when AppointmentSidebar saves
  useEffect(() => {
    const handleRefreshAvailabilities = () => {
      // Invalidate and refetch the availabilities query
      queryClient.invalidateQueries({
        queryKey: [
          "availabilities",
          effectiveClinicianId,
          isAdmin,
          isClinician,
          apiStartDate,
          apiEndDate,
        ],
      });
      // Also invalidate appointments in case they were affected
      queryClient.invalidateQueries({
        queryKey: [
          "appointments",
          effectiveClinicianId,
          isAdmin,
          isClinician,
          apiStartDate,
          apiEndDate,
        ],
      });
    };

    // Listen for the refresh event
    window.addEventListener(
      "refreshAvailabilities",
      handleRefreshAvailabilities,
    );

    // Cleanup
    return () => {
      window.removeEventListener(
        "refreshAvailabilities",
        handleRefreshAvailabilities,
      );
    };
  }, [
    queryClient,
    effectiveClinicianId,
    isAdmin,
    isClinician,
    apiStartDate,
    apiEndDate,
  ]);

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

  const [_isLoading, setIsLoading] = useState(true);
  const [sortBy, _setSortBy] = useState("legal_last_name");
  const [statusFilter, _setStatusFilter] = useState<string[]>(["all"]);
  const [searchQuery, _setSearchQuery] = useState("");
  const [_clients, setClients] = useState<{
    data: ClientGroupWithMembership[];
    pagination: { page: number; limit: number; total: number };
  }>({ data: [], pagination: { page: 1, limit: 20, total: 0 } });

  const fetchClientData = useCallback(
    async (params = {}) => {
      setIsLoading(true);
      const [clients, error] = await fetchClientGroups({
        searchParams: {
          status: statusFilter.join(","),
          search: searchQuery,
          sortBy,
          ...params,
        },
      });
      if (!error && clients) {
        setClients(clients);
      }
      setIsLoading(false);
    },
    [statusFilter, searchQuery, sortBy],
  );

  useEffect(() => {
    fetchClientData(); // Now only called when statusFilter or sortBy change
  }, [statusFilter, sortBy]);

  // Format appointments for the calendar
  const formattedAppointments = Array.isArray(appointmentsData)
    ? appointmentsData.map((appointment) => {
        // Create proper title with client name if available
        let title = appointment.title;

        // If the title contains "Appointment with Client" but we have client data
        if (title?.includes("Appointment with") && appointment.Client) {
          const clientName =
            appointment.Client.legal_first_name &&
            appointment.Client.legal_last_name
              ? `${appointment.Client.legal_first_name} ${appointment.Client.legal_last_name}`
              : appointment.Client.preferred_name || "Client";

          title = `Appointment with ${clientName}`;
        }

        // Map 'event' type to 'appointment' for calendar compatibility
        const eventType =
          appointment.type === "event" ? "appointment" : "appointment";

        return {
          id: appointment.id,
          resourceId: appointment.clinician_id || "",
          title: title || "Appointment",
          start: appointment.start_date,
          end: appointment.end_date,
          location: appointment.location_id,
          allDay: appointment.is_all_day,
          status: appointment.status,
          extendedProps: {
            type: eventType as "appointment" | "availability",
            isFirstAppointmentForGroup: appointment.isFirstAppointmentForGroup,
            appointmentTags: appointment.AppointmentTag || [],
          },
        };
      })
    : [];

  // Format availabilities for the calendar
  const formattedAvailabilities = Array.isArray(availabilitiesData)
    ? availabilitiesData.map((availability) => ({
        id: availability.id,
        resourceId: availability.clinician_id,
        title: availability.title || "Available",
        start: availability.start_date,
        end: availability.end_date,
        location: availability.location_id,
        extendedProps: {
          type: "availability" as const,
          clinician_id: availability.clinician_id,
          allow_online_requests: availability.allow_online_requests,
          is_recurring: availability.is_recurring,
          recurring_rule: availability.recurring_rule,
          clinician: availability.Clinician,
        },
      }))
    : [];

  // Combine appointments and availabilities
  const allEvents = [...formattedAppointments, ...formattedAvailabilities];

  const handleCreateClient = (date: string, time: string) => {
    setAppointmentDate(`${date} at ${time}`);
    setShowCreateClient(true);
  };

  const handleAppointmentDone = () => {
    setShowCreateClient(false);
  };

  // Show loading state if waiting for clinician data or API data
  if (
    isLoadingClinicianData ||
    (isClinician &&
      !effectiveClinicianId &&
      sessionStatus === "authenticated") ||
    (shouldFetchData &&
      (isLoadingClinicians ||
        isLoadingLocations ||
        isLoadingAppointments ||
        isLoadingAvailabilities))
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
          initialEvents={allEvents}
          initialLocations={formattedLocations}
          isScheduledPage={false}
          onAppointmentDone={handleAppointmentDone}
          onCreateClient={handleCreateClient}
        />

        <CreateClientDrawer
          fetchClientData={fetchClientData}
          open={showCreateClient}
          onOpenChange={setShowCreateClient}
        />
      </div>
    </div>
  );
};

export default CalendarPage;

"use client";
import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarView } from "../calendar/components/calendar/calendar";
import { CreateClientForm } from "../calendar/components/client/CreateClientForm";
import { EventClickArg } from "@fullcalendar/core";
import { AppointmentSidebar } from "../calendar/components/availability/AppointmentSidebar";
import { Button } from "@mcw/ui";

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

const Scheduled = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  // Get user role information directly from roles array
  const isAdmin = session?.user?.roles?.includes("ADMIN") || false;
  const isClinician = session?.user?.roles?.includes("CLINICIAN") || false;
  const userId = session?.user?.id || null;

  // Fetch clinicians with role-based permissions
  const { data: cliniciansData = [], isLoading: isLoadingClinicians } =
    useQuery({
      queryKey: ["clinicians", userId, isAdmin, isClinician],
      queryFn: async () => {
        // Fetch clinician data based on userId if needed
        if (isClinician && !isAdmin && userId) {
          const url = `/api/clinician?userId=${userId}`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error("Failed to fetch clinician data");
          }
          return response.json(); // Expecting an array, possibly with one clinician object
        }
        // Admins might fetch all or based on other criteria (logic assumed handled by API)
        const response = await fetch("/api/clinician");
        if (!response.ok) {
          throw new Error("Failed to fetch clinicians");
        }
        return response.json();
      },
      enabled: sessionStatus === "authenticated",
    });

  // Derive the actual clinician ID after cliniciansData is loaded
  // Handle both array and single object responses from the API
  const clinicianId = React.useMemo(() => {
    if (isClinician && !isAdmin && cliniciansData) {
      let id = null;
      if (Array.isArray(cliniciansData) && cliniciansData.length > 0) {
        id = cliniciansData[0]?.id; // Get id from first element if array
      } else if (
        typeof cliniciansData === "object" &&
        cliniciansData !== null &&
        !Array.isArray(cliniciansData)
      ) {
        // Assuming the object has an 'id' property of type string or similar
        id = (cliniciansData as { id?: string | number }).id;
      }
      return id || null;
    }
    return null;
  }, [isClinician, isAdmin, cliniciansData]);

  // Fetch locations with role-based permissions
  const { data: locationsData = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations", clinicianId, isAdmin, isClinician], // Use derived clinicianId in key
    queryFn: async () => {
      let url = "/api/location";

      // Use the derived clinicianId if available
      if (isClinician && !isAdmin && clinicianId) {
        url += `?clinicianId=${clinicianId}`;
      } else if (isAdmin) {
        // Admin fetching logic (if different, else API handles it)
      } else if (isClinician && !isAdmin && !clinicianId) {
        // Handle case where clinicianId couldn't be derived but was expected
        // Decide behavior: return empty array, throw error, or fetch all if allowed?
        // For now, let's assume the API handles the case where no clinicianId is passed
        // or perhaps return an empty array immediately to prevent unnecessary API calls.
        return [];
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }
      return response.json();
    },
    // Enable only when session is authenticated AND (user is admin OR clinicianId is determined)
    enabled:
      sessionStatus === "authenticated" &&
      (!isClinician || isAdmin || !!clinicianId),
  });

  // Fetch appointments with role-based permissions
  const { data: appointmentsData = [], isLoading: isLoadingAppointments } =
    useQuery({
      queryKey: ["appointments", clinicianId, isAdmin, isClinician], // Use derived clinicianId in key
      queryFn: async () => {
        let url = "/api/appointment";

        // Use the derived clinicianId if available
        if (isClinician && !isAdmin && clinicianId) {
          url += `?clinicianId=${clinicianId}`;
        } else if (isAdmin) {
          // Admin fetching logic (if different, else API handles it)
        } else if (isClinician && !isAdmin && !clinicianId) {
          return []; // Return empty array
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }
        return response.json();
      },
      // Enable only when session is authenticated AND (user is admin OR clinicianId is determined)
      enabled:
        sessionStatus === "authenticated" &&
        (!isClinician || isAdmin || !!clinicianId),
    });

  // Fetch availabilities with role-based permissions
  const { data: availabilitiesData = [], isLoading: isLoadingAvailabilities } =
    useQuery({
      queryKey: ["availabilities", clinicianId, isAdmin, isClinician], // Use derived clinicianId in key
      queryFn: async () => {
        let url = "/api/availability";

        // Use the derived clinicianId if available
        if (isClinician && !isAdmin && clinicianId) {
          url += `?clinicianId=${clinicianId}`;
        } else if (isAdmin) {
          // Admin fetching logic (if different, else API handles it)
        } else if (isClinician && !isAdmin && !clinicianId) {
          return []; // Return empty array
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch availabilities");
        }
        const data = await response.json();
        return data;
      },
      enabled: sessionStatus === "authenticated",
    });

  // Transform API data to match the format expected by CalendarView
  const formattedClinicians = React.useMemo(() => {
    if (!cliniciansData) return [];

    const data = Array.isArray(cliniciansData)
      ? cliniciansData
      : [cliniciansData];
    return data.map((clinician) => ({
      value: clinician.id,
      label: `${clinician.first_name} ${clinician.last_name}`,
      group: "clinicians",
      user_id: clinician.user_id,
    }));
  }, [cliniciansData]);

  const formattedLocations = useMemo(
    () =>
      Array.isArray(locationsData)
        ? locationsData.map((location) => ({
            value: location.id,
            label: location.name,
            type: determineLocationType(location.address),
          }))
        : [],
    [locationsData],
  );

  // Format availabilities for the calendar - MEMOIZED
  const formattedAvailabilities = useMemo(
    () =>
      Array.isArray(availabilitiesData)
        ? availabilitiesData.map((availability) => ({
            id: availability.id,
            title: availability.title || "Available",
            start: new Date(availability.start_date).toISOString(),
            end: new Date(availability.end_date).toISOString(),
            resourceId: availability.clinician_id,
            allDay: availability.is_all_day,
            backgroundColor: "#E6F3FF",
            borderColor: "#E6F3FF",
            textColor: "#1E40AF",
            display: "block",
            extendedProps: {
              type: "availability" as const,
              clinician_id: availability.clinician_id,
              allow_online_requests: availability.allow_online_requests,
              is_recurring: availability.is_recurring,
              recurring_rule: availability.recurring_rule,
            },
          }))
        : [],
    [availabilitiesData],
  );

  // Format appointments with consistent styling - MEMOIZED
  const formattedAppointments = useMemo(
    () =>
      Array.isArray(appointmentsData)
        ? appointmentsData.map((appointment) => ({
            id: appointment.id,
            title: appointment.title,
            start: new Date(appointment.start_date).toISOString(),
            end: new Date(appointment.end_date).toISOString(),
            resourceId: appointment.clinician_id,
            allDay: appointment.is_all_day,
            backgroundColor: "#E6F3FF",
            borderColor: "#E6F3FF",
            textColor: "#1E40AF",
            display: "block",
            extendedProps: {
              type: "appointment" as const,
            },
          }))
        : [],
    [appointmentsData],
  );

  // Combine all events - MEMOIZED
  const allEvents = useMemo(
    () => [...formattedAvailabilities, ...formattedAppointments],
    [formattedAvailabilities, formattedAppointments],
  );
  // Handle appointment creation completion
  const handleAppointmentDone = () => {
    // Refresh appointments data
    // This will be handled by the query invalidation in the appointment creation
  };

  // Handle client creation
  const handleCreateClient = (date: string, time: string) => {
    setAppointmentDate(`${date} @ ${time}`);
    setShowCreateClient(true);
  };

  // Handle event click to view appointment details
  const handleEventClick = async (info: EventClickArg) => {
    const eventId = info.event.id;
    const eventType = info.event.extendedProps.type;

    if (eventType === "availability") {
      // Fetch availability details
      const response = await fetch(`/api/availability?id=${eventId}`);
      const availabilityData = await response.json();

      if (availabilityData) {
        // Set selected date from availability
        if (availabilityData.start_date) {
          setSelectedDate(new Date(availabilityData.start_date));
        }

        // Set selected resource (clinician) if available
        if (availabilityData.clinician_id) {
          setSelectedResource(availabilityData.clinician_id);
        }

        // Open the sidebar in view mode
        setIsSidebarOpen(true);
      }
    } else {
      // Handle regular appointment click
      const response = await fetch(`/api/appointment/${eventId}`);
      const appointmentData = await response.json();

      if (appointmentData) {
        // Set selected date from appointment
        if (appointmentData.start_date) {
          setSelectedDate(new Date(appointmentData.start_date));
        }

        // Set selected resource (clinician) if available
        if (appointmentData.clinician_id) {
          setSelectedResource(appointmentData.clinician_id);
        }

        // Open the sidebar in view mode
        setIsSidebarOpen(true);
      }
    }
  };

  // Handle date selection to create a new availability
  const handleDateSelect = (selectInfo: {
    start: Date;
    end: Date;
    resource?: { id: string };
  }) => {
    // Reset viewing mode when creating a new availability
    setSelectedDate(selectInfo.start);
    setSelectedResource(selectInfo.resource?.id || null);

    // Get the local time by adjusting for timezone (same logic as main calendar)
    const adjustForTimezone = (date: Date) => {
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() + userTimezoneOffset);
    };

    const localStart = adjustForTimezone(selectInfo.start);
    const localEnd = adjustForTimezone(selectInfo.end);

    // Format times in 12-hour format
    const formatTime12Hour = (date: Date) => {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    // Save the selected time info for the availability sidebar using 12-hour format
    const eventData = {
      startTime: formatTime12Hour(localStart),
      endTime: formatTime12Hour(localEnd),
    };

    // Store this data to be accessed by the form
    window.sessionStorage.setItem(
      "selectedTimeSlot",
      JSON.stringify(eventData),
    );

    setIsSidebarOpen(true);
  };

  // Show loading state if waiting for data
  if (
    sessionStatus === "loading" ||
    isLoadingClinicians ||
    isLoadingLocations ||
    isLoadingAppointments ||
    isLoadingAvailabilities
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
    <div className="flex h-screen flex-col">
      <div className="bg-gray-50 px-6 py-2 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              Availability schedule
            </h1>
            <p className="text-gray-600 text-sm">
              Use this schedule to show when you're available to meet with
              clients.{" "}
              <Link
                className="text-[#267356] hover:text-blue-700 text-sm"
                href="/help/availability"
              >
                Learn about managing availability
              </Link>
            </p>
          </div>
          <Button
            className="bg-[#2e8467] hover:bg-[#267356] text-white rounded-md px-4 py-2"
            onClick={() => router.push("/calendar")}
          >
            View calendar
          </Button>
        </div>
      </div>
      <div className="flex-1">
        <CalendarView
          initialClinicians={formattedClinicians}
          initialEvents={allEvents}
          initialLocations={formattedLocations}
          isScheduledPage={true}
          onAppointmentDone={handleAppointmentDone}
          onCreateClient={handleCreateClient}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
        />

        <AppointmentSidebar
          open={isSidebarOpen}
          selectedDate={selectedDate || new Date()}
          selectedResource={selectedResource}
          onClose={() => setIsSidebarOpen(false)}
          onDone={() => {
            setIsSidebarOpen(false);
            // Refresh data after successful operation
            handleAppointmentDone();
          }}
          onOpenChange={(open) => {
            // Prevent unnecessary re-renders
            if (open !== isSidebarOpen) {
              setIsSidebarOpen(open);
            }
          }}
        />

        {showCreateClient && (
          <CreateClientForm
            appointmentDate={appointmentDate}
            onClientCreated={() => {
              setShowCreateClient(false);
            }}
            onClose={() => setShowCreateClient(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Scheduled;

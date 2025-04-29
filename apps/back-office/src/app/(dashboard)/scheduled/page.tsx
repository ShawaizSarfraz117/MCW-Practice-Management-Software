"use client";
import React, { useState } from "react";
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

  // Get user role information
  const isAdmin = session?.user?.isAdmin || false;
  const isClinician = session?.user?.isClinician || false;
  const effectiveClinicianId = session?.user?.id || null;

  // Fetch clinicians with role-based permissions
  const { data: cliniciansData = [], isLoading: isLoadingClinicians } =
    useQuery({
      queryKey: ["clinicians", effectiveClinicianId, isAdmin, isClinician],
      queryFn: async () => {
        let url = "/api/clinician";

        // If user is a clinician and not an admin, fetch only their own data
        if (isClinician && !isAdmin && effectiveClinicianId) {
          url += `?id=${effectiveClinicianId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch clinicians");
        }
        return response.json();
      },
      enabled: sessionStatus === "authenticated",
    });

  // Fetch locations with role-based permissions
  const { data: locationsData = [], isLoading: isLoadingLocations } = useQuery({
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
    enabled: sessionStatus === "authenticated",
  });

  // Fetch appointments with role-based permissions
  const { data: appointmentsData = [], isLoading: isLoadingAppointments } =
    useQuery({
      queryKey: ["appointments", effectiveClinicianId, isAdmin, isClinician],
      queryFn: async () => {
        let url = "/api/appointment";

        // If user is a clinician and not an admin, fetch only their appointments
        if (isClinician && !isAdmin && effectiveClinicianId) {
          url += `?clinicianId=${effectiveClinicianId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }
        return response.json();
      },
      enabled: sessionStatus === "authenticated",
    });

  // Fetch availabilities with role-based permissions
  const { data: availabilitiesData = [], isLoading: isLoadingAvailabilities } =
    useQuery({
      queryKey: ["availabilities", effectiveClinicianId, isAdmin, isClinician],
      queryFn: async () => {
        let url = "/api/availability";

        // If user is a clinician and not an admin, fetch only their availabilities
        if (isClinician && !isAdmin && effectiveClinicianId) {
          url += `?clinicianId=${effectiveClinicianId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          console.error(
            "DEBUG: Failed to fetch availabilities:",
            response.status,
            response.statusText,
          );
          throw new Error("Failed to fetch availabilities");
        }
        const data = await response.json();
        return data;
      },
      enabled: sessionStatus === "authenticated",
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

  // Format availabilities for the calendar
  const formattedAvailabilities = Array.isArray(availabilitiesData)
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
      }))
    : [];

  // Format appointments with consistent styling
  const formattedAppointments = Array.isArray(appointmentsData)
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
      }))
    : [];

  // Combine all events
  const allEvents = [...formattedAvailabilities, ...formattedAppointments];

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

    // Save the selected time info for the availability sidebar
    const eventData = {
      startTime: new Date(selectInfo.start).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      endTime: new Date(selectInfo.end).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
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
                href="/help/availability"
                className="text-[#267356] hover:text-blue-700 text-sm"
              >
                Learn about managing availability
              </Link>
            </p>
          </div>
          <Button
            onClick={() => router.push("/calendar")}
            className="bg-[#2e8467] hover:bg-[#267356] text-white rounded-md px-4 py-2"
          >
            View calendar
          </Button>
        </div>
      </div>
      <div className="flex-1">
        <CalendarView
          initialClinicians={formattedClinicians}
          initialLocations={formattedLocations}
          initialEvents={allEvents}
          onCreateClient={handleCreateClient}
          onAppointmentDone={handleAppointmentDone}
          onEventClick={handleEventClick}
          onDateSelect={handleDateSelect}
          isScheduledPage={true}
        />

        <AppointmentSidebar
          open={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          selectedDate={selectedDate || new Date()}
          selectedResource={selectedResource}
          onDone={() => {
            setIsSidebarOpen(false);
            handleAppointmentDone();
          }}
          onClose={() => setIsSidebarOpen(false)}
        />

        {showCreateClient && (
          <CreateClientForm
            appointmentDate={appointmentDate}
            onClose={() => setShowCreateClient(false)}
            onClientCreated={() => {
              setShowCreateClient(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Scheduled;

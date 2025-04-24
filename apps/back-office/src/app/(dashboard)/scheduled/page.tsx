"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { CalendarView } from "../calendar/components/calendar/calendar";
import { CreateClientForm } from "../calendar/components/client/CreateClientForm";
import { IntakeForm } from "../calendar/components/intake/IntakeForm";
import { AppointmentSidebar } from "../calendar/components/availability/AppointmentSidebar";
import { EventClickArg } from "@fullcalendar/core";
import { AppointmentData } from "../calendar/components/appointment-dialog/types";

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
  const { data: session, status: sessionStatus } = useSession();
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<
    AppointmentData | undefined
  >(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [isViewingAppointment, setIsViewingAppointment] = useState(false);

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

  const formattedAppointments = Array.isArray(appointmentsData)
    ? appointmentsData.map((appointment) => ({
        id: appointment.id,
        title: appointment.title,
        start: appointment.start_date,
        end: appointment.end_date,
        resourceId: appointment.clinician_id,
        location: appointment.location_id,
        allDay: appointment.is_all_day,
        status: appointment.status,
        type: appointment.type,
      }))
    : [];

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
    const appointmentId = info.event.id;
    const response = await fetch(`/api/appointment/${appointmentId}`);
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
      setIsViewingAppointment(true);
      setIsSidebarOpen(true);
      setSelectedAppointment(appointmentData);
    }
  };

  // Handle date selection to create a new appointment
  const handleDateSelect = (selectInfo: {
    start: Date;
    end: Date;
    resource?: { id: string };
  }) => {
    // Reset viewing mode when creating a new appointment
    setIsViewingAppointment(false);
    setSelectedAppointment(undefined);
    setSelectedDate(selectInfo.start);
    setSelectedResource(selectInfo.resource?.id || null);

    // Save the selected time info for the appointment sidebar
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
    isLoadingAppointments
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
      <div className="flex-1">
        <CalendarView
          initialClinicians={formattedClinicians}
          initialEvents={formattedAppointments}
          initialLocations={formattedLocations}
          onAppointmentDone={handleAppointmentDone}
          onCreateClient={handleCreateClient}
          onEventClick={handleEventClick}
          onDateSelect={handleDateSelect}
        />

        {showCreateClient && (
          <CreateClientForm
            appointmentDate={appointmentDate}
            onClose={() => setShowCreateClient(false)}
          />
        )}

        {showIntakeForm && (
          <IntakeForm
            clientEmail=""
            clientName=""
            onClose={() => setShowIntakeForm(false)}
          />
        )}

        <AppointmentSidebar
          open={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          selectedDate={selectedDate || new Date()}
          selectedResource={selectedResource}
          onCreateClient={handleCreateClient}
          onDone={handleAppointmentDone}
          appointmentData={selectedAppointment}
          isViewMode={isViewingAppointment}
        />
      </div>
    </div>
  );
};

export default Scheduled;

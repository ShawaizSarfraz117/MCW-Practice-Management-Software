"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg } from "@fullcalendar/core";
import { format } from "date-fns";
import { useSession } from "next-auth/react";

import { AppointmentDialog } from "../appointment-dialog";
import { CalendarToolbar } from "./components/CalendarToolbar";
import { useAppointmentHandler } from "./hooks/useAppointmentHandler";
import { getHeaderDateFormat } from "./utils/date-utils";
import { CalendarViewProps, Event } from "./types";

export function CalendarView({
  initialClinicians,
  initialLocations,
  initialEvents,
  onCreateClient,
  onAppointmentDone,
}: CalendarViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [isViewingAppointment, setIsViewingAppointment] = useState(false);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Get session data to check if user is admin
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin || false;

  // Set the view based on user role
  const [currentView, setCurrentView] = useState(
    isAdmin ? "resourceTimeGridDay" : "timeGridDay",
  );
  const [currentDate, setCurrentDate] = useState(new Date());

  // Initialize selected clinicians based on user role
  const [selectedClinicians, setSelectedClinicians] = useState<string[]>(() => {
    if (!isAdmin && initialClinicians.length === 1) {
      // Non-admin users should only see their own clinician
      return [initialClinicians[0].value];
    } else {
      // Admin users get default selection of first two clinicians
      return initialClinicians
        .slice(0, Math.min(2, initialClinicians.length))
        .map((c) => c.value);
    }
  });

  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    initialLocations.map((loc) => loc.value),
  );

  const calendarRef = useRef<FullCalendar>(null);

  // Use the appointment handler hook
  const { appointmentFormRef, fetchAppointmentDetails } =
    useAppointmentHandler();

  // Filter events based on selected resources
  const filteredEvents = useMemo(() => {
    // First filter events by selected locations
    let filtered = events.filter((event) =>
      selectedLocations.includes(event.location),
    );

    // For non-admin users, only show events related to their clinician ID
    if (!isAdmin && selectedClinicians.length > 0) {
      filtered = filtered.filter((event) =>
        selectedClinicians.includes(event.resourceId),
      );
    }

    return filtered;
  }, [events, selectedLocations, selectedClinicians, isAdmin]);

  // Effect to capture form values from the AppointmentDialog
  useEffect(() => {
    // Hook to access appointment form values when needed
    const captureFormValues = (e: CustomEvent) => {
      if (e.detail && e.detail.formValues) {
        appointmentFormRef.current = e.detail.formValues;
      }
    };

    // Add event listener for form submission
    window.addEventListener(
      "appointmentFormSubmit",
      captureFormValues as EventListener,
    );

    return () => {
      window.removeEventListener(
        "appointmentFormSubmit",
        captureFormValues as EventListener,
      );
    };
  }, []);

  // Handle appointment dialog closing and form submission
  const handleAppointmentSubmit = async () => {
    try {
      // Process the appointment submission and update the calendar
      const newEvents = await handleCreateAppointment();
      if (newEvents && newEvents.length > 0) {
        setEvents((prevEvents) => [...prevEvents, ...newEvents]);
      }

      // Call the onAppointmentDone callback if provided
      if (onAppointmentDone) onAppointmentDone();
    } catch (error) {
      console.error("Error handling appointment submission:", error);
    }
  };

  // Helper function to handle appointment creation
  const handleCreateAppointment = async () => {
    if (!appointmentFormRef.current) return [];

    const values = appointmentFormRef.current;

    try {
      // If client is specified, get client details for title
      if (values.client) {
        const response = await fetch(`/api/client?id=${values.client}`);
        if (response.ok) {
          const clientData = await response.json();
          const clientName =
            clientData.legal_first_name && clientData.legal_last_name
              ? `${clientData.legal_first_name} ${clientData.legal_last_name}`
              : "Client";

          return createAppointmentWithAPI(values, clientName);
        }
      }

      // No client or error fetching client, proceed with generic title
      return createAppointmentWithAPI(values);
    } catch (error) {
      console.error("Error in appointment creation:", error);
      return [];
    }
  };

  // Function to create appointment via API
  const createAppointmentWithAPI = async (
    values: {
      type?: string;
      eventName?: string;
      client?: string;
      startDate: Date;
      endDate: Date;
      location?: string;
      clinician?: string;
      recurring?: boolean;
      allDay?: boolean;
      selectedServices?: Array<{ serviceId: string; fee: number }>;
    },
    clientName?: string,
  ) => {
    // Create the appointment payload based on form values
    const appointmentData = createAppointmentPayload(values, clientName);

    try {
      const response = await fetch("/api/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            response.statusText ||
            "Failed to create appointment",
        );
      }

      const data = await response.json();
      const appointments = Array.isArray(data) ? data : [data];

      // Format events for calendar
      return appointments.map((appointment) => ({
        id: appointment.id,
        resourceId: appointment.clinician_id || "",
        title: appointment.title,
        start: appointment.start_date,
        end: appointment.end_date,
        location: appointment.location_id || "",
      }));
    } catch (error) {
      console.error("API error:", error);
      alert(
        `Error creating appointment: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return [];
    }
  };

  // Helper to create appointment payload
  const createAppointmentPayload = (
    values: {
      type?: string;
      eventName?: string;
      client?: string;
      startDate: Date;
      endDate: Date;
      location?: string;
      clinician?: string;
      recurring?: boolean;
      allDay?: boolean;
      selectedServices?: Array<{ serviceId: string; fee: number }>;
    },
    clientName?: string,
  ) => {
    return {
      type: values.type || "APPOINTMENT",
      title:
        values.type === "event"
          ? values.eventName || "Event"
          : values.client
            ? `Appointment with ${clientName || "Client"}`
            : "New Appointment",
      is_all_day: values.allDay || false,
      start_date: values.startDate.toISOString(),
      end_date: values.endDate.toISOString(),
      location_id: values.location || "",
      client_id: values.client || null,
      clinician_id: values.clinician || selectedResource || "",
      created_by: session?.user?.id || "",
      status: "SCHEDULED",
      is_recurring: values.recurring || false,
      service_id: values.selectedServices?.[0]?.serviceId || null,
      appointment_fee: values.selectedServices?.[0]?.fee || null,
    };
  };

  // Handle event click to view appointment details
  const handleEventClick = async (info: EventClickArg) => {
    const appointmentId = info.event.id;
    const appointmentData = await fetchAppointmentDetails(appointmentId);

    if (appointmentData) {
      // Set selected date from appointment
      if (appointmentData.start_date) {
        setSelectedDate(new Date(appointmentData.start_date));
      }

      // Set selected resource (clinician) if available
      if (appointmentData.clinician_id) {
        setSelectedResource(appointmentData.clinician_id);
      }

      // Open the dialog in view mode
      setIsViewingAppointment(true);
      setIsDialogOpen(true);
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
    setSelectedAppointment(null);
    setSelectedDate(selectInfo.start);
    setSelectedResource(selectInfo.resource?.id || null);

    // Save the selected time info for the appointment dialog
    const eventData = {
      startTime: format(selectInfo.start, "h:mm a"),
      endTime: format(selectInfo.end, "h:mm a"),
    };

    // Store this data to be accessed by the form
    window.sessionStorage.setItem(
      "selectedTimeSlot",
      JSON.stringify(eventData),
    );

    setIsDialogOpen(true);
  };

  // View handling functions
  const handleViewChange = (newView: string) => {
    // For non-admin users, don't allow resourceTimeGrid views
    if (!isAdmin && newView.startsWith("resourceTimeGrid")) {
      newView = newView.replace("resourceTimeGrid", "timeGrid");
    }

    setCurrentView(newView);
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      calendar.changeView(newView);
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      calendar.today();
      setCurrentDate(new Date());
    }
  };

  const handlePrev = () => {
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      calendar.prev();
      setCurrentDate(calendar.getDate());
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      calendar.next();
      setCurrentDate(calendar.getDate());
    }
  };

  // Get formatted header date text
  const getFormattedHeaderDate = () => {
    return getHeaderDateFormat(currentView, currentDate);
  };

  // Filter resources based on selected clinicians
  const resources = initialClinicians
    .filter((clinician) => selectedClinicians.includes(clinician.value))
    .map((clinician) => ({
      id: clinician.value,
      title: clinician.label,
    }));

  return (
    <div className="flex h-full bg-background">
      <div className="flex-1 flex flex-col">
        <CalendarToolbar
          currentView={currentView}
          getHeaderDateFormat={getFormattedHeaderDate}
          handleNext={handleNext}
          handlePrev={handlePrev}
          handleToday={handleToday}
          handleViewChange={handleViewChange}
          initialClinicians={initialClinicians}
          initialLocations={initialLocations}
          isAdmin={isAdmin}
          selectedClinicians={selectedClinicians}
          selectedLocations={selectedLocations}
          setSelectedClinicians={setSelectedClinicians}
          setSelectedLocations={setSelectedLocations}
        />

        <div className="flex-1 p-4">
          <FullCalendar
            ref={calendarRef}
            allDaySlot={true}
            allDayText="All day"
            dayHeaderFormat={{
              weekday: "short",
              month: "numeric",
              day: "numeric",
              omitCommas: true,
            }}
            eventClick={handleEventClick}
            events={filteredEvents}
            headerToolbar={false}
            height="100%"
            initialView={currentView}
            nowIndicator={true}
            plugins={[
              resourceTimeGridPlugin,
              timeGridPlugin,
              dayGridPlugin,
              interactionPlugin,
            ]}
            resources={isAdmin ? resources : undefined}
            select={handleDateSelect}
            selectable={true}
            slotMaxTime="23:00:00"
            slotMinTime="07:00:00"
            timeZone="America/New_York"
            views={{
              resourceTimeGridDay: {
                type: "resourceTimeGrid",
                duration: { days: 1 },
                slotDuration: "01:00:00",
                slotLabelFormat: {
                  hour: "numeric",
                  minute: "2-digit",
                  meridiem: "short",
                },
              },
              timeGridDay: {
                type: "timeGrid",
                duration: { days: 1 },
                slotDuration: "01:00:00",
                slotLabelFormat: {
                  hour: "numeric",
                  minute: "2-digit",
                  meridiem: "short",
                },
              },
              resourceTimeGridWeek: {
                type: "resourceTimeGrid",
                duration: { weeks: 1 },
                slotDuration: "01:00:00",
                slotLabelFormat: {
                  hour: "numeric",
                  minute: "2-digit",
                  meridiem: "short",
                },
              },
              timeGridWeek: {
                type: "timeGrid",
                duration: { weeks: 1 },
                slotDuration: "01:00:00",
                slotLabelFormat: {
                  hour: "numeric",
                  minute: "2-digit",
                  meridiem: "short",
                },
              },
              dayGridMonth: {
                type: "dayGrid",
                duration: { months: 1 },
                dayHeaderFormat: { weekday: "short" },
              },
            }}
          />
        </div>
      </div>

      <AppointmentDialog
        appointmentData={
          isViewingAppointment && selectedAppointment
            ? (selectedAppointment as unknown as Record<string, unknown>)
            : undefined
        }
        isViewMode={isViewingAppointment}
        open={isDialogOpen}
        selectedDate={selectedDate || new Date()}
        selectedResource={selectedResource}
        onCreateClient={(date, time) => onCreateClient?.(date, time)}
        onDone={handleAppointmentSubmit}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}

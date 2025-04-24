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

import { AppointmentDialog } from "../AppointmentDialog";
import { CalendarToolbar } from "./components/CalendarToolbar";
import { useAppointmentHandler } from "./hooks/useAppointmentHandler";
import { getHeaderDateFormat } from "./utils/date-utils";
import {
  CalendarViewProps,
  Event,
  Clinician,
  Location,
  AppointmentData,
} from "./types";
import { EditAppointmentDialog } from "../EditAppointmentDialog";

export function CalendarView({
  initialClinicians,
  initialLocations,
  initialEvents,
  onCreateClient,
  onAppointmentDone,
  onEventClick,
  onDateSelect,
}: CalendarViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
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
        .map((c: Clinician) => c.value);
    }
  });

  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    initialLocations.map((loc: Location) => loc.value),
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

  // Listen for appointment updates
  useEffect(() => {
    const handleAppointmentUpdate = (event: CustomEvent) => {
      const updatedAppointment = event.detail.appointment;

      // Update the events array by replacing the old appointment with the updated one
      setEvents((prevEvents) => {
        return prevEvents.map((event) => {
          if (event.id === updatedAppointment.id) {
            return {
              ...event,
              ...updatedAppointment,
              start: new Date(updatedAppointment.start_date),
              end: new Date(updatedAppointment.end_date),
            };
          }
          return event;
        });
      });

      // Close the edit dialog
      setIsEditDialogOpen(false);
    };

    const handleAppointmentDelete = async () => {
      try {
        // Get the current date range from the calendar
        const calendarApi = calendarRef.current?.getApi();
        if (!calendarApi) return;

        const view = calendarApi.view;
        const startDate = view.activeStart.toISOString().split("T")[0];
        const endDate = view.activeEnd.toISOString().split("T")[0];

        // Construct the URL with date range
        let url = `/api/appointment?startDate=${startDate}&endDate=${endDate}`;

        // If user is a clinician and not an admin, fetch only their appointments
        if (!isAdmin && selectedClinicians.length > 0) {
          url += `&clinicianId=${selectedClinicians[0]}`;
        }

        // Fetch updated appointments
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }

        const appointments = await response.json();

        // Format appointments for calendar
        const formattedEvents = appointments.map(
          (appointment: AppointmentData) => ({
            id: appointment.id,
            resourceId: appointment.clinician_id || "",
            title: appointment.title,
            start: appointment.start_date,
            end: appointment.end_date,
            location: appointment.location_id || "",
          }),
        );

        // Update calendar events
        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error refreshing appointments:", error);
      }

      // Close the edit dialog
      setIsEditDialogOpen(false);
    };

    window.addEventListener(
      "appointmentUpdated",
      handleAppointmentUpdate as EventListener,
    );
    window.addEventListener(
      "appointmentDeleted",
      handleAppointmentDelete as EventListener,
    );

    return () => {
      window.removeEventListener(
        "appointmentUpdated",
        handleAppointmentUpdate as EventListener,
      );
      window.removeEventListener(
        "appointmentDeleted",
        handleAppointmentDelete as EventListener,
      );
    };
  }, [calendarRef, isAdmin, selectedClinicians]);

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
      startTime?: string;
      endTime?: string;
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
      startTime?: string;
      endTime?: string;
      location?: string;
      clinician?: string;
      recurring?: boolean;
      allDay?: boolean;
      selectedServices?: Array<{ serviceId: string; fee: number }>;
      recurringInfo?: {
        frequency: string;
        period: string;
        selectedDays: string[];
        monthlyPattern?: string;
        endType: string;
        endValue: string | undefined;
      };
    },
    clientName?: string,
  ) => {
    // Parse and combine date and time values
    const getDateTimeISOString = (date: Date, timeStr?: string) => {
      if (values.allDay || !timeStr) return date.toISOString();

      const [timeValue, period] = timeStr.split(" ");
      const [hours, minutes] = timeValue.split(":").map(Number);

      // Convert 12-hour format to 24-hour
      let hours24 = hours;
      if (period === "PM" && hours !== 12) hours24 += 12;
      if (period === "AM" && hours === 12) hours24 = 0;

      // Create a new date with the correct local time
      const newDate = new Date(date);
      newDate.setHours(hours24, minutes, 0, 0);

      // Create an ISO string but adjust for timezone offset to preserve local time
      // Format: YYYY-MM-DDTHH:MM:SS.sssZ
      const tzOffset = newDate.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = new Date(newDate.getTime() - tzOffset).toISOString();

      return localISOTime;
    };

    // Create start and end dates with the correct times
    const startDateTime = getDateTimeISOString(
      values.startDate,
      values.startTime,
    );
    const endDateTime = getDateTimeISOString(values.endDate, values.endTime);

    // Format recurring rule in RFC5545 format if recurring is enabled
    let recurringRule = null;
    if (values.recurring && values.recurringInfo) {
      const parts = [`FREQ=${values.recurringInfo.period}`];

      // Add interval (frequency)
      if (
        values.recurringInfo.frequency &&
        parseInt(values.recurringInfo.frequency) > 1
      ) {
        parts.push(`INTERVAL=${values.recurringInfo.frequency}`);
      }

      // Add weekdays for weekly recurrence
      if (
        values.recurringInfo.period === "WEEKLY" &&
        values.recurringInfo.selectedDays?.length > 0
      ) {
        parts.push(`BYDAY=${values.recurringInfo.selectedDays.join(",")}`);
      }

      // Add monthly pattern if specified
      if (
        values.recurringInfo.period === "MONTHLY" &&
        values.recurringInfo.monthlyPattern
      ) {
        if (values.recurringInfo.monthlyPattern === "onDateOfMonth") {
          // Use BYMONTHDAY for same day each month
          const dayOfMonth = values.startDate.getDate();
          parts.push(`BYMONTHDAY=${dayOfMonth}`);
        } else if (values.recurringInfo.monthlyPattern === "onWeekDayOfMonth") {
          // Use BYDAY with ordinal for same weekday each month
          const dayOfWeek = values.startDate.getDay();
          const weekNumber = Math.ceil(values.startDate.getDate() / 7);
          const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
          parts.push(`BYDAY=${weekNumber}${days[dayOfWeek]}`);
        } else if (
          values.recurringInfo.monthlyPattern === "onLastWeekDayOfMonth"
        ) {
          // Use BYDAY with -1 for last weekday of month
          const dayOfWeek = values.startDate.getDay();
          const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
          parts.push(`BYDAY=-1${days[dayOfWeek]}`);
        }
      }

      // Add end condition
      if (
        values.recurringInfo.endType === "After" &&
        values.recurringInfo.endValue
      ) {
        parts.push(`COUNT=${values.recurringInfo.endValue}`);
      } else if (
        values.recurringInfo.endType === "On Date" &&
        values.recurringInfo.endValue
      ) {
        // Format the end date as YYYYMMDD for UNTIL
        const endDate = new Date(values.recurringInfo.endValue);
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, "0");
        const day = String(endDate.getDate()).padStart(2, "0");
        parts.push(`UNTIL=${year}${month}${day}T235959Z`);
      }

      recurringRule = parts.join(";");
    }

    return {
      type: values.type || "APPOINTMENT",
      title:
        values.type === "event"
          ? values.eventName || "Event"
          : values.client
            ? `Appointment with ${clientName || "Client"}`
            : "New Appointment",
      is_all_day: values.allDay || false,
      start_date: startDateTime,
      end_date: endDateTime,
      location_id: values.location || "",
      client_id: values.client || null,
      clinician_id: values.clinician || selectedResource || "",
      created_by: session?.user?.id || "",
      status: "SCHEDULED",
      is_recurring: values.recurring || false,
      recurring_rule: recurringRule,
      service_id: values.selectedServices?.[0]?.serviceId || null,
      appointment_fee: values.selectedServices?.[0]?.fee || null,
    };
  };

  // Handle event click to view appointment details
  const handleEventClick = async (info: EventClickArg) => {
    if (onEventClick) {
      onEventClick(info);
      return;
    }

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

      // Store the time info for the appointment dialog
      const eventData = {
        startTime: format(new Date(appointmentData.start_date), "h:mm a"),
        endTime: format(new Date(appointmentData.end_date), "h:mm a"),
      };

      window.sessionStorage.setItem(
        "selectedTimeSlot",
        JSON.stringify(eventData),
      );

      // Open the edit dialog
      setSelectedAppointment(appointmentData);
      setIsEditDialogOpen(true);
    }
  };

  // Handle date selection to create a new appointment
  const handleDateSelect = (selectInfo: {
    start: Date;
    end: Date;
    resource?: { id: string };
  }) => {
    if (onDateSelect) {
      onDateSelect(selectInfo);
      return;
    }

    // Reset viewing mode when creating a new appointment
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
    .filter((clinician: Clinician) =>
      selectedClinicians.includes(clinician.value),
    )
    .map((clinician: Clinician) => ({
      id: clinician.value,
      title: clinician.label,
    }));

  // Add this effect to fetch appointments when view or date changes
  useEffect(() => {
    async function fetchAppointmentsForCurrentView() {
      if (!calendarRef.current) return;
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;
      const startDate = view.activeStart.toISOString().split("T")[0];
      const endDate = view.activeEnd.toISOString().split("T")[0];

      let url = `/api/appointment?startDate=${startDate}&endDate=${endDate}`;
      if (!isAdmin && selectedClinicians.length > 0) {
        url += `&clinicianId=${selectedClinicians[0]}`;
      }
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch appointments");
        const appointments = await response.json();
        const formattedEvents = appointments.map(
          (appointment: AppointmentData) => ({
            id: appointment.id,
            resourceId: appointment.clinician_id || "",
            title: appointment.title,
            start: appointment.start_date,
            end: appointment.end_date,
            location: appointment.location_id || "",
          }),
        );
        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    }
    fetchAppointmentsForCurrentView();
  }, [currentView, currentDate, selectedClinicians, isAdmin]);

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
        appointmentData={undefined}
        isViewMode={false}
        open={isDialogOpen}
        selectedDate={selectedDate || new Date()}
        selectedResource={selectedResource}
        onCreateClient={(date, time) => onCreateClient?.(date, time)}
        onDone={handleAppointmentSubmit}
        onOpenChange={setIsDialogOpen}
      />

      <EditAppointmentDialog
        appointmentData={selectedAppointment || undefined}
        open={isEditDialogOpen}
        selectedDate={selectedDate || new Date()}
        selectedResource={selectedResource}
        onDone={() => {
          // Just close the dialog after update
          setIsEditDialogOpen(false);
          // If there's a callback, call it
          if (onAppointmentDone) onAppointmentDone();
        }}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
}

"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DateSelectArg } from "@fullcalendar/core";
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
  AvailabilityData,
} from "./types";
import { EditAppointmentDialog } from "../EditAppointmentDialog";
import { AvailabilitySidebar } from "../availability/AvailabilitySidebar";
import styles from "./calendar.module.css";
import { ClientGroup } from "../appointment-dialog/types";

declare global {
  interface Window {
    toast?: {
      error: (message: string) => void;
    };
  }
}

interface FormValues {
  clientGroup: ClientGroup | null;
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
  selectedServices?: Array<{
    serviceId: string;
    fee: number;
  }>;
  recurringInfo?: {
    frequency: string;
    period: string;
    selectedDays: string[];
    monthlyPattern?: string;
    endType: string;
    endValue: string | undefined;
  };
}

export function CalendarView({
  initialClinicians,
  initialLocations,
  initialEvents,
  onCreateClient,
  onAppointmentDone,
  onEventClick,
  onDateSelect,
  isScheduledPage = false,
}: CalendarViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAvailabilitySidebar, setShowAvailabilitySidebar] = useState(false);
  const [selectedAvailability, setSelectedAvailability] =
    useState<AvailabilityData | null>(null);

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
    // First filter events by type based on the page we're on
    let filtered = events.filter((event) => {
      const eventType = event.extendedProps?.type;

      // On scheduled page, only show availabilities
      if (isScheduledPage) {
        return eventType === "availability";
      }
      // On calendar page, only show appointments
      return eventType !== "availability";
    });

    // Then filter by location and clinician
    filtered = filtered.filter((event) => {
      // For availability events, only check clinician
      if (event.extendedProps?.type === "availability") {
        return (
          event.resourceId && selectedClinicians.includes(event.resourceId)
        );
      }
      // For regular events, filter by location
      return event.location && selectedLocations.includes(event.location);
    });

    // For non-admin users, only show events related to their clinician ID
    if (!isAdmin && selectedClinicians.length > 0) {
      filtered = filtered.filter((event) => {
        return (
          event.resourceId && selectedClinicians.includes(event.resourceId)
        );
      });
    }

    return filtered;
  }, [events, selectedLocations, selectedClinicians, isAdmin, isScheduledPage]);

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

    const values = appointmentFormRef.current as unknown as FormValues;

    // Add detailed logging of the form values
    console.log("Appointment form values:", {
      rawValues: values,
      client: values.client,
      type: values.type,
      hasClient: Boolean(values.client),
      clientTrimmed: values.client ? values.client.trim() : null,
      formKeys: Object.keys(values),
    });

    try {
      // If client is specified, get client group details for title
      if (values.client && values.client.trim()) {
        console.log("Fetching client group details for ID:", values.client);

        const response = await fetch(`/api/client-group?id=${values.client}`);
        if (response.ok) {
          const clientGroupData = await response.json();
          console.log("Successfully fetched client group:", clientGroupData);

          const clientName = clientGroupData.name || "Client Group";
          return createAppointmentWithAPI(values, clientName);
        } else {
          console.error(
            "Failed to fetch client group data:",
            await response.text(),
          );
        }
      } else {
        console.log(
          "No client specified or empty client ID, form values:",
          values,
        );
      }

      return createAppointmentWithAPI(values);
    } catch (error) {
      console.error("Error in appointment creation:", error);
      return [];
    }
  };

  // Function to create appointment via API
  const createAppointmentWithAPI = async (
    values: FormValues,
    clientName?: string,
  ) => {
    // Create the appointment payload based on form values
    const appointmentData = createAppointmentPayload(values, clientName);
    console.log("Sending appointment creation request with data:", {
      fullPayload: appointmentData,
      clientGroupId: appointmentData.client_group_id,
      originalClient: values.client,
      formValues: values,
    });

    try {
      const response = await fetch("/api/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", {
          status: response.status,
          errorData,
          sentPayload: appointmentData,
          originalFormValues: values,
        });
        throw new Error(errorData.error || "Failed to create appointment");
      }

      const responseData = await response.json();
      console.log("API Success Response:", {
        status: response.status,
        data: responseData,
        sentPayload: appointmentData,
      });

      if (!response.ok) {
        let errorMessage = "Failed to create appointment";

        // Handle specific validation errors
        if (responseData.missingFields?.length > 0) {
          errorMessage = `Missing required fields: ${responseData.missingFields.join(", ")}`;
          console.error(
            "Validation error:",
            errorMessage,
            "Full error:",
            responseData,
          );
        } else if (responseData.error) {
          errorMessage = responseData.error;
          if (responseData.details) {
            errorMessage += `: ${responseData.details}`;
          }
          console.error(
            "API error:",
            errorMessage,
            "Full error:",
            responseData,
          );
        }

        // Show error in a more user-friendly way using the toast system if available
        if (typeof window !== "undefined" && window.toast) {
          window.toast.error(errorMessage);
        } else {
          alert(errorMessage);
        }

        throw new Error(errorMessage);
      }

      console.log("Successfully created appointment(s):", responseData);

      const appointments = Array.isArray(responseData)
        ? responseData
        : [responseData];

      // Format events for calendar
      const formattedEvents = appointments.map((appointment) => ({
        id: appointment.id,
        resourceId: appointment.clinician_id || "",
        title: appointment.title,
        start: appointment.start_date,
        end: appointment.end_date,
        location: appointment.location_id || "",
      }));

      console.log("Formatted calendar events:", formattedEvents);
      return formattedEvents;
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  };

  // Helper to create appointment payload
  const createAppointmentPayload = (
    values: FormValues,
    clientName?: string,
  ) => {
    // Log incoming values
    console.log("Creating appointment payload from values:", {
      formValues: values,
      clientName,
      hasClient: Boolean(values.client),
      clientValue: values.client,
    });

    // Validate input dates first
    if (
      !(values.startDate instanceof Date) ||
      isNaN(values.startDate.getTime())
    ) {
      console.error("Invalid start date:", values.startDate);
      throw new Error(`Invalid start date: ${values.startDate}`);
    }

    if (!(values.endDate instanceof Date) || isNaN(values.endDate.getTime())) {
      console.error("Invalid end date:", values.endDate);
      throw new Error(`Invalid end date: ${values.endDate}`);
    }

    // Parse and combine date and time values
    const getDateTimeISOString = (date: Date, timeStr?: string) => {
      if (!timeStr) {
        console.log("No time string provided, using date as is:", date);
        return date.toISOString();
      }

      // Validate time string format
      const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i;
      if (!timeRegex.test(timeStr)) {
        console.error("Invalid time string format:", timeStr);
        throw new Error(
          `Invalid time format. Expected "HH:MM AM/PM", got "${timeStr}"`,
        );
      }

      const [timeValue, period] = timeStr.split(" ");
      const [hours, minutes] = timeValue.split(":").map(Number);

      // Convert 12-hour format to 24-hour
      let hours24 = hours;
      if (period.toUpperCase() === "PM" && hours !== 12) hours24 += 12;
      if (period.toUpperCase() === "AM" && hours === 12) hours24 = 0;

      // Create a new date with the correct local time
      const newDate = new Date(date);
      newDate.setHours(hours24, minutes, 0, 0);

      // Log timezone information for debugging
      console.log("Timezone information:", {
        originalDate: date,
        timeString: timeStr,
        localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: newDate.getTimezoneOffset(),
        localTime: newDate.toLocaleString(),
      });

      // Create an ISO string but adjust for timezone offset to preserve local time
      const tzOffset = newDate.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = new Date(newDate.getTime() - tzOffset).toISOString();

      return localISOTime;
    };

    // Create start and end dates with the correct times
    let startDateTime, endDateTime;
    try {
      startDateTime = getDateTimeISOString(values.startDate, values.startTime);
      endDateTime = getDateTimeISOString(values.endDate, values.endTime);

      console.log("Parsed date/times:", {
        startDateTime,
        endDateTime,
        originalStartDate: values.startDate,
        originalEndDate: values.endDate,
        startTime: values.startTime,
        endTime: values.endTime,
      });
    } catch (error) {
      console.error("Error parsing dates:", error);
      throw error;
    }

    // Validate date range
    if (new Date(endDateTime) <= new Date(startDateTime)) {
      const error = "End date/time must be after start date/time";
      console.error(error, { startDateTime, endDateTime });
      throw new Error(error);
    }

    // Validate recurring appointment settings
    if (values.recurring && values.recurringInfo) {
      // Validate frequency is a positive number
      if (
        values.recurringInfo.frequency &&
        parseInt(values.recurringInfo.frequency) <= 0
      ) {
        throw new Error("Recurring frequency must be a positive number");
      }

      // Validate selected days for weekly recurrence
      if (
        values.recurringInfo.period === "WEEKLY" &&
        (!values.recurringInfo.selectedDays ||
          values.recurringInfo.selectedDays.length === 0)
      ) {
        throw new Error(
          "Weekly recurring appointments must have at least one day selected",
        );
      }

      // Validate end date for "On Date" end type
      if (
        values.recurringInfo.endType === "On Date" &&
        values.recurringInfo.endValue
      ) {
        const endDate = new Date(values.recurringInfo.endValue);
        if (endDate <= new Date(startDateTime)) {
          throw new Error(
            "Recurring end date must be after the appointment start date",
          );
        }
      }
    }

    console.log("Date/Time values:", {
      startDate: values.startDate,
      startTime: values.startTime,
      endDate: values.endDate,
      endTime: values.endTime,
      calculatedStart: startDateTime,
      calculatedEnd: endDateTime,
      isRecurring: values.recurring,
      recurringInfo: values.recurringInfo,
    });

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

    const payload = {
      type: values.type || "APPOINTMENT",
      title:
        values.type === "event"
          ? values.eventName || "Event"
          : values.clientGroup
            ? `Appointment with ${clientName || "Client"}`
            : "New Appointment",
      is_all_day: values.allDay || false,
      start_date: startDateTime,
      end_date: endDateTime,
      location_id: values.location || "",
      client_group_id: values.clientGroup ? values.clientGroup : null,
      clinician_id: values.clinician || selectedResource || "",
      created_by: session?.user?.id || "",
      status: "SCHEDULED",
      is_recurring: values.recurring || false,
      recurring_rule: recurringRule,
      service_id: values.selectedServices?.[0]?.serviceId || null,
      appointment_fee: values.selectedServices?.[0]?.fee || null,
    };

    // Log the final payload for debugging
    console.log("Final appointment payload:", {
      ...payload,
      originalClientId: values.client,
      finalClientGroupId: payload.client_group_id,
      allFormValues: values,
    });

    // Validate required fields before sending
    if (!payload.location_id) {
      throw new Error("Location is required");
    }
    if (!payload.clinician_id) {
      throw new Error("Clinician is required");
    }

    return payload;
  };

  // Add debug log for initial events
  useEffect(() => {
    console.log("Initial events:", initialEvents);
  }, [initialEvents]);

  // Add debug log for events state changes
  useEffect(() => {
    console.log("Current events:", events);
  }, [events]);

  // Effect to fetch events
  useEffect(() => {
    async function fetchEventsForCurrentView() {
      if (!calendarRef.current) return;
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;
      const startDate = view.activeStart.toISOString().split("T")[0];
      const endDate = view.activeEnd.toISOString().split("T")[0];

      try {
        // Fetch appointments
        let appointmentUrl = `/api/appointment?startDate=${startDate}&endDate=${endDate}`;
        if (!isAdmin && selectedClinicians.length > 0) {
          appointmentUrl += `&clinicianId=${selectedClinicians[0]}`;
        }

        // Fetch availabilities
        let availabilityUrl = `/api/availability?startDate=${startDate}&endDate=${endDate}`;
        if (!isAdmin && selectedClinicians.length > 0) {
          availabilityUrl += `&clinicianId=${selectedClinicians[0]}`;
        }

        console.log("Fetching from URLs:", { appointmentUrl, availabilityUrl });

        // Fetch both appointments and availabilities in parallel
        const [appointmentsResponse, availabilitiesResponse] =
          await Promise.all([fetch(appointmentUrl), fetch(availabilityUrl)]);

        if (!appointmentsResponse.ok)
          throw new Error("Failed to fetch appointments");
        if (!availabilitiesResponse.ok)
          throw new Error("Failed to fetch availabilities");

        const [appointments, availabilities] = await Promise.all([
          appointmentsResponse.json(),
          availabilitiesResponse.json(),
        ]);

        console.log("Raw data received:", { appointments, availabilities });

        // Format appointments
        const formattedAppointments = appointments.map(
          (appointment: AppointmentData) => ({
            id: appointment.id,
            resourceId: appointment.clinician_id || "",
            title: appointment.title,
            start: appointment.start_date,
            end: appointment.end_date,
            location: appointment.location_id || "",
            extendedProps: {
              type: "appointment",
            },
          }),
        );

        // Format availabilities to match appointment pattern
        const formattedAvailabilities = availabilities.map(
          (availability: AvailabilityData) => {
            const event = {
              id: availability.id,
              resourceId: availability.clinician_id,
              title: availability.title || "Available",
              start: availability.start_date,
              end: availability.end_date,
              location: availability.location || "",
              extendedProps: {
                type: "availability",
                clinician_id: availability.clinician_id,
                allow_online_requests: availability.allow_online_requests,
                is_recurring: availability.is_recurring,
                recurring_rule: availability.recurring_rule,
              },
            };
            console.log("Formatted availability event:", event);
            return event;
          },
        );

        console.log("Setting events:", {
          availabilities: formattedAvailabilities,
          appointments: formattedAppointments,
        });

        // Set all events
        setEvents([...formattedAvailabilities, ...formattedAppointments]);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    }
    fetchEventsForCurrentView();
  }, [currentView, currentDate, selectedClinicians, isAdmin]);

  // Handle event click to view appointment details
  const handleEventClick = async (clickInfo: EventClickArg) => {
    console.log("Event clicked:", clickInfo.event);

    if (clickInfo.event.extendedProps?.type === "availability") {
      const availabilityId = clickInfo.event.id;
      console.log("Fetching availability:", availabilityId);

      try {
        const response = await fetch(`/api/availability?id=${availabilityId}`);
        if (!response.ok)
          throw new Error("Failed to fetch availability details");
        const availabilityData = await response.json();

        console.log("Availability data:", availabilityData);
        setSelectedAvailability(availabilityData);
        setShowAvailabilitySidebar(true);
      } catch (error) {
        console.error("Error fetching availability:", error);
      }
      return;
    }

    // Handle regular appointment click
    if (onEventClick) {
      onEventClick(clickInfo);
      return;
    }

    const appointmentId = clickInfo.event.id;
    const appointmentData = await fetchAppointmentDetails(appointmentId);

    if (appointmentData) {
      if (appointmentData.start_date) {
        setSelectedDate(new Date(appointmentData.start_date));
      }
      if (appointmentData.clinician_id) {
        setSelectedResource(appointmentData.clinician_id);
      }

      const eventData = {
        startTime: format(new Date(appointmentData.start_date), "h:mm a"),
        endTime: format(new Date(appointmentData.end_date), "h:mm a"),
      };

      window.sessionStorage.setItem(
        "selectedTimeSlot",
        JSON.stringify(eventData),
      );
      setSelectedAppointment(appointmentData);
      setIsEditDialogOpen(true);
    }
  };

  // Handle date selection to create a new appointment
  const handleDateSelect = (selectInfo: DateSelectArg) => {
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
            eventDisplay="block"
            eventOverlap={true}
            slotEventOverlap={true}
            eventDidMount={(info) => {
              const event = info.event;
              const type = event.extendedProps?.type;
              if (type === "availability") {
                const allowRequests =
                  event.extendedProps?.allow_online_requests;
                const isRecurring = event.extendedProps?.is_recurring;

                info.el.classList.add(styles.availabilitySlot);
                info.el.setAttribute(
                  "data-allow-requests",
                  String(!!allowRequests),
                );
                info.el.setAttribute("data-recurring", String(!!isRecurring));
              }
            }}
            eventContent={(arg) => {
              const type = arg.event.extendedProps?.type;
              if (type === "availability") {
                const start = arg.event.start;
                const startTime = start
                  ? new Date(start).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "";
                const title = arg.event.title || "Available";

                return (
                  <div className="p-1">
                    <div className={styles.availabilityTime}>{startTime}</div>
                    <div className={styles.availabilityTitle}>{title}</div>
                  </div>
                );
              }
              return (
                <div style={{ padding: "2px 4px" }}>{arg.event.title}</div>
              );
            }}
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

      <AvailabilitySidebar
        open={showAvailabilitySidebar}
        onOpenChange={setShowAvailabilitySidebar}
        selectedDate={
          selectedAvailability?.start_date
            ? new Date(selectedAvailability.start_date)
            : new Date()
        }
        selectedResource={selectedAvailability?.clinician_id || null}
        onClose={() => setShowAvailabilitySidebar(false)}
        availabilityData={selectedAvailability ?? undefined}
        isEditMode={!!selectedAvailability}
      />
    </div>
  );
}

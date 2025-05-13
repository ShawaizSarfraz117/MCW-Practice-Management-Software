"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventClickArg,
  DateSelectArg,
  EventMountArg,
} from "@fullcalendar/core";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { DayHeaderContentArg } from "@fullcalendar/core";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
import { ClientGroup } from "../appointment-dialog/types";
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  toast,
  useToast,
} from "@mcw/ui";

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
  const [appointmentLimits, setAppointmentLimits] = useState<
    Record<string, number | null>
  >({});
  const [addLimitDropdown, setAddLimitDropdown] = useState<{
    open: boolean;
    anchor: HTMLElement | null;
    date: Date | null;
  }>({ open: false, anchor: null, date: null });
  const addLimitDropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Add useToast hook
  const { toast: showToast } = useToast();
  const queryClient = useQueryClient();

  // Get session data to check if user is admin
  const { data: session } = useSession();
  const isAdmin = session?.user?.roles?.includes("ADMIN") || false;
  const userId = session?.user?.id;

  // Set the view based on user role
  const [currentView, setCurrentView] = useState(
    isAdmin ? "resourceTimeGridDay" : "timeGridDay",
  );
  const [currentDate, setCurrentDate] = useState(new Date());

  // Initialize selected clinicians based on user role
  const [selectedClinicians, setSelectedClinicians] = useState<string[]>([]);

  // Update selected clinicians when initialClinicians changes or when user is a clinician
  useEffect(() => {
    if (!isAdmin && userId) {
      // For non-admin users, find their clinician ID
      const userClinician = initialClinicians.find(
        (c: Clinician) => c.user_id === userId,
      );
      if (userClinician) {
        setSelectedClinicians([userClinician.value]);
      } else {
        console.error("No clinician found for user:", userId);
      }
    } else if (initialClinicians.length > 0) {
      // For admin users, select first two clinicians
      setSelectedClinicians(
        initialClinicians
          .slice(0, Math.min(2, initialClinicians.length))
          .map((c: Clinician) => c.value),
      );
    }
  }, [initialClinicians, isAdmin, userId]);

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
        return event.resourceId;
        return event.resourceId;
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
        const formattedAppointments = appointments.map(
          (
            appointment: AppointmentData & {
              isFirstAppointmentForGroup?: boolean;
            },
          ) => ({
            id: appointment.id,
            resourceId: appointment.clinician_id || "",
            title: appointment.title,
            start: appointment.start_date,
            end: appointment.end_date,
            location: appointment.location_id || "",
            extendedProps: {
              type: "appointment",
              isFirstAppointmentForGroup:
                appointment.isFirstAppointmentForGroup,
            },
          }),
        );

        // Update calendar events
        setEvents(formattedAppointments);
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

    try {
      // Handle events (no client group)
      if (values.type === "event") {
        return createAppointmentWithAPI(values);
      }

      // Handle appointments with client group
      if (values.clientGroup) {
        const response = await fetch(
          `/api/client/group?id=${values.clientGroup}`,
        );
        if (response.ok) {
          const clientGroupData = await response.json();
          const clientName = clientGroupData.name || "Client Group";
          return createAppointmentWithAPI(values, clientName);
        } else {
          console.error(
            "Failed to fetch client group data:",
            await response.text(),
          );
        }
      }

      // Handle appointments without client group
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
        // Handle appointment limit error
        if (errorData.error === "Appointment limit reached for this day.") {
          toast({
            title: "Appointment limit reached for this day",
            // description: "Please select at least one invoice to make a payment.",
            // variant: "destructive",
          });

          return [];
        }
        throw new Error(errorData.error || "Failed to create appointment");
      }

      const responseData = await response.json();

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
    console.log("payload", payload, clientName);

    // Validate required fields before sending
    if (!payload.location_id) {
      throw new Error("Location is required");
    }
    if (!payload.clinician_id) {
      throw new Error("Clinician is required");
    }

    return payload;
  };

  // Get the current date range from the calendar
  const getDateRange = () => {
    if (!calendarRef.current) return { startDate: "", endDate: "" };
    const calendarApi = calendarRef.current.getApi();
    const view = calendarApi.view;
    const startDate = view.activeStart.toISOString().split("T")[0];
    const endDate = view.activeEnd.toISOString().split("T")[0];
    return { startDate, endDate };
  };

  // Fetch events using React Query
  const { data: eventsData, isLoading: _isLoadingEvents } = useQuery({
    queryKey: [
      "calendarEvents",
      currentView,
      currentDate,
      selectedClinicians,
      isAdmin,
      isScheduledPage,
    ],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();

      // Construct URLs with parameters
      let appointmentUrl = `/api/appointment?startDate=${startDate}&endDate=${endDate}`;
      let availabilityUrl = `/api/availability?startDate=${startDate}&endDate=${endDate}`;

      if (!isAdmin && selectedClinicians.length > 0) {
        const clinicianId = selectedClinicians[0];
        appointmentUrl += `&clinicianId=${clinicianId}`;
        availabilityUrl += `&clinicianId=${clinicianId}`;
      }

      // Fetch both in parallel
      const [appointmentsResponse, availabilitiesResponse] = await Promise.all([
        fetch(appointmentUrl),
        fetch(availabilityUrl),
      ]);

      if (!appointmentsResponse.ok)
        throw new Error("Failed to fetch appointments");
      if (!availabilitiesResponse.ok)
        throw new Error("Failed to fetch availabilities");

      const [appointments, availabilities] = await Promise.all([
        appointmentsResponse.json(),
        availabilitiesResponse.json(),
      ]);

      // Format appointments
      const formattedAppointments = appointments.map(
        (
          appointment: AppointmentData & {
            isFirstAppointmentForGroup?: boolean;
          },
        ) => ({
          id: appointment.id,
          resourceId: appointment.clinician_id || "",
          title: appointment.title,
          start: appointment.start_date,
          end: appointment.end_date,
          location: appointment.location_id || "",
          extendedProps: {
            type: "appointment",
            isFirstAppointmentForGroup: appointment.isFirstAppointmentForGroup,
          },
        }),
      );

      // Format availabilities
      const formattedAvailabilities = availabilities.map(
        (availability: AvailabilityData) => {
          // Get the UTC dates from the API
          const utcStart = new Date(availability.start_date);
          const utcEnd = new Date(availability.end_date);

          // Convert to local time by adjusting for timezone offset
          const localStart = new Date(utcStart);
          const localEnd = new Date(utcEnd);

          // Adjust the hours to match local time
          localStart.setHours(utcStart.getUTCHours(), utcStart.getUTCMinutes());
          localEnd.setHours(utcEnd.getUTCHours(), utcEnd.getUTCMinutes());

          return {
            id: availability.id,
            resourceId: availability.clinician_id,
            title: availability.title || "Available",
            start: localStart,
            end: localEnd,
            location: availability.location || "",
            extendedProps: {
              type: "availability",
              clinician_id: availability.clinician_id,
              allow_online_requests: availability.allow_online_requests,
              is_recurring: availability.is_recurring,
              recurring_rule: availability.recurring_rule,
            },
          };
        },
      );

      return [...formattedAvailabilities, ...formattedAppointments];
    },
    enabled: !!calendarRef.current,
  });

  // Set events from query data when it changes
  useEffect(() => {
    if (eventsData) {
      setEvents(eventsData);
    }
  }, [eventsData]);

  // React Query for appointment limits
  const { data: limitsData } = useQuery({
    queryKey: [
      "appointmentLimits",
      currentView,
      currentDate,
      selectedClinicians,
      isScheduledPage,
    ],
    queryFn: async () => {
      if (
        !isScheduledPage ||
        selectedClinicians.length === 0 ||
        !calendarRef.current
      ) {
        return {};
      }

      const { startDate, endDate } = getDateRange();
      const clinicianId = selectedClinicians[0];

      // Get all dates in range
      const dates: string[] = [];
      const d = new Date(startDate);
      const end = new Date(endDate);
      while (d <= end) {
        dates.push(d.toISOString().split("T")[0]);
        d.setDate(d.getDate() + 1);
      }

      // Fetch all limits in parallel
      const results = await Promise.all(
        dates.map((date) =>
          fetch(
            `/api/appointment-limit?clinicianId=${clinicianId}&date=${date}`,
          )
            .then((res) => res.json())
            .then((data) => ({ date, limit: data.limit ?? null }))
            .catch(() => ({ date, limit: null })),
        ),
      );

      const limits: Record<string, number | null> = {};
      results.forEach(({ date, limit }) => {
        limits[date] = limit;
      });
      return limits;
    },
    enabled:
      isScheduledPage && selectedClinicians.length > 0 && !!calendarRef.current,
  });

  // Set appointment limits from query data when it changes
  useEffect(() => {
    if (limitsData) {
      setAppointmentLimits(limitsData);
    }
  }, [limitsData]);

  // Function to handle adding a limit
  function handleAddLimit(
    date: Date,
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    });
    setAddLimitDropdown({ open: true, anchor: event.currentTarget, date });
  }

  // Mutation for setting appointment limit
  const setLimitMutation = useMutation({
    mutationFn: async ({
      clinicianId,
      date,
      maxLimit,
    }: {
      clinicianId: string;
      date: string;
      maxLimit: number;
    }) => {
      const response = await fetch("/api/appointment-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinician_id: clinicianId,
          date,
          max_limit: maxLimit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to set limit");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Update the local state
      setAppointmentLimits((prev) => ({
        ...prev,
        [variables.date]: variables.maxLimit,
      }));

      // Invalidate the related query to refetch data
      queryClient.invalidateQueries({
        queryKey: ["appointmentLimits"],
      });
    },
    onError: (error) => {
      console.error("Error setting limit:", error);
      showToast({
        title: "Failed to set limit",
        variant: "destructive",
      });
    },
  });

  // Update only the selected date's limit
  async function handleSelectLimit(limit: number | null) {
    if (!addLimitDropdown.date || selectedClinicians.length === 0) {
      console.log("Missing date or clinician:", {
        date: addLimitDropdown.date,
        clinicians: selectedClinicians,
      });
      return;
    }

    const clinicianId = selectedClinicians[0];
    const date = addLimitDropdown.date.toISOString().split("T")[0];
    const apiLimit = limit === null ? 0 : limit;

    try {
      await setLimitMutation.mutateAsync({
        clinicianId,
        date,
        maxLimit: apiLimit,
      });
    } finally {
      setAddLimitDropdown({ open: false, anchor: null, date: null });
    }
  }

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        addLimitDropdown.open &&
        addLimitDropdownRef.current &&
        !addLimitDropdownRef.current.contains(event.target as Node)
      ) {
        setAddLimitDropdown({ open: false, anchor: null, date: null });
        setDropdownPosition(null);
      }
    }
    if (addLimitDropdown.open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [addLimitDropdown.open]);

  // Effect to handle availability refresh
  useEffect(() => {
    const handleAvailabilityRefresh = () => {
      // Invalidate the events query to refresh data
      queryClient.invalidateQueries({
        queryKey: ["calendarEvents"],
      });
    };

    window.addEventListener(
      "refreshAvailabilities",
      handleAvailabilityRefresh as EventListener,
    );

    return () => {
      window.removeEventListener(
        "refreshAvailabilities",
        handleAvailabilityRefresh as EventListener,
      );
    };
  }, [queryClient]);

  // Handle event click to view appointment details
  const handleEventClick = async (clickInfo: EventClickArg) => {
    if (clickInfo.event.extendedProps?.type === "availability") {
      const availabilityId = clickInfo.event.id;

      try {
        const response = await fetch(`/api/availability?id=${availabilityId}`);
        if (!response.ok)
          throw new Error("Failed to fetch availability details");
        const availabilityData = await response.json();

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

    // Format time in local timezone
    const formatTimeFromDate = (date: Date) => {
      // Create a new date to avoid modifying the original
      const localDate = new Date(date);

      // Get hours and minutes in local time
      const hours = localDate.getHours();
      const minutes = localDate.getMinutes();

      // Convert to 12-hour format
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;

      // Format the time string
      return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
    };

    // Save the selected time info for the appointment dialog
    const eventData = {
      startTime: formatTimeFromDate(selectInfo.start),
      endTime: formatTimeFromDate(selectInfo.end),
      // Store local hours and minutes
      startHour: selectInfo.start.getHours(),
      endHour: selectInfo.end.getHours(),
      startMinute: selectInfo.start.getMinutes(),
      endMinute: selectInfo.end.getMinutes(),
    };

    // Store this data to be accessed by the form
    window.sessionStorage.setItem(
      "selectedTimeSlot",
      JSON.stringify(eventData),
    );

    // Ensure dialog opens after time is stored
    setTimeout(() => {
      setIsDialogOpen(true);
    }, 0);
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

  // Format availabilities for business hours
  const businessHoursFromAvailability = useMemo(() => {
    const availabilityEvents = events.filter(
      (event): event is Event => event.extendedProps?.type === "availability",
    );

    return availabilityEvents.map((availability) => {
      const start = new Date(availability.start);
      const end = new Date(availability.end);
      return {
        daysOfWeek: [start.getDay()], // 0 = Sunday, 1 = Monday, etc.
        startTime: format(start, "HH:mm"),
        endTime: format(end, "HH:mm"),
      };
    });
  }, [events]);

  // Adjust events rendering on eventDidMount
  const eventDidMount = (info: EventMountArg) => {
    const event = info.event;
    const type = event.extendedProps?.type;

    if (type === "availability") {
      // Set classes for availability events to ensure visibility
      info.el.classList.add("bg-[#e6f3ff]", "opacity-80", "cursor-pointer");

      // For recurring availability, add a visual indicator
      if (event.extendedProps?.is_recurring) {
        const recurringSymbol = document.createElement("span");
        recurringSymbol.textContent = "↻"; // Unicode arrow for recurring
        recurringSymbol.classList.add(
          "absolute",
          "top-0",
          "right-0",
          "text-sm",
          "text-blue-500",
        );
        info.el.appendChild(recurringSymbol);
      }
    } else {
      // For regular events, set their styles accordingly
      info.el.classList.add("bg-gray-200", "cursor-pointer");
    }
  };

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

        <FullCalendar
          ref={calendarRef}
          allDaySlot={true}
          allDayText="All day"
          businessHours={businessHoursFromAvailability}
          dayHeaderContent={
            isScheduledPage
              ? (args: DayHeaderContentArg) => {
                  const dateStr = args.date.toISOString().split("T")[0];
                  const limit = appointmentLimits[dateStr];
                  const isDropdownOpen =
                    addLimitDropdown.open &&
                    addLimitDropdown.date &&
                    dropdownPosition &&
                    addLimitDropdown.date.toDateString() ===
                      args.date.toDateString();
                  let buttonText = "+ Appt Limit";
                  if (limit === 0) buttonText = "No Availability";
                  else if (limit !== undefined && limit !== null)
                    buttonText = `${limit} max appts`;
                  return (
                    <div className="flex flex-col items-center relative">
                      <span>{args.text}</span>
                      <Button
                        className="w-full text-[0.7rem] font-medium text-gray-700 mt-1 mb-1"
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleAddLimit(args.date, e)}
                      >
                        {buttonText}
                      </Button>
                      {isDropdownOpen && (
                        <Card
                          ref={addLimitDropdownRef}
                          className="fixed bg-white z-50 min-w-[170px] overflow-hidden p-0"
                          style={{
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                            transform: "translate(-50%, 0)",
                            marginTop: "4px",
                          }}
                        >
                          <CardHeader className="p-[10px_10px_6px_10px] border-b border-gray-100">
                            <div className="font-bold text-[0.6rem] text-gray-800">
                              Appt limit per day
                            </div>
                            <div className="font-medium text-[0.5rem] text-gray-400 mt-0.5">
                              {addLimitDropdown.date
                                ? `All ${addLimitDropdown.date.toLocaleDateString(undefined, { weekday: "long" })}s`
                                : ""}
                            </div>
                          </CardHeader>
                          <CardContent className="py-2 px-0 max-h-60 overflow-y-auto">
                            <div
                              className={`px-4 py-3 text-left cursor-pointer text-gray-800 font-bold text-[0.7rem] rounded-lg mx-2 mb-1 ${
                                appointmentLimits[dateStr] === 0
                                  ? "bg-gray-100"
                                  : ""
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("Selecting no limit");
                                handleSelectLimit(null);
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              No appt limit
                            </div>
                            {[...Array(20)].map((_, i: number) => {
                              const num = i + 1;
                              return (
                                <div
                                  key={num}
                                  className={`px-4 py-2.5 text-left cursor-pointer text-gray-800 font-medium text-[0.7rem] rounded-lg mx-2 mb-1 transition-colors ${
                                    appointmentLimits[dateStr] === num
                                      ? "bg-gray-100"
                                      : ""
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSelectLimit(num);
                                  }}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {num}
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  );
                }
              : undefined
          }
          dayHeaderFormat={{
            weekday: "short",
            month: "numeric",
            day: "numeric",
            omitCommas: true,
          }}
          eventClick={handleEventClick}
          eventContent={(arg) => {
            const type = arg.event.extendedProps?.type;
            const isFirstAppointment = arg.event.extendedProps
              ?.isFirstAppointmentForGroup as boolean | undefined;

            // Handle Availability events separately
            if (type === "availability") {
              const start = arg.event.start;
              const end = arg.event.end;
              const originalStartTime =
                arg.event.extendedProps?.originalStartTime;
              const originalEndTime = arg.event.extendedProps?.originalEndTime;

              // Use the original times or fallback to calculated times
              const startTime =
                originalStartTime || (start ? format(start, "h:mm a") : "");
              const endTime =
                originalEndTime || (end ? format(end, "h:mm a") : "");

              const title = arg.event.title || "Available";

              return (
                <div className="p-1 relative text-gray-800 shadow-sm rounded-sm">
                  <div className="text-xs font-medium text-gray-600 mb-0.5">
                    {startTime} - {endTime}
                  </div>
                  <div className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    {title}
                  </div>
                  <span className="absolute top-1 right-1 text-[10px] font-medium text-green-600/70 uppercase tracking-wider">
                    new
                  </span>
                </div>
              );
            }

            // Handle regular Appointment events
            const title = arg.event.title; // Or format as needed
            // Add badge based on isFirstAppointmentForGroup
            const badgeText =
              isFirstAppointment === true
                ? "New"
                : isFirstAppointment === false
                  ? ""
                  : null;
            const badgeColor =
              isFirstAppointment === true
                ? "bg-green-100 text-green-800"
                : isFirstAppointment === false
                  ? "bg-blue-100 text-blue-800"
                  : "";

            return (
              <div className="p-1 flex flex-col h-full relative">
                {/* You might want to add time or other info here */}
                <div className="text-sm font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis mb-1 flex-grow">
                  {title}
                </div>
                {badgeText && (
                  <span
                    className={`absolute top-1.5 right-1.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${badgeColor}`}
                  >
                    {badgeText}
                  </span>
                )}
              </div>
            );
          }}
          // eventDidMount={(info) => {
          //   const event = info.event;
          //   const type = event.extendedProps?.type;

          //   // Handle availability events
          //   if (type === "availability") {
          //     const allowRequests = event.extendedProps?.allow_online_requests;
          //     const isRecurring = event.extendedProps?.is_recurring;

          //     // Apply Tailwind equivalent classes directly
          //     info.el.classList.add(
          //       "bg-white",
          //       "border",
          //       "border-gray-200",
          //       "opacity-85",
          //       "cursor-pointer",
          //       "pointer-events-auto",
          //       "z-10",
          //       "relative",
          //       "pl-4",
          //       "shadow-sm",
          //       "rounded-sm"
          //     );

          //     // Create the colored bar for the left side
          //     const leftBar = document.createElement("div");
          //     leftBar.classList.add(
          //       "absolute",
          //       "left-0",
          //       "top-0",
          //       "bottom-0",
          //       "w-1",
          //     );

          //     // Set the color based on allowRequests
          //     if (allowRequests) {
          //       leftBar.classList.add("bg-green-500");
          //     } else {
          //       leftBar.classList.add("bg-red-500");
          //     }

          //     info.el.appendChild(leftBar);

          //     // Add recurring symbol if needed
          //     if (isRecurring) {
          //       const recurringSymbol = document.createElement("div");
          //       recurringSymbol.classList.add(
          //         "absolute",
          //         "top-1",
          //         "right-1",
          //         "text-xs",
          //         "text-gray-500",
          //       );
          //       recurringSymbol.textContent = "↻";
          //       info.el.appendChild(recurringSymbol);
          //     }

          //     // Apply hover effect
          //     info.el.addEventListener("mouseenter", () => {
          //       info.el.classList.replace("opacity-85", "opacity-100");
          //     });

          //     info.el.addEventListener("mouseleave", () => {
          //       info.el.classList.replace("opacity-100", "opacity-85");
          //     });
          //   }
          // }}
          // initialView="timeGridDay"
          eventDisplay="block"
          eventOverlap={true}
          events={filteredEvents}
          headerToolbar={false}
          eventDidMount={eventDidMount}
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
          slotEventOverlap={true}
          slotMaxTime="24:00:00"
          slotMinTime="00:00:00"
          timeZone="local"
          displayEventTime={true}
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
            hour12: true,
          }}
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
            hour12: true,
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
              resourceOrder: "title",
              resourceAreaWidth: "150px",
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
        availabilityData={selectedAvailability ?? undefined}
        isEditMode={!!selectedAvailability}
        open={showAvailabilitySidebar}
        selectedDate={
          selectedAvailability?.start_date
            ? new Date(selectedAvailability.start_date)
            : new Date()
        }
        selectedResource={selectedAvailability?.clinician_id || null}
        onClose={() => setShowAvailabilitySidebar(false)}
        onOpenChange={setShowAvailabilitySidebar}
      />
    </div>
  );
}

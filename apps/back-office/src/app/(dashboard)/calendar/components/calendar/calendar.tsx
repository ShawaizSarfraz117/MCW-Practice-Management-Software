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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { AppointmentDialog } from "../AppointmentDialog";
import { CalendarToolbar } from "./components/CalendarToolbar";
import { useAppointmentHandler } from "./hooks/useAppointmentHandler";
import { getHeaderDateFormat } from "./utils/date-utils";
import {
  CalendarViewProps,
  CalendarEvent,
  Clinician,
  Location,
  AppointmentData,
  AvailabilityData,
  EventApiWithResourceIds,
} from "./types";
import { EditAppointmentDialog } from "../EditAppointmentDialog";
import { AvailabilitySidebar } from "../availability/AvailabilitySidebar";
import { ClientGroup } from "../appointment-dialog/types";
import { IntakeForm } from "../intake/IntakeForm";
import { AppointmentTagName } from "@/types/entities/appointment";
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
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
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
    clinicianId?: string | null;
  }>({ open: false, anchor: null, date: null, clinicianId: null });
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

  // Set the view based on user role and page type
  const [currentView, setCurrentView] = useState(
    isScheduledPage ? "resourceTimeGridDay" : "timeGridDay",
  );
  const [currentDate, setCurrentDate] = useState(new Date());

  // Update events when initialEvents changes (for reactive updates)
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

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

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  // Intake form state
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [intakeClientData, setIntakeClientData] = useState<{
    clientName: string;
    clientEmail: string;
    clientId: string;
    clientGroupId: string;
    appointmentDate?: Date | string;
    appointmentTime?: string;
    clinicianName?: string;
    locationName?: string;
    appointmentId?: string;
  } | null>(null);

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
      // On calendar page, show both appointments and availabilities
      return true;
    });

    // Then filter by location and clinician
    filtered = filtered.filter((event) => {
      // For availability events, only check clinician
      if (event.extendedProps?.type === "availability") {
        // Availabilities use resourceId for clinician, not location
        const resourceId =
          event.resourceId ||
          (event as unknown as EventApiWithResourceIds)._def?.resourceIds?.[0];

        // If we have selected clinicians, filter by them
        if (selectedClinicians.length > 0) {
          return resourceId && selectedClinicians.includes(resourceId);
        }
        // Otherwise show all availabilities
        return true;
      }
      // For regular events, filter by location
      return event.location && selectedLocations.includes(event.location);
    });

    // For non-admin users, only show events related to their clinician ID
    if (!isAdmin && selectedClinicians.length > 0) {
      filtered = filtered.filter((event) => {
        const resourceId = (event as unknown as EventApiWithResourceIds)._def
          ?.resourceIds?.[0];
        return resourceId && selectedClinicians.includes(resourceId);
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
              AppointmentTag?: Array<{
                Tag: { name: string };
              }>;
              Invoice?: Array<{ id: string; status: string }>;
            },
          ) => ({
            id: appointment.id,
            resourceId: appointment.clinician_id || "",
            title: appointment.title,
            start: appointment.start_date,
            end: appointment.end_date,
            location: appointment.location_id || "",
            extendedProps: {
              type: "appointment" as const,
              isFirstAppointmentForGroup:
                appointment.isFirstAppointmentForGroup,
              appointmentTags: appointment.AppointmentTag || [],
              hasInvoice: appointment.Invoice && appointment.Invoice.length > 0,
              invoices: appointment.Invoice || [],
            },
          }),
        );

        // Update calendar events - PRESERVE AVAILABILITIES
        setEvents((prevEvents) => {
          // Keep all availability events
          const availabilities = prevEvents.filter(
            (event) => event.extendedProps?.type === "availability",
          );
          // Combine with new appointments
          return [...availabilities, ...formattedAppointments];
        });
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
    window.addEventListener(
      "appointmentTagsUpdated",
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
      window.removeEventListener(
        "appointmentTagsUpdated",
        handleAppointmentDelete as EventListener,
      );
    };
  }, [calendarRef, isAdmin, selectedClinicians]);

  // Handle appointment dialog closing and form submission
  const handleAppointmentSubmit = async () => {
    try {
      // Process the appointment submission and update the calendar
      const newEvents = await handleCreateAppointment();
      if (newEvents?.length > 0) {
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
        if (typeof values.clientGroup === "object" && values.clientGroup.name) {
          return createAppointmentWithAPI(values, values.clientGroup.name);
        }

        const clientGroupId =
          typeof values.clientGroup === "object"
            ? values.clientGroup.id
            : values.clientGroup;

        const response = await fetch(`/api/client/group?id=${clientGroupId}`);
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

  // Helper function to get client email
  const getClientEmail = async (clientId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/client/contact?clientId=${clientId}`);
      if (response.ok) {
        const result = await response.json();
        const contacts = result.data || []; // Extract the data array

        // Find email contact - try primary first, then any email
        const emailContact =
          contacts.find(
            (c: { contact_type: string; is_primary: boolean; value: string }) =>
              (c.contact_type === "EMAIL" || c.contact_type === "email") &&
              c.is_primary,
          ) ||
          contacts.find(
            (c: { contact_type: string; value: string }) =>
              c.contact_type === "EMAIL" || c.contact_type === "email",
          );

        return emailContact?.value || null;
      }
    } catch (error) {
      console.error("Error fetching client email:", error);
    }
    return null;
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

      console.log("Created appointments:", appointments);
      console.log("First appointment tags:", appointments[0]?.AppointmentTag);

      // Log the actual structure to debug
      if (appointments[0]?.AppointmentTag?.length > 0) {
        console.log(
          "Tag structure:",
          JSON.stringify(appointments[0].AppointmentTag[0], null, 2),
        );
      }

      // Check the first appointment (main appointment for recurring) for "New Client" tag
      const firstAppointment = appointments[0];
      console.log("First appointment:", firstAppointment);
      const hasNewClientTag = firstAppointment?.AppointmentTag?.some(
        (tag: { Tag?: { name?: string } }) => {
          console.log("Checking tag:", tag);
          console.log("Tag name:", tag.Tag?.name);
          console.log("Expected name:", AppointmentTagName.NEW_CLIENT);
          return tag.Tag?.name === AppointmentTagName.NEW_CLIENT;
        },
      );

      // If it's a new client appointment, show the intake form
      if (hasNewClientTag && firstAppointment) {
        const clientGroup = firstAppointment.ClientGroup;

        if (clientGroup?.ClientGroupMembership?.length > 0) {
          const firstMember = clientGroup.ClientGroupMembership[0];
          const client = firstMember.Client;

          if (client) {
            // Get client email from contacts
            const clientEmail = await getClientEmail(client.id);

            setIntakeClientData({
              clientName: `${client.legal_first_name} ${client.legal_last_name}`,
              clientEmail: clientEmail || "",
              clientId: client.id,
              clientGroupId: clientGroup.id,
              appointmentDate: firstAppointment.start_date,
              appointmentTime: new Date(
                firstAppointment.start_date,
              ).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
              clinicianName:
                firstAppointment.Clinician?.legal_first_name &&
                firstAppointment.Clinician?.legal_last_name
                  ? `${firstAppointment.Clinician.legal_first_name} ${firstAppointment.Clinician.legal_last_name}`
                  : "Your Provider",
              locationName: firstAppointment.Location?.name || "Our Office",
              appointmentId: firstAppointment.id,
            });
            console.log("Setting intake form to show with data:", {
              clientName: `${client.legal_first_name} ${client.legal_last_name}`,
              clientEmail: clientEmail || "",
            });
            setShowIntakeForm(true);
          }
        } else {
          console.log("No client group or membership found");
        }
      }

      // Format events for calendar
      const formattedEvents = appointments.map((appointment) => ({
        id: appointment.id,
        resourceId: appointment.clinician_id || "",
        title: appointment.title,
        start: appointment.start_date,
        end: appointment.end_date,
        location: appointment.location_id || "",
        extendedProps: {
          type: "appointment" as const,
          appointmentTags: appointment.AppointmentTag || [],
          hasInvoice: appointment.Invoice && appointment.Invoice.length > 0,
          invoices: appointment.Invoice || [],
        },
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

      // Validate time string format - handle both 12-hour and 24-hour formats
      const time12Regex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i;
      const time24Regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

      if (!time12Regex.test(timeStr) && !time24Regex.test(timeStr)) {
        console.error("Invalid time string format:", timeStr);
        throw new Error(
          `Invalid time format. Expected "HH:MM" or "HH:MM AM/PM", got "${timeStr}"`,
        );
      }

      let hours24: number, minutes: number;

      if (time12Regex.test(timeStr)) {
        // 12-hour format
        const [timeValue, period] = timeStr.split(" ");
        const [hours, mins] = timeValue.split(":").map(Number);
        hours24 = hours;
        minutes = mins;

        // Convert 12-hour format to 24-hour
        if (period.toUpperCase() === "PM" && hours !== 12) hours24 += 12;
        if (period.toUpperCase() === "AM" && hours === 12) hours24 = 0;
      } else {
        // 24-hour format
        const [hours, mins] = timeStr.split(":").map(Number);
        hours24 = hours;
        minutes = mins;
      }

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
        const dayOrder = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
        const sortedDays = [...values.recurringInfo.selectedDays].sort(
          (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b),
        );
        parts.push(`BYDAY=${sortedDays.join(",")}`);
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

    // Ensure we have a valid user ID for created_by
    if (!session?.user?.id) {
      throw new Error("User session not found. Please log in again.");
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
      client_group_id: values.clientGroup
        ? typeof values.clientGroup === "object"
          ? values.clientGroup.id
          : values.clientGroup
        : null,
      clinician_id: values.clinician || selectedResource || "",
      created_by: session.user.id,
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
            AppointmentTag?: Array<{
              Tag: { name: string };
            }>;
            Invoice?: Array<{ id: string; status: string }>;
          },
        ) => ({
          id: appointment.id,
          resourceId: appointment.clinician_id || "",
          title: appointment.title,
          start: appointment.start_date,
          end: appointment.end_date,
          location: appointment.location_id || "",
          extendedProps: {
            type: "appointment" as const,
            isFirstAppointmentForGroup: appointment.isFirstAppointmentForGroup,
            appointmentTags: appointment.AppointmentTag || [],
            hasInvoice: appointment.Invoice && appointment.Invoice.length > 0,
            invoices: appointment.Invoice || [],
          },
        }),
      );

      // Format availabilities
      const formattedAvailabilities = availabilities.map(
        (availability: AvailabilityData) => ({
          id: availability.id,
          resourceId: availability.clinician_id,
          title: availability.title || "Available",
          start: availability.start_date,
          end: availability.end_date,
          location: availability.location || "",
          extendedProps: {
            type: "availability" as const,
            clinician_id: availability.clinician_id,
            allow_online_requests: availability.allow_online_requests,
            is_recurring: availability.is_recurring,
            recurring_rule: availability.recurring_rule,
            clinician: availability.Clinician,
          },
        }),
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
        (selectedClinicians.length === 0 && initialClinicians.length === 0) ||
        !calendarRef.current
      ) {
        return {};
      }

      const { startDate, endDate } = getDateRange();

      // Check if we have valid dates
      if (!startDate || !endDate) {
        return {};
      }

      // Get clinicians to fetch limits for
      const cliniciansToFetch =
        selectedClinicians.length > 0
          ? selectedClinicians
          : initialClinicians.slice(0, 3).map((c) => c.value);

      // Get all dates in range
      const dates: string[] = [];
      const d = new Date(startDate);
      const end = new Date(endDate);
      while (d <= end) {
        dates.push(d.toISOString().split("T")[0]);
        d.setDate(d.getDate() + 1);
      }

      // Fetch all limits for all clinicians and dates in parallel
      const fetchPromises: Promise<{
        clinicianId: string;
        date: string;
        limit: number | null;
      }>[] = [];

      cliniciansToFetch.forEach((clinicianId) => {
        dates.forEach((date) => {
          fetchPromises.push(
            fetch(
              `/api/appointment-limit?clinicianId=${clinicianId}&date=${date}`,
            )
              .then((res) => res.json())
              .then((data) => ({
                clinicianId,
                date,
                limit: data.limit ?? null,
              }))
              .catch(() => ({ clinicianId, date, limit: null })),
          );
        });
      });

      const results = await Promise.all(fetchPromises);

      const limits: Record<string, number | null> = {};
      results.forEach(({ clinicianId, date, limit }) => {
        const limitKey = `${clinicianId}-${date}`;
        limits[limitKey] = limit;
      });
      return limits;
    },
    enabled:
      isScheduledPage &&
      (selectedClinicians.length > 0 || initialClinicians.length > 0),
  });

  // Set appointment limits from query data when it changes
  useEffect(() => {
    if (limitsData) {
      setAppointmentLimits(limitsData);
    }
  }, [limitsData]);

  // Function to handle adding a limit for specific clinician
  function handleAddLimitForClinician(
    date: Date,
    clinicianId: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    });
    setAddLimitDropdown({
      open: true,
      anchor: event.currentTarget,
      date,
      clinicianId,
    });
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
      // Update the local state with the correct key format
      const limitKey = `${variables.clinicianId}-${variables.date}`;
      setAppointmentLimits((prev) => ({
        ...prev,
        [limitKey]: variables.maxLimit,
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

  // Update limit for specific clinician
  async function handleSelectLimitForClinician(
    limit: number | null,
    targetClinicianId: string,
  ) {
    if (!addLimitDropdown.date || !targetClinicianId) {
      console.log("Missing date or clinician for limit:", {
        date: addLimitDropdown.date,
        clinicianId: targetClinicianId,
      });
      return;
    }

    // Use local date to ensure consistency
    const year = addLimitDropdown.date.getFullYear();
    const month = String(addLimitDropdown.date.getMonth() + 1).padStart(2, "0");
    const day = String(addLimitDropdown.date.getDate()).padStart(2, "0");
    const date = `${year}-${month}-${day}`;
    const apiLimit = limit === null ? 0 : limit;

    try {
      await setLimitMutation.mutateAsync({
        clinicianId: targetClinicianId,
        date,
        maxLimit: apiLimit,
      });

      // Update the local state with clinician-specific key
      const limitKey = `${targetClinicianId}-${date}`;
      setAppointmentLimits((prev) => ({
        ...prev,
        [limitKey]: apiLimit,
      }));
    } finally {
      setAddLimitDropdown({
        open: false,
        anchor: null,
        date: null,
        clinicianId: null,
      });
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
        setAddLimitDropdown({
          open: false,
          anchor: null,
          date: null,
          clinicianId: null,
        });
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
    const handleAvailabilityRefresh = async () => {
      // Invalidate and refetch all calendar events queries to refresh data
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "calendarEvents",
      });

      // Force refetch to ensure immediate update
      await queryClient.refetchQueries({
        predicate: (query) => query.queryKey[0] === "calendarEvents",
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
      if (isScheduledPage) {
        // On scheduled page, open availability sidebar
        const availabilityId = clickInfo.event.id;
        try {
          const response = await fetch(
            `/api/availability?id=${availabilityId}`,
          );
          if (!response.ok)
            throw new Error("Failed to fetch availability details");
          const availabilityData = await response.json();

          setSelectedAvailability(availabilityData);
          setShowAvailabilitySidebar(true);
        } catch (error) {
          console.error("Error fetching availability:", error);
        }
      } else {
        // On calendar page, open appointment dialog
        setSelectedDate(clickInfo.event.start || new Date());
        setSelectedResource(
          clickInfo.event.extendedProps?.clinician_id || null,
        );

        // Set up the time slot information
        const startTime = format(clickInfo.event.start || new Date(), "h:mm a");
        const endTime = format(clickInfo.event.end || new Date(), "h:mm a");

        const eventData = {
          startTime,
          endTime,
          startDate:
            clickInfo.event.start?.toISOString() || new Date().toISOString(),
          endDate:
            clickInfo.event.end?.toISOString() || new Date().toISOString(),
        };

        window.sessionStorage.setItem(
          "selectedTimeSlot",
          JSON.stringify(eventData),
        );
        setIsDialogOpen(true);
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

    // Get the local time by adjusting for timezone
    const adjustForTimezone = (date: Date) => {
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() + userTimezoneOffset);
    };

    const localStart = adjustForTimezone(selectInfo.start);
    const localEnd = adjustForTimezone(selectInfo.end);

    // Format the times in local timezone
    const startTime = format(localStart, "h:mm a"); // 12-hour format
    const endTime = format(localEnd, "h:mm a"); // 12-hour format

    // Save the selected time info for the appointment dialog
    const eventData = {
      startTime,
      endTime,
      startDate: localStart.toISOString(),
      endDate: localEnd.toISOString(),
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
    // Close any open dropdowns when view changes
    setAddLimitDropdown({
      open: false,
      anchor: null,
      date: null,
      clinicianId: null,
    });
    setDropdownPosition(null);

    // On scheduled page, use resource view only for day view
    if (isScheduledPage) {
      if (newView === "timeGridDay") {
        newView = "resourceTimeGridDay";
      }
      // Keep week view as regular timeGridWeek (no resource view)
    } else {
      // On regular calendar page, non-admin users don't use resource views
      if (!isAdmin && newView.startsWith("resourceTimeGrid")) {
        newView = newView.replace("resourceTimeGrid", "timeGrid");
      }
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
  const resources = useMemo(() => {
    return initialClinicians
      .filter((clinician: Clinician) =>
        selectedClinicians.includes(clinician.value),
      )
      .map((clinician: Clinician) => ({
        id: clinician.value,
        title: clinician.label,
      }));
  }, [initialClinicians, selectedClinicians]);

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
          isScheduledPage={isScheduledPage}
          selectedClinicians={selectedClinicians}
          selectedLocations={selectedLocations}
          setSelectedClinicians={setSelectedClinicians}
          setSelectedLocations={setSelectedLocations}
        />

        <FullCalendar
          ref={calendarRef}
          allDaySlot={true}
          allDayText="All day"
          dayHeaderContent={(args) => {
            const date = args.date;
            const weekday = date.toLocaleDateString("en-US", {
              weekday: "short",
            });
            const month = date.getMonth() + 1;
            const day = date.getDate();
            return (
              <div className="text-center">
                <div className="font-medium">
                  {weekday} {month}/{day}
                </div>
              </div>
            );
          }}
          eventClick={handleEventClick}
          eventContent={(arg) => {
            const type = arg.event.extendedProps?.type;
            const _isFirstAppointment = arg.event.extendedProps
              ?.isFirstAppointmentForGroup as boolean | undefined;
            const appointmentTags = (arg.event.extendedProps?.appointmentTags ||
              []) as Array<{
              Tag: { name: string };
            }>;
            const _hasInvoice = arg.event.extendedProps?.hasInvoice as
              | boolean
              | undefined;
            const _invoices = (arg.event.extendedProps?.invoices ||
              []) as Array<{
              id: string;
              status: string;
            }>;

            // Check if current view is a week view
            const isWeekView = currentView.includes("Week");

            // Handle Availability events separately
            if (type === "availability") {
              const _title = arg.event.title || "Available";
              const startTime = arg.timeText;

              // Get clinician initials for week view
              const getClinicianInitials = () => {
                const clinician = arg.event.extendedProps?.clinician;
                if (clinician?.first_name && clinician?.last_name) {
                  return `${clinician.first_name.charAt(0)}${clinician.last_name.charAt(0)}`.toUpperCase();
                }
                const resourceId = (
                  arg.event as unknown as EventApiWithResourceIds
                )._def?.resourceIds?.[0];
                const clinicianResource = resources.find(
                  (r) => r.id === resourceId,
                );
                if (clinicianResource) {
                  const nameParts = clinicianResource.title.split(" ");
                  if (nameParts.length >= 2) {
                    return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
                  }
                }
                return "AN"; // Default fallback
              };

              // Different display for calendar vs scheduled page
              if (isScheduledPage) {
                // Full display on scheduled page with initials in week view (only for admins)
                if (isWeekView) {
                  return (
                    <div className="px-3 py-2 flex flex-col h-full">
                      <div className="text-xs text-gray-600 mb-1">
                        {startTime}
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {isAdmin ? `${getClinicianInitials()}: ` : ""}
                        Availability
                      </div>
                    </div>
                  );
                } else {
                  // Day view - no initials, Month view - with initials (only for admins)
                  const isDayView = currentView.includes("Day");
                  return (
                    <div className="px-3 py-2 flex flex-col h-full">
                      <div className="text-xs text-gray-600 mb-1">
                        {startTime}
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {isDayView
                          ? "Availability"
                          : isAdmin
                            ? `${getClinicianInitials()}: Availability`
                            : "Availability"}
                      </div>
                    </div>
                  );
                }
              } else {
                // Only dotted line on calendar page - no time display
                return (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "relative",
                    }}
                  >
                    <div
                      className="availability-dotted-line"
                      data-event-end={arg.event.end?.toISOString()}
                      data-event-id={arg.event.id}
                      data-event-resource={
                        (arg.event as unknown as EventApiWithResourceIds)._def
                          ?.resourceIds?.[0]
                      }
                      data-event-start={arg.event.start?.toISOString()}
                      data-event-time={arg.timeText}
                      data-event-title={arg.event.title}
                      style={{
                        width: "12px",
                        height: "100%",
                        borderLeft: "3px dotted #3B82F6",
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        minHeight: "20px",
                        position: "absolute",
                        left: "0",
                        top: "0",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                );
              }
            }

            // Handle regular Appointment events
            const title = arg.event.title; // Or format as needed
            const startTime = arg.timeText; // This contains the formatted start time

            return (
              <div className="p-1 flex flex-col h-full relative">
                {/* Start time above title */}
                <div className="text-xs text-gray-600 mb-0.5">{startTime}</div>

                <div className="flex h-full">
                  {/* Title on the left */}
                  <div className="text-sm font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis flex-grow pr-2">
                    {title}
                  </div>

                  {/* Tags and icons on the right - only show if NOT week view */}
                  {!isWeekView && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {appointmentTags.map((appointmentTag, index: number) => {
                        const tag = appointmentTag.Tag;
                        const tagName = tag.name;

                        // Define tag styling based on tag name
                        let tagStyle = "";
                        let tagText = "";

                        switch (tagName) {
                          case "Appointment Paid":
                            tagStyle = "bg-green-500 text-white";
                            tagText = "✓ Paid";
                            break;
                          case "Appointment Unpaid":
                            tagStyle = "bg-gray-500 text-white";
                            tagText = "Unpaid";
                            break;
                          case "New Client":
                            tagStyle =
                              "bg-green-100 text-green-800 border border-green-300";
                            tagText = "New";
                            break;
                          case "No Note":
                            tagStyle = "bg-gray-200 text-gray-700";
                            tagText = "No Note";
                            break;
                          case "Note Added":
                            return null;
                          default:
                            tagStyle =
                              "bg-gray-100 text-gray-800 border border-gray-200";
                            tagText = tagName;
                        }

                        return (
                          <span
                            key={index}
                            className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full ${tagStyle}`}
                            style={{ fontSize: "9px" }}
                          >
                            {tagText}
                          </span>
                        );
                      })}

                      {/* Show document icon if there are notes */}
                      {appointmentTags.some(
                        (at) => at.Tag.name === "Note Added",
                      ) && (
                        <div className="flex items-center">
                          <svg
                            className="text-gray-600"
                            fill="currentColor"
                            height="12"
                            viewBox="0 0 16 16"
                            width="12"
                          >
                            <path d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
                            <path d="M5 5h6v1H5V5zm0 2h6v1H5V7zm0 2h4v1H5V9z" />
                          </svg>
                          <svg
                            className="text-green-600 ml-1"
                            fill="currentColor"
                            height="12"
                            viewBox="0 0 16 16"
                            width="12"
                          >
                            <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }}
          eventDidMount={(info) => {
            const event = info.event;
            const type = event.extendedProps?.type;

            // Add cursor pointer for all events except appointment limits
            if (type !== "appointmentLimit") {
              info.el.classList.add("cursor-pointer");
            }

            if (type === "availability") {
              const allowRequests = event.extendedProps?.allow_online_requests;
              const _isRecurring = event.extendedProps?.is_recurring;

              // Different styling based on page type
              if (isScheduledPage) {
                // On scheduled page, show with background
                info.el.classList.add(
                  "bg-[#2d84671a]",
                  "border-0",
                  "opacity-85",
                  "pointer-events-auto",
                  "z-10",
                  "relative",
                  "pl-4",
                );

                // Create the colored bar for the left side
                const leftBar = document.createElement("div");
                leftBar.classList.add(
                  "absolute",
                  "left-0",
                  "top-0",
                  "bottom-0",
                  "w-1",
                );

                // Set the color based on allowRequests
                if (allowRequests) {
                  leftBar.classList.add("bg-green-500");
                } else {
                  leftBar.classList.add("bg-red-500");
                }

                info.el.appendChild(leftBar);

                // Remove recurring symbol - commented out as requested
                // if (isRecurring) {
                //   const recurringSymbol = document.createElement("div");
                //   recurringSymbol.classList.add(
                //     "absolute",
                //     "top-1",
                //     "right-1",
                //     "text-xs",
                //     "text-gray-500",
                //   );
                //   recurringSymbol.textContent = "↻";
                //   info.el.appendChild(recurringSymbol);
                // }

                // Apply hover effect
                info.el.addEventListener("mouseenter", () => {
                  info.el.classList.replace("opacity-85", "opacity-100");
                });

                info.el.addEventListener("mouseleave", () => {
                  info.el.classList.replace("opacity-100", "opacity-85");
                });
              } else {
                // On calendar page, minimal styling - transparent background
                info.el.style.setProperty(
                  "background-color",
                  "transparent",
                  "important",
                );
                info.el.style.setProperty("border", "none", "important");
                info.el.style.setProperty("box-shadow", "none", "important");
                info.el.classList.add("availability-event-calendar");

                // Set a data attribute to identify this event
                info.el.setAttribute("data-event-type", "availability");

                // Remove all inner styling
                const allInnerElements = info.el.querySelectorAll("*");
                allInnerElements.forEach((el) => {
                  if (el instanceof HTMLElement) {
                    el.style.setProperty(
                      "background-color",
                      "transparent",
                      "important",
                    );
                    el.style.setProperty(
                      "background",
                      "transparent",
                      "important",
                    );
                    el.style.setProperty("border", "none", "important");
                  }
                });

                // Create tooltip element for hover
                let tooltip: HTMLDivElement | null = null;

                // Simple hover handlers directly on the event element
                info.el.addEventListener("mouseenter", () => {
                  // Remove any existing tooltip
                  if (tooltip?.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                  }

                  // Create and show tooltip
                  tooltip = document.createElement("div");
                  tooltip.style.cssText = `
                    position: fixed;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 12px 16px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    min-width: 220px;
                    z-index: 99999;
                    pointer-events: none;
                  `;

                  // Get event details
                  // Format the times from the event dates
                  let startTime = "";
                  let endTime = "";

                  // First try to get the time from the data attribute we set
                  const availabilityElement = info.el.querySelector(
                    ".availability-dotted-line",
                  );
                  const eventTimeData =
                    availabilityElement?.getAttribute("data-event-time");

                  if (eventTimeData) {
                    // Use the pre-formatted time from FullCalendar
                    const times = eventTimeData.split(" - ");
                    if (times.length === 2) {
                      startTime = times[0]
                        .replace("a", " AM")
                        .replace("p", " PM");
                      endTime = times[1]
                        .replace("a", " AM")
                        .replace("p", " PM");
                    } else {
                      startTime = eventTimeData
                        .replace("a", " AM")
                        .replace("p", " PM");
                      endTime = "";
                    }
                  } else {
                    // Try to get from time element
                    const timeTextElement =
                      info.el.querySelector(".fc-event-time");
                    if (timeTextElement?.textContent) {
                      const timeText = timeTextElement.textContent;
                      const times = timeText.split(" - ");
                      if (times.length === 2) {
                        startTime = times[0]
                          .replace("a", " AM")
                          .replace("p", " PM");
                        endTime = times[1]
                          .replace("a", " AM")
                          .replace("p", " PM");
                      } else {
                        startTime = timeText
                          .replace("a", " AM")
                          .replace("p", " PM");
                        endTime = "";
                      }
                    } else {
                      // Last fallback - format the dates
                      if (event.start && event.end) {
                        const startDate =
                          typeof event.start === "string"
                            ? new Date(event.start)
                            : event.start;
                        const endDate =
                          typeof event.end === "string"
                            ? new Date(event.end)
                            : event.end;
                        startTime = format(startDate, "h:mm a");
                        endTime = format(endDate, "h:mm a");
                      } else {
                        startTime = "Time not available";
                        endTime = "";
                      }
                    }
                  }
                  const title = event.title || "Availability";

                  // Get clinician name from event extended props or resources
                  let clinicianName = "Unknown";
                  if (event.extendedProps?.clinician) {
                    // If clinician data is in extended props
                    const clinician = event.extendedProps.clinician;
                    clinicianName = `${clinician.first_name} ${clinician.last_name}`;
                  } else {
                    // Fallback to finding in resources
                    const resourceId = (
                      event as unknown as EventApiWithResourceIds
                    )._def?.resourceIds?.[0];
                    const clinicianResource = resources.find(
                      (r) => r.id === resourceId,
                    );
                    clinicianName = clinicianResource
                      ? clinicianResource.title
                      : "Unknown";
                  }

                  tooltip.innerHTML = `
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                      ${endTime ? `${startTime} - ${endTime}` : startTime}
                    </div>
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #111827;">
                      ${title}
                    </div>
                    ${
                      isAdmin
                        ? `<div style="color: #6b7280; font-size: 13px;">
                      ${clinicianName}
                    </div>`
                        : ""
                    }
                  `;

                  document.body.appendChild(tooltip);

                  // Position the tooltip
                  const rect = info.el.getBoundingClientRect();

                  // Calculate position
                  let left = rect.right + 10;
                  let top = rect.top + rect.height / 2 - 30; // Approximate center

                  // Adjust if tooltip goes off screen
                  const tooltipWidth = 220; // min-width
                  const tooltipHeight = 80; // approximate height

                  if (left + tooltipWidth > window.innerWidth) {
                    left = rect.left - tooltipWidth - 10;
                  }

                  if (top < 10) {
                    top = 10;
                  } else if (top + tooltipHeight > window.innerHeight - 10) {
                    top = window.innerHeight - tooltipHeight - 10;
                  }

                  tooltip.style.left = `${left}px`;
                  tooltip.style.top = `${top}px`;
                });

                info.el.addEventListener("mouseleave", () => {
                  // Remove tooltip
                  if (tooltip?.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                    tooltip = null;
                  }
                });

                // Also inject global CSS if not already present
                if (
                  !document.head.querySelector(
                    "style[data-availability-styles]",
                  )
                ) {
                  const style = document.createElement("style");
                  style.setAttribute("data-availability-styles", "true");
                  style.textContent = `
                    .fc-event[data-event-type="availability"],
                    .fc-event[data-event-type="availability"] .fc-event-main,
                    .fc-event[data-event-type="availability"] .fc-event-main-frame,
                    .fc-event[data-event-type="availability"] .fc-event-title-container,
                    .fc-event[data-event-type="availability"] .fc-event-title,
                    .fc-event[data-event-type="availability"] .fc-event-time {
                      background: transparent !important;
                      background-color: transparent !important;
                      border: none !important;
                    }
                    
                    .fc-event[data-event-type="availability"] {
                      background-color: transparent !important;
                    }
                    
                    .fc-event[data-event-type="availability"]:hover {
                      background-color: transparent !important;
                    }
                    
                    .fc-event[data-event-type="availability"]:hover * {
                      background: transparent !important;
                      background-color: transparent !important;
                    }
                  `;
                  document.head.appendChild(style);
                }
              }
            } else {
              // Style regular appointments with greenish background
              info.el.style.backgroundColor = "#e6f4ea";
              info.el.style.borderLeft = "3px solid #0f9d58";
              info.el.style.borderRadius = "4px";
              info.el.classList.add("hover:shadow-md", "transition-shadow");
            }
          }}
          eventDisplay="block"
          eventOverlap={true}
          events={filteredEvents}
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }}
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
          resourceLabelContent={
            isScheduledPage && initialClinicians.length > 0
              ? (args) => {
                  const resourceId = args.resource.id;
                  const clinician = initialClinicians.find(
                    (c) => c.value === resourceId,
                  );

                  // For day view, show appointment limit controls
                  if (currentView === "resourceTimeGridDay") {
                    // Use local date to match how we store the keys
                    const year = currentDate.getFullYear();
                    const month = String(currentDate.getMonth() + 1).padStart(
                      2,
                      "0",
                    );
                    const day = String(currentDate.getDate()).padStart(2, "0");
                    const dateStr = `${year}-${month}-${day}`;
                    const limitKey = `${resourceId}-${dateStr}`;
                    const limit = appointmentLimits[limitKey];

                    const isDropdownOpen =
                      addLimitDropdown.open &&
                      addLimitDropdown.date &&
                      addLimitDropdown.date.toDateString() ===
                        currentDate.toDateString() &&
                      addLimitDropdown.clinicianId === resourceId;

                    let buttonText = "+ Appt Limit";
                    if (limit !== undefined && limit !== null) {
                      if (limit === 0) {
                        buttonText = "No Availability";
                      } else {
                        buttonText = `${limit} max`;
                      }
                    }

                    return (
                      <div className="flex flex-col items-center w-full py-2">
                        {isAdmin && (
                          <div className="text-sm font-medium text-gray-900 mb-2 text-center">
                            {clinician ? clinician.label : args.resource.title}
                          </div>
                        )}
                        <div className="relative">
                          <Button
                            className="text-xs px-2 py-1 w-full max-w-[100px]"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddLimitForClinician(
                                currentDate,
                                resourceId,
                                e,
                              );
                            }}
                          >
                            {buttonText}
                          </Button>
                          {isDropdownOpen && (
                            <Card
                              ref={addLimitDropdownRef}
                              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white z-[9999] min-w-[170px] overflow-hidden p-0 shadow-lg border"
                              style={{
                                position: "fixed",
                                top: dropdownPosition?.top,
                                left: dropdownPosition?.left,
                                transform: "translate(-50%, 0)",
                                zIndex: 9999,
                              }}
                            >
                              <CardHeader className="p-[10px_10px_6px_10px] border-b border-gray-100">
                                <div className="font-bold text-[0.6rem] text-gray-800">
                                  Appt limit per day
                                </div>
                                <div className="font-medium text-[0.5rem] text-gray-400 mt-0.5">
                                  {clinician?.label || "Clinician"} - All{" "}
                                  {currentDate.toLocaleDateString(undefined, {
                                    weekday: "long",
                                  })}
                                  s
                                </div>
                              </CardHeader>
                              <CardContent className="py-2 px-0 max-h-60 overflow-y-auto">
                                <div
                                  className={`px-4 py-3 text-left cursor-pointer text-gray-800 font-bold text-[0.7rem] rounded-lg mx-2 mb-1 ${
                                    limit === 0 ? "bg-gray-100" : ""
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSelectLimitForClinician(
                                      null,
                                      resourceId,
                                    );
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
                                        limit === num ? "bg-gray-100" : ""
                                      }`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSelectLimitForClinician(
                                          num,
                                          resourceId,
                                        );
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
                      </div>
                    );
                  }

                  // Default - show clinician name only for admins
                  return (
                    <div className="text-sm font-medium text-gray-900 text-center py-2">
                      {isAdmin && clinician ? clinician.label : ""}
                    </div>
                  );
                }
              : undefined
          }
          resources={
            isScheduledPage && currentView === "resourceTimeGridDay"
              ? resources
              : undefined
          }
          select={handleDateSelect}
          selectable={true}
          slotEventOverlap={true}
          slotMaxTime="24:00:00"
          slotMinTime="00:00:00"
          timeZone="America/New_York"
          views={{
            resourceTimeGridDay: {
              type: "resourceTimeGrid",
              duration: { days: 1 },
              slotDuration: "01:00:00",
              slotLabelFormat: {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              },
            },
            timeGridDay: {
              type: "timeGrid",
              duration: { days: 1 },
              slotDuration: "01:00:00",
              slotLabelFormat: {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              },
            },
            timeGridWeek: {
              type: "timeGrid",
              duration: { weeks: 1 },
              slotDuration: "01:00:00",
              slotLabelFormat: {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              },
            },
            resourceTimeGridWeek: {
              type: "resourceTimeGrid",
              duration: { weeks: 1 },
              slotDuration: "01:00:00",
              slotLabelFormat: {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
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
        onOpenChange={setShowAvailabilitySidebar}
      />

      {showIntakeForm && intakeClientData && (
        <IntakeForm
          appointmentDate={intakeClientData.appointmentDate}
          appointmentId={intakeClientData.appointmentId}
          appointmentTime={intakeClientData.appointmentTime}
          clientGroupId={intakeClientData.clientGroupId}
          clinicianName={intakeClientData.clinicianName}
          locationName={intakeClientData.locationName}
          onClose={() => {
            setShowIntakeForm(false);
            setIntakeClientData(null);
          }}
        />
      )}
    </div>
  );
}

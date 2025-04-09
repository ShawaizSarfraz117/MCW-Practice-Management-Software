"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight, Columns } from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  MultiSelect,
  LocationSelect,
} from "@mcw/ui";
import { AppointmentDialog } from "../appointment-dialog";
import { format } from "date-fns";
import { useSession } from "next-auth/react";

// Types
interface Clinician {
  value: string;
  label: string;
  group: string;
}

interface Location {
  value: string;
  label: string;
  type: "physical" | "virtual" | "unassigned";
}

interface Event {
  id: string;
  resourceId: string;
  title: string;
  start: string;
  end: string;
  location: string;
}

interface AppointmentData {
  id: string;
  type: string;
  title: string;
  start_date: string;
  end_date: string;
  location_id: string;
  client_id?: string;
  clinician_id?: string;
  status: string;
  is_all_day: boolean;
  is_recurring: boolean;
  recurring_rule?: string;
  service_id?: string;
  appointment_fee?: number;
  notes?: string;
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
  services?: Array<{
    id: string;
    name: string;
    code: string;
    rate: number;
    duration: number;
  }>;
}

interface CalendarViewProps {
  initialClinicians: Clinician[];
  initialLocations: Location[];
  initialEvents: Event[];
  onCreateClient?: (date: string, time: string) => void;
  onAppointmentDone?: () => void;
}

// Define FormValues interface to match the appointment dialog's form values
interface FormValues {
  type: string;
  eventName: string;
  clientType: string;
  client: string;
  clinician: string;
  selectedServices: Array<{ serviceId: string; fee: number }>;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  location: string;
  recurring: boolean;
  allDay: boolean;
  cancelAppointments: boolean;
  notifyClients: boolean;
}

const clinicianGroups = {
  clinicians: "CLINICIANS",
  admins: "ADMINS",
};

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
  // Add state to track if we're viewing an existing appointment
  const [isViewingAppointment, setIsViewingAppointment] = useState(false);
  // State for API error notifications, use _apiError naming to avoid linter error
  const [_apiError, setApiError] = useState<string | null>(null);

  // Get session data to check if user is admin
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin || false;

  // Rename to _setEvents to avoid unused warning
  const [events, _setEvents] = useState<Event[]>(initialEvents);

  // Create ref to track dialog form values with proper type
  const appointmentFormRef = useRef<FormValues | null>(null);

  // Set the view based on user role
  const [currentView, setCurrentView] = useState(
    isAdmin ? "resourceTimeGridDay" : "timeGridDay",
  );
  const [currentDate, setCurrentDate] = useState(new Date());

  // Initialize selectedClinicians based on user role
  // For admin, preselect first two clinicians (or just the first one if only one exists)
  // For non-admin, only select their own clinician ID (which should be the only one in initialClinicians)
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

  // State for selected appointment
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentData | null>(null);

  // Function to handle appointment dialog closing
  const handleAppointmentSubmit = () => {
    // Get form values from the dialog's form state
    if (appointmentFormRef.current) {
      // Create a new appointment from the form data
      const values = appointmentFormRef.current;

      try {
        // If client is specified, first get client details to use proper name in title
        if (values.client) {
          // Fetch client info to get their name
          fetch(`/api/client?id=${values.client}`)
            .then((response) => {
              if (!response.ok) {
                throw new Error("Failed to fetch client information");
              }
              return response.json();
            })
            .then((clientData) => {
              // Create title with actual client name
              const clientName =
                clientData.legal_first_name && clientData.legal_last_name
                  ? `${clientData.legal_first_name} ${clientData.legal_last_name}`
                  : "Client";

              // Create appointment with proper client name in title
              createAppointment(values, clientName);
            })
            .catch((error) => {
              console.error("Error fetching client details:", error);
              // Continue with generic title if client fetch fails
              createAppointment(values);
            });
        } else {
          // No client specified, just create the appointment with default title
          createAppointment(values);
        }
      } catch (err) {
        console.error("Error preparing appointment data:", err);
      }
    }

    // Call the onAppointmentDone callback if provided
    if (onAppointmentDone) onAppointmentDone();
  };

  // Helper function to format ISO datetime
  const getISODateTime = (
    date: Date,
    timeStr: string,
    isAllDay: boolean = false,
  ): string => {
    // Parse the time components from the timeStr (e.g., "6:30 PM")
    try {
      // Get the date part (YYYY-MM-DD) from the date object
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      let hours = 0;
      let minutes = 0;
      let seconds = 0;

      // For all-day events, use specific times
      if (isAllDay) {
        // If this is an end date for an all-day event, set it to 11:59:59 PM
        if (timeStr === "end") {
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        // Otherwise, start date for an all-day event uses 00:00:00
      } else if (timeStr) {
        // Parse time string (e.g., "6:30 PM")
        const [time, ampm] = timeStr.split(" ");
        const [hourStr, minuteStr] = time.split(":");

        hours = parseInt(hourStr);
        minutes = parseInt(minuteStr);

        // Convert to 24-hour format
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
      }

      // Create a new date object with the combined date and time
      // This ensures we're not affected by timezone conversions in toISOString()
      const combinedDate = new Date(
        `${dateStr}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );

      // Return the ISO string but adjust it to maintain the local time the user selected
      // We need to adjust for the timezone offset to ensure the time is stored correctly
      const tzOffset = combinedDate.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = new Date(
        combinedDate.getTime() - tzOffset,
      ).toISOString();

      return localISOTime;
    } catch (err) {
      console.error("Error formatting date:", err);
      return new Date().toISOString();
    }
  };

  // Helper function to create appointment with API
  const createAppointment = (values: FormValues, clientName?: string) => {
    // Reset error state
    setApiError(null);

    // Get formatted start and end dates, handling all-day events
    const startDateTime = getISODateTime(
      values.startDate,
      values.allDay ? "start" : values.startTime,
      values.allDay,
    );
    const endDateTime = getISODateTime(
      values.endDate,
      values.allDay ? "end" : values.endTime,
      values.allDay,
    );

    // Create API payload
    const appointmentData = {
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
      created_by: session?.user?.id || "", // Current user as creator
      status: "SCHEDULED",
      is_recurring: values.recurring || false,
      recurring_rule: values.recurring ? "WEEKLY" : null, // Simple default
      service_id: values.selectedServices?.[0]?.serviceId || null,
      appointment_fee: values.selectedServices?.[0]?.fee || null,
    };

    console.log("Submitting appointment with dates:", {
      original: {
        startDate: values.startDate,
        startTime: values.startTime,
        endDate: values.endDate,
        endTime: values.endTime,
        isAllDay: values.allDay,
      },
      formatted: {
        startDateTime,
        endDateTime,
      },
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      browserTime: new Date().toString(),
    });

    // Save to API
    fetch("/api/appointment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(appointmentData),
    })
      .then(async (response) => {
        if (!response.ok) {
          // Try to parse error message from response
          let errorMessage = "Failed to create appointment";
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (_e) {
            // If we can't parse error JSON, use status text
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        return response.json();
      })
      .then((createdAppointment) => {
        console.log("Appointment created:", createdAppointment);

        // Add the new event to the calendar
        const newEvent = {
          id: createdAppointment.id,
          resourceId: createdAppointment.clinician_id || "",
          title: createdAppointment.title,
          start: createdAppointment.start_date,
          end: createdAppointment.end_date,
          location: createdAppointment.location_id || "",
        };

        // Add the new event to the calendar
        _setEvents((prevEvents) => [...prevEvents, newEvent]);
      })
      .catch((error) => {
        console.error("Error creating appointment:", error);
        // Set error message for display
        setApiError(error.message);

        // Show error notification to user with time zone info to help debugging
        const timeZoneInfo = `Browser timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
        alert(`Error: ${error.message}\n\n${timeZoneInfo}`);
      });
  };

  // Effect to capture form values from the AppointmentDialog
  useEffect(() => {
    // This is a hook to access appointment form values when needed
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

  // Add a function to fetch appointment details by ID
  const fetchAppointmentDetails = async (appointmentId: string) => {
    try {
      console.log(`Fetching appointment details for ID: ${appointmentId}`);
      const response = await fetch(`/api/appointment?id=${appointmentId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          `Error ${response.status}: Failed to fetch appointment details`;
        console.error(errorMessage);
        setApiError(errorMessage);

        // Show a user-friendly error message
        alert(`Could not load appointment details. ${errorMessage}`);
        return;
      }

      const appointmentData = await response.json();
      console.log("Appointment data received:", appointmentData);

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

      // Update selectedAppointment state
      setSelectedAppointment(appointmentData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching appointment details:", error);
      setApiError(`Failed to load appointment details: ${errorMessage}`);

      // Show a user-friendly error message
      alert(`Could not load appointment details. Please try again.`);
    }
  };

  // Use the original eventClick handler
  const handleEventClick = (info: {
    event: {
      id: string;
      title: string;
      start: Date;
      end: Date;
      extendedProps: Record<string, unknown>;
    };
  }) => {
    // Get the appointment ID from the event
    const appointmentId = info.event.id;
    fetchAppointmentDetails(appointmentId);
  };

  // Modify handleDateSelect to reset viewing mode
  const handleDateSelect = (selectInfo: {
    start: Date;
    end: Date;
    resource?: { id: string };
  }) => {
    // Reset viewing mode when creating a new appointment
    setIsViewingAppointment(false);

    setSelectedDate(selectInfo.start);
    setSelectedResource(selectInfo.resource?.id || null);

    // Save the selected time info so the appointment dialog can use it
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

  const getHeaderDateFormat = () => {
    switch (currentView) {
      case "resourceTimeGridDay":
        return format(currentDate, "EEEE, MMMM d, yyyy");
      case "timeGridWeek":
        return format(currentDate, "MMMM yyyy");
      case "dayGridMonth":
        return format(currentDate, "MMMM yyyy");
      default:
        return format(currentDate, "MMMM yyyy");
    }
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
        <div className="border-b">
          <div className="h-14 px-4 flex items-center justify-between">
            {/* Left section */}
            <div className="flex items-center space-x-2">
              <Button size="icon" variant="ghost" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                className="text-sm"
                size="sm"
                variant="ghost"
                onClick={handleToday}
              >
                Today
              </Button>
              <Button size="icon" variant="ghost" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {getHeaderDateFormat()}
              </span>
            </div>

            {/* Center section - only show clinician selector for admin users */}
            <div className="flex items-center">
              {isAdmin && (
                <MultiSelect
                  groups={clinicianGroups}
                  options={initialClinicians}
                  selected={selectedClinicians}
                  onChange={setSelectedClinicians}
                />
              )}
            </div>

            {/* Right section with view selector buttons */}
            <div className="flex items-center space-x-2">
              <div className="flex rounded-md border">
                <Button
                  className="rounded-none text-sm px-3"
                  size="sm"
                  variant={
                    currentView ===
                    (isAdmin ? "resourceTimeGridDay" : "timeGridDay")
                      ? "secondary"
                      : "ghost"
                  }
                  onClick={() =>
                    handleViewChange(
                      isAdmin ? "resourceTimeGridDay" : "timeGridDay",
                    )
                  }
                >
                  Day
                </Button>
                <Separator orientation="vertical" />
                <Button
                  className="rounded-none text-sm px-3"
                  size="sm"
                  variant={
                    currentView ===
                    (isAdmin ? "resourceTimeGridWeek" : "timeGridWeek")
                      ? "secondary"
                      : "ghost"
                  }
                  onClick={() =>
                    handleViewChange(
                      isAdmin ? "resourceTimeGridWeek" : "timeGridWeek",
                    )
                  }
                >
                  Week
                </Button>
                <Separator orientation="vertical" />
                <Button
                  className="rounded-none text-sm px-3"
                  size="sm"
                  variant={
                    currentView === "dayGridMonth" ? "secondary" : "ghost"
                  }
                  onClick={() => handleViewChange("dayGridMonth")}
                >
                  Month
                </Button>
              </div>

              <Select defaultValue="status">
                <SelectTrigger className="w-[120px] h-8 text-sm">
                  <SelectValue>Color: Status</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>

              <Button className="h-8 w-8" size="icon" variant="ghost">
                <Columns className="h-4 w-4" />
              </Button>

              <LocationSelect
                options={initialLocations}
                selected={selectedLocations}
                onChange={setSelectedLocations}
              />
            </div>
          </div>
        </div>

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
            events={filteredEvents}
            eventClick={handleEventClick}
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
        open={isDialogOpen}
        selectedDate={selectedDate}
        selectedResource={selectedResource}
        appointmentData={isViewingAppointment ? selectedAppointment : undefined}
        isViewMode={isViewingAppointment}
        onCreateClient={onCreateClient}
        onDone={handleAppointmentSubmit}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { differenceInDays, addDays, format, addMinutes } from "date-fns";
import { MapPin } from "lucide-react";
import { Button } from "@mcw/ui";
import { Dialog, DialogContent, DialogFooter } from "@mcw/ui";
import { Checkbox } from "@mcw/ui";
import { Tabs, TabsList, TabsTrigger } from "@mcw/ui";

import { Avatar, AvatarFallback, AvatarImage } from "@mcw/ui";
import { cn } from "@mcw/utils";
import { SearchSelect } from "@mcw/ui";
import { DatePicker } from "@mcw/ui";
import { TimePicker } from "@mcw/ui";
import { RecurringControl } from "./calendar/recurring-control";
import { Input } from "@mcw/ui";
// Replace the React Hook Form import with TanStack Form imports
// With these TanStack Form imports
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

type Service = {
  id: string;
  type: string;
  code: string;
  duration: number;
  description: string | null;
  rate: number;
};

type Clinician = {
  id: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
};

type Location = {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
};

type Client = {
  id: string;
  legal_first_name: string;
  legal_last_name: string;
  is_active: boolean;
};

interface AppointmentData {
  start_date?: string;
  end_date?: string;
  title?: string;
  type?: string;
  client_id?: string;
  clinician_id?: string;
  location_id?: string;
  is_recurring?: boolean;
  is_all_day?: boolean;
  services?: Array<{
    id: string;
    rate: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  selectedDate?: Date | null;
  selectedResource?: string | null;
  onCreateClient?: (date: string, time: string) => void;
  onDone?: () => void;
  appointmentData?: AppointmentData;
  isViewMode?: boolean;
}

// Define a type for form values
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

// Custom hook to get clinician data for the current user
function useClinicianData() {
  const { data: session, status: sessionStatus } = useSession();
  const isAdmin = session?.user?.isAdmin || false;
  const isClinician = session?.user?.isClinician || false;
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
          if (data && data.id) {
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

export function AppointmentDialog({
  open,
  onOpenChange,
  selectedDate,
  onCreateClient,
  onDone,
  appointmentData,
  isViewMode = false,
}: AppointmentDialogProps) {
  const [duration, setDuration] = useState<string>("50 mins");
  const [selectedServices, setSelectedServices] = useState<
    Array<{ serviceId: string; fee: number }>
  >([]);
  // Add a state to track UI updates
  const [_updateCounter, setUpdateCounter] = useState(0);
  // Add a separate state for the active tab
  const [activeTab, setActiveTab] = useState<"appointment" | "event" | "out">(
    "appointment",
  );
  // Add state for form validation errors
  const [validationErrors, setValidationErrors] = useState<{
    client?: boolean;
    clinician?: boolean;
    location?: boolean;
    service?: boolean;
  }>({});
  // Add state for general error message
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Use the custom hook to get clinician data
  const {
    clinicianId: effectiveClinicianId,
    isAdmin,
    isClinician,
    isLoading: isLoadingClinicianData,
    shouldFetchData,
    sessionStatus,
  } = useClinicianData();

  // Force a re-render
  const forceUpdate = () => setUpdateCounter((prev) => prev + 1);

  // Add separate state for each tab's form values with type annotations
  const [appointmentFormValues, setAppointmentFormValues] =
    useState<FormValues>({
      type: "appointment",
      eventName: "",
      clientType: "individual",
      client: "",
      clinician: effectiveClinicianId || "",
      selectedServices: [{ serviceId: "", fee: 0 }],
      startDate: selectedDate || new Date(),
      endDate: selectedDate || new Date(),
      startTime: "12:00 PM",
      endTime: "12:50 PM",
      location: "sp",
      recurring: false,
      allDay: false,
      cancelAppointments: true,
      notifyClients: true,
    });

  const [eventFormValues, setEventFormValues] = useState<FormValues>({
    type: "event",
    eventName: "",
    clientType: "individual",
    client: "",
    clinician: effectiveClinicianId || "",
    selectedServices: [],
    startDate: selectedDate || new Date(),
    endDate: selectedDate || new Date(),
    startTime: "12:00 PM",
    endTime: "12:50 PM",
    location: "sp",
    recurring: false,
    allDay: false,
    cancelAppointments: false,
    notifyClients: false,
  });

  // Update the form initialization to ensure proper state management
  const form = useForm({
    defaultValues:
      activeTab === "appointment" ? appointmentFormValues : eventFormValues,
    onSubmit: async ({ value }) => {
      // Reset validation errors
      setValidationErrors({});
      setGeneralError(null);

      // Validate required fields based on active tab
      const errors: {
        client?: boolean;
        clinician?: boolean;
        location?: boolean;
        service?: boolean;
      } = {};

      let hasErrors = false;

      // Validate time fields format
      if (!value.startTime || !value.endTime) {
        setGeneralError("Time fields are required");
        return;
      }

      // Ensure time format is correct (e.g., "6:30 PM")
      const timeRegex = /^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/;
      if (!timeRegex.test(value.startTime) || !timeRegex.test(value.endTime)) {
        setGeneralError("Time must be in format '6:30 PM'");
        return;
      }

      if (activeTab === "appointment") {
        // For appointments, client, clinician, location, and service are required
        if (!value.client) {
          errors.client = true;
          hasErrors = true;
        }

        if (!value.clinician) {
          errors.clinician = true;
          hasErrors = true;
        }

        if (!value.location) {
          errors.location = true;
          hasErrors = true;
        }

        if (
          value.selectedServices?.length > 0 &&
          !value.selectedServices[0].serviceId
        ) {
          errors.service = true;
          hasErrors = true;
        }
      } else if (activeTab === "event") {
        // For events, clinician and location are required
        if (!value.clinician) {
          errors.clinician = true;
          hasErrors = true;
        }

        if (!value.location) {
          errors.location = true;
          hasErrors = true;
        }
      }

      if (hasErrors) {
        setValidationErrors(errors);
        setGeneralError("Please fill in all required fields marked with *");
        return; // Prevent form submission
      }

      // Dispatch a custom event with the form values
      const formSubmitEvent = new CustomEvent("appointmentFormSubmit", {
        detail: { formValues: value },
      });
      window.dispatchEvent(formSubmitEvent);

      console.log("Form submitted with values:", value);

      // Close the dialog and call onDone callback
      onOpenChange(false);
      if (onDone) onDone();
    },
  });

  // With TanStack Form's getFieldValue
  const allDay = form.getFieldValue("allDay");
  const startDate = form.getFieldValue("startDate");
  const endDate = form.getFieldValue("endDate");
  const startTime = form.getFieldValue("startTime");
  const endTime = form.getFieldValue("endTime");
  const selectedClient = form.getFieldValue("client");
  const isRecurring = form.getFieldValue("recurring");

  // Add queries for services, clinicians, and locations - only run when shouldFetchData is true
  const { data: services = [], isLoading: isLoadingServices } = useQuery<
    Service[]
  >({
    queryKey: ["services", effectiveClinicianId, isAdmin, isClinician],
    queryFn: async () => {
      let url = "/api/service";

      // If user is a clinician and not an admin, fetch only assigned services
      if (isClinician && !isAdmin && effectiveClinicianId) {
        url += `?clinicianId=${effectiveClinicianId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      return response.json();
    },
    enabled: shouldFetchData, // Only run query when session is loaded
  });

  const { data: clinicians = [], isLoading: isLoadingClinicians } = useQuery<
    Clinician[]
  >({
    queryKey: ["clinicians", effectiveClinicianId, isAdmin, isClinician],
    queryFn: async () => {
      // If user is admin, fetch all clinicians
      // If user is clinician, fetch only self
      let url = "/api/clinician";

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

  const { data: locations = [], isLoading: isLoadingLocations } = useQuery<
    Location[]
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

  // Add a query for clients
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<
    Client[]
  >({
    queryKey: ["clients", effectiveClinicianId, isAdmin, isClinician],
    queryFn: async () => {
      let url = "/api/client";

      // If user is a clinician and not an admin, fetch only assigned clients
      if (isClinician && !isAdmin && effectiveClinicianId) {
        url += `?clinicianId=${effectiveClinicianId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      return response.json();
    },
    enabled: shouldFetchData, // Only run query when session is loaded
  });

  // Add separate pagination states for each dropdown
  const [clientPage, setClientPage] = useState(1);
  const [clinicianPage, setClinicianPage] = useState(1);
  const [locationPage, setLocationPage] = useState(1);
  const [servicePage, setServicePage] = useState(1);
  const itemsPerPage = 10;

  // Add state for search terms
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clinicianSearchTerm, setClinicianSearchTerm] = useState("");
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");

  // Safely filter options based on search terms, ensuring data is an array first
  const filteredClients = Array.isArray(clients)
    ? clients
        .map((client) => ({
          label: `${client.legal_first_name} ${client.legal_last_name}`,
          value: client.id,
        }))
        .filter((option) =>
          option.label.toLowerCase().includes(clientSearchTerm.toLowerCase()),
        )
    : [];

  const filteredClinicianOptions = Array.isArray(clinicians)
    ? clinicians
        .map((clinician) => ({
          label: `${clinician.first_name} ${clinician.last_name}`,
          value: clinician.id,
        }))
        .filter((option) =>
          option.label
            .toLowerCase()
            .includes(clinicianSearchTerm.toLowerCase()),
        )
    : [];

  const filteredLocationOptions = Array.isArray(locations)
    ? locations
        .map((location) => ({
          label: location.name,
          value: location.id,
        }))
        .filter((option) =>
          option.label.toLowerCase().includes(locationSearchTerm.toLowerCase()),
        )
    : [];

  const filteredServiceOptions = Array.isArray(services)
    ? services
        .map((service) => ({
          label: `${service.code} ${service.type}`,
          value: service.id,
          fee: service.rate,
        }))
        .filter((option) =>
          option.label.toLowerCase().includes(serviceSearchTerm.toLowerCase()),
        )
    : [];

  // Calculate total pages for each option type
  const clientTotalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const clinicianTotalPages = Math.ceil(
    filteredClinicianOptions.length / itemsPerPage,
  );
  const locationTotalPages = Math.ceil(
    filteredLocationOptions.length / itemsPerPage,
  );
  const serviceTotalPages = Math.ceil(
    filteredServiceOptions.length / itemsPerPage,
  );

  // Paginate the filtered options
  const paginatedClients = filteredClients.slice(
    (clientPage - 1) * itemsPerPage,
    clientPage * itemsPerPage,
  );

  const paginatedClinicianOptions = filteredClinicianOptions.slice(
    (clinicianPage - 1) * itemsPerPage,
    clinicianPage * itemsPerPage,
  );

  const paginatedLocationOptions = filteredLocationOptions.slice(
    (locationPage - 1) * itemsPerPage,
    locationPage * itemsPerPage,
  );

  const paginatedServiceOptions = filteredServiceOptions.slice(
    (servicePage - 1) * itemsPerPage,
    servicePage * itemsPerPage,
  );

  useEffect(() => {
    let duration = "";
    if (startDate && endDate) {
      if (allDay) {
        const days = differenceInDays(endDate, startDate);
        duration = `${days} day${days !== 1 ? "s" : ""}`;
      } else if (startTime && endTime) {
        // Parse times
        const [startTimeStr, startPeriod] = startTime.split(" ");
        const [endTimeStr, endPeriod] = endTime.split(" ");
        const [startHour, startMinute] = startTimeStr.split(":").map(Number);
        const [endHour, endMinute] = endTimeStr.split(":").map(Number);

        // Convert to 24-hour format
        let start24Hour = startHour;
        if (startPeriod === "PM" && startHour !== 12) start24Hour += 12;
        if (startPeriod === "AM" && startHour === 12) start24Hour = 0;

        let end24Hour = endHour;
        if (endPeriod === "PM" && endHour !== 12) end24Hour += 12;
        if (endPeriod === "AM" && endHour === 12) end24Hour = 0;

        // Calculate minutes
        const mins = (end24Hour - start24Hour) * 60 + (endMinute - startMinute);
        duration = `${mins} mins`;
      }
    }
    setDuration(duration || "0 mins");
  }, [startDate, endDate, startTime, endTime, allDay]);

  // Update the useEffect to set the clinician value when session data is available
  useEffect(() => {
    if (open) {
      // Check if there's a selected time slot in session storage
      const selectedTimeSlotData =
        window.sessionStorage.getItem("selectedTimeSlot");
      let startTime, endTime;

      if (selectedTimeSlotData) {
        const { startTime: selectedStart, endTime: selectedEnd } =
          JSON.parse(selectedTimeSlotData);
        startTime = selectedStart;
        endTime = selectedEnd;
        // Clear the session storage after use
        window.sessionStorage.removeItem("selectedTimeSlot");
      } else {
        // Default times if no selection was made
        startTime = format(new Date(), "h:mm a");
        endTime = format(addMinutes(new Date(), 30), "h:mm a");
      }

      // Initialize form values
      setAppointmentFormValues({
        type: "appointment",
        eventName: "",
        clientType: "individual",
        client: "",
        clinician: effectiveClinicianId || "",
        selectedServices: [{ serviceId: "", fee: 0 }],
        startDate: selectedDate ? selectedDate : new Date(),
        endDate: selectedDate ? selectedDate : new Date(),
        startTime: startTime,
        endTime: endTime,
        location: "sp",
        recurring: false,
        allDay: false,
        cancelAppointments: true,
        notifyClients: true,
      });

      setEventFormValues({
        type: "event",
        eventName: "",
        clientType: "individual",
        client: "",
        clinician: effectiveClinicianId || "",
        selectedServices: [],
        startDate: selectedDate ? selectedDate : new Date(),
        endDate: selectedDate ? selectedDate : new Date(),
        startTime: startTime,
        endTime: endTime,
        location: "sp",
        recurring: false,
        allDay: false,
        cancelAppointments: false,
        notifyClients: false,
      });
    }
  }, [open, selectedDate, effectiveClinicianId]);

  // Add effect to handle appointment data when in view mode
  useEffect(() => {
    if (isViewMode && appointmentData && open) {
      // Format dates from appointment data
      const startDate = appointmentData.start_date
        ? new Date(appointmentData.start_date)
        : new Date();

      const endDate = appointmentData.end_date
        ? new Date(appointmentData.end_date)
        : new Date();

      // Format times
      const startTime = format(startDate, "h:mm a");
      const endTime = format(endDate, "h:mm a");

      // Determine appointment type
      const type = appointmentData.type || "appointment";

      // Set active tab based on appointment type
      setActiveTab(type as "appointment" | "event");

      // Create form values from appointment data
      const formValues = {
        type: type,
        eventName: appointmentData.title || "",
        clientType: "individual",
        client: appointmentData.client_id || "",
        clinician: appointmentData.clinician_id || "",
        selectedServices:
          appointmentData.services?.map((s) => ({
            serviceId: s.id,
            fee: s.rate || 0,
          })) || [],
        startDate: startDate,
        endDate: endDate,
        startTime: startTime,
        endTime: endTime,
        location: appointmentData.location_id || "",
        recurring: appointmentData.is_recurring || false,
        allDay: appointmentData.is_all_day || false,
        cancelAppointments: true,
        notifyClients: true,
      };

      // Update form with appointment data
      if (type === "appointment") {
        setAppointmentFormValues(formValues);
      } else if (type === "event") {
        setEventFormValues(formValues);
      }

      // Set selected services
      if (appointmentData.services && appointmentData.services.length > 0) {
        setSelectedServices(
          appointmentData.services.map((s) => ({
            serviceId: s.id,
            fee: s.rate || 0,
          })),
        );
      }

      // Reset the form with the appointment data
      form.reset(formValues);
    }
  }, [isViewMode, appointmentData, open, form]);

  // Handle checkbox changes with proper state updates
  const handleCheckboxChange = (
    field: keyof typeof form.state.values,
    checked: boolean,
  ) => {
    form.setFieldValue(field, checked);
    forceUpdate();
  };

  // Handle client selection with proper state updates
  const handleClientSelect = (value: string) => {
    form.setFieldValue("client", value);
    forceUpdate(); // Force re-render to ensure UI updates
  };

  // Update date handling in the component
  const handleDateChange = (
    field: "startDate" | "endDate",
    date: Date | undefined,
  ) => {
    if (!date) return;

    if (field === "startDate") {
      // When start date changes, update both start and end date
      form.setFieldValue("startDate", date);
      form.setFieldValue("endDate", date);
    } else {
      // For end date, we only allow changing if it's an all-day event
      if (form.getFieldValue("allDay")) {
        form.setFieldValue("endDate", date);
      } else {
        // For regular appointments, end date must match start date
        form.setFieldValue("endDate", form.getFieldValue("startDate"));
      }
    }
    forceUpdate(); // Ensure UI updates
  };

  // Handle time selection with proper state updates
  const handleTimeChange = (field: "startTime" | "endTime", time: string) => {
    form.setFieldValue(field, time);
    forceUpdate(); // Force re-render to ensure UI updates
  };

  // Ensure the dialog doesn't close when interacting with date pickers
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent escape key from closing modal when interacting with date picker or time picker
      if (
        e.key === "Escape" &&
        (document.activeElement?.classList.contains("rdp-button") ||
          document.activeElement?.closest(".rdp") ||
          document.activeElement?.closest("[data-timepicker]"))
      ) {
        e.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open]);

  return (
    <Dialog
      modal={false}
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          const type = activeTab || "appointment";
          if (type === "event") {
            form.reset(eventFormValues);
            setSelectedServices([]);
          } else if (type === "appointment") {
            form.reset(appointmentFormValues);
            // Check if services are available
            if (Array.isArray(services) && services.length > 0) {
              setSelectedServices([
                {
                  serviceId: services[0].id,
                  fee: services[0].rate,
                },
              ]);
            } else {
              setSelectedServices([{ serviceId: "", fee: 0 }]);
            }
          } else if (type === "out") {
            // Find first available clinician or use empty string
            const firstClinicianId =
              Array.isArray(clinicians) && clinicians.length > 0
                ? clinicians[0]?.id
                : "";

            form.reset({
              type: "out",
              eventName: "",
              clientType: "individual",
              client: "",
              clinician:
                isClinician && effectiveClinicianId
                  ? effectiveClinicianId
                  : firstClinicianId,
              selectedServices: [],
              startDate: selectedDate || new Date(),
              endDate: selectedDate
                ? addDays(selectedDate, 1)
                : addDays(new Date(), 1),
              startTime: "12:00 PM",
              endTime: "12:50 PM",
              location: "sp",
              recurring: false,
              allDay: false,
              cancelAppointments: true,
              notifyClients: true,
            });
            setSelectedServices([]);
          }
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="p-0 gap-0 w-[464px] max-h-[90vh] overflow-auto rounded-none">
        {isLoadingClinicianData ||
        (isClinician &&
          !effectiveClinicianId &&
          sessionStatus === "authenticated") ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#16A34A] mx-auto mb-4"></div>
              <p className="text-gray-500">Loading user data...</p>
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            onPointerDownCapture={(e) => {
              // Prevent dialog from closing when clicking inside date pickers
              if (
                e.target &&
                ((e.target as HTMLElement).classList.contains("rdp-button") ||
                  (e.target as HTMLElement).closest(".rdp") ||
                  (e.target as HTMLElement).closest("[data-timepicker]"))
              ) {
                e.stopPropagation();
              }
            }}
          >
            <Tabs
              className="w-full"
              value={activeTab}
              onValueChange={(value) => {
                if (activeTab === "appointment") {
                  setAppointmentFormValues(form.state.values);
                } else if (activeTab === "event") {
                  setEventFormValues(form.state.values);
                }

                setActiveTab(value as "appointment" | "event" | "out");
                form.setFieldValue(
                  "type",
                  value as "appointment" | "event" | "out",
                );

                if (value === "event") {
                  form.reset(eventFormValues);
                } else if (value === "appointment") {
                  form.reset(appointmentFormValues);
                } else if (value === "out") {
                  // Find first available clinician or use empty string
                  const firstClinicianId =
                    Array.isArray(clinicians) && clinicians.length > 0
                      ? clinicians[0]?.id
                      : "";

                  form.reset({
                    type: "out",
                    eventName: "",
                    clientType: "individual",
                    client: "",
                    clinician:
                      isClinician && effectiveClinicianId
                        ? effectiveClinicianId
                        : firstClinicianId,
                    selectedServices: [],
                    startDate: selectedDate || new Date(),
                    endDate: selectedDate
                      ? addDays(selectedDate, 1)
                      : addDays(new Date(), 1),
                    startTime: "12:00 PM",
                    endTime: "12:50 PM",
                    location: "sp",
                    recurring: false,
                    allDay: false,
                    cancelAppointments: true,
                    notifyClients: true,
                  });
                  setSelectedServices([]);
                }

                // Force re-render to update UI
                forceUpdate();
              }}
            >
              <TabsList className="h-12 w-full rounded-none bg-transparent p-0 border-b">
                <TabsTrigger
                  className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-[#16A34A] data-[state=active]:bg-transparent data-[state=active]:text-[#16A34A] flex-1 text-sm font-normal"
                  value="appointment"
                  disabled={isViewMode && activeTab !== "appointment"}
                >
                  Appointment
                </TabsTrigger>
                <TabsTrigger
                  className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-[#16A34A] data-[state=active]:bg-transparent data-[state=active]:text-[#16A34A] flex-1 text-sm font-normal"
                  value="event"
                  disabled={isViewMode && activeTab !== "event"}
                >
                  Event
                </TabsTrigger>
                {/* <TabsTrigger
                  className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-[#16A34A] data-[state=active]:bg-transparent data-[state=active]:text-[#16A34A] flex-1 text-sm font-normal"
                  value="out"
                >
                  Out of Office
                </TabsTrigger> */}
              </TabsList>
            </Tabs>

            <div className="px-6 space-y-4">
              {activeTab === "event" ? (
                // Event Form Content
                <>
                  <div>
                    <Input
                      className="rounded-none border-gray-200"
                      placeholder="Event name (optional)"
                      value={form.getFieldValue("eventName") || ""}
                      onChange={(e) =>
                        form.setFieldValue("eventName", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <h2 className="text-sm mb-4">Appointment details</h2>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          checked={allDay}
                          className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
                          id="event-all-day"
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("allDay", !!checked)
                          }
                        />
                        <label
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1"
                          htmlFor="event-all-day"
                        >
                          All day
                        </label>
                      </div>

                      {allDay ? (
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                          <DatePicker
                            className="border-gray-200"
                            value={startDate}
                            onChange={(date) => {
                              handleDateChange("startDate", date);
                              forceUpdate(); // Ensure UI updates
                            }}
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <div className="flex items-center gap-2">
                            <DatePicker
                              className="border-gray-200"
                              value={endDate}
                              onChange={(date) => {
                                handleDateChange("endDate", date);
                                forceUpdate(); // Ensure UI updates
                              }}
                            />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {differenceInDays(
                                endDate || new Date(),
                                startDate || new Date(),
                              )}{" "}
                              days
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <DatePicker
                            className="border-gray-200"
                            value={startDate}
                            onChange={(date) => {
                              handleDateChange("startDate", date);
                              forceUpdate(); // Ensure UI updates
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center flex-1">
                              <TimePicker
                                className="border-gray-200"
                                value={startTime}
                                onChange={(time) => {
                                  handleTimeChange("startTime", time);
                                  forceUpdate(); // Ensure UI updates
                                }}
                                data-timepicker
                              />
                              <span className="text-sm text-gray-500">to</span>
                              <TimePicker
                                className="border-gray-200"
                                value={endTime}
                                onChange={(time) => {
                                  handleTimeChange("endTime", time);
                                  forceUpdate(); // Ensure UI updates
                                }}
                                data-timepicker
                              />
                            </div>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {duration}
                            </span>
                          </div>
                        </div>
                      )}

                      <SearchSelect
                        searchable
                        showPagination
                        className={cn(
                          "border-gray-200",
                          validationErrors.clinician && "border-red-500",
                        )}
                        currentPage={clinicianPage}
                        options={paginatedClinicianOptions}
                        placeholder={
                          isLoadingClinicians
                            ? "Loading clinicians..."
                            : "Search Team Members *"
                        }
                        totalPages={clinicianTotalPages}
                        value={form.getFieldValue("clinician")}
                        onPageChange={setClinicianPage}
                        onSearch={setClinicianSearchTerm}
                        onValueChange={(value) => {
                          form.setFieldValue("clinician", value);
                          // Clear validation error when value is selected
                          if (validationErrors.clinician) {
                            setValidationErrors((prev) => ({
                              ...prev,
                              clinician: false,
                            }));
                            if (
                              Object.values({
                                ...validationErrors,
                                clinician: false,
                              }).every((v) => !v)
                            ) {
                              setGeneralError(null);
                            }
                          }
                          forceUpdate();
                        }}
                      />
                      {validationErrors.clinician && (
                        <p className="text-xs text-red-500 mt-1">
                          Clinician is required
                        </p>
                      )}

                      <SearchSelect
                        searchable
                        showPagination
                        className={cn(
                          "border-gray-200",
                          validationErrors.location && "border-red-500",
                        )}
                        currentPage={locationPage}
                        icon={<MapPin className="h-4 w-4 text-gray-500" />}
                        options={paginatedLocationOptions}
                        placeholder={
                          isLoadingLocations
                            ? "Loading locations..."
                            : "Search Locations *"
                        }
                        totalPages={locationTotalPages}
                        value={form.getFieldValue("location")}
                        onPageChange={setLocationPage}
                        onSearch={setLocationSearchTerm}
                        onValueChange={(value) => {
                          form.setFieldValue("location", value);
                          // Clear validation error when value is selected
                          if (validationErrors.location) {
                            setValidationErrors((prev) => ({
                              ...prev,
                              location: false,
                            }));
                            if (
                              Object.values({
                                ...validationErrors,
                                location: false,
                              }).every((v) => !v)
                            ) {
                              setGeneralError(null);
                            }
                          }
                          forceUpdate();
                        }}
                      />
                      {validationErrors.location && (
                        <p className="text-xs text-red-500 mt-1">
                          Location is required
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : activeTab === "out" ? (
                // Out of Office Form Content
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      checked={allDay}
                      className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
                      id="out-all-day"
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("allDay", !!checked)
                      }
                    />
                    <label
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1"
                      htmlFor="out-all-day"
                    >
                      All day
                    </label>
                  </div>

                  {allDay ? (
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                      <DatePicker
                        className="border-gray-200"
                        value={startDate}
                        onChange={(date) => {
                          handleDateChange("startDate", date);
                          forceUpdate(); // Ensure UI updates
                        }}
                      />
                      <span className="text-sm text-gray-500">to</span>
                      <div className="flex items-center gap-2">
                        <DatePicker
                          className="border-gray-200"
                          value={endDate}
                          onChange={(date) => {
                            handleDateChange("endDate", date);
                            forceUpdate(); // Ensure UI updates
                          }}
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {differenceInDays(
                            endDate || new Date(),
                            startDate || new Date(),
                          )}{" "}
                          days
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <DatePicker
                        className="border-gray-200"
                        value={startDate}
                        onChange={(date) => {
                          handleDateChange("startDate", date);
                          forceUpdate(); // Ensure UI updates
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center flex-1">
                          <TimePicker
                            className="border-gray-200"
                            value={startTime}
                            onChange={(time) => {
                              handleTimeChange("startTime", time);
                              forceUpdate(); // Ensure UI updates
                            }}
                            data-timepicker
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <TimePicker
                            className="border-gray-200"
                            value={endTime}
                            onChange={(time) => {
                              handleTimeChange("endTime", time);
                              forceUpdate(); // Ensure UI updates
                            }}
                            data-timepicker
                          />
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {duration}
                        </span>
                      </div>
                    </div>
                  )}

                  <SearchSelect
                    searchable
                    showPagination
                    className={cn(
                      "border-gray-200",
                      validationErrors.clinician && "border-red-500",
                    )}
                    currentPage={clinicianPage}
                    options={paginatedClinicianOptions}
                    placeholder={
                      isLoadingClinicians
                        ? "Loading clinicians..."
                        : "Search Team Members *"
                    }
                    totalPages={clinicianTotalPages}
                    value={form.getFieldValue("clinician")}
                    onPageChange={setClinicianPage}
                    onSearch={setClinicianSearchTerm}
                    onValueChange={(value) => {
                      form.setFieldValue("clinician", value);
                      // Clear validation error when value is selected
                      if (validationErrors.clinician) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          clinician: false,
                        }));
                        if (
                          Object.values({
                            ...validationErrors,
                            clinician: false,
                          }).every((v) => !v)
                        ) {
                          setGeneralError(null);
                        }
                      }
                      forceUpdate();
                    }}
                  />
                  {validationErrors.clinician && (
                    <p className="text-xs text-red-500 mt-1">
                      Clinician is required
                    </p>
                  )}

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      checked={form.getFieldValue("cancelAppointments")}
                      className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
                      id="cancel-appointments"
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("cancelAppointments", !!checked)
                      }
                    />
                    <label
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1"
                      htmlFor="cancel-appointments"
                    >
                      Cancel appointments during this time
                    </label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      checked={form.getFieldValue("notifyClients")}
                      className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
                      id="notify-clients"
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("notifyClients", !!checked)
                      }
                    />
                    <label
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1"
                      htmlFor="notify-clients"
                    >
                      Notify clients and contacts of cancellation
                    </label>
                  </div>
                </div>
              ) : (
                // Original Appointment Form Content
                <>
                  <div>
                    <div className="flex gap-2">
                      <button
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-none border text-sm font-normal whitespace-nowrap",
                          form.getFieldValue("clientType") === "individual"
                            ? "border-[#16A34A] bg-[#16A34A]/5 text-[#16A34A]"
                            : "border-gray-200 hover:bg-gray-50",
                        )}
                        type="button"
                        onClick={() =>
                          form.setFieldValue("clientType", "individual")
                        }
                      >
                        <div className="flex -space-x-2">
                          <Avatar className="h-5 w-5 border-2 border-background">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>A</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-5 w-5 border-2 border-background">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>B</AvatarFallback>
                          </Avatar>
                        </div>
                        Individual or couple
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-grow">
                        <SearchSelect
                          searchable
                          showPagination
                          className={cn(
                            "border-gray-200",
                            validationErrors.client && "border-red-500",
                          )}
                          currentPage={clientPage}
                          options={paginatedClients}
                          placeholder={
                            isLoadingClients
                              ? "Loading clients..."
                              : "Search Clients *"
                          }
                          totalPages={clientTotalPages}
                          value={selectedClient}
                          onPageChange={setClientPage}
                          onSearch={setClientSearchTerm}
                          onValueChange={(value) => {
                            handleClientSelect(value);
                            // Clear validation error when value is selected
                            if (validationErrors.client) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                client: false,
                              }));
                              if (
                                Object.values({
                                  ...validationErrors,
                                  client: false,
                                }).every((v) => !v)
                              ) {
                                setGeneralError(null);
                              }
                            }
                          }}
                        />
                        {validationErrors.client && (
                          <p className="text-xs text-red-500 mt-1">
                            Client is required
                          </p>
                        )}
                      </div>
                      <button
                        className="text-sm font-medium text-[#16A34A] hover:text-[#16A34A]/90 whitespace-nowrap"
                        type="button"
                        onClick={() => {
                          const formattedDate = selectedDate
                            ? format(selectedDate, "MMMM d, yyyy")
                            : "";
                          const formattedTime =
                            form.getFieldValue("startTime") || "12:00 PM";
                          onCreateClient?.(formattedDate, formattedTime);
                        }}
                      >
                        + Create client
                      </button>
                    </div>

                    <h2 className="text-sm mb-4">Appointment details</h2>

                    <div className="space-y-4">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          checked={allDay}
                          className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
                          id="appointment-all-day"
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("allDay", !!checked)
                          }
                        />
                        <label
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1"
                          htmlFor="appointment-all-day"
                        >
                          All day
                        </label>
                      </div>

                      {allDay ? (
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                          <DatePicker
                            className="border-gray-200"
                            value={startDate}
                            onChange={(date) => {
                              handleDateChange("startDate", date);
                              forceUpdate(); // Ensure UI updates
                            }}
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <div className="flex items-center gap-2">
                            <DatePicker
                              className="border-gray-200"
                              value={endDate}
                              onChange={(date) => {
                                handleDateChange("endDate", date);
                                forceUpdate(); // Ensure UI updates
                              }}
                            />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {differenceInDays(
                                endDate || new Date(),
                                startDate || new Date(),
                              )}{" "}
                              days
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <DatePicker
                            className="border-gray-200"
                            value={startDate}
                            onChange={(date) => {
                              handleDateChange("startDate", date);
                              forceUpdate(); // Ensure UI updates
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center flex-1">
                              <TimePicker
                                className="border-gray-200"
                                value={startTime}
                                onChange={(time) => {
                                  handleTimeChange("startTime", time);
                                  forceUpdate(); // Ensure UI updates
                                }}
                                data-timepicker
                              />
                              <span className="text-sm text-gray-500">to</span>
                              <TimePicker
                                className="border-gray-200"
                                value={endTime}
                                onChange={(time) => {
                                  handleTimeChange("endTime", time);
                                  forceUpdate(); // Ensure UI updates
                                }}
                                data-timepicker
                              />
                            </div>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {duration}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          checked={isRecurring}
                          className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
                          id="appointment-recurring"
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("recurring", !!checked)
                          }
                        />
                        <label
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1"
                          htmlFor="appointment-recurring"
                        >
                          Recurring
                        </label>
                      </div>

                      {isRecurring && (
                        <RecurringControl
                          open={open}
                          startDate={startDate || new Date()}
                          visible={true}
                          onRecurringChange={(recurringValues) => {
                            console.log("Recurring values:", recurringValues);
                          }}
                        />
                      )}

                      <SearchSelect
                        searchable
                        showPagination
                        className={cn(
                          "border-gray-200",
                          validationErrors.location && "border-red-500",
                        )}
                        currentPage={locationPage}
                        icon={<MapPin className="h-4 w-4 text-gray-500" />}
                        options={paginatedLocationOptions}
                        placeholder={
                          isLoadingLocations
                            ? "Loading locations..."
                            : "Search Locations *"
                        }
                        totalPages={locationTotalPages}
                        value={form.getFieldValue("location")}
                        onPageChange={setLocationPage}
                        onSearch={setLocationSearchTerm}
                        onValueChange={(value) => {
                          form.setFieldValue("location", value);
                          // Clear validation error when value is selected
                          if (validationErrors.location) {
                            setValidationErrors((prev) => ({
                              ...prev,
                              location: false,
                            }));
                            if (
                              Object.values({
                                ...validationErrors,
                                location: false,
                              }).every((v) => !v)
                            ) {
                              setGeneralError(null);
                            }
                          }
                          forceUpdate();
                        }}
                      />
                      {validationErrors.location && (
                        <p className="text-xs text-red-500 mt-1">
                          Location is required
                        </p>
                      )}

                      {selectedClient && (
                        <>
                          <SearchSelect
                            searchable
                            showPagination
                            className={cn(
                              "border-gray-200",
                              validationErrors.clinician && "border-red-500",
                            )}
                            currentPage={clinicianPage}
                            options={paginatedClinicianOptions}
                            placeholder={
                              isLoadingClinicians
                                ? "Loading clinicians..."
                                : "Search Team Members *"
                            }
                            totalPages={clinicianTotalPages}
                            value={form.getFieldValue("clinician")}
                            onPageChange={setClinicianPage}
                            onSearch={setClinicianSearchTerm}
                            onValueChange={(value) => {
                              form.setFieldValue("clinician", value);
                              // Clear validation error when value is selected
                              if (validationErrors.clinician) {
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  clinician: false,
                                }));
                                if (
                                  Object.values({
                                    ...validationErrors,
                                    clinician: false,
                                  }).every((v) => !v)
                                ) {
                                  setGeneralError(null);
                                }
                              }
                              forceUpdate();
                            }}
                          />
                          {validationErrors.clinician && (
                            <p className="text-xs text-red-500 mt-1">
                              Clinician is required
                            </p>
                          )}

                          <SearchSelect
                            searchable
                            showPagination
                            className={cn(
                              "border-gray-200",
                              validationErrors.service && "border-red-500",
                            )}
                            currentPage={servicePage}
                            options={paginatedServiceOptions}
                            placeholder={
                              isLoadingServices
                                ? "Loading services..."
                                : "Search Services *"
                            }
                            totalPages={serviceTotalPages}
                            value={selectedServices[0]?.serviceId || ""}
                            onPageChange={setServicePage}
                            onSearch={setServiceSearchTerm}
                            onValueChange={(value: string) => {
                              const selectedServiceOption = services.find(
                                (option) => option.id === value,
                              );
                              const fee = selectedServiceOption?.rate || 0;

                              const newServices = [
                                { serviceId: value, fee: fee },
                              ];
                              setSelectedServices(newServices);
                              form.setFieldValue(
                                "selectedServices",
                                newServices,
                              );

                              // Clear validation error when value is selected
                              if (validationErrors.service) {
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  service: false,
                                }));
                                if (
                                  Object.values({
                                    ...validationErrors,
                                    service: false,
                                  }).every((v) => !v)
                                ) {
                                  setGeneralError(null);
                                }
                              }
                            }}
                          />
                          {validationErrors.service && (
                            <p className="text-xs text-red-500 mt-1">
                              Service is required
                            </p>
                          )}
                          <div className="flex justify-end mt-2">
                            <div className="w-32">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">Fee</span>
                                <div className="relative flex-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    $
                                  </span>
                                  <input
                                    className="w-full rounded-none border border-gray-200 py-2 pl-8 pr-3 text-sm"
                                    type="number"
                                    value={selectedServices[0]?.fee || 0}
                                    onChange={(e) => {
                                      const newServices = [...selectedServices];
                                      if (newServices.length > 0) {
                                        newServices[0] = {
                                          ...newServices[0],
                                          fee:
                                            Number.parseInt(e.target.value) ||
                                            0,
                                        };
                                        setSelectedServices(newServices);
                                        form.setFieldValue(
                                          "selectedServices",
                                          newServices,
                                        );
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Billing information - Always visible */}
                  {selectedClient && (
                    <div className="mt-4 space-y-2 border-t pt-4">
                      <div className="flex justify-between text-sm">
                        <span>Billing Type</span>
                        <span>Self-pay</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Appointment Total</span>
                        <span>
                          $
                          {selectedServices.reduce(
                            (sum, service) => sum + Number(service.fee),
                            0,
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t">
              {generalError && (
                <p className="text-sm text-red-500 mr-auto">{generalError}</p>
              )}
              <Button
                className="h-9 px-4 rounded-none hover:bg-transparent"
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                {isViewMode ? "Close" : "Cancel"}
              </Button>
              {!isViewMode && (
                <Button
                  className="h-9 px-4 bg-[#16A34A] hover:bg-[#16A34A]/90 rounded-none"
                  type="submit"
                  disabled={sessionStatus !== "authenticated"}
                >
                  Done
                </Button>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

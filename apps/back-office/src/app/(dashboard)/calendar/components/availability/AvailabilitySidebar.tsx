"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
} from "@mcw/ui";
import { X, Minus, Trash2 } from "lucide-react";
import { DateTimeControls } from "./components/FormControls";
import { AvailabilityFormProvider } from "./context/FormContext";
import { useFormTabs } from "./hooks/useFormTabs";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@mcw/utils";
import { calculateDuration } from "../appointment-dialog/utils/CalculateDuration";
import {
  AvailabilitySidebarProps,
  Service,
  AvailabilityService,
  Location,
} from "./types";
import { DeleteAvailabilityModal } from "./DeleteAvailabilityModal";
import { ValidationError } from "../appointment-dialog/components/ValidationError";
import { useSession } from "next-auth/react";

export function AvailabilitySidebar({
  open,
  onOpenChange,
  selectedDate = new Date(),
  selectedResource,
  availabilityData: initialAvailabilityData,
  isEditMode = false,
}: AvailabilitySidebarProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.user?.roles?.includes("ADMIN") || false;
  const isClinician = session?.user?.roles?.includes("CLINICIAN") || false;
  const userId = session?.user?.id;

  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const apiStartDate = startOfWeek.toISOString().split("T")[0];
  const apiEndDate = endOfWeek.toISOString().split("T")[0];

  const { data: fetchedAvailabilityData, isLoading: isLoadingAvailability } =
    useQuery({
      queryKey: [
        "availability",
        initialAvailabilityData?.id,
        apiStartDate,
        apiEndDate,
      ],
      queryFn: async () => {
        // If we have an ID, fetch specific availability
        if (initialAvailabilityData?.id) {
          const response = await fetch(
            `/api/availability?id=${initialAvailabilityData.id}`,
          );
          if (!response.ok) {
            throw new Error("Failed to fetch availability");
          }
          return response.json();
        }
        // Otherwise fetch by date range
        const response = await fetch(
          `/api/availability?startDate=${apiStartDate}&endDate=${apiEndDate}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch availability");
        }
        return response.json();
      },
      enabled:
        isEditMode &&
        (!!initialAvailabilityData?.id || (!!apiStartDate && !!apiEndDate)),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    });

  // Use fetched data if available, otherwise use initial data
  const availabilityData = fetchedAvailabilityData || initialAvailabilityData;
  const [allowOnlineRequests, setAllowOnlineRequests] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "MON",
    "WED",
    "FRI",
  ]);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [frequency, setFrequency] = useState("1");
  const [period, setPeriod] = useState("week");
  const [endType, setEndType] = useState("never");
  const [endValue, setEndValue] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteOption, setDeleteOption] = useState<"single" | "future" | "all">(
    "single",
  );
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [duration, setDuration] = useState<string>("0 mins");
  const [localSelectedServices, setLocalSelectedServices] = useState<string[]>(
    [],
  );
  const [validationState, setValidationState] = useState<
    Record<string, boolean>
  >({});

  // State for user's clinician ID
  const [userClinicianId, setUserClinicianId] = useState<string | null>(null);

  // Fetch clinician ID for non-admin users
  useEffect(() => {
    const fetchClinicianId = async () => {
      if (isClinician && !isAdmin && userId) {
        try {
          const response = await fetch(`/api/clinician?userId=${userId}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.id) {
              setUserClinicianId(data.id);
            }
          }
        } catch (error) {
          console.error("Error fetching clinician ID:", error);
        }
      }
    };

    fetchClinicianId();
  }, [isClinician, isAdmin, userId]);

  // Use user's clinician ID if they're a clinician, otherwise use selectedResource
  const effectiveClinicianId =
    isClinician && !isAdmin && userClinicianId
      ? userClinicianId
      : selectedResource;

  // Fetch availability services if we have an availability ID
  const {
    data: availabilityServices = [],
    isLoading: _isLoadingAvailabilityServices,
  } = useQuery<AvailabilityService[]>({
    queryKey: ["availabilityServices", availabilityData?.id],
    queryFn: async (): Promise<AvailabilityService[]> => {
      if (!availabilityData?.id) return [];
      try {
        const response = await fetch(
          `/api/availability?id=${availabilityData.id}&services=true`,
        );
        if (response.ok) {
          const data = await response.json();
          // The API returns an object with services array
          return Array.isArray(data) ? data : data.services || [];
        }
        return [];
      } catch (error) {
        console.error("Error fetching availability services:", error);
        return [];
      }
    },
    enabled: !!availabilityData?.id && isEditMode,
  });

  const { availabilityFormValues, setAvailabilityFormValues, forceUpdate } =
    useFormTabs(effectiveClinicianId, selectedDate);

  // Update form values when effective clinician ID changes
  useEffect(() => {
    if (
      effectiveClinicianId &&
      availabilityFormValues.clinician !== effectiveClinicianId
    ) {
      setAvailabilityFormValues((prev) => ({
        ...prev,
        clinician: effectiveClinicianId,
      }));
    }
  }, [
    effectiveClinicianId,
    availabilityFormValues.clinician,
    setAvailabilityFormValues,
  ]);

  // Fetch locations
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await fetch("/api/location");
      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }
      const data = await response.json();
      // Ensure the result is always an array
      return Array.isArray(data) ? data : [data];
    },
  });

  // State to store fetched services
  const [fetchedServices, setFetchedServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // Fetch team members for admin users
  const { data: teamMembers = [], isLoading: isLoadingTeamMembers } = useQuery({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      const response = await fetch("/api/clinician");
      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!session?.user?.roles?.includes("ADMIN"),
  });

  // Clear validation errors
  const clearValidationError = (field: string) => {
    setValidationState((prev) => ({
      ...prev,
      [field]: false,
    }));
  };

  // Use React Query to fetch practice services
  const {
    data: servicesData,
    isLoading: isLoadingServicesQuery,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ["practiceServices"],
    queryFn: async () => {
      const response = await fetch("/api/service");
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Failed to fetch services:",
          response.status,
          response.statusText,
        );
        console.error("Error response:", errorText);
        throw new Error("Failed to fetch services");
      }
      return response.json();
    },
    enabled: false, // Only fetch when explicitly triggered
  });

  // Update fetched services when data changes
  useEffect(() => {
    if (servicesData) {
      let services: Service[] = [];
      if (Array.isArray(servicesData)) {
        // Map snake_case to camelCase if needed
        services = servicesData.map((service: Record<string, unknown>) => ({
          id: service.id as string,
          type: service.type as string,
          code: service.code as string,
          duration: service.duration as number,
          description: service.description as string,
          rate: service.rate as number,
          defaultRate: service.rate as number, // API returns rate, not defaultRate
          color: service.color as string,
          isActive: (service.is_active as boolean) ?? true,
          isDefault: (service.is_default as boolean) ?? false,
          billInUnits: (service.bill_in_units as boolean) ?? false,
          availableOnline: (service.available_online as boolean) ?? false,
          allowNewClients: (service.allow_new_clients as boolean) ?? false,
          requireCall: (service.require_call as boolean) ?? false,
          blockBefore: (service.block_before as number) ?? 0,
          blockAfter: (service.block_after as number) ?? 0,
        }));
      } else if (
        servicesData.services &&
        Array.isArray(servicesData.services)
      ) {
        services = servicesData.services;
      } else if (servicesData.data && Array.isArray(servicesData.data)) {
        services = servicesData.data;
      }
      setFetchedServices(services);
    }
  }, [servicesData]);

  // Update loading state when query loading changes
  useEffect(() => {
    setIsLoadingServices(isLoadingServicesQuery);
  }, [isLoadingServicesQuery]);

  // Function to fetch all practice services
  const fetchServices = async () => {
    await refetchServices();
  };

  // Use fetched services or empty array
  const allServices = fetchedServices;

  // Update state when availabilityData changes
  useEffect(() => {
    if (open && availabilityData) {
      setAllowOnlineRequests(availabilityData.allow_online_requests || false);
      setIsRecurring(availabilityData.is_recurring || false);
      setTitle(availabilityData.title || "");
      // Use location_id if available, otherwise location
      setSelectedLocation(
        availabilityData.location_id || availabilityData.location || "",
      );

      // Don't initialize services here - handled in separate effect

      // Handle recurring rule parsing
      if (availabilityData.recurring_rule && availabilityData.is_recurring) {
        // Parse BYDAY
        const byDayMatch =
          availabilityData.recurring_rule.match(/BYDAY=([^;]+)/);
        if (byDayMatch) {
          setSelectedDays(byDayMatch[1].split(","));
        }

        // Parse INTERVAL
        const intervalMatch =
          availabilityData.recurring_rule.match(/INTERVAL=(\d+)/);
        if (intervalMatch) {
          setFrequency(intervalMatch[1]);
        }

        // Parse FREQ
        const freqMatch = availabilityData.recurring_rule.match(/FREQ=(\w+)/);
        if (freqMatch) {
          setPeriod(freqMatch[1].toLowerCase());
        }

        // Parse end rule
        if (availabilityData.recurring_rule.includes("COUNT=")) {
          setEndType("occurrences");
          const countMatch =
            availabilityData.recurring_rule.match(/COUNT=(\d+)/);
          if (countMatch) {
            setEndValue(countMatch[1]);
          }
        } else if (availabilityData.recurring_rule.includes("UNTIL=")) {
          setEndType("date");
          const untilMatch =
            availabilityData.recurring_rule.match(/UNTIL=(\d{8})/);
          if (untilMatch) {
            const year = untilMatch[1].slice(0, 4);
            const month = untilMatch[1].slice(4, 6);
            const day = untilMatch[1].slice(6, 8);
            setEndValue(`${year}-${month}-${day}`);
          }
        } else {
          setEndType("never");
          setEndValue("");
        }
      } else {
        // Reset recurring values if not recurring
        setSelectedDays(["MON", "WED", "FRI"]);
        setFrequency("1");
        setPeriod("week");
        setEndType("never");
        setEndValue("");
      }

      // Update the unified form state for editing
      setAvailabilityFormValues((prev) => ({
        ...prev,
        title: availabilityData.title || "",
        startDate: availabilityData.start_date
          ? new Date(availabilityData.start_date)
          : prev.startDate,
        endDate: availabilityData.end_date
          ? new Date(availabilityData.end_date)
          : prev.endDate,
        startTime: availabilityData.start_date
          ? (() => {
              const date = new Date(availabilityData.start_date);
              // Adjust for timezone offset to get the original local time
              const tzOffset = date.getTimezoneOffset() * 60000;
              const localDate = new Date(date.getTime() + tzOffset);
              return format(localDate, "h:mm a");
            })()
          : "9:00 AM",
        endTime: availabilityData.end_date
          ? (() => {
              const date = new Date(availabilityData.end_date);
              // Adjust for timezone offset to get the original local time
              const tzOffset = date.getTimezoneOffset() * 60000;
              const localDate = new Date(date.getTime() + tzOffset);
              return format(localDate, "h:mm a");
            })()
          : "5:00 PM",
        type: "availability",
        clinician: availabilityData.clinician_id || "",
        location:
          availabilityData.location_id || availabilityData.location || "",
        allowOnlineRequests: availabilityData.allow_online_requests || false,
        isRecurring: availabilityData.is_recurring || false,
        recurringRule: availabilityData.recurring_rule || undefined,
        selectedServices: availabilityData.service_id
          ? [availabilityData.service_id]
          : [],
      }));
    } else if (!isEditMode) {
      // Only reset values if not in edit mode
      setAllowOnlineRequests(false);
      setIsRecurring(false);
      setSelectedDays(["MON", "WED", "FRI"]);
      setTitle("");
      setFrequency("1");
      setPeriod("week");
      setEndType("never");
      setEndValue("");
      setSelectedLocation("");
      setLocalSelectedServices([]);
    }
  }, [open, availabilityData, setAvailabilityFormValues, isEditMode]);

  // Initialize selected services only once when they're first loaded
  useEffect(() => {
    if (
      isEditMode &&
      availabilityServices.length > 0 &&
      localSelectedServices.length === 0 &&
      open
    ) {
      setLocalSelectedServices(availabilityServices.map((s) => s.id));
      // Also fetch all services for the dropdown in edit mode
      fetchServices();
    }
  }, [availabilityServices.length, isEditMode, open]); // Only depend on length, not the array itself

  // Fetch services when component opens
  useEffect(() => {
    if (open && !isEditMode) {
      fetchServices();
    }
  }, [open, isEditMode]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showServiceDropdown) {
        const target = event.target as Element;
        if (!target.closest(".service-dropdown-container")) {
          setShowServiceDropdown(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showServiceDropdown]);

  // Calculate duration dynamically based on form values
  useEffect(() => {
    const startDate = availabilityFormValues.startDate;
    const endDate = availabilityFormValues.endDate;
    const startTime = availabilityFormValues.startTime;
    const endTime = availabilityFormValues.endTime;
    const allDay = availabilityFormValues.allDay;

    setDuration(
      calculateDuration(startDate, endDate, startTime, endTime, allDay),
    );
  }, [
    availabilityFormValues.startDate,
    availabilityFormValues.endDate,
    availabilityFormValues.startTime,
    availabilityFormValues.endTime,
    availabilityFormValues.allDay,
  ]);

  // Helper function to create recurring rule in RFC5545 format
  const createRecurringRule = () => {
    if (!isRecurring) return null;

    const parts = [`FREQ=${period.toUpperCase()}`];

    if (frequency && parseInt(frequency) > 1) {
      parts.push(`INTERVAL=${frequency}`);
    }

    if (period === "week" && selectedDays.length > 0) {
      parts.push(`BYDAY=${selectedDays.join(",")}`);
    }

    if (endType === "occurrences" && endValue) {
      parts.push(`COUNT=${endValue}`);
    } else if (endType === "date" && endValue) {
      const endDate = new Date(endValue);
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, "0");
      const day = String(endDate.getDate()).padStart(2, "0");
      parts.push(`UNTIL=${year}${month}${day}T235959Z`);
    }

    return parts.join(";");
  };

  // Helper function to convert date and time to local ISO string
  const getDateTimeUTC = (date: Date, timeStr?: string) => {
    const newDate = new Date(date);
    if (timeStr) {
      try {
        // Handle both 12-hour format (1:00 PM) and 24-hour format (13:00)
        if (timeStr.includes(" ")) {
          // 12-hour format with AM/PM
          const [timeValue, period] = timeStr.split(" ");
          const [hours, minutes] = timeValue.split(":").map(Number);
          let hours24 = hours;
          if (period.toUpperCase() === "PM" && hours !== 12) hours24 += 12;
          if (period.toUpperCase() === "AM" && hours === 12) hours24 = 0;
          newDate.setHours(hours24, minutes, 0, 0);
        } else {
          // 24-hour format
          const [hours, minutes] = timeStr.split(":").map(Number);
          newDate.setHours(hours, minutes, 0, 0);
        }
      } catch (error) {
        console.error("Error converting date/time:", error);
      }
    }

    const tzOffset = newDate.getTimezoneOffset() * 60000;
    const localDate = new Date(newDate.getTime() - tzOffset);
    return localDate.toISOString();
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  // Add service to availability
  const handleAddServiceToAvailability = (serviceId: string) => {
    setLocalSelectedServices((prev) => [...prev, serviceId]);
  };

  // Add all services to availability
  const handleAddAllServices = () => {
    const availableServices = allServices.filter(
      (service: Service) => !localSelectedServices.includes(service.id),
    );

    setLocalSelectedServices((prev) => [
      ...prev,
      ...availableServices.map((s) => s.id),
    ]);
    setShowServiceDropdown(false);
  };

  // Remove service from availability
  const handleRemoveServiceFromAvailability = (serviceId: string) => {
    setLocalSelectedServices((prev) => prev.filter((id) => id !== serviceId));
  };

  const handleDelete = async () => {
    try {
      if (!availabilityData?.id) {
        setGeneralError("No availability ID found");
        return;
      }

      // Add deleteOption parameter for recurring availabilities
      const deleteUrl = availabilityData?.is_recurring
        ? `/api/availability?id=${availabilityData.id}&deleteOption=${deleteOption}`
        : `/api/availability?id=${availabilityData.id}`;

      const response = await fetch(deleteUrl, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete availability");
      }

      // Close dialog first, then sidebar after successful deletion
      setIsDeleteDialogOpen(false);
      onOpenChange(false);

      // Ensure API has processed the deletion
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Invalidate all availability-related queries
      await queryClient.invalidateQueries({
        queryKey: ["availabilities"],
      });

      // Invalidate all calendarEvents queries regardless of their additional parameters
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "calendarEvents",
      });

      // Invalidate appointment limits as they might be affected
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "appointmentLimits",
      });

      await queryClient.invalidateQueries({
        queryKey: ["availabilities", apiStartDate, apiEndDate],
      });

      // Force a refetch of all calendar events queries
      await queryClient.refetchQueries({
        predicate: (query) => query.queryKey[0] === "calendarEvents",
      });

      // Trigger custom event for calendar refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("refreshAvailabilities"));
      }

      // Additional safety: invalidate all queries as a final step
      await queryClient.invalidateQueries();
    } catch (error) {
      console.error("Error deleting availability:", error);
      setGeneralError(
        error instanceof Error
          ? error.message
          : "Failed to delete availability",
      );
      // Don't close the dialog on error
      setIsDeleteDialogOpen(false);
    }
  };

  // Save handler for both create and edit
  const handleSave = async () => {
    try {
      // Validate required fields
      if (!availabilityFormValues.clinician) {
        setValidationState((prev) => ({ ...prev, clinician: true }));
        setGeneralError("Please select a team member");
        return;
      }

      // Construct the payload
      const payload = {
        title: title || "Availability",
        start_date: getDateTimeUTC(
          availabilityFormValues.startDate,
          availabilityFormValues.startTime,
        ),
        end_date: getDateTimeUTC(
          availabilityFormValues.endDate,
          availabilityFormValues.endTime,
        ),
        location_id: selectedLocation,
        clinician_id: availabilityFormValues.clinician,
        allow_online_requests: allowOnlineRequests,
        is_recurring: isRecurring,
        recurring_rule: isRecurring ? createRecurringRule() : null,
        selectedServices: localSelectedServices,
      };

      // Call the API to create/update availability
      const response = await fetch(
        "/api/availability" +
          (isEditMode && availabilityData?.id
            ? `?id=${availabilityData.id}`
            : ""),
        {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save availability");
      }

      // Ensure API has processed the changes
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Invalidate all availability-related queries FIRST
      await queryClient.invalidateQueries({
        queryKey: ["availabilities"],
      });

      // Invalidate all calendarEvents queries regardless of their additional parameters
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "calendarEvents",
      });

      // Invalidate appointment limits as they might be affected
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "appointmentLimits",
      });

      await queryClient.invalidateQueries({
        queryKey: ["availabilities", apiStartDate, apiEndDate],
      });

      // Force a refetch of all calendar events queries
      await queryClient.refetchQueries({
        predicate: (query) => query.queryKey[0] === "calendarEvents",
      });

      // Trigger custom event for calendar refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("refreshAvailabilities"));
      }

      // Additional safety: invalidate all queries as a final step
      await queryClient.invalidateQueries();

      // Close sidebar after refresh
      onOpenChange(false);
    } catch (error) {
      setGeneralError(
        error instanceof Error ? error.message : "Failed to save availability",
      );
    }
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 w-[600px] bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50",
        open ? "translate-x-0" : "translate-x-full",
      )}
    >
      {isLoadingAvailability ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : (
        <AvailabilityFormProvider
          duration={duration}
          forceUpdate={forceUpdate}
          form={{
            ...availabilityFormValues,
            setFieldValue: (field, value) =>
              setAvailabilityFormValues((prev) => ({
                ...prev,
                [field]: value,
              })),
            getFieldValue: <T = unknown,>(field: string): T =>
              availabilityFormValues[
                field as keyof typeof availabilityFormValues
              ] as T,
            reset: (values) =>
              setAvailabilityFormValues({
                ...availabilityFormValues,
                ...values,
              }),
            handleSubmit: handleSave,
            state: { values: availabilityFormValues },
          }}
          setGeneralError={() => {}}
          setValidationErrors={() => {}}
          validationErrors={{}}
        >
          <form
            className="h-full flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSave();
            }}
          >
            <div className="flex sticky top-0 bg-white items-center justify-between p-4 border-b z-10">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => onOpenChange(false)}>
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-lg">
                  {isEditMode ? "Edit availability" : "New availability"}
                </h2>
              </div>
              <div className="flex gap-2">
                {isEditMode && (
                  <Button
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    type="button"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white"
                  type="submit"
                >
                  Save
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={allowOnlineRequests}
                    className="mt-1"
                    id="allowRequests"
                    onCheckedChange={(checked) =>
                      setAllowOnlineRequests(checked as boolean)
                    }
                  />
                  <label className="text-gray-900" htmlFor="allowRequests">
                    Allow online appointment requests
                  </label>
                </div>

                <div>
                  <label className="block mb-2">Availability title</label>
                  <Input
                    className="w-full"
                    placeholder="Enter availability title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Team Member Dropdown - Only for Admin */}
                {session?.user?.roles?.includes("ADMIN") && (
                  <div>
                    <label className="block mb-2">Team member</label>
                    <Select
                      value={
                        availabilityFormValues.clinician ||
                        effectiveClinicianId ||
                        ""
                      }
                      onValueChange={(value) => {
                        setAvailabilityFormValues((prev) => ({
                          ...prev,
                          clinician: value,
                        }));
                        clearValidationError("clinician");
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full",
                          validationState.clinician && "border-red-500",
                        )}
                      >
                        <SelectValue
                          placeholder={
                            isLoadingTeamMembers
                              ? "Loading team members..."
                              : "Select a team member *"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map(
                          (member: {
                            id: string;
                            first_name: string;
                            last_name: string;
                          }) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.first_name} {member.last_name}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <ValidationError
                      message="Team member is required"
                      show={!!validationState.clinician}
                    />
                  </div>
                )}

                <DateTimeControls id="availability-date-time" />
                <div className="bg-gray-50 p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isRecurring}
                      className="mt-1"
                      id="recurring"
                      onCheckedChange={(checked) =>
                        setIsRecurring(checked as boolean)
                      }
                    />
                    <label className="text-gray-900" htmlFor="recurring">
                      Recurring
                    </label>
                  </div>

                  {isRecurring && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span>Every</span>
                        <Select value={frequency} onValueChange={setFrequency}>
                          <SelectTrigger className="w-[70px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={period} onValueChange={setPeriod}>
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="week">week</SelectItem>
                            <SelectItem value="month">month</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {period === "week" && (
                        <div className="flex gap-1">
                          {["S", "M", "T", "W", "T", "F", "S"].map(
                            (day, index) => {
                              const dayValue = [
                                "SUN",
                                "MON",
                                "TUE",
                                "WED",
                                "THU",
                                "FRI",
                                "SAT",
                              ][index];
                              return (
                                <button
                                  key={dayValue}
                                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm
                                  ${
                                    selectedDays.includes(dayValue)
                                      ? "bg-[#16A34A] text-white"
                                      : "bg-white border text-gray-700"
                                  }`}
                                  type="button"
                                  onClick={() => toggleDay(dayValue)}
                                >
                                  {day}
                                </button>
                              );
                            },
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span>Ends</span>
                        <Select value={endType} onValueChange={setEndType}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">never</SelectItem>
                            <SelectItem value="date">on date</SelectItem>
                            <SelectItem value="occurrences">
                              after occurrences
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {endType === "date" && (
                          <Input
                            min={format(new Date(), "yyyy-MM-dd")}
                            type="date"
                            value={endValue}
                            onChange={(e) => setEndValue(e.target.value)}
                          />
                        )}
                        {endType === "occurrences" && (
                          <Input
                            max="52"
                            min="1"
                            placeholder="Number of occurrences"
                            type="number"
                            value={endValue}
                            onChange={(e) => setEndValue(e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Location</label>
                  <Select
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {allowOnlineRequests && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-medium">Services</h3>
                    </div>

                    <div className="text-sm text-gray-600">
                      Add services that are set up for online requests.{" "}
                      <button
                        className="text-[#16A34A] hover:underline"
                        onClick={() => {
                          /* Add manage service settings handler */
                        }}
                      >
                        Manage service settings
                      </button>
                    </div>

                    {localSelectedServices.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No services added to this availability yet
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {allServices
                          .filter((service: Service) =>
                            localSelectedServices.includes(service.id),
                          )
                          .map((service: Service) => (
                            <div
                              key={service.id}
                              className="flex items-center justify-between p-4 border rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="font-medium">
                                  {service.code} {service.type}
                                </div>
                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                  <span>{service.duration} min</span>
                                  <span>•</span>
                                  <span>
                                    ${service.defaultRate || service.rate}
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleRemoveServiceFromAvailability(
                                    service.id,
                                  )
                                }
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}

                    <div className="relative service-dropdown-container">
                      <button
                        className=" inline-flex items-center gap-2 px-3 py-2 text-left text-gray-600 bg-[#E5E7EB] rounded-md"
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          // Toggle dropdown
                          const newDropdownState = !showServiceDropdown;
                          setShowServiceDropdown(newDropdownState);

                          // Fetch services when opening
                          if (newDropdownState === true) {
                            try {
                              await fetchServices();
                            } catch (error) {
                              console.error("Error in fetchServices:", error);
                            }
                          }
                        }}
                      >
                        <span>Add service</span>
                      </button>

                      {showServiceDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
                          {/* Header with title */}
                          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-900">
                              Add service
                            </h3>
                          </div>

                          {/* Search Input */}
                          <div className="p-4 border-b border-gray-100">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                  className="h-4 w-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                  />
                                </svg>
                              </div>
                              <Input
                                className="!pl-8 w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500 "
                                placeholder="Search services..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="max-h-64 overflow-y-auto">
                            {/* Loading state */}
                            {isLoadingServices ? (
                              <div className="px-4 py-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
                                <p className="text-sm text-gray-500">
                                  Loading services...
                                </p>
                              </div>
                            ) : (
                              <>
                                {/* Add all services option */}
                                {allServices.filter(
                                  (service: Service) =>
                                    !localSelectedServices.includes(service.id),
                                ).length > 0 && (
                                  <div className="px-4 py-2 bg-[#2D84671A] border-b border-blue-100">
                                    <button
                                      className="w-full text-left py-2 px-3  rounded-lg text-[#2D8467] font-medium text-sm transition-colors duration-150"
                                      type="button"
                                      onClick={handleAddAllServices}
                                    >
                                      <div className="flex items-center gap-2">
                                        <svg
                                          className="h-4 w-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                          />
                                        </svg>
                                        Add all services
                                      </div>
                                    </button>
                                  </div>
                                )}

                                {/* Filtered services list */}
                                <div className="py-2">
                                  {allServices
                                    .filter(
                                      (service: Service) =>
                                        searchTerm === "" ||
                                        service.code
                                          ?.toLowerCase()
                                          .includes(searchTerm.toLowerCase()) ||
                                        service.type
                                          ?.toLowerCase()
                                          .includes(searchTerm.toLowerCase()) ||
                                        service.description
                                          ?.toLowerCase()
                                          .includes(searchTerm.toLowerCase()),
                                    )
                                    .map((service: Service) => {
                                      const isAlreadyAdded =
                                        localSelectedServices.includes(
                                          service.id,
                                        );

                                      return (
                                        <button
                                          key={service.id}
                                          className={cn(
                                            "w-full text-left px-4 py-3 transition-colors duration-150 border-b border-gray-50 last:border-b-0",
                                            isAlreadyAdded
                                              ? "bg-gray-50 cursor-not-allowed"
                                              : "hover:bg-gray-50 cursor-pointer",
                                          )}
                                          disabled={isAlreadyAdded}
                                          type="button"
                                          onClick={() => {
                                            if (!isAlreadyAdded) {
                                              handleAddServiceToAvailability(
                                                service.id,
                                              );
                                              setShowServiceDropdown(false);
                                              setSearchTerm("");
                                            }
                                          }}
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div
                                                className={cn(
                                                  "font-medium text-sm",
                                                  isAlreadyAdded
                                                    ? "text-gray-500"
                                                    : "text-gray-900",
                                                )}
                                              >
                                                {service.code} {service.type}
                                              </div>
                                              {service.duration && (
                                                <div
                                                  className={cn(
                                                    "text-xs mt-1",
                                                    isAlreadyAdded
                                                      ? "text-gray-400"
                                                      : "text-gray-500",
                                                  )}
                                                >
                                                  {service.duration} minutes
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {service.defaultRate ||
                                              service.rate ? (
                                                <div
                                                  className={cn(
                                                    "text-sm font-medium",
                                                    isAlreadyAdded
                                                      ? "text-gray-400"
                                                      : "text-gray-700",
                                                  )}
                                                >
                                                  $
                                                  {service.defaultRate ||
                                                    service.rate}
                                                </div>
                                              ) : null}
                                            </div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                </div>

                                {/* No results message */}
                                {allServices.filter(
                                  (service: Service) =>
                                    searchTerm === "" ||
                                    service.code
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase()) ||
                                    service.type
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase()),
                                ).length === 0 &&
                                  searchTerm !== "" && (
                                    <div className="px-4 py-8 text-center">
                                      <div className="text-gray-400 mb-2">
                                        <svg
                                          className="h-8 w-8 mx-auto"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                          />
                                        </svg>
                                      </div>
                                      <p className="text-sm text-gray-500">
                                        No services found matching
                                      </p>
                                      <p className="text-sm font-medium text-gray-700">
                                        "{searchTerm}"
                                      </p>
                                    </div>
                                  )}

                                {allServices.length === 0 &&
                                  searchTerm === "" &&
                                  !isLoadingServices && (
                                    <div className="px-4 py-8 text-center">
                                      <div className="text-gray-400 mb-2">
                                        <svg
                                          className="h-8 w-8 mx-auto"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-1.414 0l-2.414-2.414a1 1 0 00-.707-.293H8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                          />
                                        </svg>
                                      </div>
                                      <p className="text-sm font-medium text-gray-700">
                                        No services available
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        There are no services in the database
                                      </p>
                                    </div>
                                  )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {generalError && (
                  <div className="text-red-500 text-sm">{generalError}</div>
                )}
              </div>
            </div>
          </form>
        </AvailabilityFormProvider>
      )}

      {/* Delete Availability Modal */}
      <DeleteAvailabilityModal
        isRecurring={availabilityData?.is_recurring}
        open={isDeleteDialogOpen}
        selectedOption={deleteOption}
        onConfirm={handleDelete}
        onOpenChange={setIsDeleteDialogOpen}
        onOptionChange={setDeleteOption}
      />
    </div>
  );
}

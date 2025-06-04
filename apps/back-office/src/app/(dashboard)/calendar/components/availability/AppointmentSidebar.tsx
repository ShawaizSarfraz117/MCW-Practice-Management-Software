"use client";
import { useState, useEffect, useCallback } from "react";
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
import { X, Minus } from "lucide-react";
import { DateTimeControls } from "./components/FormControls";
import { AvailabilityFormProvider } from "./context/FormContext";
import { useFormTabs } from "./hooks/useFormTabs";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@mcw/utils";
import { ValidationError } from "../appointment-dialog/components/ValidationError";
import { calculateDuration } from "../appointment-dialog/utils/CalculateDuration";
import {
  AppointmentSidebarProps,
  Location,
  DetailedService,
  AvailabilityService,
} from "./types";

// Utility function to extract time from a DateTime field
const extractTimeFromDateTime = (dateTime: Date | string): string => {
  const date = typeof dateTime === "string" ? new Date(dateTime) : dateTime;
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Utility function to extract date from a DateTime field
const extractDateFromDateTime = (dateTime: Date | string): Date => {
  return typeof dateTime === "string" ? new Date(dateTime) : dateTime;
};

export function AppointmentSidebar({
  open,
  onOpenChange,
  selectedDate = new Date(),
  selectedResource,
  onDone,
  availabilityData,
  isEditMode = false,
}: AppointmentSidebarProps) {
  const { data: session } = useSession();
  const [allowOnlineRequests, setAllowOnlineRequests] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "MON",
    "WED",
    "FRI",
  ]);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<
    Record<string, boolean>
  >({});
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("1");
  const [period, setPeriod] = useState("week");
  const [endType, setEndType] = useState("never");
  const [endValue, setEndValue] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [duration, setDuration] = useState<string>("0 mins");

  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityId, setAvailabilityId] = useState<string | null>(null);
  const [preSelectedServices, setPreSelectedServices] = useState<string[]>([]);
  const [removedAutoServices, setRemovedAutoServices] = useState<string[]>([]);

  const { availabilityFormValues, setAvailabilityFormValues, forceUpdate } =
    useFormTabs(selectedResource, selectedDate);

  // Stable function to read session storage and update form values
  const updateFormWithSessionStorage = useCallback(() => {
    if (typeof window !== "undefined") {
      const timeSlot = JSON.parse(
        window.sessionStorage.getItem("selectedTimeSlot") || "{}",
      );

      if (timeSlot.startTime && timeSlot.endTime) {
        setAvailabilityFormValues((prev) => ({
          ...prev,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          startDate: selectedDate,
          endDate: selectedDate,
        }));
        return true; // Indicate that values were updated
      }
    }
    return false; // Indicate that no values were updated
  }, [selectedDate, setAvailabilityFormValues]);

  // Handle time slot from session storage - ensure this runs when sidebar opens
  useEffect(() => {
    if (open && !isEditMode) {
      updateFormWithSessionStorage();
    }
  }, [open, isEditMode, updateFormWithSessionStorage]);

  // Clean up session storage when sidebar closes
  useEffect(() => {
    if (!open) {
      window.sessionStorage.removeItem("selectedTimeSlot");
    }
  }, [open]);

  // Stable function to update clinician
  const updateClinicianInForm = useCallback(() => {
    if (selectedResource) {
      setAvailabilityFormValues((prev) => ({
        ...prev,
        clinician: selectedResource,
      }));
    }
  }, [selectedResource, setAvailabilityFormValues]);

  // Handle selected resource (clinician) when sidebar opens or resource changes
  useEffect(() => {
    if (selectedResource && open) {
      updateClinicianInForm();
    }
  }, [selectedResource, open, updateClinicianInForm]);

  // Handle loading availability data for editing
  useEffect(() => {
    if (open && availabilityData && isEditMode) {
      setAllowOnlineRequests(availabilityData.allow_online_requests || false);
      setIsRecurring(availabilityData.is_recurring || false);
      setTitle(availabilityData.title || "");

      // Handle recurring rule parsing if available
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
      }

      // Update form values with availability data, extracting time from start_date and end_date
      setAvailabilityFormValues((prev) => ({
        ...prev,
        title: availabilityData.title || "",
        startDate: availabilityData.start_date
          ? extractDateFromDateTime(availabilityData.start_date)
          : prev.startDate,
        endDate: availabilityData.end_date
          ? extractDateFromDateTime(availabilityData.end_date)
          : prev.endDate,
        startTime: availabilityData.start_date
          ? extractTimeFromDateTime(availabilityData.start_date)
          : prev.startTime,
        endTime: availabilityData.end_date
          ? extractTimeFromDateTime(availabilityData.end_date)
          : prev.endTime,
        clinician: availabilityData.clinician_id || "",
        allowOnlineRequests: availabilityData.allow_online_requests || false,
        isRecurring: availabilityData.is_recurring || false,
      }));
    }
  }, [open, availabilityData, isEditMode]);

  const { data: services = [], isLoading: isLoadingServices } = useQuery<
    DetailedService[]
  >({
    queryKey: ["services", availabilityFormValues.clinician],
    queryFn: async (): Promise<DetailedService[]> => {
      try {
        let url = "/api/service";

        if (availabilityFormValues.clinician) {
          url += `?clinicianId=${availabilityFormValues.clinician}&detailed=true`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const allServices: DetailedService[] = data.services || [];
            return allServices.filter(
              (service: DetailedService) => service.availableOnline === true,
            );
          }
        }
        return [];
      } catch (error) {
        console.error("Error fetching services:", error);
        return [];
      }
    },
    enabled: !!session?.user && !!availabilityFormValues.clinician,
  });

  const { data: allServices = [], isLoading: isLoadingAllServices } = useQuery<
    DetailedService[]
  >({
    queryKey: ["allServices", availabilityFormValues.clinician],
    queryFn: async (): Promise<DetailedService[]> => {
      try {
        let url = "/api/service";

        if (availabilityFormValues.clinician) {
          url += `?clinicianId=${availabilityFormValues.clinician}&detailed=true`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            return data.services || [];
          }
        }
        return [];
      } catch (error) {
        console.error("Error fetching all services:", error);
        return [];
      }
    },
    enabled: !!session?.user && !!availabilityFormValues.clinician,
  });

  const {
    data: availabilityServices = [],
    isLoading: isLoadingAvailabilityServices,
    refetch: refetchAvailabilityServices,
  } = useQuery<AvailabilityService[]>({
    queryKey: ["availabilityServices", availabilityId],
    queryFn: async (): Promise<AvailabilityService[]> => {
      if (!availabilityId) return [];
      try {
        const response = await fetch(
          `/api/availability?id=${availabilityId}&services=true`,
        );
        if (response.ok) {
          const data = await response.json();
          return data.services || [];
        }
        return [];
      } catch (error) {
        console.error("Error fetching availability services:", error);
        return [];
      }
    },
    enabled: !!availabilityId,
  });

  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await fetch("/api/location");
      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [data];
    },
  });

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

  // Helper function to convert date and time to ISO string while preserving local time
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

    // Create ISO string manually to preserve local time interpretation
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, "0");
    const day = String(newDate.getDate()).padStart(2, "0");
    const hours = String(newDate.getHours()).padStart(2, "0");
    const minutes = String(newDate.getMinutes()).padStart(2, "0");
    const seconds = String(newDate.getSeconds()).padStart(2, "0");

    const localISOTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;

    console.log("getDateTimeUTC input:", { date, timeStr });
    console.log("getDateTimeUTC output:", localISOTime);

    return localISOTime;
  };

  const handleSave = async () => {
    try {
      setValidationState({});
      setGeneralError(null);

      if (!availabilityFormValues.clinician) {
        setGeneralError("No team member selected from calendar");
        return;
      }

      if (!selectedLocation) {
        setValidationState((prev) => ({ ...prev, location: true }));
        setGeneralError("Please select a location");
        return;
      }

      const payload = {
        title: title || "New Availability",
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
        selectedServices: [
          ...services
            .filter((s: DetailedService) => !removedAutoServices.includes(s.id))
            .map((s) => s.id),
          ...preSelectedServices,
        ],
      };

      const response = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create availability");
      }

      setAvailabilityId(responseData.id);

      onOpenChange(false);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("refreshAvailabilities"));
      }

      onDone();
    } catch (error) {
      setGeneralError(
        error instanceof Error
          ? error.message
          : "Failed to create availability",
      );
    }
  };

  // Handle background click to close sidebar
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

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

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const clearValidationError = (field: string) => {
    setValidationState((prev) => ({
      ...prev,
      [field]: false,
    }));
    setGeneralError(null);
  };

  // Add service to pre-selected list (before availability creation)
  const handlePreSelectService = (serviceId: string) => {
    setPreSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
    setShowServiceDropdown(false);
  };

  // Add service to availability
  const handleAddServiceToAvailability = async (serviceId: string) => {
    if (!availabilityId) return;

    try {
      const response = await fetch(
        `/api/availability?id=${availabilityId}&services=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ serviceId }),
        },
      );

      if (response.ok) {
        refetchAvailabilityServices();
        setShowServiceDropdown(false);
      } else {
        const errorData = await response.json();
        setGeneralError(errorData.error || "Failed to add service");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setGeneralError("Failed to add service to availability");
    }
  };

  const handleRemoveServiceFromAvailability = async (serviceId: string) => {
    if (!availabilityId) return;

    try {
      const response = await fetch(
        `/api/availability?id=${availabilityId}&services=true&serviceId=${serviceId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        refetchAvailabilityServices();
      } else {
        const errorData = await response.json();
        setGeneralError(errorData.error || "Failed to remove service");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setGeneralError("Failed to remove service from availability");
    }
  };

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/5 z-50"
      onClick={handleBackgroundClick}
    >
      <div
        className="fixed right-0 top-0 h-full w-[600px] bg-white shadow-lg overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex sticky top-0 bg-white items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <button onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg">
              {isEditMode ? "Edit availability" : "New availability"}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {session?.user?.roles?.includes("CLINICIAN") ||
              (session?.user?.roles?.includes("ADMIN") && (
                <Button
                  className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white"
                  disabled={!!generalError}
                  onClick={handleSave}
                >
                  Save
                </Button>
              ))}
          </div>
        </div>

        <AvailabilityFormProvider
          duration={duration}
          forceUpdate={forceUpdate}
          form={{
            ...availabilityFormValues,
            setFieldValue: (
              field: string,
              value: unknown,
              _options?: unknown,
            ) => {
              setAvailabilityFormValues((prev) => ({
                ...prev,
                [field]: value,
              }));
              if (field === "clinician" && value) {
                clearValidationError("clinician");
              }
            },
            getFieldValue: <T = unknown,>(field: string): T =>
              availabilityFormValues[
                field as keyof typeof availabilityFormValues
              ] as T,
            reset: (values: Partial<typeof availabilityFormValues> = {}) =>
              setAvailabilityFormValues({
                ...availabilityFormValues,
                ...values,
              }),
            handleSubmit: () => {},
            state: { values: availabilityFormValues },
          }}
          setGeneralError={setGeneralError}
          setValidationErrors={setValidationState}
          validationErrors={validationState}
        >
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
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
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
                              }
                            `}
                            onClick={() => toggleDay(dayValue)}
                          >
                            {day}
                          </button>
                        );
                      })}
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
                <SelectTrigger
                  className={cn(
                    "w-full",
                    validationState.location && "border-red-500",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
                    <SelectValue
                      placeholder={
                        isLoadingLocations
                          ? "Loading locations..."
                          : "Select a location *"
                      }
                    />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location: Location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ValidationError
                message="Location is required"
                show={!!validationState.location}
              />
            </div>

            {/* Services Section */}
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

              {availabilityId ? (
                isLoadingAvailabilityServices ? (
                  <div className="text-center py-4 text-gray-500">
                    Loading availability services...
                  </div>
                ) : availabilityServices.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No services added to this availability yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">
                      Added Services:
                    </div>
                    {availabilityServices.map(
                      (service: AvailabilityService) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200"
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
                              handleRemoveServiceFromAvailability(service.id)
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ),
                    )}
                  </div>
                )
              ) : isLoadingServices ? (
                <div className="text-center py-4 text-gray-500">
                  Loading services...
                </div>
              ) : !availabilityFormValues.clinician ? (
                <div className="text-center py-4 text-gray-500">
                  No team member selected from calendar
                </div>
              ) : services.length === 0 && preSelectedServices.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No services available for online requests for the selected
                  team member
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    ...services.filter(
                      (s: DetailedService) =>
                        !removedAutoServices.includes(s.id),
                    ),
                    ...allServices.filter((s: DetailedService) =>
                      preSelectedServices.includes(s.id),
                    ),
                  ].map((service: DetailedService) => {
                    const serviceData = {
                      id: service.id,
                      code: service.code,
                      type: service.type,
                      duration: service.duration,
                      rate: service.defaultRate || service.rate,
                      isCustomRate: !!service.customRate,
                      isActive: service.isActive !== false,
                    };

                    return (
                      <div
                        key={serviceData.id}
                        className={cn(
                          "flex items-center justify-between p-4 border rounded-lg",
                          !serviceData.isActive && "opacity-50 bg-gray-50",
                        )}
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {serviceData.code} {serviceData.type}
                            {!serviceData.isActive && (
                              <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <span>{serviceData.duration} min</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              ${serviceData.rate}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (preSelectedServices.includes(serviceData.id)) {
                              // Remove from pre-selected services
                              setPreSelectedServices((prev) =>
                                prev.filter((id) => id !== serviceData.id),
                              );
                            } else {
                              // This is an auto-added service, add it to removed list
                              setRemovedAutoServices((prev) => [
                                ...prev,
                                serviceData.id,
                              ]);
                            }
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="relative service-dropdown-container">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-2 text-left text-gray-600 bg-[#E5E7EB] rounded-md"
                  onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                >
                  <span>Add service</span>
                </button>

                {showServiceDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
                    {/* Header with title */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Add Service
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
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <Input
                          type="text"
                          placeholder="Search"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="!pl-8 w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {isLoadingAllServices ? (
                      <div className="px-4 py-8 text-center">
                        <div className="text-gray-400 mb-2">
                          <svg
                            className="h-8 w-8 mx-auto animate-spin"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">
                          Loading services...
                        </p>
                      </div>
                    ) : allServices.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="text-gray-400 mb-2">
                          <svg
                            className="h-8 w-8 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          No services available
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          No services found for the selected team member
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {!availabilityId &&
                          allServices.filter(
                            (service: DetailedService) =>
                              searchTerm === "" ||
                              service.code
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase()) ||
                              service.type
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase()),
                          ).length > 0 && (
                            <div className="px-4 py-2 bg-[#2D84671A] border-b border-blue-100">
                              <button
                                type="button"
                                className="w-full text-left py-2 px-3  rounded-lg text-[#2D8467] font-medium text-sm transition-colors duration-150"
                                onClick={() => {
                                  const filteredServices = allServices.filter(
                                    (service: DetailedService) =>
                                      searchTerm === "" ||
                                      service.code
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase()) ||
                                      service.type
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase()),
                                  );
                                  filteredServices.forEach(
                                    (service: DetailedService) => {
                                      if (
                                        !preSelectedServices.includes(
                                          service.id,
                                        )
                                      ) {
                                        handlePreSelectService(service.id);
                                      }
                                    },
                                  );
                                  setShowServiceDropdown(false);
                                  setSearchTerm("");
                                }}
                              >
                                Add all services
                              </button>
                            </div>
                          )}

                        {/* Services list */}
                        <div className="py-2">
                          {availabilityId
                            ? // After availability is created - show services not yet added
                              allServices
                                .filter(
                                  (service: DetailedService) =>
                                    !availabilityServices.some(
                                      (as: AvailabilityService) =>
                                        as.id === service.id,
                                    ),
                                )
                                .filter(
                                  (service: DetailedService) =>
                                    searchTerm === "" ||
                                    service.code
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase()) ||
                                    service.type
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase()),
                                )
                                .map((service: DetailedService) => (
                                  <button
                                    key={service.id}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
                                    onClick={() => {
                                      handleAddServiceToAvailability(
                                        service.id,
                                      );
                                      setShowServiceDropdown(false);
                                      setSearchTerm("");
                                    }}
                                  >
                                    <div className="text-gray-900 text-sm">
                                      {service.code} {service.type}
                                      {service.duration && (
                                        <span className="text-gray-500">
                                          , {service.duration} min
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                ))
                            : // Before availability is created - show all services that can be selected
                              allServices
                                .filter(
                                  (service: DetailedService) =>
                                    searchTerm === "" ||
                                    service.code
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase()) ||
                                    service.type
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase()),
                                )
                                .map((service: DetailedService) => (
                                  <button
                                    key={service.id}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
                                    onClick={() => {
                                      handlePreSelectService(service.id);
                                      setShowServiceDropdown(false);
                                      setSearchTerm("");
                                    }}
                                  >
                                    <div className="text-gray-900 text-sm">
                                      {service.code} {service.type}
                                      {service.duration && (
                                        <span className="text-gray-500">
                                          , {service.duration} min
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                ))}

                          {/* No results message */}
                          {allServices.filter(
                            (service: DetailedService) =>
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
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
                        </div>

                        {/* All services already added message */}
                        {availabilityId &&
                          allServices.filter(
                            (service: DetailedService) =>
                              !availabilityServices.some(
                                (as: AvailabilityService) =>
                                  as.id === service.id,
                              ),
                          ).length === 0 && (
                            <div className="px-4 py-8 text-center">
                              <div className="text-green-400 mb-2">
                                <svg
                                  className="h-8 w-8 mx-auto"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <p className="text-sm font-medium text-gray-700">
                                All services added
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                All available services have been added to this
                                availability
                              </p>
                            </div>
                          )}

                        {/* Bottom spacing */}
                        <div className="h-4"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {generalError && (
              <div className="text-red-500 text-sm">{generalError}</div>
            )}
          </div>
        </AvailabilityFormProvider>
      </div>
    </div>
  );
}

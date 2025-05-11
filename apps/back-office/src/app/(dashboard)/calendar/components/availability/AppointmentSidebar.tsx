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
  SearchSelect,
} from "@mcw/ui";
import { X, Plus, Minus } from "lucide-react";
import { DateTimeControls } from "./components/FormControls";
import { AvailabilityFormProvider } from "./context/FormContext";
import { useFormTabs } from "./hooks/useFormTabs";
import {
  AppointmentData,
  Clinician,
  Service,
} from "../appointment-dialog/types";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@mcw/utils";
import { ValidationError } from "../appointment-dialog/components/ValidationError";
import { calculateDuration } from "../appointment-dialog/utils/CalculateDuration";

interface AppointmentSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedResource: string | null;
  onCreateClient?: (date: string, time: string) => void;
  onDone: () => void;
  appointmentData?: AppointmentData;
  isViewMode?: boolean;
  timeSlot?: {
    startTime: string;
    endTime: string;
    duration: string;
  };
  onClose: () => void;
}

// function adaptFormToInterface(originalForm: unknown): FormInterface {
//   return originalForm as FormInterface;
// }

export function AppointmentSidebar({
  open,
  onOpenChange,
  selectedDate = new Date(),
  selectedResource,
  onDone,
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
  const [selectedLocation, setSelectedLocation] = useState("video");
  const [services, setServices] = useState<Service[]>([]);
  const [_clinician, setClinician] = useState<Clinician[]>([]);
  const [duration, setDuration] = useState<string>("0 mins");

  // const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [clinicianPage, setClinicianPage] = useState(1);
  const [_clinicianSearchTerm, setClinicianSearchTerm] = useState("");

  // Initialize form values with stored time slot data
  useEffect(() => {
    if (open) {
      // Update form values with selected date from calendar
      setAvailabilityFormValues((prev) => ({
        ...prev,
        startDate: selectedDate,
        endDate: selectedDate,
      }));

      const selectedTimeSlotData =
        window.sessionStorage.getItem("selectedTimeSlot");
      if (selectedTimeSlotData) {
        try {
          const timeData = JSON.parse(selectedTimeSlotData);
          setAvailabilityFormValues((prev) => ({
            ...prev,
            startTime: timeData.startTime || prev.startTime,
            endTime: timeData.endTime || prev.endTime,
          }));
        } catch (error) {
          console.error("Error parsing time slot data:", error);
        }
      }
    }
  }, [open, selectedDate]); // Add selectedDate to dependencies

  const { availabilityFormValues, setAvailabilityFormValues, forceUpdate } =
    useFormTabs(selectedResource, selectedDate);

  // Fetch clinicians with role-based permissions
  const { data: clinicians = [], isLoading: isLoadingClinicians } = useQuery({
    queryKey: [
      "clinicians",
      selectedResource,
      session?.user?.roles?.includes("CLINICIAN") &&
        !session?.user?.roles?.includes("ADMIN") &&
        session?.user?.id,
    ],
    queryFn: async () => {
      let url = "/api/clinician";
      // If user is a clinician and not an admin, fetch only their own data
      if (
        session?.user?.roles?.includes("CLINICIAN") &&
        !session?.user?.roles?.includes("ADMIN") &&
        session?.user?.id
      ) {
        url += `?userId=${session.user.id}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch clinicians");
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [data];
    },
    enabled: !!session?.user,
  });

  // Format clinician options for the SearchSelect
  const formattedClinicianOptions = clinicians.map((clinician) => ({
    label: `${clinician.first_name} ${clinician.last_name}`,
    value: clinician.id,
  }));

  // Fetch services when component mounts
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`/api/service`);
        if (response.ok) {
          const data = await response.json();
          setServices(data);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    if (session?.user?.id || selectedResource) {
      fetchServices();
    }
  }, [session?.user?.id, selectedResource]);

  useEffect(() => {
    const fetchClinician = async () => {
      try {
        const response = await fetch(`/api/clinician`);
        if (response.ok) {
          const data = await response.json();
          setClinician(data);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    if (session?.user?.id || selectedResource) {
      fetchClinician();
    }
  }, [session?.user?.id, selectedResource]);

  // Helper function to create recurring rule in RFC5545 format
  const createRecurringRule = () => {
    if (!isRecurring) return null;

    const parts = [`FREQ=${period.toUpperCase()}`];

    // Add interval (frequency)
    if (frequency && parseInt(frequency) > 1) {
      parts.push(`INTERVAL=${frequency}`);
    }

    // Add weekdays for weekly recurrence
    if (period === "week" && selectedDays.length > 0) {
      parts.push(`BYDAY=${selectedDays.join(",")}`);
    }

    // Add end condition
    if (endType === "occurrences" && endValue) {
      parts.push(`COUNT=${endValue}`);
    } else if (endType === "date" && endValue) {
      // Format the end date as YYYYMMDD for UNTIL
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
    if (!timeStr) return date.toISOString();

    try {
      // Create a new date object from the selected date
      const newDate = new Date(date);

      // Parse the time string (e.g., "8:00 AM")
      const [timeValue, period] = timeStr.split(" ");
      const [hours, minutes] = timeValue.split(":").map(Number);

      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error("Invalid time format");
      }

      // Convert to 24-hour format
      let hours24 = hours;
      if (period?.toUpperCase() === "PM" && hours !== 12) hours24 += 12;
      if (period?.toUpperCase() === "AM" && hours === 12) hours24 = 0;

      // Set the time components while keeping the original date
      newDate.setHours(hours24);
      newDate.setMinutes(minutes);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);

      return newDate.toISOString();
    } catch (error) {
      console.error("Error converting date/time:", error);
      return date.toISOString();
    }
  };

  // Handle save button click
  const handleSave = async () => {
    try {
      // Clear any existing errors first
      setValidationState({});
      setGeneralError(null);

      // Validate required fields
      if (!availabilityFormValues.clinician) {
        setValidationState((prev) => ({ ...prev, clinician: true }));
        setGeneralError("Please select a team member");
        return;
      }

      // Get the stored time values
      const storedTimeData = window.sessionStorage.getItem("selectedTimeSlot");
      const timeData = storedTimeData ? JSON.parse(storedTimeData) : null;

      // Use stored raw time values if available, otherwise use form values
      const startTime = timeData?.startTime || availabilityFormValues.startTime;
      const endTime = timeData?.endTime || availabilityFormValues.endTime;

      // Construct the payload using the form's date values which are now properly synced with selectedDate
      const payload = {
        title: title || "New Availability",
        start_date: getDateTimeUTC(
          selectedDate, // Use selectedDate directly
          startTime,
        ),
        end_date: getDateTimeUTC(
          selectedDate, // Use selectedDate directly
          endTime,
        ),
        location: selectedLocation,
        clinician_id: availabilityFormValues.clinician,
        allow_online_requests: allowOnlineRequests,
        is_recurring: isRecurring,
        recurring_rule: isRecurring ? createRecurringRule() : null,
      };

      // Call the API to create availability
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

      // Clear the stored time slot after successful save
      window.sessionStorage.removeItem("selectedTimeSlot");

      // Close the sidebar and refresh the calendar
      onOpenChange(false);

      // Trigger a refresh of availabilities
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

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  // const setValidationErrors = (errors: Record<string, boolean>) => {
  //   setValidationState(errors);
  // };

  // Clear validation error for a specific field
  const clearValidationError = (field: string) => {
    setValidationState((prev) => ({
      ...prev,
      [field]: false,
    }));
    setGeneralError(null);
  };

  // Update duration when times change
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
        <div className="flex sticky top-0 bg-white items-center justify-between p-4 border-b z-[100]">
          <div className="flex items-center gap-3">
            <button onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg">New availability</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {session?.user?.roles?.includes("CLINICIAN") &&
              !session?.user?.roles?.includes("ADMIN") && (
                <Button
                  className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white"
                  disabled={!!generalError}
                  onClick={handleSave}
                >
                  Save
                </Button>
              )}
          </div>
        </div>

        <div className="relative z-[90]">
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
                // Clear validation error when clinician is selected
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
              handleSubmit: () => {
                /* implement submit logic here */
              },
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

              <div>
                <label className="block mb-2">Team member</label>
                <SearchSelect
                  searchable
                  showPagination
                  className={cn(
                    "border-gray-200",
                    validationState.clinician && "border-red-500",
                  )}
                  currentPage={clinicianPage}
                  options={formattedClinicianOptions}
                  placeholder={
                    isLoadingClinicians
                      ? "Loading team members..."
                      : "Search Team Members *"
                  }
                  value={availabilityFormValues.clinician}
                  onPageChange={setClinicianPage}
                  onSearch={setClinicianSearchTerm}
                  onValueChange={(value) => {
                    setAvailabilityFormValues((prev) => ({
                      ...prev,
                      clinician: value,
                    }));
                    clearValidationError("clinician");
                  }}
                />
                <ValidationError
                  message="Team member is required"
                  show={!!validationState.clinician}
                />
              </div>

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
                                }
                              `}
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
                    <SelectItem value="video">Video Office</SelectItem>
                    <SelectItem value="physical">Physical Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Services Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium">Services</h3>
                  <Button
                    className="text-[#16A34A] hover:text-[#16A34A]/90"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Fetch all services again when Add service is clicked
                      fetch("/api/service")
                        .then((response) => response.json())
                        .then((data) => setServices(data))
                        .catch((error) =>
                          console.error("Error fetching services:", error),
                        );
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add service
                  </Button>
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

                <div className="space-y-3">
                  {services.map((service, index) => {
                    return (
                      <div
                        key={service?.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {service.code} {service.type}
                          </div>
                          <div className="text-sm text-gray-600">
                            {service.duration} min • ${service.rate}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setServices(services.filter((_, i) => i !== index));
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {generalError && (
                <div className="text-red-500 text-sm">{generalError}</div>
              )}
            </div>
          </AvailabilityFormProvider>
        </div>
      </div>
    </div>
  );
}
// ... existing code ...

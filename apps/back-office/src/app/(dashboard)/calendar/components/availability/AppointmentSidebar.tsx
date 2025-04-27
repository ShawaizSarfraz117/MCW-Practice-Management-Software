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
import { DateTimeControls } from "../appointment-dialog/components/FormControls";
import { FormProvider } from "../appointment-dialog/context/FormContext";
import { useForm } from "@tanstack/react-form";
import {
  AppointmentData,
  Clinician,
  FormInterface,
  Service,
} from "../appointment-dialog/types";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@mcw/utils";
import { ValidationError } from "../appointment-dialog/components/ValidationError";

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

function adaptFormToInterface(originalForm: unknown): FormInterface {
  return originalForm as FormInterface;
}

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
  const [clinician, setClinician] = useState<Clinician[]>([]);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [clinicianPage, setClinicianPage] = useState(1);
  const [_clinicianSearchTerm, setClinicianSearchTerm] = useState("");

  // Get stored time slot from session storage
  const timeSlot =
    typeof window !== "undefined"
      ? JSON.parse(window.sessionStorage.getItem("selectedTimeSlot") || "{}")
      : {};

  const form = useForm({
    defaultValues: {
      startDate: selectedDate,
      endDate: selectedDate,
      startTime: timeSlot.startTime || format(selectedDate, "hh:mm a"),
      endTime:
        timeSlot.endTime ||
        format(new Date(selectedDate.getTime() + 60 * 60 * 1000), "hh:mm a"),
      allDay: false,
      type: "availability",
      clinician: clinician[0]?.id || "",
      location: selectedLocation,
      eventName: "",
      recurring: false,
    },
    onSubmit: async ({ value }) => {
      try {
        // Validate clinician selection
        if (!value.clinician) {
          setValidationState((prev) => ({ ...prev, clinician: true }));
          throw new Error("Please select a team member");
        }

        // Create the availability payload
        const payload = {
          title: title || "New Availability",
          is_all_day: value.allDay,
          start_date: getDateTimeISOString(value.startDate, value.startTime),
          end_date: getDateTimeISOString(value.endDate, value.endTime),
          location: selectedLocation,
          clinician_id: value.clinician,
          allow_online_requests: allowOnlineRequests,
          is_recurring: isRecurring,
          recurring_rule: isRecurring ? createRecurringRule() : null,
        };

        console.log("Submitting availability payload:", payload);

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
          throw new Error(
            responseData.error || "Failed to create availability",
          );
        }

        // Close the sidebar and refresh the calendar
        onOpenChange(false);
        onDone();
      } catch (error) {
        console.error("Error creating availability:", error);
        setGeneralError(
          error instanceof Error
            ? error.message
            : "Failed to create availability",
        );
      }
    },
  });

  // Fetch clinicians with role-based permissions
  const { data: clinicians = [], isLoading: isLoadingClinicians } = useQuery({
    queryKey: [
      "clinicians",
      selectedResource,
      session?.user?.isAdmin,
      session?.user?.isClinician,
    ],
    queryFn: async () => {
      let url = "/api/clinician";

      // If user is a clinician and not an admin, fetch only their own data
      if (
        session?.user?.isClinician &&
        !session?.user?.isAdmin &&
        session?.user?.id
      ) {
        url += `?id=${session.user.id}`;
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

  // Helper function to convert date and time to ISO string
  const getDateTimeISOString = (date: Date, timeStr?: string) => {
    if (!timeStr) return date.toISOString();

    try {
      const [timeValue, period] = timeStr.split(" ");
      const [hours, minutes] = timeValue.split(":").map(Number);

      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error("Invalid time format");
      }

      // Convert 12-hour format to 24-hour
      let hours24 = hours;
      if (period.toUpperCase() === "PM" && hours !== 12) hours24 += 12;
      if (period.toUpperCase() === "AM" && hours === 12) hours24 = 0;

      // Create a new date with the correct time
      const newDate = new Date(date);
      newDate.setHours(hours24, minutes, 0, 0);

      // Return the ISO string
      return newDate.toISOString();
    } catch (error) {
      console.error("Error converting date/time:", error);
      return date.toISOString();
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

  const setValidationErrors = (errors: Record<string, boolean>) => {
    setValidationState(errors);
  };

  // Clear validation error for a specific field
  const clearValidationError = (field: string) => {
    setValidationState((prev) => ({
      ...prev,
      [field]: false,
    }));
  };

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
            <h2 className="text-lg">New availability</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white"
              onClick={() => form.handleSubmit()}
            >
              Save
            </Button>
          </div>
        </div>

        <FormProvider
          form={adaptFormToInterface(form)}
          duration={timeSlot?.duration || "1 hour"}
          validationErrors={validationState}
          setValidationErrors={setValidationErrors}
          setGeneralError={setGeneralError}
          isAdmin={session?.user?.isAdmin || false}
          isClinician={session?.user?.isClinician || false}
          effectiveClinicianId={selectedResource || session?.user?.id || ""}
          shouldFetchData={!!session?.user}
          forceUpdate={() => {
            const currentValues = form.state.values;
            form.reset({
              ...currentValues,
              startDate: selectedDate,
              endDate: selectedDate,
              startTime: timeSlot.startTime || format(selectedDate, "hh:mm a"),
              endTime:
                timeSlot.endTime ||
                format(
                  new Date(selectedDate.getTime() + 60 * 60 * 1000),
                  "hh:mm a",
                ),
            });
          }}
        >
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3">
              <Checkbox
                id="allowRequests"
                checked={allowOnlineRequests}
                onCheckedChange={(checked) =>
                  setAllowOnlineRequests(checked as boolean)
                }
                className="mt-1"
              />
              <label htmlFor="allowRequests" className="text-gray-900">
                Allow online appointment requests
              </label>
            </div>

            <div>
              <label className="block mb-2">Availability title</label>
              <Input
                className="w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter availability title"
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
                value={form.getFieldValue("clinician")}
                onPageChange={setClinicianPage}
                onSearch={setClinicianSearchTerm}
                onValueChange={(value) => {
                  form.setFieldValue("clinician", value);
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
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) =>
                    setIsRecurring(checked as boolean)
                  }
                  className="mt-1"
                />
                <label htmlFor="recurring" className="text-gray-900">
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
                            onClick={() => toggleDay(dayValue)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm
                              ${
                                selectedDays.includes(dayValue)
                                  ? "bg-[#16A34A] text-white"
                                  : "bg-white border text-gray-700"
                              }`}
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
                        type="date"
                        value={endValue}
                        onChange={(e) => setEndValue(e.target.value)}
                        min={format(new Date(), "yyyy-MM-dd")}
                      />
                    )}
                    {endType === "occurrences" && (
                      <Input
                        type="number"
                        value={endValue}
                        onChange={(e) => setEndValue(e.target.value)}
                        min="1"
                        max="52"
                        placeholder="Number of occurrences"
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
                  variant="outline"
                  size="sm"
                  className="text-[#16A34A] hover:text-[#16A34A]/90"
                  onClick={() => {
                    if (
                      services.length > 0 &&
                      !selectedServices.includes(services[0].id)
                    ) {
                      setSelectedServices([
                        ...selectedServices,
                        services[0].id,
                      ]);
                    }
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
                {services.map((service) => {
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
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedServices(
                            selectedServices.filter((id) => id !== service.id),
                          );
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
        </FormProvider>
      </div>
    </div>
  );
}

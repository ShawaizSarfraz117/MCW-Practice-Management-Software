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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@mcw/ui";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { DateTimeControls } from "./components/FormControls";
import { AvailabilityFormProvider } from "./context/FormContext";
import { useFormTabs } from "./hooks/useFormTabs";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@mcw/utils";

interface AvailabilitySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedResource: string | null;
  onClose: () => void;
  availabilityData?: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    location: string;
    clinician_id: string;
    allow_online_requests: boolean;
    is_recurring: boolean;
    recurring_rule: string | null;
    service_id?: string;
  };
  isEditMode?: boolean;
}

interface Service {
  id: string;
  type: string;
  code: string;
  duration: number;
  description: string;
  rate: number;
}

export function AvailabilitySidebar({
  open,
  onOpenChange,
  selectedDate = new Date(),
  selectedResource,
  availabilityData: initialAvailabilityData,
  isEditMode = false,
}: AvailabilitySidebarProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Calculate start and end dates for the current week
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay()); // Start from Sunday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday

  // Format dates for API
  const apiStartDate = startOfWeek.toISOString().split("T")[0];
  const apiEndDate = endOfWeek.toISOString().split("T")[0];

  // Fetch availability data when in edit mode
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
  const [selectedLocation, setSelectedLocation] = useState("video");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const { availabilityFormValues, setAvailabilityFormValues, forceUpdate } =
    useFormTabs(selectedResource, selectedDate);

  // Update state when availabilityData changes
  useEffect(() => {
    if (open && availabilityData) {
      // Format times in local timezone
      const formatToLocalTime = (dateStr: string) => {
        // Create a date object from the UTC string
        const date = new Date(dateStr);

        // Get UTC hours and minutes
        const utcHours = date.getUTCHours();
        const utcMinutes = date.getUTCMinutes();

        // Convert to 12-hour format
        const period = utcHours >= 12 ? "PM" : "AM";
        const displayHours = utcHours % 12 || 12;

        return `${displayHours.toString().padStart(2, "0")}:${utcMinutes.toString().padStart(2, "0")} ${period}`;
      };

      // Update the unified form state for editing
      setAvailabilityFormValues((prev) => ({
        ...prev,
        title: availabilityData.title || "",
        startDate: new Date(availabilityData.start_date),
        endDate: new Date(availabilityData.end_date),
        startTime: formatToLocalTime(availabilityData.start_date),
        endTime: formatToLocalTime(availabilityData.end_date),
        type: "availability",
        clinician: availabilityData.clinician_id || "",
        location: availabilityData.location || "video",
        allowOnlineRequests: availabilityData.allow_online_requests || false,
        isRecurring: availabilityData.is_recurring || false,
        recurringRule: availabilityData.recurring_rule || undefined,
        selectedServices: availabilityData.service_id
          ? [availabilityData.service_id]
          : [],
      }));

      // Update other state values
      setAllowOnlineRequests(availabilityData.allow_online_requests || false);
      setIsRecurring(availabilityData.is_recurring || false);
      setTitle(availabilityData.title || "");
      setSelectedLocation(availabilityData.location || "video");

      // Handle recurring rule if present
      if (availabilityData.is_recurring && availabilityData.recurring_rule) {
        const ruleParams = availabilityData.recurring_rule.split(";").reduce(
          (acc: Record<string, string>, param: string) => {
            const [key, value] = param.split("=");
            acc[key] = value;
            return acc;
          },
          {} as Record<string, string>,
        );

        // Set recurring values based on the rule
        setFrequency(ruleParams.INTERVAL || "1");
        setPeriod(ruleParams.FREQ?.toLowerCase() || "week");

        if (ruleParams.BYDAY) {
          setSelectedDays(ruleParams.BYDAY.split(","));
        }

        if (ruleParams.COUNT) {
          setEndType("occurrences");
          setEndValue(ruleParams.COUNT);
        } else if (ruleParams.UNTIL) {
          setEndType("date");
          // Convert UNTIL date from YYYYMMDD format to YYYY-MM-DD
          const untilDate = ruleParams.UNTIL.substring(0, 8);
          setEndValue(
            `${untilDate.substring(0, 4)}-${untilDate.substring(4, 6)}-${untilDate.substring(6, 8)}`,
          );
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
    } else {
      // Reset all values if no availabilityData
      setAllowOnlineRequests(false);
      setIsRecurring(false);
      setSelectedDays(["MON", "WED", "FRI"]);
      setTitle("");
      setFrequency("1");
      setPeriod("week");
      setEndType("never");
      setEndValue("");
      setSelectedLocation("video");
    }
  }, [open, availabilityData, setAvailabilityFormValues]);

  // Fetch services when component mounts
  useEffect(() => {
    const fetchServices = async () => {
      try {
        let url = "/api/service";

        // If user is a clinician and not an admin, fetch only their services
        if (
          session?.user?.roles?.includes("CLINICIAN") &&
          !session?.user?.roles?.includes("ADMIN") &&
          availabilityFormValues.clinician
        ) {
          url += `?clinicianId=${availabilityFormValues.clinician}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setServices(Array.isArray(data) ? data : [data]);

          // If editing, set selected services from availability data
          if (isEditMode && availabilityData?.service_id) {
            setSelectedServices([availabilityData.service_id]);
          }
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    // Only fetch when we have a session and clinician data if needed
    if (session?.user?.id) {
      fetchServices();
    }
  }, [
    session?.user?.id,
    session?.user?.roles,
    availabilityFormValues.clinician,
    isEditMode,
    availabilityData,
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

  // Update getDateTimeISOString function to handle UTC properly
  const getDateTimeISOString = (date: Date, timeStr?: string) => {
    try {
      if (!timeStr) {
        return date.toISOString();
      }

      // Parse the time string (e.g., "1:00 PM")
      const [timeValue, period] = timeStr.split(" ");
      const [hours, minutes] = timeValue.split(":").map(Number);

      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error("Invalid time format");
      }

      // Convert to 24-hour format
      let hours24 = hours;
      if (period.toUpperCase() === "PM" && hours !== 12) hours24 += 12;
      if (period.toUpperCase() === "AM" && hours === 12) hours24 = 0;

      // Create a new date and set UTC time
      const newDate = new Date(date);
      newDate.setUTCHours(hours24, minutes, 0, 0);

      return newDate.toISOString();
    } catch (error) {
      console.error("Error converting date/time:", error);
      return date.toISOString();
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `/api/availability?id=${availabilityData?.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete availability");
      }

      // Close sidebar first
      onOpenChange(false);

      // Invalidate and refetch with date range
      await queryClient.invalidateQueries({
        queryKey: ["availabilities", apiStartDate, apiEndDate],
      });

      // Trigger a new fetch with date range
      await queryClient.fetchQuery({
        queryKey: ["availabilities", apiStartDate, apiEndDate],
        queryFn: async () => {
          const response = await fetch(
            `/api/availability?startDate=${apiStartDate}&endDate=${apiEndDate}`,
          );
          if (!response.ok) {
            throw new Error("Failed to fetch availabilities");
          }
          return response.json();
        },
      });
    } catch (error) {
      console.error("Error deleting availability:", error);
      setGeneralError(
        error instanceof Error
          ? error.message
          : "Failed to delete availability",
      );
    }
  };

  // Save handler for both create and edit
  const handleSave = async () => {
    try {
      // Validate required fields
      if (!availabilityFormValues.clinician) {
        setGeneralError("Please select a team member");
        return;
      }

      // Construct the payload
      const payload = {
        title: title || "Availability",
        start_date: getDateTimeISOString(
          availabilityFormValues.startDate,
          availabilityFormValues.startTime,
        ),
        end_date: getDateTimeISOString(
          availabilityFormValues.endDate,
          availabilityFormValues.endTime,
        ),
        location: selectedLocation,
        clinician_id: availabilityFormValues.clinician,
        allow_online_requests: allowOnlineRequests,
        is_recurring: isRecurring,
        recurring_rule: isRecurring ? createRecurringRule() : null,
        service_id: selectedServices[0] || null,
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

      // Close sidebar first
      onOpenChange(false);

      // Invalidate and refetch with date range
      await queryClient.invalidateQueries({
        queryKey: ["availabilities", apiStartDate, apiEndDate],
      });

      // Trigger a new fetch with date range
      await queryClient.fetchQuery({
        queryKey: ["availabilities", apiStartDate, apiEndDate],
        queryFn: async () => {
          const response = await fetch(
            `/api/availability?startDate=${apiStartDate}&endDate=${apiEndDate}`,
          );
          if (!response.ok) {
            throw new Error("Failed to fetch availabilities");
          }
          return response.json();
        },
      });
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
          duration={"1 hour"}
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
                <button onClick={() => onOpenChange(false)}>
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-lg">
                  {isEditMode ? "Edit availability" : "New availability"}
                </h2>
              </div>
              <div className="flex gap-2">
                {isEditMode && (
                  <AlertDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Availability</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this availability?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={handleDelete}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
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

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">Services</h3>
                    <Button
                      className="text-[#16A34A] hover:text-[#16A34A]/90"
                      size="sm"
                      variant="outline"
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
                      const isSelected = selectedServices.includes(service.id);
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
                          {isSelected && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                // Only update the frontend state
                                setSelectedServices(
                                  selectedServices.filter(
                                    (id) => id !== service.id,
                                  ),
                                );
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {generalError && (
                  <div className="text-red-500 text-sm">{generalError}</div>
                )}
              </div>
            </div>
          </form>
        </AvailabilityFormProvider>
      )}
    </div>
  );
}

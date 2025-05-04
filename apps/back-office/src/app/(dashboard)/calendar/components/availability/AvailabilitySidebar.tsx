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
      setAllowOnlineRequests(availabilityData.allow_online_requests || false);
      setIsRecurring(availabilityData.is_recurring || false);
      setTitle(availabilityData.title || "");
      setSelectedLocation(availabilityData.location || "video");

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
          ? format(new Date(availabilityData.start_date), "hh:mm a")
          : prev.startTime,
        endTime: availabilityData.end_date
          ? format(new Date(availabilityData.end_date), "hh:mm a")
          : prev.endTime,
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
        const response = await fetch(`/api/service`);
        if (response.ok) {
          const data = await response.json();
          setServices(data);

          // If editing, set selected services from availability data
          if (isEditMode && availabilityData?.service_id) {
            setSelectedServices([availabilityData.service_id]);
          }
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    if (session?.user?.id || selectedResource) {
      fetchServices();
    }
  }, [session?.user?.id, selectedResource, isEditMode, availabilityData]);

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

  // Helper function to convert date and time to ISO string
  const getDateTimeISOString = (date: Date, timeStr?: string) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (!timeStr)
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
    try {
      const [timeValue, period] = timeStr.split(" ");
      const [hours, minutes] = timeValue.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error("Invalid time format");
      }
      let hours24 = hours;
      if (period.toUpperCase() === "PM" && hours !== 12) hours24 += 12;
      if (period.toUpperCase() === "AM" && hours === 12) hours24 = 0;
      const newDate = new Date(date);
      newDate.setHours(hours24, minutes, 0, 0);
      return `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}T${pad(newDate.getHours())}:${pad(newDate.getMinutes())}:00`;
    } catch (error) {
      console.error("Error converting date/time:", error);
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <AvailabilityFormProvider
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
          duration={"1 hour"}
          validationErrors={{}}
          setValidationErrors={() => {}}
          setGeneralError={() => {}}
          forceUpdate={forceUpdate}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSave();
            }}
            className="h-full flex flex-col"
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
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                          onClick={handleDelete}
                          className="bg-red-600 hover:bg-red-700 text-white"
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
                  type="submit"
                  className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white"
                >
                  Save
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
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
                                selectedServices.filter(
                                  (id) => id !== service.id,
                                ),
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
            </div>
          </form>
        </AvailabilityFormProvider>
      )}
    </div>
  );
}

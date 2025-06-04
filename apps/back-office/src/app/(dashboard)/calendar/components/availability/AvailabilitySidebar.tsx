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
} from "./types";

export function AvailabilitySidebar({
  open,
  onOpenChange,
  selectedDate = new Date(),
  selectedResource,
  availabilityData: initialAvailabilityData,
  isEditMode = false,
}: AvailabilitySidebarProps) {
  const queryClient = useQueryClient();

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
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [duration, setDuration] = useState<string>("0 mins");

  // Fetch availability services if we have an availability ID
  const {
    data: availabilityServices = [],
    isLoading: isLoadingAvailabilityServices,
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
          return data.services || [];
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
    useFormTabs(selectedResource, selectedDate);

  // Fetch all services for the dropdown
  const { data: allServices = [] } = useQuery<Service[]>({
    queryKey: [
      "allServices",
      availabilityData?.clinician_id || availabilityFormValues.clinician,
    ],
    queryFn: async (): Promise<Service[]> => {
      try {
        let url = "/api/service";
        const clinicianId =
          availabilityData?.clinician_id || availabilityFormValues.clinician;

        if (clinicianId) {
          url += `?clinicianId=${clinicianId}&detailed=true`;
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
    enabled: !!(
      availabilityData?.clinician_id || availabilityFormValues.clinician
    ),
  });

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
  const handleAddServiceToAvailability = async (serviceId: string) => {
    if (!availabilityData?.id) return;

    try {
      const response = await fetch(
        `/api/availability?id=${availabilityData.id}&services=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ serviceId }),
        },
      );

      if (response.ok) {
        // Refresh availability services
        queryClient.invalidateQueries({
          queryKey: ["availabilityServices", availabilityData.id],
        });
      } else {
        const errorData = await response.json();
        setGeneralError(errorData.error || "Failed to add service");
      }
    } catch (error) {
      console.error("Error add service:", error);
      setGeneralError("Failed to add service to availability");
    }
  };

  // Add all services to availability
  const handleAddAllServices = async () => {
    if (!availabilityData?.id) return;

    const availableServices = allServices.filter(
      (service: Service) =>
        !availabilityServices.some(
          (as: AvailabilityService) => as.id === service.id,
        ),
    );

    try {
      // Add all services one by one
      for (const service of availableServices) {
        await fetch(
          `/api/availability?id=${availabilityData.id}&services=true`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ serviceId: service.id }),
          },
        );
      }

      // Refresh availability services
      queryClient.invalidateQueries({
        queryKey: ["availabilityServices", availabilityData.id],
      });

      setShowServiceDropdown(false);
    } catch (error) {
      console.error("Error add all services:", error);
      setGeneralError("Failed to add all services");
    }
  };

  // Remove service from availability
  const handleRemoveServiceFromAvailability = async (serviceId: string) => {
    if (!availabilityData?.id) return;

    try {
      const response = await fetch(
        `/api/availability?id=${availabilityData.id}&services=true&serviceId=${serviceId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        // Refresh availability services
        queryClient.invalidateQueries({
          queryKey: ["availabilityServices", availabilityData.id],
        });
      } else {
        const errorData = await response.json();
        setGeneralError(errorData.error || "Failed to remove service");
      }
    } catch (error) {
      console.error("Error remove service:", error);
      setGeneralError("Failed to remove service from availability");
    }
  };

  const handleDelete = async () => {
    try {
      console.log("Delete attempt - availabilityData:", availabilityData);
      console.log(
        "Delete attempt - availabilityData.id:",
        availabilityData?.id,
      );

      if (!availabilityData?.id) {
        setGeneralError("No availability ID found");
        return;
      }

      const response = await fetch(
        `/api/availability?id=${availabilityData.id}`,
        {
          method: "DELETE",
        },
      );

      console.log("Delete response status:", response.status);
      console.log("Delete response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Delete error data:", errorData);
        throw new Error(errorData.error || "Failed to delete availability");
      }

      // Close sidebar first
      onOpenChange(false);

      // Invalidate all availability-related queries
      await queryClient.invalidateQueries({
        queryKey: ["availabilities"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["availabilities", apiStartDate, apiEndDate],
      });

      // Trigger custom event for calendar refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("refreshAvailabilities"));
      }

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
        start_date: getDateTimeUTC(
          availabilityFormValues.startDate,
          availabilityFormValues.startTime,
        ),
        end_date: getDateTimeUTC(
          availabilityFormValues.endDate,
          availabilityFormValues.endTime,
        ),
        location: selectedLocation,
        clinician_id: availabilityFormValues.clinician,
        allow_online_requests: allowOnlineRequests,
        is_recurring: isRecurring,
        recurring_rule: isRecurring ? createRecurringRule() : null,
        selectedServices: availabilityServices.map((service) => service.id),
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

      // Invalidate all availability-related queries
      await queryClient.invalidateQueries({
        queryKey: ["availabilities"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["availabilities", apiStartDate, apiEndDate],
      });

      // Trigger custom event for calendar refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("refreshAvailabilities"));
      }

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
                                  type="button"
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

                  {isLoadingAvailabilityServices ? (
                    <div className="text-center py-4 text-gray-500">
                      Loading services...
                    </div>
                  ) : availabilityServices.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No services added to this availability yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availabilityServices.map(
                        (service: AvailabilityService) => (
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
                                handleRemoveServiceFromAvailability(service.id)
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  <div className="relative service-dropdown-container">
                    <button
                      type="button"
                      className=" inline-flex items-center gap-2 px-3 py-2 text-left text-gray-600 bg-[#E5E7EB] rounded-md"
                      onClick={() =>
                        setShowServiceDropdown(!showServiceDropdown)
                      }
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
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                            </div>
                            <Input
                              type="text"
                              placeholder="Search services..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="!pl-8 w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500 "
                            />
                          </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                          {/* Add all services option */}
                          {allServices.filter(
                            (service: Service) =>
                              !availabilityServices.some(
                                (as: AvailabilityService) =>
                                  as.id === service.id,
                              ),
                          ).length > 0 && (
                            <div className="px-4 py-2 bg-[#2D84671A] border-b border-blue-100">
                              <button
                                type="button"
                                className="w-full text-left py-2 px-3  rounded-lg text-[#2D8467] font-medium text-sm transition-colors duration-150"
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
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
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
                                  !availabilityServices.some(
                                    (as: AvailabilityService) =>
                                      as.id === service.id,
                                  ),
                              )
                              .filter(
                                (service: Service) =>
                                  searchTerm === "" ||
                                  service.code
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase()) ||
                                  service.type
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase()),
                              )
                              .map((service: Service) => (
                                <button
                                  key={service.id}
                                  type="button"
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0"
                                  onClick={() => {
                                    handleAddServiceToAvailability(service.id);
                                    setShowServiceDropdown(false);
                                    setSearchTerm("");
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900 text-sm">
                                        {service.code} {service.type}
                                      </div>
                                      {service.duration && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {service.duration} minutes
                                        </div>
                                      )}
                                    </div>
                                    {service.defaultRate || service.rate ? (
                                      <div className="text-sm font-medium text-gray-700 ml-3">
                                        ${service.defaultRate || service.rate}
                                      </div>
                                    ) : null}
                                  </div>
                                </button>
                              ))}
                          </div>

                          {/* No results message */}
                          {allServices
                            .filter(
                              (service: Service) =>
                                !availabilityServices.some(
                                  (as: AvailabilityService) =>
                                    as.id === service.id,
                                ),
                            )
                            .filter(
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

                          {allServices.filter(
                            (service: Service) =>
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
                        </div>
                      </div>
                    )}
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

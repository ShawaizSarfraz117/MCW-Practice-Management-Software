import { useCallback, useState } from "react";
import { AppointmentData, FormInterface } from "../types";
import { useQuery } from "@tanstack/react-query";
import { Location, Service } from "../types";

interface UseAppointmentUpdateProps {
  form: FormInterface;
  appointmentData?: AppointmentData;
  setIsConfirmationOpen: (value: boolean) => void;
  setGeneralError: (error: string | null) => void;
  setValidationErrors: (errors: Record<string, boolean>) => void;
  validationErrors: Record<string, boolean>;
  forceUpdate: () => void;
  effectiveClinicianId?: string | null;
  isAdmin?: boolean;
  isClinician?: boolean;
  shouldFetchData?: boolean;
  onDone?: () => void;
}

interface RecurringInfo {
  period: string;
  frequency?: string;
  selectedDays?: string[];
  monthlyPattern?: string;
  endType?: string;
  endValue?: string | number;
}

function constructRecurringRule(
  recurringInfo: RecurringInfo,
  startDate: Date,
): string {
  const parts = [`FREQ=${recurringInfo.period}`];

  // Add interval (frequency)
  if (recurringInfo.frequency && parseInt(recurringInfo.frequency) > 1) {
    parts.push(`INTERVAL=${recurringInfo.frequency}`);
  }

  // Add weekdays for weekly recurrence
  if (
    recurringInfo.period === "WEEKLY" &&
    recurringInfo.selectedDays &&
    recurringInfo.selectedDays.length > 0
  ) {
    parts.push(`BYDAY=${recurringInfo.selectedDays.join(",")}`);
  }

  // Add monthly pattern if specified
  if (recurringInfo.period === "MONTHLY" && recurringInfo.monthlyPattern) {
    if (recurringInfo.monthlyPattern === "onDateOfMonth") {
      // Use BYMONTHDAY for same day each month
      const dayOfMonth = startDate.getDate();
      parts.push(`BYMONTHDAY=${dayOfMonth}`);
    } else if (recurringInfo.monthlyPattern === "onWeekDayOfMonth") {
      // Use BYDAY with ordinal for same weekday each month
      const dayOfWeek = startDate.getDay();
      const weekNumber = Math.ceil(startDate.getDate() / 7);
      const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      parts.push(`BYDAY=${weekNumber}${days[dayOfWeek]}`);
    } else if (recurringInfo.monthlyPattern === "onLastWeekDayOfMonth") {
      // Use BYDAY with -1 for last weekday of month
      const dayOfWeek = startDate.getDay();
      const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      parts.push(`BYDAY=-1${days[dayOfWeek]}`);
    }
  }

  // Add end condition
  if (recurringInfo.endType === "After" && recurringInfo.endValue) {
    parts.push(`COUNT=${recurringInfo.endValue}`);
  } else if (recurringInfo.endType === "On Date" && recurringInfo.endValue) {
    // Format the end date as YYYYMMDD for UNTIL
    const endDate = new Date(recurringInfo.endValue);
    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, "0");
    const day = String(endDate.getDate()).padStart(2, "0");
    parts.push(`UNTIL=${year}${month}${day}T235959Z`);
  }

  return parts.join(";");
}

// function processDateTime(date: Date, time: string): string {
//   const [hours, minutes] = time.split(":");
//   const period = time.split(" ")[1];
//   let hour = parseInt(hours);

//   if (period === "PM" && hour !== 12) hour += 12;
//   if (period === "AM" && hour === 12) hour = 0;

//   const dateTime = new Date(date);
//   dateTime.setHours(hour, parseInt(minutes.split(" ")[0]), 0, 0);

//   const tzOffset = dateTime.getTimezoneOffset() * 60000;
//   return new Date(dateTime.getTime() - tzOffset).toISOString();
// }

export function useAppointmentUpdate({
  form,
  appointmentData,
  setIsConfirmationOpen,
  setGeneralError,
  setValidationErrors,
  validationErrors,
  forceUpdate,
  effectiveClinicianId,
  isAdmin,
  isClinician,
  shouldFetchData,
  onDone,
}: UseAppointmentUpdateProps) {
  // State
  const [locationPage, setLocationPage] = useState(1);
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const itemsPerPage = 10;

  // API Queries
  const { data: locationsData = [], isLoading: isLoadingLocations } = useQuery<
    Location[]
  >({
    queryKey: ["locations", effectiveClinicianId, isAdmin, isClinician],
    queryFn: async () => {
      let url = "/api/location";
      if (isClinician && !isAdmin && effectiveClinicianId) {
        url += `?clinicianId=${effectiveClinicianId}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }
      return response.json();
    },
    enabled: !!shouldFetchData,
  });

  const { data: servicesData = [], isLoading: isLoadingServices } = useQuery<
    Service[]
  >({
    queryKey: ["services", effectiveClinicianId, isAdmin, isClinician],
    queryFn: async () => {
      let url = "/api/service";
      if (isClinician && !isAdmin && effectiveClinicianId) {
        url += `?clinicianId=${effectiveClinicianId}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      return response.json();
    },
    enabled: !!shouldFetchData,
  });

  // Filtered and paginated location options
  const filteredLocationOptions = Array.isArray(locationsData)
    ? locationsData
        .map((location) => ({
          label: location.name,
          value: location.id,
        }))
        .filter((option) =>
          option.label.toLowerCase().includes(locationSearchTerm.toLowerCase()),
        )
    : [];

  const locationTotalPages = Math.ceil(
    filteredLocationOptions.length / itemsPerPage,
  );

  const paginatedLocationOptions = filteredLocationOptions.slice(
    (locationPage - 1) * itemsPerPage,
    locationPage * itemsPerPage,
  );

  // Handlers
  const clearValidationError = useCallback(
    (field: string) => {
      if (validationErrors[field]) {
        setValidationErrors({
          ...validationErrors,
          [field]: false,
        });
        if (
          Object.values({ ...validationErrors, [field]: false }).every(
            (v) => !v,
          )
        ) {
          setGeneralError(null);
        }
      }
    },
    [validationErrors, setValidationErrors, setGeneralError],
  );

  const handleClientSelect = useCallback(
    (value: string) => {
      form.setFieldValue("client", value);
      clearValidationError("client");
      forceUpdate();
    },
    [form, clearValidationError, forceUpdate],
  );

  const handleServiceSelect = useCallback(
    (value: string) => {
      const selectedServiceOption = servicesData.find(
        (option) => option.id === value,
      );
      const fee = selectedServiceOption?.rate || 0;

      const newServices = [{ serviceId: value, fee: fee }];
      form.setFieldValue("selectedServices", newServices);
      clearValidationError("service");
      forceUpdate();
    },
    [servicesData, form, clearValidationError, forceUpdate],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      form.setFieldValue("status", value);
      forceUpdate();
    },
    [form, forceUpdate],
  );

  const handleLocationChange = useCallback(
    (value: string) => {
      form.setFieldValue("location", value);
      clearValidationError("location");
      forceUpdate();
    },
    [form, clearValidationError, forceUpdate],
  );

  const handleUpdateConfirm = useCallback(async () => {
    try {
      const startDate = form.getFieldValue<Date>("startDate");
      const endDate = form.getFieldValue<Date>("endDate");
      const startTime = form.getFieldValue<string>("startTime");
      const endTime = form.getFieldValue<string>("endTime");
      const type = form.getFieldValue<string>("type") || "event";
      const eventName = form.getFieldValue<string>("eventName");
      const allDay = form.getFieldValue<boolean>("allDay");
      const location = form.getFieldValue<string>("location");
      const client = form.getFieldValue<string>("client");
      const status = form.getFieldValue<string>("status");
      const selectedServices =
        form.getFieldValue<Array<{ serviceId: string; fee: number }>>(
          "selectedServices",
        );
      const recurring = form.getFieldValue<boolean>("recurring");
      const recurringInfo = form.getFieldValue<RecurringInfo>("recurringInfo");

      // Validate required fields
      if (!location) {
        setValidationErrors({ ...validationErrors, location: true });
        setGeneralError("Location is required");
        return;
      }

      if (!startDate || !endDate || !startTime || !endTime) {
        setGeneralError("Required date and time fields are missing");
        return;
      }

      // Process dates
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      const [startHours, startMinutes] = startTime.split(":");
      const [endHours, endMinutes] = endTime.split(":");
      const startPeriod = startTime.split(" ")[1];
      const endPeriod = endTime.split(" ")[1];

      let startHour = parseInt(startHours);
      let endHour = parseInt(endHours);

      if (startPeriod === "PM" && startHour !== 12) startHour += 12;
      if (startPeriod === "AM" && startHour === 12) startHour = 0;
      if (endPeriod === "PM" && endHour !== 12) endHour += 12;
      if (endPeriod === "AM" && endHour === 12) endHour = 0;

      startDateTime.setHours(
        startHour,
        parseInt(startMinutes.split(" ")[0]),
        0,
        0,
      );
      endDateTime.setHours(endHour, parseInt(endMinutes.split(" ")[0]), 0, 0);

      const tzOffset = startDateTime.getTimezoneOffset() * 60000;
      const startDateUTC = new Date(
        startDateTime.getTime() - tzOffset,
      ).toISOString();
      const endDateUTC = new Date(
        endDateTime.getTime() - tzOffset,
      ).toISOString();

      const recurringRule =
        recurring && recurringInfo
          ? constructRecurringRule(recurringInfo, startDate)
          : null;

      const updateData = {
        id: appointmentData?.id,
        type: type,
        title: eventName || appointmentData?.title || "Event",
        is_all_day: allDay || false,
        start_date: startDateUTC,
        end_date: endDateUTC,
        location_id: location,
        client_id: client || appointmentData?.client_id || null,
        clinician_id: appointmentData?.clinician_id || "",
        service_id:
          selectedServices?.[0]?.serviceId ||
          appointmentData?.PracticeService?.id ||
          null,
        appointment_fee:
          selectedServices?.[0]?.fee ||
          appointmentData?.PracticeService?.rate ||
          0,
        is_recurring: recurring || false,
        recurring_rule: recurring ? recurringRule : null,
        status: status || "SCHEDULED",
      };
      const response = await fetch("/api/appointment", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server response:", errorData);
        throw new Error(errorData.error || "Failed to update appointment");
      }

      const updatedAppointment = await response.json();
      window.dispatchEvent(
        new CustomEvent("appointmentUpdated", {
          detail: { appointment: updatedAppointment },
        }),
      );

      setIsConfirmationOpen(false);

      if (onDone) {
        onDone();
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      setGeneralError(
        error instanceof Error
          ? error.message
          : "Failed to update appointment. Please try again.",
      );
    }
  }, [
    form,
    appointmentData,
    setIsConfirmationOpen,
    setGeneralError,
    setValidationErrors,
    validationErrors,
  ]);

  return {
    locationPage,
    locationSearchTerm,
    isLoadingLocations,
    isLoadingServices,
    servicesData,
    paginatedLocationOptions,
    locationTotalPages,
    setLocationPage,
    setLocationSearchTerm,
    handleClientSelect,
    handleServiceSelect,
    handleStatusChange,
    handleLocationChange,
    handleUpdateConfirm,
    clearValidationError,
  };
}

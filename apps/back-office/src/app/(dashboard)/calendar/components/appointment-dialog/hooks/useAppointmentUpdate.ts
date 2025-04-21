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
    (status: string) => {
      // Only update the form value, don't make API call
      form.setFieldValue("status", status);
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
      if (!appointmentData?.id) {
        setGeneralError("Cannot update: Appointment ID is missing");
        return;
      }

      // Get all the current form values
      const formValues = form.state.values;

      // Prepare the update payload
      const updatePayload = {
        id: appointmentData.id,
        type: formValues.type || appointmentData.type,
        title: formValues.eventName || appointmentData.title,
        is_all_day: formValues.allDay,
        start_date: formValues.startDate,
        end_date: formValues.endDate,
        location_id: formValues.location || appointmentData.location_id,
        status: formValues.status || appointmentData.status,
        client_id: formValues.client || appointmentData.client_id,
        clinician_id: formValues.clinician || appointmentData.clinician_id,
        is_recurring: formValues.recurring,
        recurring_rule: formValues.recurringInfo
          ? constructRecurringRule(
              formValues.recurringInfo,
              formValues.startDate,
            )
          : appointmentData.recurring_rule,
        service_id:
          formValues.selectedServices?.[0]?.serviceId ||
          appointmentData.PracticeService?.id,
        appointment_fee:
          formValues.selectedServices?.[0]?.fee ||
          appointmentData.appointment_fee,
      };

      // Call the API to update the appointment
      const response = await fetch("/api/appointment", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error("Failed to update appointment");
      }

      // Update was successful
      setGeneralError(null);
      setIsConfirmationOpen(false);

      // If there's a callback, call it
      if (onDone) {
        onDone();
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      setGeneralError("Failed to update appointment. Please try again.");
    }
  }, [
    appointmentData,
    form.state.values,
    setGeneralError,
    setIsConfirmationOpen,
    onDone,
  ]);

  return {
    // State
    locationPage,
    locationSearchTerm,
    isLoadingLocations,
    isLoadingServices,

    // Data
    servicesData,
    paginatedLocationOptions,
    locationTotalPages,

    // Handlers
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

"use client";

import { Checkbox, DatePicker, Input, SearchSelect, TimePicker } from "@mcw/ui";
import { useQuery } from "@tanstack/react-query";
import { Clinician, Location } from "./types";
import { differenceInDays } from "date-fns";
import { MapPin } from "lucide-react";

import { useFormContext } from "./context/FormContext";
import { RecurringControl } from "../calendar/RecurringControl";

export function EventTab(): React.ReactNode {
  const {
    form,
    validationErrors,
    setValidationErrors,
    setGeneralError,
    forceUpdate,
    effectiveClinicianId,
    isAdmin,
    isClinician,
    shouldFetchData,
    duration,
  } = useFormContext();

  // Fetch clinicians
  const { data: clinicians = [] } = useQuery<Clinician[]>({
    queryKey: ["clinicians", effectiveClinicianId, isAdmin, isClinician],
    queryFn: async () => {
      let url = "/api/clinician";

      if (isClinician && !isAdmin && effectiveClinicianId) {
        url += `?userId=${effectiveClinicianId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch clinicians");
      }
      const data = await response.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : [data];
    },
    enabled: !!shouldFetchData,
  });

  // Fetch locations
  const { data: locations = [] } = useQuery<Location[]>({
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

  // Helper for validation error clearing
  const clearValidationError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors({
        ...validationErrors,
        [field]: false,
      });

      // If all errors are cleared, also clear general error
      if (
        Object.values({ ...validationErrors, [field]: false }).every((v) => !v)
      ) {
        setGeneralError(null);
      }
    }
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    form.setFieldValue(field, checked);
    forceUpdate();
  };

  const allDay = form.getFieldValue<boolean>("allDay");
  const startDate = form.getFieldValue<Date>("startDate");
  const endDate = form.getFieldValue<Date>("endDate");
  const startTime = form.getFieldValue<string>("startTime");
  const endTime = form.getFieldValue<string>("endTime");
  const isRecurring = form.getFieldValue<boolean>("recurring");

  const formattedClinicianOptions = clinicians.map((clinician) => ({
    label: `${clinician.first_name} ${clinician.last_name}`,
    value: clinician.id,
  }));

  const formattedLocationOptions = locations.map((location) => ({
    label: location.name,
    value: location.id,
  }));

  return (
    <>
      <div>
        <Input
          placeholder="Event name (optional)"
          className="rounded-none border-gray-200"
          value={form.getFieldValue("eventName") || ""}
          onChange={(e) => form.setFieldValue("eventName", e.target.value)}
        />
      </div>

      <div>
        <h2 className="text-sm mb-4">Appointment details</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="event-all-day"
              checked={allDay}
              onCheckedChange={(checked) =>
                handleCheckboxChange("allDay", !!checked)
              }
              className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
            />
            <label
              htmlFor="event-all-day"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1"
            >
              All day
            </label>
          </div>

          {allDay ? (
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
              <DatePicker
                value={startDate}
                onChange={(date) => form.setFieldValue("startDate", date)}
                className="border-gray-200"
              />
              <span className="text-sm text-gray-500">to</span>
              <div className="flex items-center gap-2">
                <DatePicker
                  value={endDate}
                  onChange={(date) => form.setFieldValue("endDate", date)}
                  className="border-gray-200"
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
                value={startDate}
                onChange={(date) => form.setFieldValue("startDate", date)}
                className="border-gray-200"
              />
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center flex-1">
                  <TimePicker
                    value={startTime}
                    onChange={(time) => form.setFieldValue("startTime", time)}
                    className="border-gray-200"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <TimePicker
                    value={endTime}
                    onChange={(time) => form.setFieldValue("endTime", time)}
                    className="border-gray-200"
                  />
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {duration}
                </span>
              </div>
            </div>
          )}

          <SearchSelect
            options={formattedClinicianOptions}
            value={form.getFieldValue("clinician")}
            onValueChange={(value) => {
              form.setFieldValue("clinician", value);
              clearValidationError("clinician");
            }}
            placeholder="Team member"
            className={`border-gray-200 ${validationErrors.clinician ? "border-red-500" : ""}`}
          />

          <SearchSelect
            options={formattedLocationOptions}
            value={form.getFieldValue("location")}
            onValueChange={(value) => {
              form.setFieldValue("location", value);
              clearValidationError("location");
              forceUpdate();
            }}
            placeholder="Location"
            icon={<MapPin className="h-4 w-4 text-gray-500" />}
            className={`border-gray-200 ${validationErrors.location ? "border-red-500" : ""}`}
          />

          <div className="flex items-start space-x-2">
            <Checkbox
              id="event-recurring"
              checked={isRecurring}
              onCheckedChange={(checked) =>
                handleCheckboxChange("recurring", !!checked)
              }
              className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
            />
            <label
              htmlFor="event-recurring"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1"
            >
              Recurring
            </label>
          </div>

          {isRecurring && (
            <RecurringControl
              startDate={startDate || new Date()}
              visible={true}
              open={true}
              onRecurringChange={(recurringValues) => {
                form.setFieldValue("recurringInfo", recurringValues);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

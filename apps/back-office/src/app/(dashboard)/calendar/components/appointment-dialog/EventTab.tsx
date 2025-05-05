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
          className="rounded-none border-gray-200"
          placeholder="Event name (optional)"
          value={form.getFieldValue("eventName") || ""}
          onChange={(e) => {
            form.setFieldValue("eventName", e.target.value);
            forceUpdate();
          }}
        />
      </div>

      <div>
        <h2 className="text-sm mb-4">Appointment details</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              checked={allDay}
              className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
              id="event-all-day"
              onCheckedChange={(checked) =>
                handleCheckboxChange("allDay", !!checked)
              }
            />
            <label
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1"
              htmlFor="event-all-day"
            >
              All day
            </label>
          </div>

          {allDay ? (
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
              <DatePicker
                className="border-gray-200"
                value={startDate}
                onChange={(date) => form.setFieldValue("startDate", date)}
              />
              <span className="text-sm text-gray-500">to</span>
              <div className="flex items-center gap-2">
                <DatePicker
                  className="border-gray-200"
                  value={endDate}
                  onChange={(date) => form.setFieldValue("endDate", date)}
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
                className="border-gray-200"
                value={startDate}
                onChange={(date) => form.setFieldValue("startDate", date)}
              />
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center flex-1">
                  <TimePicker
                    className="border-gray-200"
                    value={startTime}
                    onChange={(time) => form.setFieldValue("startTime", time)}
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <TimePicker
                    className="border-gray-200"
                    value={endTime}
                    onChange={(time) => form.setFieldValue("endTime", time)}
                  />
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {duration}
                </span>
              </div>
            </div>
          )}

          <SearchSelect
            className={`border-gray-200 ${validationErrors.clinician ? "border-red-500" : ""}`}
            options={formattedClinicianOptions}
            placeholder="Team member"
            value={form.getFieldValue("clinician")}
            onValueChange={(value) => {
              form.setFieldValue("clinician", value);
              clearValidationError("clinician");
            }}
          />

          <SearchSelect
            className={`border-gray-200 ${validationErrors.location ? "border-red-500" : ""}`}
            icon={<MapPin className="h-4 w-4 text-gray-500" />}
            options={formattedLocationOptions}
            placeholder="Location"
            value={form.getFieldValue("location")}
            onValueChange={(value) => {
              form.setFieldValue("location", value);
              clearValidationError("location");
              forceUpdate();
            }}
          />

          <div className="flex items-start space-x-2">
            <Checkbox
              checked={isRecurring}
              className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
              id="event-recurring"
              onCheckedChange={(checked) =>
                handleCheckboxChange("recurring", !!checked)
              }
            />
            <label
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1"
              htmlFor="event-recurring"
            >
              Recurring
            </label>
          </div>

          {isRecurring && (
            <RecurringControl
              open={true}
              startDate={startDate || new Date()}
              visible={true}
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

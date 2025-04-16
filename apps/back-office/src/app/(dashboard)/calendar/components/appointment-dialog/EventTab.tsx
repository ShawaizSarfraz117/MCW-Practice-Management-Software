"use client";

import { Input, SearchSelect } from "@mcw/ui";
import { useQuery } from "@tanstack/react-query";
import { Clinician, Location } from "./types";

import { useFormContext } from "./context/FormContext";
import { CheckboxControl, DateTimeControls } from "./components/FormControls";
import { Label } from "@mcw/ui";

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
  } = useFormContext();

  // Fetch clinicians
  const { data: clinicians = [] } = useQuery<Clinician[]>({
    queryKey: ["clinicians", effectiveClinicianId, isAdmin, isClinician],
    queryFn: async () => {
      let url = "/api/clinician";

      if (isClinician && !isAdmin && effectiveClinicianId) {
        url += `?id=${effectiveClinicianId}`;
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

  return (
    <div className="p-6 space-y-6">
      {/* Event Name */}
      <div className="space-y-2">
        <Label htmlFor="eventName">Event Name</Label>
        <Input
          id="eventName"
          placeholder="Enter event name"
          value={form.getFieldValue<string>("eventName") || ""}
          onChange={(e) => form.setFieldValue("eventName", e.target.value)}
        />
      </div>

      {/* Clinician Field */}
      <div className="space-y-2">
        <Label htmlFor="clinician">Clinician</Label>
        <SearchSelect
          value={form.getFieldValue<string>("clinician")}
          placeholder="Search or select clinician"
          onValueChange={(value) => {
            form.setFieldValue("clinician", value);
            clearValidationError("clinician");
            forceUpdate();
          }}
          options={clinicians.map((clinician) => ({
            label: `${clinician.first_name} ${clinician.last_name}`,
            value: clinician.id,
          }))}
          className={validationErrors.clinician ? "border-red-500" : ""}
        />
      </div>

      {/* Location Select */}
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <SearchSelect
          value={form.getFieldValue<string>("location")}
          placeholder="Search or select location"
          onValueChange={(value) => {
            form.setFieldValue("location", value);
            clearValidationError("location");
            forceUpdate();
          }}
          options={locations.map((location) => ({
            label: location.name,
            value: location.id,
          }))}
          className={validationErrors.location ? "border-red-500" : ""}
        />
      </div>

      {/* Date/Time Controls */}
      <div className="space-y-2">
        <Label htmlFor="datetime">Date & Time</Label>
        <DateTimeControls id="datetime" />
      </div>

      {/* All Day Checkbox */}
      <CheckboxControl id="allDay" field="allDay" label="All Day" />
    </div>
  );
}

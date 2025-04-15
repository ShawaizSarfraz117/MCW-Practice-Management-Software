"use client";

import { MapPin } from "lucide-react";
import { Input, SearchSelect } from "@mcw/ui";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clinician, Location } from "./types";
import { cn } from "@mcw/utils";
import { ValidationError } from "./components/validation-error";
import { useFormContext } from "./context/form-context";
import { CheckboxControl, DateTimeControls } from "./components/form-controls";

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

  // Add separate pagination states for each dropdown
  const [clinicianPage, setClinicianPage] = useState(1);
  const [locationPage, setLocationPage] = useState(1);
  const itemsPerPage = 10;

  // Add state for search terms
  const [clinicianSearchTerm, setClinicianSearchTerm] = useState("");
  const [locationSearchTerm, setLocationSearchTerm] = useState("");

  // Fetch clinicians
  const { data: clinicians = [], isLoading: isLoadingClinicians } = useQuery<
    Clinician[]
  >({
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
  const { data: locations = [], isLoading: isLoadingLocations } = useQuery<
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

  // Filter and prepare dropdown options
  const filteredClinicianOptions = Array.isArray(clinicians)
    ? clinicians
        .map((clinician) => ({
          label: `${clinician.first_name} ${clinician.last_name}`,
          value: clinician.id,
        }))
        .filter((option) =>
          option.label
            .toLowerCase()
            .includes(clinicianSearchTerm.toLowerCase()),
        )
    : [];

  const filteredLocationOptions = Array.isArray(locations)
    ? locations
        .map((location) => ({
          label: location.name,
          value: location.id,
        }))
        .filter((option) =>
          option.label.toLowerCase().includes(locationSearchTerm.toLowerCase()),
        )
    : [];

  // Calculate total pages for each option type
  const clinicianTotalPages = Math.ceil(
    filteredClinicianOptions.length / itemsPerPage,
  );
  const locationTotalPages = Math.ceil(
    filteredLocationOptions.length / itemsPerPage,
  );

  // Paginate the filtered options
  const paginatedClinicianOptions = filteredClinicianOptions.slice(
    (clinicianPage - 1) * itemsPerPage,
    clinicianPage * itemsPerPage,
  );

  const paginatedLocationOptions = filteredLocationOptions.slice(
    (locationPage - 1) * itemsPerPage,
    locationPage * itemsPerPage,
  );

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
    <>
      <div>
        <Input
          className="rounded-none border-gray-200"
          placeholder="Event name (optional)"
          value={form.getFieldValue("eventName") || ""}
          onChange={(e) => form.setFieldValue("eventName", e.target.value)}
        />
      </div>

      <div>
        <h2 className="text-sm mb-4">Appointment details</h2>
        <div className="space-y-4">
          <CheckboxControl field="allDay" id="event-all-day" label="All day" />

          <DateTimeControls id="event-date-time" />

          <SearchSelect
            searchable
            showPagination
            className={cn(
              "border-gray-200",
              validationErrors.clinician && "border-red-500",
            )}
            currentPage={clinicianPage}
            options={paginatedClinicianOptions}
            placeholder={
              isLoadingClinicians
                ? "Loading clinicians..."
                : "Search Team Members *"
            }
            totalPages={clinicianTotalPages}
            value={form.getFieldValue("clinician")}
            onPageChange={setClinicianPage}
            onSearch={setClinicianSearchTerm}
            onValueChange={(value) => {
              form.setFieldValue("clinician", value);
              clearValidationError("clinician");
              forceUpdate();
            }}
          />
          <ValidationError
            message="Clinician is required"
            show={!!validationErrors.clinician}
          />

          <SearchSelect
            searchable
            showPagination
            className={cn(
              "border-gray-200",
              validationErrors.location && "border-red-500",
            )}
            currentPage={locationPage}
            icon={<MapPin className="h-4 w-4 text-gray-500" />}
            options={paginatedLocationOptions}
            placeholder={
              isLoadingLocations ? "Loading locations..." : "Search Locations *"
            }
            totalPages={locationTotalPages}
            value={form.getFieldValue("location")}
            onPageChange={setLocationPage}
            onSearch={setLocationSearchTerm}
            onValueChange={(value) => {
              form.setFieldValue("location", value);
              clearValidationError("location");
              forceUpdate();
            }}
          />
          <ValidationError
            message="Location is required"
            show={!!validationErrors.location}
          />
        </div>
      </div>
    </>
  );
}

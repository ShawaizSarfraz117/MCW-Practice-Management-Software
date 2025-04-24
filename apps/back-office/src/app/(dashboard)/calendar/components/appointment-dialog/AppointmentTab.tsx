/* eslint-disable max-lines-per-function */
"use client";

import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, SearchSelect } from "@mcw/ui";
import { format } from "date-fns";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AppointmentTabProps,
  Client,
  Clinician,
  Location,
  Service,
} from "./types";
import { cn } from "@mcw/utils";
import { ValidationError } from "./components/ValidationError";
import { useFormContext } from "./context/FormContext";
import { CheckboxControl, DateTimeControls } from "./components/FormControls";
import { RecurringControl } from "../calendar/RecurringControl";

export function AppointmentTab({
  onCreateClient,
  selectedDate: _selectedDate,
}: AppointmentTabProps) {
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

  const [selectedServices, setSelectedServices] = useState<
    Array<{ serviceId: string; fee: number }>
  >([{ serviceId: "", fee: 0 }]);

  // Pagination and search states for dropdowns
  const [clientPage, setClientPage] = useState(1);
  const [clinicianPage, setClinicianPage] = useState(1);
  const [locationPage, setLocationPage] = useState(1);
  const [servicePage, setServicePage] = useState(1);
  const itemsPerPage = 10;

  // Search term states
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clinicianSearchTerm, setClinicianSearchTerm] = useState("");
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");

  // Form values
  const selectedClient = form.getFieldValue<string>("client");
  const isRecurring = form.getFieldValue<boolean>("recurring");

  // API data fetching
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

  const { data: cliniciansData = [], isLoading: isLoadingClinicians } =
    useQuery<Clinician[]>({
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
        return Array.isArray(data) ? data : [data];
      },
      enabled: !!shouldFetchData,
    });

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

  const { data: clientsData = [], isLoading: isLoadingClients } = useQuery<
    Client[]
  >({
    queryKey: ["clients", effectiveClinicianId, isAdmin, isClinician],
    queryFn: async () => {
      let url = "/api/client/group";

      if (isClinician && !isAdmin && effectiveClinicianId) {
        url += `?clinicianId=${effectiveClinicianId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      const rawData = await response.json();

      // Check if the data might be nested in a property
      let data = rawData;

      // If data is an object with a data property that's an array, use that
      if (
        !Array.isArray(rawData) &&
        rawData &&
        typeof rawData === "object" &&
        Array.isArray(rawData.data)
      ) {
        console.log("Found nested data property in response");
        data = rawData.data;
      }

      // If data is an object with a clients property that's an array, use that
      if (
        !Array.isArray(rawData) &&
        rawData &&
        typeof rawData === "object" &&
        Array.isArray(rawData.clients)
      ) {
        console.log("Found nested clients property in response");
        data = rawData.clients;
      }

      if (
        !Array.isArray(rawData) &&
        rawData &&
        typeof rawData === "object" &&
        Array.isArray(rawData.results)
      ) {
        data = rawData.results;
      }
      return data;
    },
    enabled: !!shouldFetchData,
  });

  const filteredClients = Array.isArray(clientsData)
    ? clientsData
        .map((clientGroup) => {
          if (Array.isArray(clientGroup?.ClientGroupMembership)) {
            return clientGroup.ClientGroupMembership.map((membership) => {
              const client = membership.Client;

              return {
                label:
                  `${client?.legal_first_name || ""} ${client?.legal_last_name || ""}`.trim(),
                value: client?.id || "",
              };
            });
          }
          return [];
        })
        .flat()
        .filter((option) => {
          if (!option.value) {
            console.log("Filtering out option with empty value:", option);
            return false;
          }

          const matches = option.label
            .toLowerCase()
            .includes(clientSearchTerm.toLowerCase());
          return matches;
        })
    : [];

  const filteredClinicianOptions = Array.isArray(cliniciansData)
    ? cliniciansData
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

  const filteredServiceOptions = Array.isArray(servicesData)
    ? servicesData
        .map((service) => ({
          label: `${service.code} ${service.type}`,
          value: service.id,
          fee: service.rate,
        }))
        .filter((option) =>
          option.label.toLowerCase().includes(serviceSearchTerm.toLowerCase()),
        )
    : [];

  // Pagination calculations
  const clientTotalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const clinicianTotalPages = Math.ceil(
    filteredClinicianOptions.length / itemsPerPage,
  );
  const locationTotalPages = Math.ceil(
    filteredLocationOptions.length / itemsPerPage,
  );
  const serviceTotalPages = Math.ceil(
    filteredServiceOptions.length / itemsPerPage,
  );

  // Paginated options
  const paginatedClients = filteredClients.slice(
    (clientPage - 1) * itemsPerPage,
    clientPage * itemsPerPage,
  );
  const paginatedClinicianOptions = filteredClinicianOptions.slice(
    (clinicianPage - 1) * itemsPerPage,
    clinicianPage * itemsPerPage,
  );
  const paginatedLocationOptions = filteredLocationOptions.slice(
    (locationPage - 1) * itemsPerPage,
    locationPage * itemsPerPage,
  );
  const paginatedServiceOptions = filteredServiceOptions.slice(
    (servicePage - 1) * itemsPerPage,
    servicePage * itemsPerPage,
  );

  // Helper for client selection
  const handleClientSelect = (value: string) => {
    form.setFieldValue("client", value);
    clearValidationError("client");
    forceUpdate(); // Force re-render to ensure UI updates
  };

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

  const handleCreateClientClick = () => {
    if (!onCreateClient) return;

    const date = form.getFieldValue<Date>("startDate");
    const time = form.getFieldValue<string>("startTime") || "12:00 PM";

    const formattedDate = date
      ? format(date, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");
    const formattedTime = time || "12:00 PM";

    onCreateClient?.(formattedDate, formattedTime);
  };

  return (
    <>
      <div>
        <div className="flex gap-2">
          <button
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-none border text-sm font-normal whitespace-nowrap",
              form.getFieldValue("clientType") === "individual"
                ? "border-[#16A34A] bg-[#16A34A]/5 text-[#16A34A]"
                : "border-gray-200 hover:bg-gray-50",
            )}
            type="button"
            onClick={() => form.setFieldValue("clientType", "individual")}
          >
            <div className="flex -space-x-2">
              <Avatar className="h-5 w-5 border-2 border-background">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <Avatar className="h-5 w-5 border-2 border-background">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>B</AvatarFallback>
              </Avatar>
            </div>
            Individual or couple
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-grow">
            <SearchSelect
              searchable
              showPagination
              className={cn(
                "border-gray-200",
                validationErrors.client && "border-red-500",
              )}
              currentPage={clientPage}
              options={paginatedClients}
              placeholder={
                isLoadingClients
                  ? "Loading clients..."
                  : filteredClients.length === 0
                    ? "No clients found"
                    : "Search Clients *"
              }
              totalPages={clientTotalPages}
              value={selectedClient}
              onPageChange={setClientPage}
              onSearch={setClientSearchTerm}
              onValueChange={handleClientSelect}
            />
            <ValidationError
              message="Client is required"
              show={!!validationErrors.client}
            />
          </div>
          <div className="flex gap-2">
            <button
              className="text-sm font-medium text-[#16A34A] hover:text-[#16A34A]/90 whitespace-nowrap"
              type="button"
              onClick={handleCreateClientClick}
            >
              + Create client
            </button>
          </div>
        </div>

        <h2 className="text-sm mb-4">Appointment details</h2>

        <div className="space-y-4">
          <CheckboxControl
            field="allDay"
            id="appointment-all-day"
            label="All day"
          />

          <DateTimeControls id="appointment-date-time" />

          <CheckboxControl
            field="recurring"
            id="appointment-recurring"
            label="Recurring"
          />

          {isRecurring && (
            <RecurringControl
              startDate={form.getFieldValue<Date>("startDate") || new Date()}
              visible={true}
              open={true}
              onRecurringChange={(recurringValues) => {
                form.setFieldValue("recurringInfo", recurringValues);
              }}
            />
          )}

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

          {selectedClient && (
            <>
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
                  validationErrors.service && "border-red-500",
                )}
                currentPage={servicePage}
                options={paginatedServiceOptions}
                placeholder={
                  isLoadingServices
                    ? "Loading services..."
                    : "Search Services *"
                }
                totalPages={serviceTotalPages}
                value={selectedServices[0]?.serviceId || ""}
                onPageChange={setServicePage}
                onSearch={setServiceSearchTerm}
                onValueChange={(value: string) => {
                  const selectedServiceOption = servicesData.find(
                    (option) => option.id === value,
                  );
                  const fee = selectedServiceOption?.rate || 0;

                  const newServices = [{ serviceId: value, fee: fee }];
                  setSelectedServices(newServices);
                  form.setFieldValue("selectedServices", newServices);

                  clearValidationError("service");
                }}
              />
              <ValidationError
                message="Service is required"
                show={!!validationErrors.service}
              />

              <div className="flex justify-end mt-2">
                <div className="w-32">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Fee</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        className="w-full rounded-none border border-gray-200 py-2 pl-8 pr-3 text-sm"
                        type="number"
                        value={selectedServices[0]?.fee || 0}
                        onChange={(e) => {
                          const newServices = [...selectedServices];
                          if (newServices.length > 0) {
                            newServices[0] = {
                              ...newServices[0],
                              fee: Number.parseInt(e.target.value) || 0,
                            };
                            setSelectedServices(newServices);
                            form.setFieldValue("selectedServices", newServices);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Billing information - Always visible */}
      {selectedClient && (
        <div className="mt-4 space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span>Billing Type</span>
            <span>Self-pay</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span>Appointment Total</span>
            <span>
              $
              {selectedServices.reduce(
                (sum, service) => sum + Number(service.fee),
                0,
              )}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

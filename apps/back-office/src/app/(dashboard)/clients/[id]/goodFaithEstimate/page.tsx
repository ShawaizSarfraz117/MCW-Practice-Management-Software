/* eslint-disable max-lines-per-function */
"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  fetchSingleClientGroup,
  fetchServices,
  fetchLocations,
  createGoodFaithEstimate,
  fetchDiagnosis,
} from "@/(dashboard)/clients/services/client.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  DateRangePicker,
} from "@mcw/ui";
import { Trash2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { DateRange } from "react-day-picker";
import ClientCard from "./components/ClientCard";
import ProviderCard from "./components/ProviderCard";
import { toast } from "@mcw/ui";
import { Loading } from "@/components";
import { ClientGroupFromAPI } from "@/(dashboard)/clients/types";
interface Client {
  id: string;
  legal_first_name: string;
  legal_last_name: string;
  date_of_birth: string;
  ClientContact?: Array<{
    id: string;
    contact_type: string;
    type: string;
    value: string;
    permission: string;
    is_primary: boolean;
  }>;
}

interface Clinician {
  id: string;
  first_name: string;
  last_name: string;
  NPI_number: string | null;
  address: string;
}

interface ClientGroupData {
  id: string;
  name: string;
  Clinician?: Clinician;
  ClientGroupMembership: Array<{
    Client: Client;
  }>;
}

interface Service {
  id: string;
  name?: string;
  code?: string;
  rate?: number;
}

interface Location {
  id: string;
  name: string;
}

interface ClientData {
  name: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  voicePermission: boolean;
  textPermission: boolean;
  emailPermission: boolean;
  clientId: string;
  hasErrors: boolean;
}

interface ProviderData {
  name: string;
  npi: string;
  tin: string;
  location: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  hasErrors: boolean;
}

interface Diagnosis {
  id: string;
  code: string;
  description?: string;
}

const GoodFaithEstimatePage = () => {
  const params = useParams();
  const router = useRouter();
  const clientGroupId = params.id as string;
  const [serviceRows, setServiceRows] = useState([
    { service: "", diagnosisCode: "", location: "", quantity: 1, rate: 0 },
  ]);
  const [notes, setNotes] = useState("");

  // Set default dates: current date for provided/expiration, current date to +6 months for service range
  const currentDate = new Date();
  const sixMonthsLater = new Date();
  sixMonthsLater.setMonth(currentDate.getMonth() + 6);

  const [formData, setFormData] = useState({
    providedDate: currentDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
    expirationDate: currentDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
    diagnosisCodes: "",
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: currentDate,
    to: sixMonthsLater,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [clientsData, setClientsData] = useState<Record<string, ClientData>>(
    {},
  );
  const [providerData, setProviderData] = useState<ProviderData | null>(null);

  // Fetch client group data
  const { data: clientGroupData, isLoading: isLoadingClientGroup } = useQuery({
    queryKey: ["clientGroup", clientGroupId],
    queryFn: async () => {
      const data = (await fetchSingleClientGroup({
        id: clientGroupId,
        searchParams: {
          includeProfile: "true",
          includeAdress: "true",
        },
      })) as { data: ClientGroupFromAPI } | null;
      return data?.data;
    },
  });

  // Fetch services
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const [data, error] = await fetchServices();
      if (error) {
        throw error;
      }
      return data as Service[];
    },
  });

  // Fetch locations
  const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const [data, error] = await fetchLocations();
      if (error) {
        throw error;
      }
      return data as Location[];
    },
  });

  // Fetch diagnosis data
  const { data: diagnosisData, isLoading: isLoadingDiagnosis } = useQuery({
    queryKey: ["diagnosis"],
    queryFn: async () => {
      const [data, error] = await fetchDiagnosis();
      if (error) {
        throw error;
      }
      // Extract the data array from the response
      const diagnosisArray = (data as { data: Diagnosis[] })
        ?.data as Diagnosis[];
      return diagnosisArray;
    },
  });

  // Preselect first service and location when data is loaded
  useEffect(() => {
    if (
      servicesData &&
      Array.isArray(servicesData) &&
      servicesData.length > 0 &&
      locationsData &&
      Array.isArray(locationsData) &&
      locationsData.length > 0
    ) {
      // Only update if the first service row is empty
      setServiceRows((prevRows) => {
        if (
          prevRows.length === 1 &&
          !prevRows[0].service &&
          !prevRows[0].location
        ) {
          const firstService = servicesData[0];
          const firstLocation = locationsData[0];

          return [
            {
              service: firstService.id,
              diagnosisCode: "",
              location: firstLocation.id,
              quantity: 1,
              rate: firstService.rate || 0,
            },
          ];
        }
        return prevRows;
      });
    }
  }, [servicesData, locationsData]);

  const addServiceRow = () => {
    setServiceRows([
      ...serviceRows,
      { service: "", diagnosisCode: "", location: "", quantity: 1, rate: 0 },
    ]);
  };

  const removeServiceRow = (index: number) => {
    if (serviceRows.length > 1) {
      const updatedRows = serviceRows.filter((_, i) => i !== index);
      setServiceRows(updatedRows);
    }
  };

  const updateServiceRow = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const updatedRows = [...serviceRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };

    // If service is selected, automatically populate the rate
    if (field === "service" && value && Array.isArray(servicesData)) {
      const selectedService = servicesData.find(
        (service) => service.id === value,
      );
      if (selectedService && selectedService.rate) {
        updatedRows[index].rate = selectedService.rate;
      }
    }

    setServiceRows(updatedRows);
  };

  const calculateTotalCost = () => {
    return serviceRows.reduce(
      (total, row) => total + row.quantity * row.rate,
      0,
    );
  };

  const handleClientDataChange = useCallback(
    (clientId: string, data: ClientData) => {
      setClientsData((prev) => ({ ...prev, [clientId]: data }));
    },
    [],
  );

  const handleProviderDataChange = useCallback((data: ProviderData) => {
    setProviderData(data);
  }, []);

  const handleSave = async () => {
    if (!clientGroupData || !clinician || !providerData) {
      toast({
        title: "Missing data",
        description: "Missing client group, clinician, or provider data",
        variant: "destructive",
      });
      return;
    }

    // Check for validation errors silently (no alerts)
    const hasClientErrors = Object.values(clientsData).some(
      (client) => client.hasErrors,
    );
    const hasProviderErrors = providerData.hasErrors;

    if (hasClientErrors || hasProviderErrors) {
      return; // Just return without submitting, no alert
    }

    // Check required fields silently
    if (!providerData.npi || !providerData.tin) {
      return; // Just return without submitting, no alert
    }

    setIsSaving(true);
    try {
      // Handle both response types from the API
      const isDirectClientGroup = "name" in clientGroupData;
      const clients = isDirectClientGroup
        ? (
            clientGroupData as unknown as ClientGroupData
          ).ClientGroupMembership?.map((membership) => membership.Client) || []
        : [];

      // Use the collected client data from components
      const clientsApiData = clients.map((client) => {
        const clientFormData = clientsData[client.id];
        return {
          client_id: client.id,
          name:
            clientFormData?.name ||
            `${client.legal_first_name} ${client.legal_last_name}`,
          dob: clientFormData?.dateOfBirth || client.date_of_birth,
          address: clientFormData?.address || "",
          city: clientFormData?.city || "",
          state: clientFormData?.state || "",
          zip_code: clientFormData?.zipCode || "",
          phone:
            clientFormData?.phone ||
            client.ClientContact?.find((c) => c.contact_type === "PHONE")
              ?.value ||
            "",
          email:
            clientFormData?.email ||
            client.ClientContact?.find((c) => c.contact_type === "EMAIL")
              ?.value ||
            "",
          should_voice: clientFormData?.voicePermission || false,
          should_text: clientFormData?.textPermission || false,
          should_email: clientFormData?.emailPermission || false,
        };
      });

      const servicesApiData = serviceRows.map((row) => ({
        service_id: row.service,
        diagnosis_id: row.diagnosisCode,
        location_id: row.location,
        quantity: row.quantity,
        fee: Number(row.rate),
      }));

      const body = {
        clinician_id: clinician.id,
        clinician_npi: providerData.npi.replace(/\s/g, ""), // Remove spaces for API
        clinician_tin: providerData.tin.replace(/-/g, ""), // Remove hyphens for API
        clinician_location_id: providerData.location,
        contact_person_id: providerData.contactPerson,
        clinician_phone: providerData.phone,
        clinician_email: providerData.email,
        provided_date: formData.providedDate || null,
        expiration_date: formData.expirationDate || null,
        service_start_date: dateRange?.from
          ? new Date(dateRange.from).toISOString()
          : null,
        service_end_date: dateRange?.to
          ? new Date(dateRange.to).toISOString()
          : null,
        total_cost: calculateTotalCost(),
        notes: notes,
        clients: clientsApiData,
        services: servicesApiData,
      };

      const [_, error] = await createGoodFaithEstimate({ body });
      router.push(`/clients/${clientGroupId}`);
      if (error) {
        toast({
          title: "Error saving estimate",
          description: "Error saving estimate",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Good Faith Estimate saved successfully!",
          description: "Good Faith Estimate saved successfully!",
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error saving estimate:", error);
      toast({
        title: "Error saving estimate",
        description: "Error saving estimate",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (
    isLoadingClientGroup ||
    isLoadingServices ||
    isLoadingLocations ||
    isLoadingDiagnosis
  ) {
    return <Loading />;
  }

  if (!clientGroupData) {
    return <div className="p-4">No client group data found</div>;
  }

  // Handle both response types from the API
  const isDirectClientGroup = "name" in clientGroupData;
  const clients = isDirectClientGroup
    ? (
        clientGroupData as unknown as ClientGroupData
      ).ClientGroupMembership?.map((membership) => membership.Client) || []
    : [];
  const clinician = isDirectClientGroup
    ? (clientGroupData as unknown as ClientGroupData).Clinician
    : undefined;
  const groupName = isDirectClientGroup
    ? (clientGroupData as unknown as ClientGroupData).name
    : "Client Group";

  const firstClient = clients[0];
  const additionalClients = clients.slice(1);

  // Check if there are any validation errors
  const hasClientErrors = Object.values(clientsData).some(
    (client) => client.hasErrors,
  );
  const hasProviderErrors = providerData?.hasErrors || false;
  const hasValidationErrors = hasClientErrors || hasProviderErrors;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Good Faith Estimate</h1>
      </div>

      {/* First Row: First Client and Provider side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {firstClient && (
          <ClientCard
            client={firstClient}
            index={0}
            isFirstClient={true}
            onDataChange={(data) =>
              handleClientDataChange(firstClient.id, data)
            }
          />
        )}

        {clinician && locationsData && (
          <ProviderCard
            clinician={clinician}
            locations={locationsData}
            onDataChange={handleProviderDataChange}
            initialData={{
              name: `${clinician.first_name} ${clinician.last_name}`,
              npi: clinician.NPI_number || "",
              tin: "",
              location: "",
              address: clinician.address || "",
              contactPerson: clinician.id,
              phone: "",
              email: "",
            }}
          />
        )}
      </div>

      {/* Additional Client Cards */}
      {additionalClients.map((client, index) => (
        <ClientCard
          key={client.id}
          client={client}
          index={index + 1}
          isFirstClient={false}
          onDataChange={(data) => handleClientDataChange(client.id, data)}
        />
      ))}

      {/* Service Details */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Details of services and items for {groupName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Date provided
              </label>
              <Input
                type="date"
                value={formData.providedDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    providedDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Expiration date
              </label>
              <Input
                type="date"
                value={formData.expirationDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expirationDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Service dates
              </label>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Diagnosis codes
              </label>
              <Select
                value={formData.diagnosisCodes}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, diagnosisCodes: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {Array.isArray(diagnosisData) &&
                    diagnosisData.map((diagnosis: Diagnosis) => (
                      <SelectItem key={diagnosis.id} value={diagnosis.id}>
                        {diagnosis.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Service Details Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 grid grid-cols-7 gap-4 text-sm font-medium">
              <div>Service details</div>
              <div>Diagnosis code</div>
              <div>Location</div>
              <div>Quantity</div>
              <div>Rate</div>
              <div>Total</div>
              <div></div>
            </div>

            {serviceRows.map((row, index) => (
              <div
                key={index}
                className="px-4 py-2 grid grid-cols-7 gap-4 border-t items-center"
              >
                <div>
                  <Select
                    value={row.service}
                    onValueChange={(value: string) =>
                      updateServiceRow(index, "service", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(servicesData) &&
                        servicesData.map((service: Service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name || service.code}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={row.diagnosisCode}
                    onValueChange={(value: string) =>
                      updateServiceRow(index, "diagnosisCode", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {Array.isArray(diagnosisData) &&
                        diagnosisData.map((diagnosis: Diagnosis) => (
                          <SelectItem key={diagnosis.id} value={diagnosis.id}>
                            {diagnosis.code}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={row.location}
                    onValueChange={(value: string) =>
                      updateServiceRow(index, "location", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(locationsData) &&
                        locationsData.map((location: Location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    type="number"
                    value={row.quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateServiceRow(
                        index,
                        "quantity",
                        parseInt(e.target.value) || 1,
                      )
                    }
                    min="1"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    value={row.rate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateServiceRow(
                        index,
                        "rate",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="$0.00"
                    step="0.01"
                  />
                </div>
                <div className="flex items-center">
                  ${(row.quantity * row.rate).toFixed(2)}
                </div>
                <div className="flex justify-center">
                  {serviceRows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeServiceRow(index)}
                      className="p-1 h-8 w-8 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button onClick={addServiceRow} variant="outline" className="mt-2">
            + Add service
          </Button>

          {/* Total Estimated Cost */}
          <div className="flex justify-end pt-4 border-t">
            <div className="text-right">
              <div className="text-lg font-semibold">
                Total estimated cost: ${calculateTotalCost().toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter any additional notes..."
            className="min-h-32"
          />
        </CardContent>
      </Card>

      {/* Save and Cancel Buttons */}
      <div className="flex gap-4 pt-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || hasValidationErrors}
          className={hasValidationErrors ? "opacity-50 cursor-not-allowed" : ""}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default GoodFaithEstimatePage;

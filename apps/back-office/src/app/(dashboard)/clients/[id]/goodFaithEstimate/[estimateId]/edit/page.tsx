/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
"use client";

import { useParams, useRouter } from "next/navigation";
import {
  fetchGoodFaithEstimate,
  fetchServices,
  fetchLocations,
  updateGoodFaithEstimate,
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
import ClientCard from "../../components/ClientCard";
import ProviderCard from "../../components/ProviderCard";
import { toast } from "@mcw/ui";
import { Loading } from "@/components";

interface GoodFaithEstimateData {
  id: string;
  clinician_id: string;
  clinician_npi: string;
  clinician_tin: string;
  clinician_location_id: string;
  contact_person_id: string | null;
  clinician_phone: string;
  clinician_email: string;
  provided_date: string;
  expiration_date: string;
  service_start_date: string;
  service_end_date: string;
  total_cost: number;
  notes: string;
  GoodFaithClients: Array<{
    id: string;
    client_id: string;
    good_faith_id: string;
    name: string;
    dob: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    phone: string;
    email: string;
    should_voice: boolean;
    should_text: boolean;
    should_email: boolean;
    Client: {
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
    };
  }>;
  GoodFaithServices: Array<{
    id: string;
    good_faith_id: string;
    service_id: string;
    diagnosis_id: string;
    location_id: string;
    quantity: number;
    fee: number;
    PracticeService: {
      id: string;
      type: string;
      rate: string;
      code: string;
      description: string;
      duration: number;
    };
    Diagnosis: {
      id: string;
      code: string;
      description: string;
    };
    Location: {
      id: string;
      name: string;
      address: string;
    };
  }>;
  Clinician: {
    id: string;
    address: string;
    first_name: string;
    last_name: string;
    NPI_number: string | null;
  };
  Location: {
    id: string;
    name: string;
    address: string;
  };
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

const EditGoodFaithEstimatePage = () => {
  const params = useParams();
  const router = useRouter();
  const clientGroupId = params.id as string;
  const estimateId = params.estimateId as string;

  const [serviceRows, setServiceRows] = useState([
    { service: "", diagnosisCode: "", location: "", quantity: 1, rate: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [formData, setFormData] = useState({
    providedDate: "",
    expirationDate: "",
    diagnosisCodes: "",
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [clientsData, setClientsData] = useState<Record<string, ClientData>>(
    {},
  );
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [goodFaithData, setGoodFaithData] =
    useState<GoodFaithEstimateData | null>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(true);

  const [servicesData, setServicesData] = useState<Service[]>([]);
  const [locationsData, setLocationsData] = useState<Location[]>([]);
  const [diagnosisData, setDiagnosisData] = useState<Diagnosis[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState(true);

  // Fetch all data on component mount or when estimateId changes
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoadingEstimate(true);
        setIsLoadingServices(true);
        setIsLoadingLocations(true);
        setIsLoadingDiagnosis(true);

        // Reset all state first
        setGoodFaithData(null);
        setClientsData({});
        setProviderData(null);
        setServiceRows([
          {
            service: "",
            diagnosisCode: "",
            location: "",
            quantity: 1,
            rate: 0,
          },
        ]);
        setNotes("");
        setFormData({
          providedDate: "",
          expirationDate: "",
          diagnosisCodes: "",
        });
        setDateRange(undefined);

        // Fetch all data in parallel
        const [
          estimateData,
          [servicesResult, servicesError],
          [locationsResult, locationsError],
          [diagnosisResult, diagnosisError],
        ] = await Promise.all([
          fetchGoodFaithEstimate(estimateId),
          fetchServices(),
          fetchLocations(),
          fetchDiagnosis(),
        ]);

        // Set services data
        if (!servicesError && servicesResult) {
          setServicesData(servicesResult as Service[]);
        }
        setIsLoadingServices(false);

        // Set locations data
        if (!locationsError && locationsResult) {
          setLocationsData(locationsResult as Location[]);
        }
        setIsLoadingLocations(false);

        // Set diagnosis data
        if (!diagnosisError && diagnosisResult) {
          const diagnosisArray = (diagnosisResult as { data: Diagnosis[] })
            ?.data as Diagnosis[];
          setDiagnosisData(diagnosisArray);
        }
        setIsLoadingDiagnosis(false);

        // Set estimate data and initialize form
        if (estimateData) {
          const goodFaithEstimate = estimateData as GoodFaithEstimateData;
          setGoodFaithData(goodFaithEstimate);

          // Initialize form data
          setFormData({
            providedDate: goodFaithEstimate.provided_date
              ? new Date(goodFaithEstimate.provided_date)
                  .toISOString()
                  .split("T")[0]
              : "",
            expirationDate: goodFaithEstimate.expiration_date
              ? new Date(goodFaithEstimate.expiration_date)
                  .toISOString()
                  .split("T")[0]
              : "",
            diagnosisCodes:
              goodFaithEstimate.GoodFaithServices[0]?.diagnosis_id || "",
          });

          // Set date range
          setDateRange({
            from: goodFaithEstimate.service_start_date
              ? new Date(goodFaithEstimate.service_start_date)
              : undefined,
            to: goodFaithEstimate.service_end_date
              ? new Date(goodFaithEstimate.service_end_date)
              : undefined,
          });

          // Set notes
          setNotes(goodFaithEstimate.notes || "");

          // Set service rows
          const services = goodFaithEstimate.GoodFaithServices.map(
            (service) => ({
              service: service.service_id,
              diagnosisCode: service.diagnosis_id,
              location: service.location_id,
              quantity: service.quantity,
              rate: service.fee,
            }),
          );
          setServiceRows(
            services.length > 0
              ? services
              : [
                  {
                    service: "",
                    diagnosisCode: "",
                    location: "",
                    quantity: 1,
                    rate: 0,
                  },
                ],
          );

          // Initialize client data from GoodFaithClients (the updated data)
          const clientsFromGoodFaith: Record<string, ClientData> = {};
          goodFaithEstimate.GoodFaithClients.forEach((gfClient) => {
            clientsFromGoodFaith[gfClient.client_id] = {
              name: gfClient.name,
              dateOfBirth: gfClient.dob
                ? new Date(gfClient.dob).toISOString().split("T")[0]
                : "",
              address: gfClient.address,
              city: gfClient.city,
              state: gfClient.state,
              zipCode: gfClient.zip_code,
              phone: gfClient.phone,
              email: gfClient.email,
              voicePermission: gfClient.should_voice,
              textPermission: gfClient.should_text,
              emailPermission: gfClient.should_email,
              clientId: gfClient.client_id,
              hasErrors: false,
            };
          });
          setClientsData(clientsFromGoodFaith);

          // Initialize provider data
          if (goodFaithEstimate.Clinician) {
            setProviderData({
              name: `${goodFaithEstimate.Clinician.first_name} ${goodFaithEstimate.Clinician.last_name}`,
              npi: goodFaithEstimate.clinician_npi || "",
              tin: goodFaithEstimate.clinician_tin || "",
              location: goodFaithEstimate.clinician_location_id || "",
              address: goodFaithEstimate.Location?.address || "",
              contactPerson:
                goodFaithEstimate.contact_person_id ||
                goodFaithEstimate.Clinician.id,
              phone: goodFaithEstimate.clinician_phone || "",
              email: goodFaithEstimate.clinician_email || "",
              hasErrors: false,
            });
          }
        }
        setIsLoadingEstimate(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoadingEstimate(false);
        setIsLoadingServices(false);
        setIsLoadingLocations(false);
        setIsLoadingDiagnosis(false);
      }
    };

    fetchAllData();
  }, [estimateId]); // Re-fetch when estimateId changes

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
    if (!goodFaithData || !providerData) {
      toast({
        title: "Missing estimate or provider data",
        description: "Missing estimate or provider data",
        variant: "destructive",
      });
      return;
    }

    // Check for validation errors silently
    const hasClientErrors = Object.values(clientsData).some(
      (client) => client.hasErrors,
    );
    const hasProviderErrors = providerData.hasErrors;

    if (hasClientErrors || hasProviderErrors) {
      return;
    }

    // Check required fields silently
    if (!providerData.npi || !providerData.tin) {
      return;
    }
    setIsSaving(true);

    // Use the collected client data from components
    const clientsApiData = goodFaithData.GoodFaithClients.map((gfClient) => {
      const clientFormData = clientsData[gfClient.client_id];
      return {
        client_id: gfClient.client_id,
        name: clientFormData?.name || gfClient.name,
        dob: clientFormData?.dateOfBirth || gfClient.dob,
        address: clientFormData?.address || gfClient.address,
        city: clientFormData?.city || gfClient.city,
        state: clientFormData?.state || gfClient.state,
        zip_code: clientFormData?.zipCode || gfClient.zip_code,
        phone: clientFormData?.phone || gfClient.phone,
        email: clientFormData?.email || gfClient.email,
        should_voice: clientFormData?.voicePermission ?? gfClient.should_voice,
        should_text: clientFormData?.textPermission ?? gfClient.should_text,
        should_email: clientFormData?.emailPermission ?? gfClient.should_email,
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
      id: goodFaithData.id,
      clinician_id: goodFaithData.clinician_id,
      clinician_npi: providerData.npi.replace(/\s/g, ""),
      clinician_tin: providerData.tin.replace(/-/g, ""),
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

    // You'll need to implement updateGoodFaithEstimate in the service
    const [_, error] = await updateGoodFaithEstimate({ body, id: estimateId });

    if (error) {
      toast({
        title: "Error updating estimate",
        description: "Error updating estimate",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Good Faith Estimate updated successfully!",
        description: "Good Faith Estimate updated successfully!",
        variant: "success",
      });
      router.push(`/clients/${clientGroupId}/goodFaithEstimate/${estimateId}`);
    }
    setIsSaving(false);
  };

  if (
    isLoadingEstimate ||
    isLoadingServices ||
    isLoadingLocations ||
    isLoadingDiagnosis
  ) {
    return <Loading />;
  }

  if (!goodFaithData) {
    return <div className="p-4">No Good Faith Estimate data found</div>;
  }

  const firstClient = goodFaithData.GoodFaithClients[0];
  const additionalClients = goodFaithData.GoodFaithClients.slice(1);

  // Check if there are any validation errors
  const hasClientErrors = Object.values(clientsData).some(
    (client) => client.hasErrors,
  );
  const hasProviderErrors = providerData?.hasErrors || false;
  const hasValidationErrors = hasClientErrors || hasProviderErrors;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Good Faith Estimate</h1>
      </div>

      {/* First Row: First Client and Provider side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {firstClient && (
          <ClientCard
            client={firstClient.Client}
            index={0}
            isFirstClient={true}
            onDataChange={(data) =>
              handleClientDataChange(firstClient.client_id, data)
            }
            initialData={clientsData[firstClient.client_id]}
          />
        )}

        {goodFaithData.Clinician && locationsData && (
          <ProviderCard
            clinician={goodFaithData.Clinician}
            locations={locationsData}
            onDataChange={handleProviderDataChange}
            initialData={{
              name: `${goodFaithData.Clinician.first_name} ${goodFaithData.Clinician.last_name}`,
              npi: goodFaithData.clinician_npi || "",
              tin: goodFaithData.clinician_tin || "",
              location: goodFaithData.clinician_location_id || "",
              address: goodFaithData.Location?.address || "",
              contactPerson:
                goodFaithData.contact_person_id || goodFaithData.Clinician.id,
              phone: goodFaithData.clinician_phone || "",
              email: goodFaithData.clinician_email || "",
            }}
          />
        )}
      </div>

      {/* Additional Client Cards */}
      {additionalClients.map((gfClient, index) => (
        <ClientCard
          key={gfClient.client_id}
          client={gfClient.Client}
          index={index + 1}
          isFirstClient={false}
          onDataChange={(data) =>
            handleClientDataChange(gfClient.client_id, data)
          }
          initialData={clientsData[gfClient.client_id]}
        />
      ))}

      {/* Service Details */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            Details of services and items for{" "}
            {goodFaithData.GoodFaithClients.map(
              (c) => c.Client.legal_first_name,
            ).join(" & ")}
          </CardTitle>
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
          {isSaving ? "Updating..." : "Update"}
        </Button>
      </div>
    </div>
  );
};

export default EditGoodFaithEstimatePage;

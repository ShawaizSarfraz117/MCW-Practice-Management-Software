import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { fetchServices } from "@/(dashboard)/clients/services/client.service";

type Service = {
  id: string;
  code: string;
  description: string;
  rate: number;
};

type Appointment = {
  id: string;
  start_date: Date | string;
  title: string;
  appointment_fee: number | string;
  service_id?: string;
  client_group_id?: string;
  write_off?: number;
};

type FormValues = {
  writeOff: string;
  serviceId: string;
  fee: string;
};

interface EditAppointmentFormProps {
  appointment: Appointment;
  onCancel: () => void;
  onSave: (values: FormValues) => void;
  isSaving: boolean;
}

export function EditAppointmentForm({
  appointment,
  onCancel,
  onSave,
  isSaving,
}: EditAppointmentFormProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>({
    writeOff: "",
    serviceId: "",
    fee: "",
  });

  // Fetch services and initialize form values when component mounts
  useEffect(() => {
    const initializeForm = async () => {
      // Initialize form values from the appointment
      setFormValues({
        writeOff: appointment.write_off?.toString() || "",
        serviceId: appointment.service_id || "",
        fee: appointment.appointment_fee?.toString() || "",
      });

      setIsLoadingServices(true);
      const [servicesData, error] = await fetchServices();
      if (!error) {
        setServices(servicesData as Service[]);
      }
      setIsLoadingServices(false);
    };

    initializeForm();
  }, [appointment]);

  const handleInputChange = (field: keyof FormValues, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleServiceChange = (serviceId: string) => {
    const selectedService = services.find(
      (service) => service.id === serviceId,
    );

    setFormValues((prev) => ({
      ...prev,
      serviceId,
      fee: selectedService?.rate.toString() || prev.fee,
    }));
  };

  const handleSaveClick = () => {
    onSave(formValues);
  };

  return (
    <div className="p-4 bg-gray-50 m-2 rounded-md border border-gray-200">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium mb-2">Type</p>
          <Select value="self-pay">
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="self-pay">Self-pay</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Write Off</p>
          <div className="flex items-center">
            <span className="mr-2">$</span>
            <Input
              className="bg-white"
              type="number"
              value={formValues.writeOff}
              onChange={(e) => handleInputChange("writeOff", e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="mb-4">
        <p className="text-sm font-medium mb-2 flex items-center">
          Services <span className="text-red-500 ml-1">*</span>
        </p>
        <div className="flex items-center gap-4">
          <Select
            value={formValues.serviceId}
            onValueChange={handleServiceChange}
          >
            <SelectTrigger className="bg-white flex-1">
              {isLoadingServices ? (
                <div className="flex items-center gap-2">
                  <p>Loading services...</p>
                </div>
              ) : (
                <SelectValue placeholder="Select service" />
              )}
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.code} {service.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span>Fee</span>
            <Input
              className="w-24 bg-white"
              type="text"
              value={`$${formValues.fee}`}
              onChange={(e) => {
                const value = e.target.value.replace(/\$|\s/g, "");
                handleInputChange("fee", value);
              }}
            />
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-500 mb-4">
        Note: changes made here affect this session only.
      </div>
      <div className="flex justify-end gap-2">
        <Button disabled={isSaving} variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="bg-[#2d8467] hover:bg-[#236c53]"
          disabled={isSaving}
          onClick={handleSaveClick}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

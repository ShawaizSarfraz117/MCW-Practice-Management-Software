"use client";
import React from "react";
import { useForm } from "@tanstack/react-form";
import {
  Button,
  Input,
  Select,
  SelectItem,
  SelectContent,
  Textarea,
  SelectTrigger,
} from "@mcw/ui";
import { Plus } from "lucide-react";

interface Service {
  detail: string;
  diagnosis: string;
  location: string;
  quantity: number;
  fee: number;
}

interface ServiceDetailsFormData {
  dateProvided: string;
  timeProvided: string;
  expirationDate: string;
  serviceDates: string;
  diagnosisCodes: string;
  notes: string;
  services: Service[];
}

interface ServiceDetailsProps {
  totalCost: number;
  clientName: string;
  initialData?: Partial<ServiceDetailsFormData>;
  onSubmit?: (data: ServiceDetailsFormData) => void;
}

interface ServicesTableProps {
  services: Service[];
  updateService: (idx: number, key: string, value: string | number) => void;
  addService: () => void;
}

function ServicesTable({
  services,
  updateService,
  addService,
}: ServicesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-t border-gray-200 mb-2">
        <thead>
          <tr>
            <th className="py-2 px-2 text-left font-semibold">
              Service details
            </th>
            <th className="py-2 px-2 text-left font-semibold">
              Diagnosis code
            </th>
            <th className="py-2 px-2 text-left font-semibold">Location</th>
            <th className="py-2 px-2 text-left font-semibold">Quantity</th>
            <th className="py-2 px-2 text-left font-semibold">Fee</th>
            <th className="py-2 px-2 text-left font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service, idx) => (
            <tr key={idx}>
              <td className="py-2 px-2">
                <Select
                  value={service.detail}
                  onValueChange={(val) => updateService(idx, "detail", val)}
                >
                  <SelectTrigger>{service.detail}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90834 Psychotherapy, 45 min">
                      90834 Psychotherapy, 45 min
                    </SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="py-2 px-2">
                <Select
                  value={service.diagnosis}
                  onValueChange={(val) => updateService(idx, "diagnosis", val)}
                >
                  <SelectTrigger>{service.diagnosis}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F41.9">F41.9</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="py-2 px-2">
                <Select
                  value={service.location}
                  onValueChange={(val) => updateService(idx, "location", val)}
                >
                  <SelectTrigger>{service.location}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Video Office">Video Office</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="py-2 px-2">
                <Input
                  type="number"
                  min={1}
                  value={service.quantity}
                  onChange={(e) =>
                    updateService(
                      idx,
                      "quantity",
                      parseInt(e.target.value) || 0,
                    )
                  }
                />
              </td>
              <td className="py-2 px-2">${service.fee}</td>
              <td className="py-2 px-2">
                ${(service.fee * service.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        type="button"
        variant="ghost"
        className="text-green-700 flex items-center gap-1"
        onClick={addService}
      >
        <Plus className="h-4 w-4" /> Add service
      </Button>
    </div>
  );
}

function ServiceDetails({
  totalCost,
  clientName,
  initialData = {},
  onSubmit,
}: ServiceDetailsProps) {
  const form = useForm({
    defaultValues: {
      dateProvided: initialData.dateProvided || "2025-03-29",
      timeProvided: initialData.timeProvided || "19:13",
      expirationDate: initialData.expirationDate || "2026-03-29",
      serviceDates: initialData.serviceDates || "Mar 29, 2025 - Sep 29, 2025",
      diagnosisCodes: initialData.diagnosisCodes || "F41.9",
      notes: initialData.notes || "",
      services: initialData.services || [
        {
          detail: "90834 Psychotherapy, 45 min",
          diagnosis: "F41.9",
          location: "Video Office",
          quantity: 1,
          fee: 100,
        },
      ],
    } as ServiceDetailsFormData,
    onSubmit: async ({ value }) => {
      onSubmit?.(value);
    },
  });

  const addService = () => {
    form.setFieldValue("services", (prev) => [
      ...prev,
      { detail: "", diagnosis: "", location: "", quantity: 1, fee: 100 },
    ]);
  };

  const updateService = (idx: number, key: string, value: string | number) => {
    form.setFieldValue("services", (prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [key]: value } : s)),
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 p-6">
        <div className="font-semibold text-gray-700 text-lg mb-4">
          Details of services and items for {clientName}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="w-[50%]">
            <form.Field name="dateProvided">
              {(field) => (
                <>
                  <label className="block text-sm text-gray-600 mb-1">
                    Date provided
                  </label>
                  <Input
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-10"
                  />
                </>
              )}
            </form.Field>
          </div>
          <div className="w-[50%]">
            <form.Field name="timeProvided">
              {(field) => (
                <>
                  <label className="block text-sm text-gray-600 mb-1">
                    Time
                  </label>
                  <Input
                    type="time"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-10"
                  />
                </>
              )}
            </form.Field>
          </div>
          <div className="w-[50%]">
            <form.Field name="expirationDate">
              {(field) => (
                <>
                  <label className="block text-sm text-gray-600 mb-1">
                    Expiration date
                  </label>
                  <Input
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-10"
                  />
                </>
              )}
            </form.Field>
          </div>
          <div className="w-[50%]">
            <form.Field name="serviceDates">
              {(field) => (
                <>
                  <label className="block text-sm text-gray-600 mb-1">
                    Service dates
                  </label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-10"
                  />
                </>
              )}
            </form.Field>
          </div>
          <div className="w-[50%]">
            <form.Field name="diagnosisCodes">
              {(field) => (
                <>
                  <label className="block text-sm text-gray-600 mb-1">
                    Diagnosis codes
                  </label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-10"
                  />
                </>
              )}
            </form.Field>
          </div>
        </div>
        <form.Field name="services">
          {(field) => (
            <ServicesTable
              services={field.state.value}
              updateService={updateService}
              addService={addService}
            />
          )}
        </form.Field>
        <div className="flex justify-end mt-4">
          <div className="text-lg font-semibold">
            Total estimated cost{" "}
            <span className="text-black font-bold">
              ${totalCost.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="mt-6">
          <form.Field name="notes">
            {(field) => (
              <>
                <label className="block text-sm text-gray-600 mb-1">
                  Notes
                </label>
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={4}
                />
              </>
            )}
          </form.Field>
        </div>
      </div>
    </form>
  );
}

export default ServiceDetails;

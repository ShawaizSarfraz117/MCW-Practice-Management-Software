"use client";
import React from "react";
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

interface ServiceDetailsProps {
  dateProvided: string;
  setDateProvided: (v: string) => void;
  timeProvided: string;
  setTimeProvided: (v: string) => void;
  expirationDate: string;
  setExpirationDate: (v: string) => void;
  serviceDates: string;
  setServiceDates: (v: string) => void;
  diagnosisCodes: string;
  setDiagnosisCodes: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  services: Service[];
  updateService: (idx: number, key: string, value: string | number) => void;
  addService: () => void;
  totalCost: number;
}

const ServiceDetails: React.FC<ServiceDetailsProps> = ({
  dateProvided,
  setDateProvided,
  timeProvided,
  setTimeProvided,
  expirationDate,
  setExpirationDate,
  serviceDates,
  setServiceDates,
  diagnosisCodes,
  setDiagnosisCodes,
  notes,
  setNotes,
  services,
  updateService,
  addService,
  totalCost,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 p-6">
      <div className="font-semibold text-gray-700 text-lg mb-4">
        Details of services and items for Alam Naqvi
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        <div className="w-[50%]">
          <label className="block text-sm text-gray-600 mb-1">
            Date provided
          </label>
          <Input
            type="date"
            value={dateProvided}
            onChange={(e) => setDateProvided(e.target.value)}
            className="h-10"
          />
        </div>
        <div className="w-[50%]">
          <label className="block text-sm text-gray-600 mb-1">Time</label>
          <Input
            type="time"
            value={timeProvided}
            onChange={(e) => setTimeProvided(e.target.value)}
            className="h-10"
          />
        </div>
        <div className="w-[50%]">
          <label className="block text-sm text-gray-600 mb-1">
            Expiration date
          </label>
          <Input
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className="h-10"
          />
        </div>
        <div className="w-[50%]">
          <label className="block text-sm text-gray-600 mb-1">
            Service dates
          </label>
          <Input
            value={serviceDates}
            onChange={(e) => setServiceDates(e.target.value)}
            className="h-10"
          />
        </div>
        <div className="w-[50%]">
          <label className="block text-sm text-gray-600 mb-1">
            Diagnosis codes
          </label>
          <Input
            value={diagnosisCodes}
            onChange={(e) => setDiagnosisCodes(e.target.value)}
            className="h-10"
          />
        </div>
      </div>
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
                    onValueChange={(val) =>
                      updateService(idx, "diagnosis", val)
                    }
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
                      updateService(idx, "quantity", e.target.value)
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
          variant="ghost"
          className="text-green-700 flex items-center gap-1"
          onClick={addService}
        >
          <Plus className="h-4 w-4" /> Add service
        </Button>
      </div>
      <div className="flex justify-end mt-4">
        <div className="text-lg font-semibold">
          Total estimated cost{" "}
          <span className="text-black font-bold">${totalCost.toFixed(2)}</span>
        </div>
      </div>
      <div className="mt-6">
        <label className="block text-sm text-gray-600 mb-1">Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
};

export default ServiceDetails;

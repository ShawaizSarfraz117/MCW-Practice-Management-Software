"use client";

import { useState } from "react";
import { Button } from "@mcw/ui";
import { Check, Calendar, User } from "lucide-react"; // Assuming these icons are needed based on screenshot

// Mock data type (replace with Prisma type later)
interface Service {
  id: string;
  code: string;
  name: string;
  duration: number;
  rate: number;
  isDefault: boolean;
  description: string; // Added for info box text
  allowOnlineBooking?: boolean; // Example based on icons
  allowNewClients?: boolean; // Example based on icons
}

export default function ServicesPage() {
  // Mock data based on screenshot
  const [services, _setServices] = useState<Service[]>([
    {
      id: "1",
      code: "90834",
      name: "Psychotherapy, 45 min",
      duration: 45,
      rate: 100,
      isDefault: true,
      description: "Service Descriptions are shown throughout...", // Example description
    },
    {
      id: "2",
      code: "00000",
      name: "Initial Consultation - No Charge",
      duration: 15,
      rate: 0,
      isDefault: false,
      description: "",
      allowOnlineBooking: true,
      allowNewClients: true,
    },
    {
      id: "3",
      code: "90791",
      name: "Psychiatric Diagnostic Evaluation",
      duration: 50,
      rate: 100,
      isDefault: false,
      description: "",
      allowOnlineBooking: true,
      allowNewClients: true,
    },
    // Add other services from screenshot...
  ]);

  // TODO: Implement Add Service functionality (e.g., open a dialog)
  const handleAddService = () => {
    console.log("Add Service clicked");
  };

  // TODO: Implement Edit Service functionality (e.g., navigate or open dialog)
  const handleEditService = (serviceId: string) => {
    console.log("Edit Service clicked:", serviceId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">Services</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage services and set rates.
          </p>
        </div>
        <Button
          onClick={handleAddService}
          className="bg-[#2d8467] hover:bg-[#236c53]"
        >
          Add Service
        </Button>
      </div>

      {/* Info Box */}
      <div
        className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md"
        role="alert"
      >
        <p className="font-bold">Click on each Service name to edit</p>
        <p className="text-sm">
          {services[0]?.description ||
            "Service Descriptions are shown throughout the SimplePractice platform internally, in some client communications and in superbills."}
        </p>
      </div>

      {/* Services List */}
      <div className="space-y-1">
        {/* List Header */}
        <div className="flex justify-between items-center pb-3 border-b mb-2">
          <p className="text-base font-medium">Services</p>
          <p className="text-base font-medium">Appointment requests</p>
        </div>

        {/* List Items */}
        {services.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No services defined yet.
          </p>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="border-b py-3 px-3 hover:bg-gray-50 cursor-pointer rounded-md"
              onClick={() => handleEditService(service.id)}
            >
              <div className="flex justify-between items-start">
                {/* Left side: Service details */}
                <div>
                  <p className="text-[#2D8467] font-medium">
                    <span className="mr-2 text-gray-600">{service.code}</span>
                    {service.name}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {service.duration} minutes at ${service.rate}
                  </p>
                  {service.isDefault && (
                    <p className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                      <Check className="h-4 w-4 text-green-600" /> Default
                      practice service
                    </p>
                  )}
                </div>

                {/* Right side: Icons (Appointment requests) */}
                <div className="flex items-center space-x-2 mt-1">
                  {service.allowOnlineBooking && (
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  )}
                  {service.allowNewClients && (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                  {/* Add other icons/indicators as needed */}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

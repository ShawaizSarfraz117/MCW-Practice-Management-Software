"use client";

import React, { useState } from "react";
import { Button } from "@mcw/ui";
import { Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Service, ServiceEdit } from "./components/types";
import ServiceEditForm from "./components/ServiceEditForm";
import AddServiceDialog from "./components/AddServiceDialog";

const ServiceSection = () => {
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(
    null,
  );
  const [modalOpen, setIsModalOpen] = useState(false);
  const [editValues, setEditValues] = useState<ServiceEdit>({} as ServiceEdit);
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const response = await fetch("/api/service");
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (serviceData: ServiceEdit) => {
      const response = await fetch("/api/service", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData),
      });
      if (!response.ok) throw new Error("Failed to update service");
      return response.json();
    },
    onSuccess: (updatedService: Service) => {
      queryClient.setQueryData<Service[]>(["services"], (old: Service[] = []) =>
        old.map((s: Service) =>
          s.id === updatedService.id ? updatedService : s,
        ),
      );
      setExpandedServiceId(null);
    },
  });

  const handleServiceClick = (serviceId: string) => {
    if (expandedServiceId !== serviceId) {
      const service = services.find((s: Service) => s.id === serviceId);
      setEditValues({
        id: service?.id || "",
        code: service?.code || "",
        type: service?.type || "",
        description: service?.description || "",
        rate: service?.rate || 0,
        duration: service?.duration || 0,
        bill_in_units: service?.bill_in_units || false,
        available_online: service?.available_online || false,
        allow_new_clients: service?.allow_new_clients || false,
        require_call: service?.require_call || false,
        block_before: service?.block_before || 0,
        block_after: service?.block_after || 0,
        is_default: service?.is_default || false,
        color: service?.color || "",
      });
    }
    setExpandedServiceId(expandedServiceId === serviceId ? null : serviceId);
  };

  const handleFieldChange = <K extends keyof ServiceEdit>(
    field: K,
    value: ServiceEdit[K],
  ) => {
    setEditValues((prev) => {
      const newValues = { ...prev, [field]: value };
      if (field === "description") {
        newValues.type = value as string;
      }
      return newValues;
    });
  };

  const handleSave = async (serviceId: string) => {
    updateServiceMutation.mutate({
      ...editValues,
      id: serviceId,
    });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["services"] });
  };

  return (
    <>
      <div>
        <div className="flex justify-between mt-5">
          <div>
            <h3 className="text-[22px] font-medium">Services</h3>
            <p className="text-[#4B5563] text-[14px]">
              Manage services and set rates.
            </p>
          </div>
          <Button
            className="bg-[#2d8467] hover:bg-[#236c53] w-[160px]"
            onClick={() => setIsModalOpen(true)}
          >
            Add Services
          </Button>
        </div>
        <div className="bg-[#EFF6FF] rounded-[10px] p-5 mt-5">
          <h3 className="text-[16px]">Click on each Service name to edit</h3>
          <p className="text-[#4B5563] text-[14px]">
            Service Descriptions are shown throughout the SimplePractice
            platform internally, in some client communications and in
            superbills.
          </p>
        </div>
        <div className="bg-white mt-5 p-4 shadow rounded-[10px]">
          <div className="flex justify-between items-center pb-3 border-b">
            <p className="text-[16px] font-medium">Services</p>
            <p className="text-[16px] font-medium">Appointment requests</p>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-gray-500">
              Loading services...
            </div>
          ) : services.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No services found
            </div>
          ) : (
            services.map((service: Service) => (
              <div
                key={service.id}
                className={`border-b py-3 ${
                  expandedServiceId === service.id ? "bg-[#E5E7EB]" : ""
                } px-3 rounded-[10px]`}
              >
                <div
                  className="cursor-pointer"
                  onClick={() => handleServiceClick(service.id)}
                >
                  <p className="text-[#2D8467] text-[16px]">
                    <span className="mr-2">{service.code}</span> {service.type}
                  </p>
                  <p className="text-[#4B5563] text-[14px] mt-1">
                    {service.duration} minutes at ${service.rate}
                  </p>
                  {service.is_default && (
                    <p className="text-[#8D8D8D] text-[14px] flex gap-2 mt-1">
                      <Check className="h-5 w-5" /> Default practice service
                    </p>
                  )}
                </div>
                {expandedServiceId === service.id && (
                  <ServiceEditForm
                    editValues={editValues}
                    service={service}
                    onCancel={() => setExpandedServiceId(null)}
                    onEditChange={handleFieldChange}
                    onSave={handleSave}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <AddServiceDialog
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalClose}
      />
    </>
  );
};

export default ServiceSection;

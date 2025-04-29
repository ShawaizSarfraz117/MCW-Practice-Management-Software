"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@mcw/ui";
import { Check, Info } from "lucide-react";
import { Service } from "../../calendar/components/appointment-dialog/types";
import AddServcieDialog from "../../billing/components/AddServiceDialog";

// Define a type for editing service fields
// All fields optional except id
// This helps with type safety for editValues
//
type ServiceEdit = Partial<Omit<Service, "id">> & { id: string };

const ServiceSection = () => {
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(
    null,
  );
  const [modalOpen, setIsModalOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<ServiceEdit>({} as ServiceEdit);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/service");
      if (!response.ok) throw new Error("Failed to fetch services");
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleServiceClick = (serviceId: string) => {
    if (expandedServiceId !== serviceId) {
      const service = services.find((s) => s.id === serviceId);
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
        color: service?.color || null,
      });
    }
    setExpandedServiceId(expandedServiceId === serviceId ? null : serviceId);
  };

  const handleEditChange = <K extends keyof ServiceEdit>(
    field: K,
    value: ServiceEdit[K],
  ) => {
    setEditValues((prev) => {
      const newValues = { ...prev, [field]: value };
      // If description is being updated, also update the type
      if (field === "description") {
        newValues.type = value as string;
      }
      return newValues;
    });
  };

  const handleSave = async (serviceId: string) => {
    try {
      const response = await fetch("/api/service", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editValues,
          id: serviceId,
        }),
      });
      if (!response.ok) throw new Error("Failed to update service");
      const updated = await response.json();
      setServices(services.map((s) => (s.id === serviceId ? updated : s)));
      setExpandedServiceId(null);
    } catch (error) {
      console.error("Error updating services:", error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchServices();
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
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2d8467] hover:bg-[#236c53] w-[160px]"
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

          {loading ? (
            <div className="py-8 text-center text-gray-500">
              Loading services...
            </div>
          ) : services.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No services found
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                className={`border-b py-3 ${
                  expandedServiceId === service.id ? "bg-[#E5E7EB]" : ""
                } px-3 rounded-[10px]`}
              >
                <div
                  onClick={() => handleServiceClick(service.id)}
                  className="cursor-pointer"
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
                  <div className="mt-3">
                    <p className="text-[#374151] text-[14px]">Description</p>
                    <input
                      type="text"
                      value={editValues.description || ""}
                      onChange={(e) =>
                        handleEditChange("description", e.target.value)
                      }
                      className="text-[#374151] bg-white text-[14px] w-[500px] border rounded-[5px] outline-none p-2"
                    />
                    <div className="flex items-center gap-4 mt-3">
                      <span>
                        <p className="text-[#374151] text-[14px]">Rate</p>
                        <input
                          type="number"
                          value={editValues.rate}
                          onChange={(e) =>
                            handleEditChange("rate", Number(e.target.value))
                          }
                          className="text-[#374151] text-[14px] w-[200px] border rounded-[5px] outline-none p-2"
                        />
                      </span>
                      <span>
                        <p className="text-[#374151] text-[14px]">
                          Default Duration
                        </p>
                        <input
                          type="number"
                          value={editValues.duration}
                          min={0}
                          onChange={(e) =>
                            handleEditChange("duration", Number(e.target.value))
                          }
                          className="text-[#374151] bg-white text-[14px] w-[80px] border rounded-[5px] outline-none p-2"
                        />
                        <span className="text-[#1F2937] ml-2 text-[14px]">
                          min
                        </span>
                      </span>
                      <span className="ml-auto">
                        <input
                          id={`active-${service.id}`}
                          type="checkbox"
                          checked={true}
                          readOnly
                          className="h-[15px] accent-[#afafaf] bg-white w-[15px]"
                        />
                        <label
                          className="text-[#1F2937] ml-1 text-[15px]"
                          htmlFor={`active-${service.id}`}
                        >
                          Active
                        </label>
                      </span>
                    </div>
                    <div className="flex gap-2 items-center mt-2">
                      <input
                        id={`bill-units-${service.id}`}
                        type="checkbox"
                        checked={editValues.bill_in_units}
                        onChange={(e) =>
                          handleEditChange("bill_in_units", e.target.checked)
                        }
                        className="h-[15px] accent-[#2D8467] bg-white w-[15px]"
                      />
                      <p className="text-[#1F2937] text-[14px]">
                        Bill this code in units
                      </p>
                      <Info className="h-4 w-4" />
                    </div>
                    <div className="mt-2">
                      <p className="text-[#1F2937] my-4 text-[16px]">
                        Booking Options
                      </p>
                      <div className="flex gap-2 items-center">
                        <input
                          id={`online-${service.id}`}
                          type="checkbox"
                          checked={editValues.available_online}
                          onChange={(e) =>
                            handleEditChange(
                              "available_online",
                              e.target.checked,
                            )
                          }
                          className="h-[15px] accent-[#2D8467] bg-white w-[15px]"
                        />
                        <p className="text-[#1F2937] text-[14px]">
                          Available for online appointment requests
                        </p>
                      </div>
                    </div>
                    <div className="text-[#1F2937] text-[14px] flex items-center gap-1 mt-3">
                      <p>Block off</p>
                      <input
                        type="number"
                        min={0}
                        value={editValues.block_before}
                        onChange={(e) =>
                          handleEditChange(
                            "block_before",
                            Number(e.target.value),
                          )
                        }
                        className="text-[#374151] bg-white text-[14px] w-[60px] border rounded-[5px] outline-none p-2"
                      />
                      <p>minutes before and</p>
                      <input
                        type="number"
                        min={0}
                        value={editValues.block_after}
                        onChange={(e) =>
                          handleEditChange(
                            "block_after",
                            Number(e.target.value),
                          )
                        }
                        className="text-[#374151] bg-white text-[14px] w-[60px] border rounded-[5px] outline-none p-2"
                      />
                      <p>minutes after the appointment</p>
                    </div>
                    <div className="mt-5 flex items-center gap-4">
                      <Button
                        onClick={() => setExpandedServiceId(null)}
                        className="bg-transparent text-black hover:bg-gray-50 border border-[lightgray]"
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-[#2d8467] hover:bg-[#236c53]"
                        onClick={() => handleSave(service.id)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <AddServcieDialog
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalClose}
      />
    </>
  );
};

export default ServiceSection;

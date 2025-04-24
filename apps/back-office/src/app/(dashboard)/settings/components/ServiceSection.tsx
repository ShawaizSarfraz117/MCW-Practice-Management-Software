"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@mcw/ui";
import { Check, Info } from "lucide-react";
import { Service } from "../../calendar/components/appointment-dialog/types";
import AddServcieDialog from "../../billing/components/AddServiceDialog";

const ServiceSection = () => {
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(
    null,
  );
  const [modalOpen, setIsModalOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/service");
        if (!response.ok) {
          throw new Error("Failed to fetch services");
        }
        const data = await response.json();
        setServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleServiceClick = (serviceId: string) => {
    setExpandedServiceId(expandedServiceId === serviceId ? null : serviceId);
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
                  {service.isDefault && (
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
                      defaultValue={service.description || ""}
                      className="text-[#374151] bg-white text-[14px] w-[500px] border rounded-[5px] outline-none p-2"
                    />
                    <div className="flex items-center gap-4 mt-3">
                      <span>
                        <p className="text-[#374151] text-[14px]">Rate</p>
                        <input
                          type="text"
                          defaultValue={service.rate}
                          className="text-[#374151] text-[14px] w-[200px] border rounded-[5px] outline-none p-2"
                        />
                      </span>
                      <span>
                        <p className="text-[#374151] text-[14px]">
                          Default Duration
                        </p>
                        <input
                          type="number"
                          defaultValue={service.duration}
                          min={0}
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
                          defaultChecked={true}
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
                        className="text-[#374151] bg-white text-[14px] w-[60px] border rounded-[5px] outline-none p-2"
                      />
                      <p>minutes before and</p>
                      <input
                        type="number"
                        min={0}
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
                      <Button className="bg-[#2d8467] hover:bg-[#236c53]">
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
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ServiceSection;

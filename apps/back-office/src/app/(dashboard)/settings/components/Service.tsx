"use client";
import type React from "react";
import { Button, Checkbox, Input } from "@mcw/ui";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@radix-ui/react-accordion";
import arrow from "../../../../../public/images/Frame.svg";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CreateService } from "./CreateService";
import { toast } from "../../../hooks/use-toast";

interface Service {
  id: string;
  code: string;
  description: string;
  rate: number;
  duration: number;
  type: string;
  color?: string;
  isActive?: boolean;
  isUnitBased?: boolean;
  isOnlineBookingEnabled?: boolean;
  minutesBlockBefore?: number;
  minutesBlockAfter?: number;
}

export default function Service() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [createServiceModel, setCreateServiceModel] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    setIsLoadingServices(true);
    setError(null);
    try {
      const response = await fetch("/api/service");
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError("Failed to load services. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load services. Please try again.",
        variant: "destructive",
      });
      console.error("Error fetching services:", err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleChange = (id: string, value: string, name: string) => {
    setServices((prevServices) =>
      prevServices.map((service) =>
        service.id === id
          ? {
              ...service,
              [name]:
                name === "rate"
                  ? parseFloat(value) || 0
                  : name === "duration"
                    ? parseInt(value) || 0
                    : value,
            }
          : service,
      ),
    );
  };

  const validateService = (service: Service): boolean => {
    if (!service.description?.trim()) {
      toast({
        title: "Validation Error",
        description: "Description is required",
        variant: "destructive",
      });
      return false;
    }

    if (service.rate < 0) {
      toast({
        title: "Validation Error",
        description: "Rate must be a positive number",
        variant: "destructive",
      });
      return false;
    }

    if (service.duration < 1) {
      toast({
        title: "Validation Error",
        description: "Duration must be at least 1 minute",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const submitEditForm = async (id: string) => {
    setIsLoading(true);
    try {
      const service = services.find((s) => s.id === id);
      if (!service) {
        throw new Error("Service not found");
      }

      if (!validateService(service)) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/service/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(service),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update service");
      }

      await fetchServices(); // Refresh the services list
      toast({
        title: "Success",
        description: "Service updated successfully",
      });
      setOpenItem(null); // Close the accordion after successful update
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Failed to update service. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to save service:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative w-full p-[24px] flex flex-col gap-[32px] bg-[#F9FAFB]">
        <div className="w-full flex justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-[#1F2937] leading-[24px]">
              Services
            </h1>
            <h3 className="text-[16px] font-normal text-[#4B5563] leading-[16px] mt-2">
              Manage services and set rates.
            </h3>
          </div>
          <div>
            <Button
              size="lg"
              onClick={() => setCreateServiceModel(true)}
              disabled={isLoadingServices || !!error}
              aria-label="Add new service"
            >
              Add Service
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/15 p-[16px] rounded-lg" role="alert">
            <p className="text-[16px] font-semibold text-destructive">
              {error}
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={fetchServices}
              disabled={isLoadingServices}
              aria-label="Retry loading services"
            >
              Retry
            </Button>
          </div>
        )}

        {!error && (
          <>
            <div className="bg-[#EFF6FF] p-[16px] rounded-lg" role="note">
              <p className="text-[16px] font-semibold text-[#1F2937]">
                Click on each Service name to edit
              </p>
              <p className="text-[14px] font-normal text-[#4B5563] pt-2">
                Service Descriptions are shown throughout the SimplePractice
                platform internally, in some client communications and in
                superbills.
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-[25px] rounded-md">
              <div className="w-full flex justify-between">
                <p className="font-semibold text-[16px] leading-[16px] text-[#1F2937]">
                  Services
                </p>
                <p className="font-semibold text-[16px] leading-[16px] text-[#1F2937]">
                  Appointment requests
                </p>
              </div>

              {isLoadingServices ? (
                <div
                  className="flex items-center justify-center h-32"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-muted-foreground">Loading services...</p>
                </div>
              ) : services.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-32"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-muted-foreground">No services found</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => setCreateServiceModel(true)}
                    aria-label="Add your first service"
                  >
                    Add your first service
                  </Button>
                </div>
              ) : (
                <div role="list" aria-label="Services list">
                  {services.map((service, index) => (
                    <div
                      key={service.id}
                      className="border-t border-[#E5E7EB] mt-4"
                    >
                      <Accordion
                        type="single"
                        collapsible
                        className="w-full flex flex-col gap-3 mt-3"
                        onValueChange={(value) => setOpenItem(value)}
                      >
                        <AccordionItem value={`item-${index}`}>
                          <AccordionTrigger
                            className={`text-[16px] font-medium leading-[16px] text-[#374151] w-full text-left flex items-center justify-between p-[20px] ${
                              openItem === `item-${index}`
                                ? "bg-[#0000000A] rounded-t-lg"
                                : ""
                            }`}
                            onClick={() =>
                              setServiceOpen(!serviceOpen ? true : false)
                            }
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-3">
                                <p className="text-[16px] font-normal text-[#2D8467] leading-[16px]">
                                  {service?.code}
                                </p>
                                <p className="text-[16px] font-normal text-[#2D8467] leading-[16px]">
                                  {service.description}
                                </p>
                              </div>
                              <p className="text-[14px] font-normal text-[#4B5563] leading-[14px]">
                                {`${service.duration} minutes at ${service.rate}$`}
                              </p>
                              <div className="flex gap-2 items-center">
                                <Image src={arrow} alt="image" />
                                <p className="text-[14px] font-normal text-[#8D8D8D] leading-[14px]">
                                  Default practice service
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="bg-[#0000000A] p-[20px] rounded-b-lg overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                            <div>
                              <form
                                className="flex flex-col gap-4"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  submitEditForm(service.id);
                                }}
                              >
                                <div>
                                  <label className="text-[16px] font-normal text-[#374151]">
                                    Description
                                  </label>
                                  <Input
                                    name="description"
                                    id="description"
                                    placeholder="Enter Description"
                                    value={service.description}
                                    className="bg-[#ffffff] w-[50%] mt-2"
                                    onChange={(e) =>
                                      handleChange(
                                        service.id,
                                        e.target.value,
                                        "description",
                                      )
                                    }
                                    disabled={isLoading}
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex gap-7">
                                    <div>
                                      <label className="text-[16px] font-normal text-[#374151]">
                                        Rate
                                      </label>
                                      <Input
                                        name="rate"
                                        id="rate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Enter rate"
                                        value={service.rate}
                                        className="bg-[#ffffff] w-[230px] mt-2"
                                        onChange={(e) =>
                                          handleChange(
                                            service.id,
                                            e.target.value,
                                            "rate",
                                          )
                                        }
                                        disabled={isLoading}
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[16px] font-normal text-[#374151]">
                                        Default Duration
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          name="duration"
                                          type="number"
                                          min="1"
                                          placeholder="Enter duration"
                                          value={service.duration}
                                          className="bg-[#ffffff] w-[230px] mt-2"
                                          onChange={(e) =>
                                            handleChange(
                                              service.id,
                                              e.target.value,
                                              "duration",
                                            )
                                          }
                                          disabled={isLoading}
                                        />
                                        <p className="text-[16px] font-normal text-[#374151]">
                                          min
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={`active-${service.id}`}
                                      checked={service.isActive}
                                      onCheckedChange={(checked) =>
                                        handleChange(
                                          service.id,
                                          checked.toString(),
                                          "isActive",
                                        )
                                      }
                                      disabled={isLoading}
                                    />
                                    <label
                                      htmlFor={`active-${service.id}`}
                                      className="text-[16px] font-normal text-[#374151]"
                                    >
                                      Active
                                    </label>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`units-${service.id}`}
                                    checked={service.isUnitBased}
                                    onCheckedChange={(checked) =>
                                      handleChange(
                                        service.id,
                                        checked.toString(),
                                        "isUnitBased",
                                      )
                                    }
                                    disabled={isLoading}
                                  />
                                  <label
                                    htmlFor={`units-${service.id}`}
                                    className="text-[16px] font-normal text-[#374151]"
                                  >
                                    Bill this code in units
                                  </label>
                                </div>

                                <div className="flex flex-col gap-4">
                                  <p className="text-[16px] font-semibold text-[#1F2937]">
                                    Booking Options
                                  </p>

                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={`online-${service.id}`}
                                      checked={service.isOnlineBookingEnabled}
                                      onCheckedChange={(checked) =>
                                        handleChange(
                                          service.id,
                                          checked.toString(),
                                          "isOnlineBookingEnabled",
                                        )
                                      }
                                      disabled={isLoading}
                                    />
                                    <label
                                      htmlFor={`online-${service.id}`}
                                      className="text-[16px] font-normal text-[#374151]"
                                    >
                                      Available for online appointment requests
                                    </label>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <p className="text-[16px] font-normal text-[#374151]">
                                      Block
                                    </p>
                                    <Input
                                      name="minutesBefore"
                                      type="number"
                                      min="0"
                                      className="w-[64px]"
                                      value={service.minutesBlockBefore || ""}
                                      onChange={(e) =>
                                        handleChange(
                                          service.id,
                                          e.target.value,
                                          "minutesBlockBefore",
                                        )
                                      }
                                      disabled={isLoading}
                                    />
                                    <p className="text-[16px] font-normal text-[#374151]">
                                      minutes before and
                                    </p>
                                    <Input
                                      name="minutesAfter"
                                      type="number"
                                      min="0"
                                      className="w-[64px]"
                                      value={service.minutesBlockAfter || ""}
                                      onChange={(e) =>
                                        handleChange(
                                          service.id,
                                          e.target.value,
                                          "minutesBlockAfter",
                                        )
                                      }
                                      disabled={isLoading}
                                    />
                                    <p className="text-[16px] font-normal text-[#374151]">
                                      minutes after the appointment
                                    </p>
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setOpenItem(null)}
                                    disabled={isLoading}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="default"
                                    type="submit"
                                    disabled={isLoading}
                                  >
                                    {isLoading ? "Saving..." : "Save"}
                                  </Button>
                                </div>
                              </form>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {createServiceModel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-service-title"
        >
          <CreateService
            setCreateServiceModel={setCreateServiceModel}
            onSuccess={() => {
              setCreateServiceModel(false);
              fetchServices();
            }}
          />
        </div>
      )}
    </>
  );
}

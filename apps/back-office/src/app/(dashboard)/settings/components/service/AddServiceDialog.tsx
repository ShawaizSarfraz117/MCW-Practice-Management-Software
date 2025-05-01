"use client";

import { X, ChevronDown } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  FormLabel,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Input,
} from "@mcw/ui";
import { useEffect, useState } from "react";
import { AddServiceDialogProps, Service } from "./types";
import { useForm } from "@tanstack/react-form";

const AddServiceDialog = ({
  isOpen,
  onClose,
  onSuccess,
}: AddServiceDialogProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewCode, setIsNewCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      id: "",
      type: "",
      code: "",
      description: "",
      rate: "",
      duration: 50,
      is_default: false,
      bill_in_units: false,
      available_online: false,
      allow_new_clients: false,
      require_call: false,
      block_before: 0,
      block_after: 0,
      color: "",
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        const response = await fetch("/api/service", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...value,
            code: selectedService?.code || value.code,
            type: value.description,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create service");
        }

        resetForm();
        if (onSuccess) onSuccess();
        onClose();
      } catch (error) {
        console.error("Error creating service:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/service");
        const data = await response.json();
        setServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const handleServiceSelect = (service: Service | null) => {
    if (!service) {
      setSelectedService(null);
      setIsNewCode(true);
      form.setFieldValue("description", "");
      form.setFieldValue("code", searchQuery);
      return;
    }

    setSelectedService(service);
    setIsNewCode(false);

    const serviceData = {
      type: service.type || service.description || "",
      code: service.code,
      description: service.type || service.description || "",
      rate: service.rate,
      duration: service.duration,
      is_default: service.is_default,
      bill_in_units: service.bill_in_units,
      available_online: service.available_online,
      allow_new_clients: service.allow_new_clients,
      require_call: service.require_call,
      block_before: service.block_before,
      block_after: service.block_after,
      color: "",
    };

    (
      Object.entries(serviceData) as [
        keyof typeof serviceData,
        string | number | boolean,
      ][]
    ).forEach(([key, value]) => {
      form.setFieldValue(key, value);
    });
  };

  const filteredServices = services.filter(
    (service) =>
      service.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const resetForm = () => {
    setSelectedService(null);
    setSearchQuery("");
    setIsNewCode(false);
    form.reset();
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-w-2xl p-6 max-h-[90vh] overflow-auto [&>button]:hidden"
        onInteractOutside={(e) => {
          e.preventDefault();
          resetForm();
          onClose();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          resetForm();
          onClose();
        }}
      >
        <div className="absolute right-2 top-2">
          <Button
            className="text-[#6b7280] hover:text-[#374151]"
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X className="w-7 h-7" />
          </Button>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Add New Service</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="flex gap-4">
            <div className="w-[180px]">
              <FormLabel className="text-[#374151] text-[14px] block mb-1.5">
                Service
              </FormLabel>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPopoverOpen}
                    className="w-full justify-between bg-white border-gray-300 text-left font-normal h-[35px]"
                  >
                    {selectedService ? (
                      <span>{selectedService.code}</span>
                    ) : isNewCode && form.getFieldValue("code") ? (
                      <span>{form.getFieldValue("code")}</span>
                    ) : (
                      <span className="text-gray-500">Service</span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command className="rounded-lg">
                    <CommandInput
                      placeholder="Search or create new service code."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      className="w-full pl-2"
                    />
                    <CommandList>
                      <CommandEmpty className="py-4">
                        <div className="text-center text-sm">
                          No code found.{" "}
                          <button
                            className="text-[#2d8467] hover:underline"
                            onClick={() => {
                              handleServiceSelect(null);
                              setIsPopoverOpen(false);
                            }}
                          >
                            Add New Code
                          </button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredServices.map((service) => (
                          <CommandItem
                            key={service.id}
                            value={service.id}
                            onSelect={() => {
                              handleServiceSelect(service);
                              setIsPopoverOpen(false);
                            }}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <span className="font-medium">
                                {service.code}
                              </span>
                              <span className="ml-2 text-gray-500">
                                {service.type}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <FormLabel className="text-[#374151] text-[14px] block mb-1.5">
                Description
              </FormLabel>
              <form.Field
                name="description"
                children={(field) => (
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="text-[#374151] bg-white text-[14px] w-full h-[35px]"
                    placeholder="Description"
                  />
                )}
              />
            </div>
          </div>

          <div className="mt-4">
            <FormLabel className="text-[#374151] text-[14px] block mb-1.5">
              Rate
            </FormLabel>
            <div className="flex items-center gap-4">
              <form.Field
                name="rate"
                children={(field) => (
                  <Input
                    type="number"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="text-[#374151] text-[14px] w-[340px] h-[35px]"
                    placeholder="0"
                    // step="0.01"
                  />
                )}
              />
              <div className="flex items-center gap-2">
                <span className="text-[#374151] text-[14px]">
                  Default Duration
                </span>
                <form.Field
                  name="duration"
                  children={(field) => (
                    <Input
                      type="number"
                      min={0}
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                      className="text-[#374151] bg-white text-[14px] w-[80px]  h-[35px]"
                      placeholder="50"
                    />
                  )}
                />
                <span className="text-[#1F2937] text-[14px]">min</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <form.Field
                name="is_default"
                children={(field) => (
                  <input
                    type="checkbox"
                    id="defaultService"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                )}
              />
              <label
                htmlFor="defaultService"
                className="text-[#1F2937] text-[14px]"
              >
                Make this the default service
              </label>
            </div>
            <div className="flex items-center gap-2">
              <form.Field
                name="bill_in_units"
                children={(field) => (
                  <input
                    type="checkbox"
                    id="billInUnits"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                )}
              />
              <label
                htmlFor="billInUnits"
                className="text-[#1F2937] text-[14px]"
              >
                Bill this code in units
              </label>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-[#1F2937] text-[18px] mb-2">Booking Options</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <form.Field
                  name="available_online"
                  children={(field) => (
                    <input
                      type="checkbox"
                      id="onlineBooking"
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  )}
                />
                <label
                  htmlFor="onlineBooking"
                  className="text-[#1F2937] text-[14px]"
                >
                  Available for online appointment requests
                </label>
              </div>
              <div className="flex items-center gap-2">
                <form.Field
                  name="allow_new_clients"
                  children={(field) => (
                    <input
                      type="checkbox"
                      id="newClients"
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  )}
                />
                <label
                  htmlFor="newClients"
                  className="text-[#1F2937] text-[14px]"
                >
                  Allow for New Clients
                </label>
              </div>
              <div className="flex items-center gap-2">
                <form.Field
                  name="require_call"
                  children={(field) => (
                    <input
                      type="checkbox"
                      id="requireCall"
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  )}
                />
                <label
                  htmlFor="requireCall"
                  className="text-[#1F2937] text-[14px]"
                >
                  Require Clients to call to request available appointment
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span className="text-[#1F2937] text-[14px]">Block off</span>
            <form.Field
              name="block_before"
              children={(field) => (
                <Input
                  type="number"
                  min={0}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  className="text-[#374151] bg-white text-[14px] w-[60px]"
                  placeholder="0"
                />
              )}
            />
            <span className="text-[#1F2937] text-[14px]">
              minutes before and
            </span>
            <form.Field
              name="block_after"
              children={(field) => (
                <Input
                  type="number"
                  min={0}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  className="text-[#374151] bg-white text-[14px] w-[60px]"
                  placeholder="0"
                />
              )}
            />
            <span className="text-[#1F2937] text-[14px]">
              minutes after the appointment
            </span>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-transparent text-black hover:bg-gray-50 border border-[lightgray]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#2d8467] hover:bg-[#236c53]"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceDialog;

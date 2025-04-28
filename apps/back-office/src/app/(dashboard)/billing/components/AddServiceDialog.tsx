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
  toast,
} from "@mcw/ui";
import { useEffect, useState } from "react";

interface Service {
  id: string;
  type: string;
  code: string;
  description?: string;
  rate: number;
  duration: number;
  isDefaultService: boolean;
  billInUnits: boolean;
  availableOnline: boolean;
  allowNewClients: boolean;
  requireCallToBook: boolean;
  bufferBefore: number;
  bufferAfter: number;
}

interface AddServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddServiceDialog = ({
  isOpen,
  onClose,
  onSuccess,
}: AddServiceDialogProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewCode, setIsNewCode] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [rate, setRate] = useState("");
  const [duration, setDuration] = useState("50");
  const [isDefaultService, setIsDefaultService] = useState(false);
  const [billInUnits, setBillInUnits] = useState(false);
  const [availableOnline, setAvailableOnline] = useState(false);
  const [allowNewClients, setAllowNewClients] = useState(false);
  const [requireCallToBook, setRequireCallToBook] = useState(false);
  const [bufferBefore, setBufferBefore] = useState("0");
  const [bufferAfter, setBufferAfter] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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
      setDescription("");
      setIsNewCode(true);
      setCustomCode(searchQuery);
      return;
    }

    setSelectedService(service);
    setDescription(service.type || service.description || "");
    setIsNewCode(false);
    setCustomCode("");
  };

  const filteredServices = services.filter(
    (service) =>
      service.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!selectedService?.code && !customCode) {
        toast.error("Service code is required");
        return;
      }

      if (!description) {
        toast.error("Description is required");
        return;
      }

      if (!rate) {
        toast.error("Rate is required");
        return;
      }

      if (!duration) {
        toast.error("Duration is required");
        return;
      }

      // Parse numeric values
      const parsedRate = parseFloat(rate);
      const parsedDuration = parseInt(duration);
      const parsedBufferBefore = parseInt(bufferBefore || "0");
      const parsedBufferAfter = parseInt(bufferAfter || "0");

      // Validate numeric values
      if (
        isNaN(parsedRate) ||
        isNaN(parsedDuration) ||
        isNaN(parsedBufferBefore) ||
        isNaN(parsedBufferAfter)
      ) {
        toast.error("Invalid numeric values");
        return;
      }

      setIsSubmitting(true);
      const response = await fetch("/api/service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: selectedService?.code || customCode,
          type: description,
          description,
          rate: parsedRate,
          duration: parsedDuration,
          is_default: isDefaultService,
          bill_in_units: billInUnits,
          available_online: availableOnline,
          allow_new_clients: allowNewClients,
          require_call: requireCallToBook,
          block_before: parsedBufferBefore,
          block_after: parsedBufferAfter,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create service");
      }

      toast.success("Service created successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create service",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedService(null);
    setDescription("");
    setSearchQuery("");
    setIsNewCode(false);
    setCustomCode("");
    setRate("");
    setDuration("50");
    setIsDefaultService(false);
    setBillInUnits(false);
    setAvailableOnline(false);
    setAllowNewClients(false);
    setRequireCallToBook(false);
    setBufferBefore("0");
    setBufferAfter("0");
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-6 max-h-[90vh] overflow-auto [&>button]:hidden">
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

        <div className="space-y-4">
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
                    className="w-full justify-between bg-white border-gray-300 text-left font-normal"
                  >
                    {selectedService ? (
                      <span>{selectedService.code}</span>
                    ) : isNewCode && customCode ? (
                      <span>{customCode}</span>
                    ) : (
                      <span className="text-gray-500">902</span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command className="rounded-lg">
                    <div className="flex items-center border-b px-3">
                      <CommandInput
                        placeholder="Search or create new service code."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        className="w-full"
                      />
                    </div>
                    <CommandList>
                      <CommandEmpty>
                        <div className="py-6 text-center text-sm">
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
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-[#374151] bg-white text-[14px] w-full border rounded-[5px] outline-none p-2"
                placeholder="Description"
              />
            </div>
          </div>

          <div className="mt-4">
            <FormLabel className="text-[#374151] text-[14px] block mb-1.5">
              Rate
            </FormLabel>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="text-[#374151] text-[14px] w-[340px] border rounded-[5px] outline-none p-2"
                placeholder="0"
              />
              <div className="flex items-center gap-2">
                <span className="text-[#374151] text-[14px]">
                  Default Duration
                </span>
                <input
                  type="number"
                  min={0}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="text-[#374151] bg-white text-[14px] w-[80px] border rounded-[5px] outline-none p-2"
                  placeholder="50"
                />
                <span className="text-[#1F2937] text-[14px]">min</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="defaultService"
                checked={isDefaultService}
                onChange={(e) => setIsDefaultService(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label
                htmlFor="defaultService"
                className="text-[#1F2937] text-[14px]"
              >
                Make this the default service
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="billInUnits"
                checked={billInUnits}
                onChange={(e) => setBillInUnits(e.target.checked)}
                className="rounded border-gray-300"
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
                <input
                  type="checkbox"
                  id="onlineBooking"
                  checked={availableOnline}
                  onChange={(e) => setAvailableOnline(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label
                  htmlFor="onlineBooking"
                  className="text-[#1F2937] text-[14px]"
                >
                  Available for online appointment requests
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newClients"
                  checked={allowNewClients}
                  onChange={(e) => setAllowNewClients(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label
                  htmlFor="newClients"
                  className="text-[#1F2937] text-[14px]"
                >
                  Allow for New Clients
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requireCall"
                  checked={requireCallToBook}
                  onChange={(e) => setRequireCallToBook(e.target.checked)}
                  className="rounded border-gray-300"
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
            <input
              type="number"
              min={0}
              value={bufferBefore}
              onChange={(e) => setBufferBefore(e.target.value)}
              className="text-[#374151] bg-white text-[14px] w-[60px] border rounded-[5px] outline-none p-2"
              placeholder="0"
            />
            <span className="text-[#1F2937] text-[14px]">
              minutes before and
            </span>
            <input
              type="number"
              min={0}
              value={bufferAfter}
              onChange={(e) => setBufferAfter(e.target.value)}
              className="text-[#374151] bg-white text-[14px] w-[60px] border rounded-[5px] outline-none p-2"
              placeholder="0"
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
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#2d8467] hover:bg-[#236c53]"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceDialog;

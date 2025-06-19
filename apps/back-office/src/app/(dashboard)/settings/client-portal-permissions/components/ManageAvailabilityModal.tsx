"use client";
import { useState } from "react";
import { SERVICES, Service } from "./services-data";
import { PracticeSettingsStep } from "./PracticeSettingsStep";
import { AvailabilitySettingsStep } from "./AvailabilitySettingsStep";
import { ALL_SERVICES } from "./services-data";

// Services Section Component
function ServicesSection({
  services,
  setServices,
  addServiceOpen,
  setAddServiceOpen,
  serviceSearch,
  setServiceSearch,
}: {
  services: Service[];
  setServices: (services: Service[]) => void;
  addServiceOpen: boolean;
  setAddServiceOpen: (open: boolean) => void;
  serviceSearch: string;
  setServiceSearch: (search: string) => void;
}) {
  const availableServices = ALL_SERVICES.filter(
    (s) =>
      !services.some((sel) => sel.id === s.id) &&
      (s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        serviceSearch === ""),
  );

  return (
    <div className="mb-2">
      <div className="font-semibold text-[#1F2937] text-base mb-1">
        Services
      </div>
      <div className="text-sm text-[#6B7280] mb-2">
        All services saved to this availability block will have online requests
        turned on
      </div>
      <div className="flex flex-col gap-3 mb-2">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-[#F6F8FA] rounded-lg px-4 py-3 flex items-center justify-between"
          >
            <div>
              <div className="font-medium text-[#1F2937] text-base">
                {service.name}
              </div>
              <div className="text-xs text-[#6B7280]">{service.details}</div>
            </div>
            <button
              className="text-[#9CA3AF] text-xl"
              onClick={() =>
                setServices(services.filter((s) => s.id !== service.id))
              }
            >
              –
            </button>
          </div>
        ))}
      </div>
      <button
        className="text-[#188153] text-sm font-medium mt-2 hover:underline"
        onClick={() => setAddServiceOpen(!addServiceOpen)}
      >
        Add service
      </button>
      {addServiceOpen && (
        <div className="mt-3 border border-[#E5E7EB] rounded-lg bg-white">
          <div className="flex items-center px-3 py-2 border-b border-[#E5E7EB]">
            <svg
              className="w-5 h-5 text-[#6B7280] mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="w-full bg-transparent outline-none text-base"
              placeholder="Search or create new service code"
              type="text"
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {availableServices.map((service) => (
              <div
                key={service.id}
                className="px-4 py-3 cursor-pointer hover:bg-[#F1F5F9] text-[#374151] text-base border-b border-[#F3F4F6] last:border-b-0"
                onClick={() => {
                  setServices([...services, service]);
                  setServiceSearch("");
                }}
              >
                <div className="font-medium">{service.name}</div>
                {service.details && (
                  <div className="text-xs text-[#6B7280]">
                    {service.details}
                  </div>
                )}
              </div>
            ))}
            {availableServices.length === 0 && (
              <div className="px-4 py-3 text-[#9CA3AF] text-base">
                No services found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManageAvailabilityModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [startTime, setStartTime] = useState("On the half hour (9:00, 9:30)");
  const [requestBefore, setRequestBefore] = useState(
    "24 hours before start time",
  );
  const [requestAdvance, setRequestAdvance] = useState("1 week in advance");
  const [location, setLocation] = useState("Video Office");
  const [startDate, setStartDate] = useState("2025-03-19");
  const [endType, setEndType] = useState("never");
  const [services, setServices] = useState(SERVICES);
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-2 py-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative flex flex-col">
        <button
          aria-label="Close"
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
        >
          ×
        </button>
        <div className="text-2xl md:text-3xl font-bold text-[#1F2937] pt-8 pb-6 px-8">
          Set up online appointment requests
        </div>
        {step === 1 ? (
          <PracticeSettingsStep
            requestAdvance={requestAdvance}
            requestBefore={requestBefore}
            setRequestAdvance={setRequestAdvance}
            setRequestBefore={setRequestBefore}
            setStartTime={setStartTime}
            startTime={startTime}
            onNext={() => setStep(2)}
          />
        ) : (
          <AvailabilitySettingsStep
            addServiceOpen={addServiceOpen}
            endType={endType}
            location={location}
            services={services}
            serviceSearch={serviceSearch}
            ServicesSection={ServicesSection}
            setAddServiceOpen={setAddServiceOpen}
            setEndType={setEndType}
            setLocation={setLocation}
            setServices={setServices}
            setServiceSearch={setServiceSearch}
            setStartDate={setStartDate}
            startDate={startDate}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </div>
  );
}

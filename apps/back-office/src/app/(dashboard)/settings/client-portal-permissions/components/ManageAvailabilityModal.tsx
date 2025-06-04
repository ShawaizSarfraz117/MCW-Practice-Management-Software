"use client";
import { useState } from "react";
import { Button } from "@mcw/ui";

const SERVICES = [
  {
    id: 1,
    name: "00000 Initial Consultation - No Charge",
    details: "15 min · $0",
  },
  {
    id: 2,
    name: "90791 Psychiatric Diagnostic Evaluation",
    details: "50 min · $100",
  },
];

const ALL_SERVICES = [
  ...SERVICES,
  {
    id: 3,
    name: "90847 Family psychotherapy, conjoint psychotherapy with the patient present",
    details: "",
  },
  {
    id: 4,
    name: "90853 Group Therapy",
    details: "",
  },
  {
    id: 5,
    name: "90887 Collateral Visit",
    details: "",
  },
  {
    id: 6,
    name: "90899 Unlisted psychiatric service or procedure",
    details: "",
  },
  {
    id: 7,
    name: "97110 Therapeutic exercises",
    details: "",
  },
  {
    id: 8,
    name: "97530 Therapeutic activities, direct (one-on-one) patient contact (use of dynamic activities to improve functional performance), each 15 minutes",
    details: "",
  },
];

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

  const availableServices = ALL_SERVICES.filter(
    (s) =>
      !services.some((sel) => sel.id === s.id) &&
      (s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        serviceSearch === ""),
  );

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
          <>
            <div className="flex-1 px-4 md:px-8 pb-8">
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 md:p-8">
                <div className="font-semibold text-[#1F2937] text-lg mb-1">
                  Practice Settings
                </div>
                <div className="text-sm text-[#6B7280] mb-6">
                  Practice settings are managed by team members with
                  administrator access
                </div>
                <div className="font-semibold text-[#1F2937] text-base mb-1">
                  Scheduling preferences
                </div>
                <div className="text-sm text-[#6B7280] mb-6">
                  Apply to all online appointment requests at your practice
                </div>
                <div className="mb-6">
                  <label className="block text-sm text-[#374151] font-medium mb-2">
                    Appointment start times
                  </label>
                  <select
                    className="w-full h-11 px-3 border border-[#D1D5DB] rounded-md text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#188153]"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  >
                    <option>On the half hour (9:00, 9:30)</option>
                    <option>On the hour (9:00, 10:00)</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-sm text-[#374151] font-medium mb-2">
                    Requests can be made
                  </label>
                  <div className="flex flex-row gap-2 items-center">
                    <select
                      className="w-full md:w-auto h-11 px-3 border border-[#D1D5DB] rounded-md text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#188153]"
                      value={requestBefore}
                      onChange={(e) => setRequestBefore(e.target.value)}
                    >
                      <option>24 hours before start time</option>
                      <option>12 hours before start time</option>
                      <option>48 hours before start time</option>
                    </select>
                    <span className="text-sm text-[#6B7280] mx-2">
                      and up to
                    </span>
                    <select
                      className="w-full md:w-auto h-11 px-3 border border-[#D1D5DB] rounded-md text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#188153]"
                      value={requestAdvance}
                      onChange={(e) => setRequestAdvance(e.target.value)}
                    >
                      <option>1 week in advance</option>
                      <option>2 weeks in advance</option>
                      <option>1 month in advance</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end items-center px-8 pb-8 pt-2 bg-white rounded-b-2xl sticky bottom-0 z-10">
              <Button
                className="bg-[#188153] hover:bg-[#146945] text-white font-medium rounded-md px-8 h-11 text-base"
                onClick={() => setStep(2)}
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 px-4 md:px-8 pb-8">
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 md:p-8">
                <div className="font-semibold text-[#1F2937] text-base mb-1">
                  YOUR SETTINGS
                </div>
                <div className="text-sm text-[#6B7280] mb-6">
                  The settings below are managed by you or team members with
                  administrator access
                </div>
                <div className="font-semibold text-[#1F2937] text-base mb-1">
                  Availability for appointment requests
                </div>
                <div className="text-sm text-[#6B7280] mb-4">
                  Clients will see your availability if events aren't already
                  scheduled at that time
                </div>
                <div className="mb-6">
                  <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB]">
                    <span className="text-[#374151] text-base">Sunday</span>
                    <span className="text-[#9CA3AF] text-base">
                      Unavailable
                    </span>
                    <button className="text-[#188153] text-xl font-bold">
                      +
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB]">
                    <span className="text-[#374151] text-base">Monday</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#374151] text-base">8:00 AM</span>
                      <span className="text-[#6B7280]">to</span>
                      <span className="text-[#374151] text-base">5:00 PM</span>
                      <button className="text-[#9CA3AF] ml-2" title="Copy">
                        <svg
                          fill="none"
                          height="18"
                          viewBox="0 0 24 24"
                          width="18"
                        >
                          <rect
                            height="13"
                            rx="2"
                            stroke="#9CA3AF"
                            strokeWidth="2"
                            width="13"
                            x="9"
                            y="9"
                          />
                          <rect
                            height="13"
                            rx="2"
                            stroke="#9CA3AF"
                            strokeWidth="2"
                            width="13"
                            x="3"
                            y="3"
                          />
                        </svg>
                      </button>
                    </div>
                    <button className="text-[#188153] text-xl font-bold">
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-row gap-4 mb-6">
                  <div className="flex flex-row gap-2 items-center">
                    <label className="block text-sm text-[#374151] font-medium mb-1">
                      Starts
                    </label>
                    <input
                      className="w-full h-11 px-3 border border-[#D1D5DB] rounded-md text-base bg-white"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <label className="block text-sm text-[#374151] font-medium mb-1">
                      Ends
                    </label>
                    <select
                      className="w-full h-11 px-3 border border-[#D1D5DB] rounded-md text-base bg-white"
                      value={endType}
                      onChange={(e) => setEndType(e.target.value)}
                    >
                      <option value="never">never</option>
                      <option value="on">on</option>
                    </select>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm text-[#374151] font-medium mb-1">
                    Location
                  </label>
                  <select
                    className="w-full h-11 px-3 border border-[#D1D5DB] rounded-md text-base bg-white"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    <option>Video Office</option>
                    <option>In Person</option>
                  </select>
                </div>
                <div className="mb-2">
                  <div className="font-semibold text-[#1F2937] text-base mb-1">
                    Services
                  </div>
                  <div className="text-sm text-[#6B7280] mb-2">
                    All services saved to this availability block will have
                    online requests turned on
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
                          <div className="text-xs text-[#6B7280]">
                            {service.details}
                          </div>
                        </div>
                        <button
                          className="text-[#9CA3AF] text-xl"
                          onClick={() =>
                            setServices(
                              services.filter((s) => s.id !== service.id),
                            )
                          }
                        >
                          –
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className="text-[#188153] text-sm font-medium mt-2 hover:underline"
                    onClick={() => setAddServiceOpen((v) => !v)}
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
              </div>
            </div>
            <div className="flex justify-between items-center px-8 pb-8 pt-2 bg-white rounded-b-2xl sticky bottom-0 z-10">
              <Button
                className="rounded-md px-8 h-11 text-base"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button className="bg-[#188153] hover:bg-[#146945] text-white font-medium rounded-md px-8 h-11 text-base">
                Save
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

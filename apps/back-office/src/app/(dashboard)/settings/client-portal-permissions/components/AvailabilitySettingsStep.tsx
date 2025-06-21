import { Button } from "@mcw/ui";
import { Service } from "./services-data";

interface ServicesSection {
  services: Service[];
  setServices: (services: Service[]) => void;
  addServiceOpen: boolean;
  setAddServiceOpen: (open: boolean) => void;
  serviceSearch: string;
  setServiceSearch: (search: string) => void;
}

export function AvailabilitySettingsStep({
  startDate,
  setStartDate,
  endType,
  setEndType,
  location,
  setLocation,
  services,
  setServices,
  addServiceOpen,
  setAddServiceOpen,
  serviceSearch,
  setServiceSearch,
  onBack,
  ServicesSection,
}: {
  startDate: string;
  setStartDate: (value: string) => void;
  endType: string;
  setEndType: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  services: Service[];
  setServices: (services: Service[]) => void;
  addServiceOpen: boolean;
  setAddServiceOpen: (open: boolean) => void;
  serviceSearch: string;
  setServiceSearch: (search: string) => void;
  onBack: () => void;
  ServicesSection: React.ComponentType<ServicesSection>;
}) {
  return (
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

          {/* Days Schedule */}
          <div className="mb-6">
            <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB]">
              <span className="text-[#374151] text-base">Sunday</span>
              <span className="text-[#9CA3AF] text-base">Unavailable</span>
              <button className="text-[#188153] text-xl font-bold">+</button>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB]">
              <span className="text-[#374151] text-base">Monday</span>
              <div className="flex items-center gap-2">
                <span className="text-[#374151] text-base">8:00 AM</span>
                <span className="text-[#6B7280]">to</span>
                <span className="text-[#374151] text-base">5:00 PM</span>
                <button className="text-[#9CA3AF] ml-2" title="Copy">
                  <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
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
              <button className="text-[#188153] text-xl font-bold">+</button>
            </div>
          </div>

          {/* Date Range */}
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

          {/* Location */}
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

          <ServicesSection
            addServiceOpen={addServiceOpen}
            services={services}
            serviceSearch={serviceSearch}
            setAddServiceOpen={setAddServiceOpen}
            setServices={setServices}
            setServiceSearch={setServiceSearch}
          />
        </div>
      </div>
      <div className="flex justify-between items-center px-8 pb-8 pt-2 bg-white rounded-b-2xl sticky bottom-0 z-10">
        <Button
          className="rounded-md px-8 h-11 text-base"
          variant="outline"
          onClick={onBack}
        >
          Back
        </Button>
        <Button className="bg-[#188153] hover:bg-[#146945] text-white font-medium rounded-md px-8 h-11 text-base">
          Save
        </Button>
      </div>
    </>
  );
}

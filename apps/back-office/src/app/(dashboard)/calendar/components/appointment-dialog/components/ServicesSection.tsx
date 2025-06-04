"use client";

import { SearchSelect } from "@mcw/ui";
import type { AppointmentData } from "../types";

interface Service {
  id: string;
  type: string;
  rate?: number;
}

interface ServicesSectionProps {
  servicesData: Service[];
  selectedServices: Array<{ serviceId: string; fee: number }>;
  appointmentData: AppointmentData | undefined;
  onServiceSelect: (value: string) => void;
}

export function ServicesSection({
  servicesData,
  selectedServices,
  appointmentData,
  onServiceSelect,
}: ServicesSectionProps) {
  return (
    <div className="pb-4 border-b">
      <p className="text-[#717171] font-medium text-[14px]">Services</p>
      <div className="flex gap-3">
        <div className="w-full">
          <SearchSelect
            className="border w-full rounded-[5px]"
            options={servicesData.map((service) => ({
              label: service.type,
              value: service.id,
            }))}
            placeholder="Select service"
            searchable={false}
            showPagination={false}
            value={
              selectedServices[0]?.serviceId ||
              appointmentData?.PracticeService?.id ||
              ""
            }
            onValueChange={onServiceSelect}
          />
        </div>
        <div className="flex justify-between border-gray-300 border w-[120px] items-center gap-2 rounded-[5px] py-1.5 px-2 text-[13px]">
          <span>Fee</span>
          <span>
            $
            {appointmentData?.PracticeService?.rate ||
              appointmentData?.appointment_fee ||
              selectedServices[0]?.fee ||
              0}
          </span>
        </div>
      </div>
    </div>
  );
}

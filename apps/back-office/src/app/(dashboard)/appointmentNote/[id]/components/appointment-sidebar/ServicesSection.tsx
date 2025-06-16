import React from "react";

interface AppointmentData {
  PracticeService?: {
    name: string;
    fee?: number | string;
  } | null;
  Service?: {
    name: string;
    fee?: number | string;
  } | null;
  appointment_type_id?: string;
  appointment_fee?: number | string;
}

interface ServicesSectionProps {
  appointment: AppointmentData | undefined;
}

export function ServicesSection({ appointment }: ServicesSectionProps) {
  const serviceName =
    appointment?.PracticeService?.name ||
    appointment?.Service?.name ||
    appointment?.appointment_type_id ||
    "Service not specified";

  const serviceFee =
    appointment?.appointment_fee ||
    appointment?.PracticeService?.fee ||
    appointment?.Service?.fee ||
    "0";

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">Services</h3>
      <div className="flex justify-between items-center">
        <span className="text-sm">{serviceName}</span>
        <span className="text-sm font-medium">${serviceFee}</span>
      </div>
    </div>
  );
}

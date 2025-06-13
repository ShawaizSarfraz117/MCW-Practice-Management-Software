import React from "react";
import { DollarSign } from "lucide-react";
import type { AppointmentDetails } from "../../types";

interface AppointmentServicesProps {
  appointment: AppointmentDetails | null;
}

export function AppointmentServices({ appointment }: AppointmentServicesProps) {
  if (!appointment?.appointmentServices?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Services</h3>

      <div className="space-y-2">
        {appointment.appointmentServices.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900">
                {service.service?.name || "Service"}
              </span>
            </div>
            {service.service?.base_cost && (
              <span className="text-sm font-medium text-gray-900">
                ${service.service.base_cost}
              </span>
            )}
          </div>
        ))}
      </div>

      {appointment.appointmentServices.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">
              Total Amount:
            </span>
            <span className="text-sm font-semibold text-gray-900">
              $
              {appointment.appointmentServices
                .reduce(
                  (sum, service) =>
                    sum + (parseFloat(service.service?.base_cost || "0") || 0),
                  0,
                )
                .toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import type { AppointmentDetails as AppointmentDetailsType } from "../../types";

interface AppointmentDetailsProps {
  appointment: AppointmentDetailsType | null;
}

export function AppointmentDetails({ appointment }: AppointmentDetailsProps) {
  if (!appointment) {
    return <div className="text-sm text-gray-500">No appointment selected</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Appointment Info</h3>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Date:</span>
          <span className="text-gray-900">
            {format(new Date(appointment.start_date), "MMMM dd, yyyy")}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Time:</span>
          <span className="text-gray-900">
            {format(new Date(appointment.start_date), "h:mm a")} -{" "}
            {format(new Date(appointment.end_date), "h:mm a")}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Clinician:</span>
          <span className="text-gray-900">
            {appointment.clinician?.user?.first_name}{" "}
            {appointment.clinician?.user?.last_name}
          </span>
        </div>

        {appointment.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Location:</span>
            <span className="text-gray-900">{appointment.location.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

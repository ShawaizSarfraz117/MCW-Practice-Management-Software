import React from "react";
import { Button } from "@mcw/ui";
import {
  Calendar,
  Clock,
  User,
  Video,
  ExternalLink,
  Edit2,
} from "lucide-react";

interface AppointmentData {
  start_date?: Date | string;
  end_date?: Date | string | null;
  Clinician?: {
    first_name: string;
    last_name: string;
  } | null;
  Location?: {
    name: string;
  } | null;
}

interface DetailsSectionProps {
  appointment: AppointmentData | undefined;
  onEditClick: () => void;
}

export function DetailsSection({
  appointment,
  onEditClick,
}: DetailsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Details</h3>
        <Button
          className="text-blue-600 p-0 h-auto text-sm"
          variant="link"
          onClick={onEditClick}
        >
          <Edit2 className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {appointment?.start_date
              ? new Date(appointment.start_date).toLocaleDateString()
              : "Date not available"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {appointment?.start_date && appointment?.end_date
              ? `${new Date(appointment.start_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(appointment.end_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${Math.round((new Date(appointment.end_date).getTime() - new Date(appointment.start_date).getTime()) / 60000)} mins)`
              : "Time not available"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {appointment?.Clinician
              ? `${appointment.Clinician.first_name} ${appointment.Clinician.last_name}`
              : "Clinician not assigned"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {appointment?.Location?.name || "Location not specified"}
          </span>
        </div>
      </div>
      <Button
        className="text-blue-600 p-0 h-auto text-sm mt-3 flex items-center"
        variant="link"
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        Open in calendar
      </Button>
    </div>
  );
}

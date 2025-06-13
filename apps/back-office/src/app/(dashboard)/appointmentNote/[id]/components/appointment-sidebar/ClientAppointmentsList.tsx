import React from "react";
import { useRouter } from "next/navigation";
import { format, isFuture, isPast } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { ScrollArea } from "@mcw/ui";
import type { ClientAppointment } from "../../types";

interface ClientAppointmentsListProps {
  appointments: ClientAppointment[];
  currentAppointmentId: string;
}

export function ClientAppointmentsList({
  appointments,
  currentAppointmentId,
}: ClientAppointmentsListProps) {
  const router = useRouter();

  const upcomingAppointments = appointments.filter((apt) =>
    isFuture(new Date(apt.start_date)),
  );
  const pastAppointments = appointments.filter((apt) =>
    isPast(new Date(apt.start_date)),
  );

  const handleAppointmentClick = (appointmentId: string) => {
    router.push(`/appointmentNote/${appointmentId}`);
  };

  const AppointmentItem = ({
    appointment,
  }: {
    appointment: ClientAppointment;
  }) => {
    const isCurrentAppointment = appointment.id === currentAppointmentId;

    return (
      <div
        className={`p-3 rounded-lg cursor-pointer transition-colors ${
          isCurrentAppointment
            ? "bg-green-50 border border-green-200"
            : "bg-gray-50 hover:bg-gray-100"
        }`}
        onClick={() => handleAppointmentClick(appointment.id)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-900">
            {appointment.title}
          </span>
          {isCurrentAppointment && (
            <span className="text-xs text-green-600 font-medium">Current</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(appointment.start_date), "MMM dd, yyyy")}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(appointment.start_date), "h:mm a")}
          </div>
        </div>
        {appointment.clinician && (
          <div className="mt-1 text-xs text-gray-500">
            with {appointment.clinician.user?.first_name}{" "}
            {appointment.clinician.user?.last_name}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Client Appointments</h3>

      <ScrollArea className="h-[400px]">
        <div className="space-y-4 pr-4">
          {upcomingAppointments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Upcoming ({upcomingAppointments.length})
              </h4>
              <div className="space-y-2">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentItem
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))}
              </div>
            </div>
          )}

          {pastAppointments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Past ({pastAppointments.length})
              </h4>
              <div className="space-y-2">
                {pastAppointments.map((appointment) => (
                  <AppointmentItem
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))}
              </div>
            </div>
          )}

          {appointments.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No appointments found
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

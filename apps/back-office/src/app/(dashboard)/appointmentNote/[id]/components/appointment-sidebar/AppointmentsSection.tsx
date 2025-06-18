import React from "react";
import { Button } from "@mcw/ui";
import { useRouter } from "next/navigation";

interface ClientAppointmentsData {
  previous?: Array<{
    id: string;
    start_date: Date | string;
    end_date?: Date | string | null;
    service?: { name: string } | null;
    Service?: { name: string } | null;
    PracticeService?: { name: string } | null;
  }>;
  next?: Array<{
    id: string;
    start_date: Date | string;
    end_date?: Date | string | null;
    service?: { name: string } | null;
    Service?: { name: string } | null;
    PracticeService?: { name: string } | null;
  }>;
}

interface AppointmentsSectionProps {
  clientAppointments: ClientAppointmentsData | undefined;
  isLoadingClientAppointments: boolean;
  clientId: string | undefined;
}

interface AppointmentItemProps {
  appointment: {
    id: string;
    start_date: Date | string;
    end_date?: Date | string | null;
    service?: { name: string } | null;
    Service?: { name: string } | null;
    PracticeService?: { name: string } | null;
  };
}

function AppointmentItem({ appointment }: AppointmentItemProps) {
  const router = useRouter();
  const serviceName =
    appointment.service?.name ||
    appointment.Service?.name ||
    appointment.PracticeService?.name;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">
            {new Date(appointment.start_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(appointment.start_date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            -
            {appointment.end_date
              ? new Date(appointment.end_date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "N/A"}
          </div>
          {serviceName && (
            <div className="text-xs text-gray-600 mt-1">{serviceName}</div>
          )}
        </div>
        <Button
          className="text-blue-600 p-0 h-auto text-sm"
          variant="link"
          onClick={() => router.push(`/appointmentNote/${appointment.id}`)}
        >
          Show
        </Button>
      </div>
    </div>
  );
}

export function AppointmentsSection({
  clientAppointments,
  isLoadingClientAppointments,
}: AppointmentsSectionProps) {
  const hasPreviousAppointments =
    clientAppointments?.previous && clientAppointments.previous.length > 0;
  const hasNextAppointments =
    clientAppointments?.next && clientAppointments.next.length > 0;
  const hasNoAppointments = !hasPreviousAppointments && !hasNextAppointments;

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">Appointments</h3>
      <div className="bg-gray-50 rounded-lg p-4">
        {isLoadingClientAppointments ? (
          <div className="text-center py-4 text-gray-500">
            Loading appointments...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Previous Appointments */}
            {hasPreviousAppointments && (
              <div>
                <div className="text-xs text-gray-500 mb-2">Previous</div>
                {clientAppointments.previous!.map((apt) => (
                  <AppointmentItem key={apt.id} appointment={apt} />
                ))}
              </div>
            )}

            {/* Next Appointments */}
            {hasNextAppointments && (
              <div>
                <div className="text-xs text-gray-500 mb-2">Upcoming</div>
                {clientAppointments.next!.map((apt) => (
                  <AppointmentItem key={apt.id} appointment={apt} />
                ))}
              </div>
            )}

            {/* No appointments message */}
            {hasNoAppointments && (
              <div className="text-center py-4 text-sm text-gray-500">
                No other appointments scheduled
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

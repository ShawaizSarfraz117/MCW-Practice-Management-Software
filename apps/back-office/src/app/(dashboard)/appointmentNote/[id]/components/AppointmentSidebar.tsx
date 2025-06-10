"use client";

import { Button } from "@mcw/ui";
import {
  Calendar,
  Clock,
  User,
  Video,
  ExternalLink,
  Edit2,
} from "lucide-react";
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
  billing_preference?: string;
  Invoice?: Array<unknown>;
}

interface AppointmentSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  appointment: AppointmentData | undefined;
  clientAppointments: ClientAppointmentsData | undefined;
  isLoadingClientAppointments: boolean;
  clientId: string | undefined;
  onEditClick: () => void;
}

export function AppointmentSidebar({
  activeTab,
  setActiveTab,
  appointment,
  clientAppointments,
  isLoadingClientAppointments,
  clientId,
  onEditClick,
}: AppointmentSidebarProps) {
  const router = useRouter();

  return (
    <div className="w-96 bg-white border-l">
      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab("appointment-info")}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "appointment-info"
                ? "text-blue-600 border-blue-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Appointment Info
          </button>
          <button
            onClick={() => setActiveTab("treatment-progress")}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "treatment-progress"
                ? "text-blue-600 border-blue-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Treatment progress
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "appointment-info" ? (
          <div className="space-y-6">
            {/* Details Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Details</h3>
                <Button
                  variant="link"
                  className="text-blue-600 p-0 h-auto text-sm"
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
                variant="link"
                className="text-blue-600 p-0 h-auto text-sm mt-3 flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open in calendar
              </Button>
            </div>

            {/* Services Section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Services</h3>
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  {appointment?.PracticeService?.name ||
                    appointment?.Service?.name ||
                    appointment?.appointment_type_id ||
                    "Service not specified"}
                </span>
                <span className="text-sm font-medium">
                  $
                  {appointment?.appointment_fee ||
                    appointment?.PracticeService?.fee ||
                    appointment?.Service?.fee ||
                    "0"}
                </span>
              </div>
            </div>

            {/* Billing Section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Billing</h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  {appointment?.billing_preference || "Self-pay"}
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Appointment total</span>
                  <span className="text-sm font-medium">
                    $
                    {appointment?.appointment_fee ||
                      appointment?.PracticeService?.fee ||
                      appointment?.Service?.fee ||
                      "0"}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      appointment?.Invoice?.length > 0
                        ? "text-green-600 bg-green-50"
                        : "text-red-600 bg-red-50"
                    }`}
                  >
                    {appointment?.Invoice?.length > 0
                      ? "Invoiced"
                      : "Uninvoiced"}
                  </span>
                </div>
              </div>
              <Button
                variant="link"
                className="text-blue-600 p-0 h-auto text-sm mt-3 flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open billing
              </Button>
            </div>

            {/* Appointments Section */}
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
                    {clientAppointments?.previous &&
                      clientAppointments.previous.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 mb-2">
                            Previous
                          </div>
                          {clientAppointments.previous.map((apt) => (
                            <div key={apt.id} className="mb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium">
                                    {new Date(
                                      apt.start_date,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(
                                      apt.start_date,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    -
                                    {apt.end_date
                                      ? new Date(
                                          apt.end_date,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "N/A"}
                                  </div>
                                  {(apt.service ||
                                    apt.Service ||
                                    apt.PracticeService) && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {apt.service?.name ||
                                        apt.Service?.name ||
                                        apt.PracticeService?.name}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="link"
                                  className="text-blue-600 p-0 h-auto text-sm"
                                  onClick={() =>
                                    router.push(`/appointmentNote/${apt.id}`)
                                  }
                                >
                                  Show
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Next Appointments */}
                    {clientAppointments?.next &&
                      clientAppointments.next.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 mb-2">
                            Upcoming
                          </div>
                          {clientAppointments.next.map((apt) => (
                            <div key={apt.id} className="mb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium">
                                    {new Date(
                                      apt.start_date,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(
                                      apt.start_date,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    -
                                    {apt.end_date
                                      ? new Date(
                                          apt.end_date,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "N/A"}
                                  </div>
                                  {(apt.service ||
                                    apt.Service ||
                                    apt.PracticeService) && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {apt.service?.name ||
                                        apt.Service?.name ||
                                        apt.PracticeService?.name}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="link"
                                  className="text-blue-600 p-0 h-auto text-sm"
                                  onClick={() =>
                                    router.push(`/appointmentNote/${apt.id}`)
                                  }
                                >
                                  Show
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* No appointments message */}
                    {(!clientAppointments?.previous ||
                      clientAppointments.previous.length === 0) &&
                      (!clientAppointments?.next ||
                        clientAppointments.next.length === 0) && (
                        <div className="text-center py-4 text-sm text-gray-500">
                          No other appointments scheduled
                        </div>
                      )}
                  </div>
                )}
              </div>
              {clientId && (
                <Button
                  variant="link"
                  className="text-blue-600 p-0 h-auto text-sm mt-3 flex items-center"
                  onClick={() => router.push(`/clients/${clientId}`)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View all appointments
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Treatment progress content would go here
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { DetailsSection } from "./appointment-sidebar/DetailsSection";
import { ServicesSection } from "./appointment-sidebar/ServicesSection";
import { BillingSection } from "./appointment-sidebar/BillingSection";
import { AppointmentsSection } from "./appointment-sidebar/AppointmentsSection";

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
            <DetailsSection
              appointment={appointment}
              onEditClick={onEditClick}
            />
            <ServicesSection appointment={appointment} />
            <BillingSection appointment={appointment} />
            <AppointmentsSection
              clientAppointments={clientAppointments}
              isLoadingClientAppointments={isLoadingClientAppointments}
              clientId={clientId}
            />
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

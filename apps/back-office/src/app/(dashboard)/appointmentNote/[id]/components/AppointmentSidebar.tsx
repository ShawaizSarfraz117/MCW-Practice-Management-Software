"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from "@mcw/ui";
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
  ClientGroup?: {
    id: string;
  } | null;
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();

  const handleCreateDiagnosisPlan = () => {
    if (appointment?.ClientGroup?.id) {
      router.push(
        `/clients/${appointment.ClientGroup.id}/diagnosisAndTreatmentPlan`,
      );
    }
  };

  return (
    <>
      <div className="w-96 bg-white border-l">
        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "appointment-info"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("appointment-info")}
            >
              Appointment Info
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "treatment-progress"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("treatment-progress")}
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
                clientId={clientId}
                isLoadingClientAppointments={isLoadingClientAppointments}
              />
            </div>
          ) : (
            <div className="py-8" id="treatment-progress">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Treatment Progress
                </h3>
                <p className="text-gray-500 mb-6">
                  View and manage the treatment progress for this client
                </p>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  Open Treatment Details
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Treatment Progress Details</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-gray-600 mb-4">
                Manage treatment progress and create diagnosis plans for this
                client.
              </p>
              <Button
                className="bg-primary hover:bg-primary/90 w-full"
                onClick={handleCreateDiagnosisPlan}
              >
                Create diagnosis and treatment plan
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

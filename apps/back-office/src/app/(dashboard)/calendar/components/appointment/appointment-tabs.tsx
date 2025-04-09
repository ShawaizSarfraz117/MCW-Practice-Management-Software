import type React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mcw/ui";
import { AppointmentTypeSelector } from "./appointment-type-selector";
import { ClientSelector } from "./client-selector";
import { AppointmentDetails } from "./appointment-details";

interface AppointmentData {
  id?: string;
  title?: string;
  type?: string;
  location_id?: string;
  client_id?: string;
  clinician_id?: string;
  is_all_day?: boolean;
  notes?: string;
  start_date?: string;
  end_date?: string;
}
interface AppointmentTabsProps {
  selectedDate: Date;
  selectedTime: string;
  onCreateClient: () => void;
  appointmentData?: AppointmentData;
  isViewMode?: boolean;
}

export const AppointmentTabs: React.FC<AppointmentTabsProps> = ({
  selectedDate,
  selectedTime,
  onCreateClient,
  appointmentData,
  isViewMode = false,
}) => {
  const appointmentDate = `${selectedDate.toLocaleDateString()} @ ${selectedTime}`;

  return (
    <Tabs className="w-full" defaultValue="appointment">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger
          value="appointment"
          disabled={isViewMode && appointmentData?.type !== "appointment"}
        >
          Appointment
        </TabsTrigger>
        <TabsTrigger
          value="event"
          disabled={isViewMode && appointmentData?.type !== "event"}
        >
          Event
        </TabsTrigger>
        <TabsTrigger
          value="out-of-office"
          disabled={isViewMode && appointmentData?.type !== "out-of-office"}
        >
          Out of office
        </TabsTrigger>
      </TabsList>
      <TabsContent className="mt-4 space-y-4" value="appointment">
        <AppointmentTypeSelector disabled={isViewMode} />
        <ClientSelector
          appointmentDate={appointmentDate}
          onCreateClient={onCreateClient}
          disabled={isViewMode}
          clientId={isViewMode ? appointmentData?.client_id : undefined}
        />
        <AppointmentDetails
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          appointmentData={appointmentData}
          isViewMode={isViewMode}
        />
      </TabsContent>
    </Tabs>
  );
};

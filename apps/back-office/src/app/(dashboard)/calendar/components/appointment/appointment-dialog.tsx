import type React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@mcw/ui";
import { AppointmentTabs } from "./appointment-tabs";

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

interface AppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedTime: string;
  onCreateClient: () => void;
  appointmentData?: AppointmentData;
  isViewMode?: boolean;
}

export const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  onCreateClient,
  appointmentData,
  isViewMode = false,
}) => {
  return (
    <Dialog modal={false} open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <AppointmentTabs
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onCreateClient={onCreateClient}
            appointmentData={appointmentData}
            isViewMode={isViewMode}
          />
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

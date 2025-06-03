import type React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@mcw/ui";
import { AppointmentTabs } from "./AppointmentTabs";
import type { AppointmentFormData } from "@/types/entities";

interface AppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedTime: string;
  onCreateClient: () => void;
  appointmentData?: AppointmentFormData;
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
            appointmentData={appointmentData}
            isViewMode={isViewMode}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onCreateClient={onCreateClient}
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

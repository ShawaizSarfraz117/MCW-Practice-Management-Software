import type React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@mcw/ui";
import { AppointmentTabs } from "./appointment-tabs";

interface AppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedTime: string;
  onCreateClient: () => void;
}

export const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  onCreateClient,
}) => {
  return (
    <Dialog modal={false} open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <AppointmentTabs
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onCreateClient={onCreateClient}
          />
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

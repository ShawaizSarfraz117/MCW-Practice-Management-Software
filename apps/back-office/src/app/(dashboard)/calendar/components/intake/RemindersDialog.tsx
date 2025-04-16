import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mcw/ui";
import { Button } from "@mcw/ui";
import { Checkbox } from "@mcw/ui";
import { Mail, MessageCircle, Phone } from "lucide-react";

interface RemindersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  clientEmail: string;
}

export const RemindersDialog: React.FC<RemindersDialogProps> = ({
  isOpen,
  onClose,
  clientName,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Send Appointment Reminders
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            You made changes to this appointment. Would you like to send
            reminders?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-span-1 font-medium">{clientName}</div>
            <div className="col-span-3 flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked id="email" />
                <label className="flex items-center gap-1" htmlFor="email">
                  <Mail className="h-4 w-4" /> Email
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="text" />
                <label className="flex items-center gap-1" htmlFor="text">
                  <MessageCircle className="h-4 w-4" /> Text
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="voice" />
                <label className="flex items-center gap-1" htmlFor="voice">
                  <Phone className="h-4 w-4" /> Voice
                </label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button className="mr-2" variant="outline" onClick={onClose}>
            Don't Send Reminders
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={onClose}
          >
            Send Reminders
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

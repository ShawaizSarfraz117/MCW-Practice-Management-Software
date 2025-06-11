import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";

interface EditAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    start_date?: string;
    end_date?: string;
  } | null;
  onSave: (date: string, time: string, duration: string) => void;
  isSaving?: boolean;
}

export function EditAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onSave,
  isSaving = false,
}: EditAppointmentDialogProps) {
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentDuration, setAppointmentDuration] = useState("60");

  useEffect(() => {
    if (open && appointment?.start_date) {
      const startDate = new Date(appointment.start_date);
      const endDate = appointment?.end_date
        ? new Date(appointment.end_date)
        : startDate;

      // Format date as YYYY-MM-DD for input
      const dateStr = startDate.toISOString().split("T")[0];
      setAppointmentDate(dateStr);

      // Format time as HH:MM for input
      const hours = startDate.getHours().toString().padStart(2, "0");
      const minutes = startDate.getMinutes().toString().padStart(2, "0");
      setAppointmentTime(`${hours}:${minutes}`);

      // Calculate duration in minutes
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationMins = Math.round(durationMs / 60000);
      setAppointmentDuration(durationMins.toString());
    }
  }, [open, appointment]);

  const handleSave = () => {
    onSave(appointmentDate, appointmentTime, appointmentDuration);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>
            Update the appointment date, time, and duration.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">
              Time
            </Label>
            <Input
              id="time"
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Duration
            </Label>
            <Select
              value={appointmentDuration}
              onValueChange={setAppointmentDuration}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

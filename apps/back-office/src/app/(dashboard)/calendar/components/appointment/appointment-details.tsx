import type React from "react";
import {
  FormLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@mcw/ui";
import { format } from "date-fns";

interface AppointmentDetailsProps {
  selectedDate: Date;
  selectedTime: string;
}

export const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  selectedDate,
  selectedTime,
}) => {
  const formattedDate = format(selectedDate, "MMMM d, yyyy");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <FormLabel className="text-sm">Date</FormLabel>
          <div className="border rounded-none p-2 text-sm bg-gray-50">
            {formattedDate}
          </div>
        </div>
        <div className="space-y-2">
          <FormLabel className="text-sm">Time</FormLabel>
          <div className="border rounded-none p-2 text-sm bg-gray-50">
            {selectedTime}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <FormLabel className="text-sm">Service</FormLabel>
        <Select defaultValue="90834">
          <SelectTrigger className="rounded-none">
            <SelectValue placeholder="Select service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="90834">90834 Psychotherapy, 45 min</SelectItem>
            <SelectItem value="90837">90837 Psychotherapy, 60 min</SelectItem>
            <SelectItem value="90846">
              90846 Family Psychotherapy without Patient
            </SelectItem>
            <SelectItem value="90847">
              90847 Family Psychotherapy with Patient
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <FormLabel className="text-sm">Location</FormLabel>
        <Select defaultValue="sp">
          <SelectTrigger className="rounded-none">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sp">
              Saint Petersburg McNulty Counseling
            </SelectItem>
            <SelectItem value="tampa">Tampa McNulty Counseling</SelectItem>
            <SelectItem value="telehealth">Telehealth</SelectItem>
            <SelectItem value="tyrone">Tyrone McNulty Counseling</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <FormLabel className="text-sm">Notes</FormLabel>
        <Textarea
          className="w-full h-20 border rounded-none p-2 text-sm resize-none"
          placeholder="Add notes about this appointment..."
        />
      </div>
    </div>
  );
};

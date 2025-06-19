import type React from "react";
import { useState } from "react";
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
import { emailService } from "@/utils/emailService";
import { showErrorToast } from "@mcw/utils";
import { toast } from "@mcw/ui";

interface RemindersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  clientEmail: string;
  appointmentDate?: Date | string;
  appointmentTime?: string;
  clinicianName?: string;
  locationName?: string;
  appointmentId?: string;
}

export const RemindersDialog: React.FC<RemindersDialogProps> = ({
  isOpen,
  onClose,
  clientName,
  clientEmail,
  appointmentDate,
  appointmentTime,
  clinicianName,
  locationName,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [emailChecked, setEmailChecked] = useState(true);

  const handleSendReminders = async () => {
    if (!emailChecked || !clientEmail) {
      onClose();
      return;
    }

    setIsSending(true);

    try {
      // Format the appointment date
      let formattedDate = "";
      let dateObj: Date;

      if (appointmentDate) {
        dateObj =
          typeof appointmentDate === "string"
            ? new Date(appointmentDate)
            : appointmentDate;
        formattedDate = dateObj.toLocaleDateString();
      } else {
        formattedDate = "TBD";
      }

      // Send appointment reminder email
      await emailService.sendEmail(
        {
          emailType: "appointment_reminder",
          to: {
            email: clientEmail,
            name: clientName,
          },
          variables: {
            client_first_name: clientName.split(" ")[0] || clientName,
            client_full_name: clientName,
            appointment_date: formattedDate,
            appointment_time: appointmentTime || "TBD",
            practice_full_name: clinicianName
              ? `${clinicianName}'s Practice`
              : "Our Practice",
            clinician_full_name: clinicianName || "Your Provider",
            location: locationName || "Our Office",
            appointment_reminder_links: "Add to your calendar",
            // Practice information - these would ideally come from practice settings
            practice_address_line1: "123 Medical Center Drive, Suite 200",
            practice_address_line2: "Boston, MA 02115",
            practice_map_link: "View on Google Maps",
            practice_phone_number: "(555) 123-4567",
          },
        },
        toast,
      );

      toast({
        title: "Reminder Sent",
        description: `Appointment reminder sent to ${clientName}`,
        variant: "success",
      });

      onClose();
    } catch (error) {
      showErrorToast(toast, error);
    } finally {
      setIsSending(false);
    }
  };

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
                <Checkbox
                  checked={emailChecked}
                  disabled={!clientEmail}
                  id="email"
                  onCheckedChange={(checked) =>
                    setEmailChecked(checked as boolean)
                  }
                />
                <label className="flex items-center gap-1" htmlFor="email">
                  <Mail className="h-4 w-4" /> Email
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox disabled id="text" />
                <label className="flex items-center gap-1" htmlFor="text">
                  <MessageCircle className="h-4 w-4" /> Text
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox disabled id="voice" />
                <label className="flex items-center gap-1" htmlFor="voice">
                  <Phone className="h-4 w-4" /> Voice
                </label>
              </div>
            </div>
          </div>
          {!clientEmail && (
            <p className="text-sm text-red-500">
              No email address available for this client.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button className="mr-2" variant="outline" onClick={onClose}>
            Don't Send Reminders
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={isSending || !clientEmail || !emailChecked}
            onClick={handleSendReminders}
          >
            {isSending ? "Sending..." : "Send Reminders"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

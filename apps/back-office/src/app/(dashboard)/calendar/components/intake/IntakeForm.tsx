import type React from "react";
import { ShareDocuments } from "@/(dashboard)/share-documents/ShareDocuments";

interface IntakeFormProps {
  clientName: string;
  clientEmail: string;
  clientId: string;
  clientGroupId: string;
  onClose: () => void;
  appointmentDate?: Date | string;
  appointmentTime?: string;
  clinicianName?: string;
  locationName?: string;
  appointmentId?: string;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({
  clientName,
  clientEmail,
  clientId,
  clientGroupId,
  onClose,
  appointmentDate,
  appointmentTime,
  clinicianName,
  locationName,
  appointmentId,
}) => {
  return (
    <ShareDocuments
      clientEmail={clientEmail}
      clientGroupId={clientGroupId}
      clientId={clientId}
      clientName={clientName}
      context="appointment"
      showReminders={true}
      onClose={onClose}
      appointmentDate={appointmentDate}
      appointmentTime={appointmentTime}
      clinicianName={clinicianName}
      locationName={locationName}
      appointmentId={appointmentId}
    />
  );
};

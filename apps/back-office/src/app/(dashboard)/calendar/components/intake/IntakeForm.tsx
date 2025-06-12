import type React from "react";
import { ShareDocuments } from "@/(dashboard)/share-documents/ShareDocuments";

interface IntakeFormProps {
  clientName: string;
  clientEmail: string;
  clientId: string;
  clientGroupId: string;
  onClose: () => void;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({
  clientName,
  clientEmail,
  clientId,
  clientGroupId,
  onClose,
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
    />
  );
};

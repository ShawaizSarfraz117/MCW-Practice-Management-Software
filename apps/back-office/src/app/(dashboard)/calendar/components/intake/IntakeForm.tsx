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
      clientName={clientName}
      clientEmail={clientEmail}
      clientId={clientId}
      clientGroupId={clientGroupId}
      onClose={onClose}
      context="appointment"
      showReminders={true}
    />
  );
};

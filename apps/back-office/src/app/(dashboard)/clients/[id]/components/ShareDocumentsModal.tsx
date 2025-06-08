import { useState } from "react";
import { Dialog, DialogContent } from "@mcw/ui";
import { ShareDocuments } from "@/(dashboard)/share-documents";

interface ShareDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  clientEmail: string;
  clientId: string;
  clientGroupId: string;
}

export default function ShareDocumentsModal({
  isOpen,
  onClose,
  clientName,
  clientEmail,
  clientId,
  clientGroupId,
}: ShareDocumentsModalProps) {
  const [showShareDocuments, setShowShareDocuments] = useState(false);

  const handleClose = () => {
    setShowShareDocuments(false);
    onClose();
  };

  if (!isOpen) return null;

  // If we're showing the share documents flow, render it directly
  if (showShareDocuments) {
    return (
      <ShareDocuments
        clientEmail={clientEmail}
        clientGroupId={clientGroupId}
        clientId={clientId}
        clientName={clientName}
        context="client-share"
        showReminders={false}
        title={`Share documents with ${clientName}`}
        onClose={handleClose}
        onSuccess={(selectedDocumentIds) => {
          console.log("Documents shared:", selectedDocumentIds);
          handleClose();
        }}
      />
    );
  }

  // Otherwise show the share modal to select users first
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium mb-4">
            Share Documents with {clientName}
          </h3>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
            onClick={() => setShowShareDocuments(true)}
          >
            Select Documents to Share
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

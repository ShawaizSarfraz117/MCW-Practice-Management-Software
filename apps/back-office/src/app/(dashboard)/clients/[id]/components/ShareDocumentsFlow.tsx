import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@mcw/ui";
import { Button } from "@mcw/ui";
import { Checkbox } from "@mcw/ui";
import { ShareDocuments } from "@/(dashboard)/share-documents";

interface Client {
  id: string;
  name: string;
  email?: string;
}

interface ShareDocumentsFlowProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  clientGroupId: string;
}

export default function ShareDocumentsFlow({
  isOpen,
  onClose,
  clients,
  clientGroupId,
}: ShareDocumentsFlowProps) {
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [showShareDocuments, setShowShareDocuments] = useState(false);

  const handleClientToggle = (client: Client) => {
    setSelectedClients((prev) => {
      const isSelected = prev.some((c) => c.id === client.id);
      if (isSelected) {
        return prev.filter((c) => c.id !== client.id);
      } else {
        return [...prev, client];
      }
    });
  };

  const handleContinue = () => {
    if (selectedClients.length > 0) {
      setShowShareDocuments(true);
    }
  };

  const handleClose = () => {
    setSelectedClients([]);
    setShowShareDocuments(false);
    onClose();
  };

  if (!isOpen) return null;

  if (showShareDocuments) {
    return (
      <ShareDocuments
        clientGroupId={clientGroupId}
        clients={selectedClients}
        context="client-share"
        showReminders={false}
        title={`Share documents with ${selectedClients.map(c => c.name).join(' & ')}`}
        onClose={handleClose}
        onSuccess={(selectedDocumentIds) => {
          console.log("Documents shared:", selectedDocumentIds);
          handleClose();
        }}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">
            Select clients to share documents with
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-3">
          {clients.map((client) => {
            const isSelected = selectedClients.some((c) => c.id === client.id);
            return (
              <div
                key={client.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleClientToggle(client)}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleClientToggle(client)}
                />
                <div className="flex-1">
                  <p className="font-medium">{client.name}</p>
                  {client.email && (
                    <p className="text-sm text-gray-500">{client.email}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={selectedClients.length === 0}
            onClick={handleContinue}
          >
            Continue to Share Documents
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
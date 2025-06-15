import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@mcw/ui";
import { Button } from "@mcw/ui";
import { Check } from "lucide-react";
import { ShareDocuments } from "@/(dashboard)/share-documents";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  // If only one client, skip the selection modal
  useEffect(() => {
    if (isOpen && clients.length === 1) {
      setSelectedClients(clients);
      setShowShareDocuments(true);
    }
  }, [isOpen, clients]);

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
        title={`Share documents with ${selectedClients.map((c) => c.name).join(" & ")}`}
        onClose={handleClose}
        onSuccess={(_selectedDocumentIds) => {
          queryClient.invalidateQueries({
            queryKey: ["clientGroupFiles", clientGroupId],
          });
          selectedClients.forEach((client) => {
            queryClient.invalidateQueries({
              queryKey: ["clientFiles", client.id],
            });
          });
          queryClient.invalidateQueries({ queryKey: ["client-shared-files"] });
          queryClient.invalidateQueries({
            queryKey: ["uploaded-files", clientGroupId],
          });
          handleClose();
        }}
      />
    );
  }

  // Only show selection modal if more than one client
  if (clients.length > 1 && !showShareDocuments) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="text-center py-4">
            <h2 className="text-xl font-normal">
              Select whom you want to share items with:
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 py-6">
            {clients.map((client) => {
              const initials = client.name
                .split(" ")
                .map((word) => word[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const isSelected = selectedClients.some(
                (c) => c.id === client.id,
              );

              return (
                <div key={client.id} className="relative">
                  <button
                    className={`w-full p-6 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                    onClick={() => handleClientToggle(client)}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center text-white text-xl font-medium mb-3">
                        {initials}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {client.name}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pb-4">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              disabled={selectedClients.length === 0}
              onClick={handleContinue}
            >
              Continue to Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}

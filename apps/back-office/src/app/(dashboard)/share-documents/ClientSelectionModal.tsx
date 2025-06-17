import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Checkbox,
} from "@mcw/ui";
import type { ShareClient } from "./ShareDocuments";

interface ClientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ShareClient[];
  onContinue: (selectedClientIds: string[]) => void;
  title?: string;
  description?: string;
}

export const ClientSelectionModal: React.FC<ClientSelectionModalProps> = ({
  isOpen,
  onClose,
  clients,
  onContinue,
  title = "Select whom you want to share items with:",
  description,
}) => {
  const [selectedClients, setSelectedClients] = useState<Set<string>>(
    new Set(),
  );

  // Initialize with all clients selected by default
  useEffect(() => {
    if (clients.length > 0) {
      setSelectedClients(new Set(clients.map((c) => c.id)));
    }
  }, [clients]);

  const handleToggleClient = (clientId: string) => {
    setSelectedClients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const handleContinue = () => {
    if (selectedClients.size > 0) {
      onContinue(Array.from(selectedClients));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </DialogHeader>

        <div className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {clients.map((client, index) => (
              <div
                key={client.id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedClients.has(client.id)
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleToggleClient(client.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedClients.has(client.id)}
                    className="mt-0.5"
                    onCheckedChange={() => handleToggleClient(client.id)}
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          C{index + 1}
                        </span>
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {client.name}
                        </p>
                        {client.email ? (
                          <p className="text-sm text-gray-500">
                            {client.email}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">
                            No email on file
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedClients.has(client.id) && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {clients.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No clients available to share with
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={selectedClients.size === 0}
            onClick={handleContinue}
          >
            Continue to Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

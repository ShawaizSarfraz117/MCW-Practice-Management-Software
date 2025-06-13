import type React from "react";
import { useState, useMemo } from "react";
import { Button } from "@mcw/ui";
import { ProgressSteps } from "./ProgressSteps";
import { Avatar, AvatarFallback } from "@mcw/ui";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { SendingDialog } from "./SendingDialog";
import { SuccessDialog } from "./SuccessDialog";
import { useShareableTemplates } from "@/(dashboard)/settings/shareable-documents/hooks/useShareableTemplates";
import { useShareDocuments } from "./hooks/useShareDocuments";
import { FileFrequency, FILE_FREQUENCY_LABELS } from "@mcw/types";
import { useUploadedFiles } from "./hooks/useUploadedFiles";
import { useSendEmail } from "./hooks/useSendEmail";
import type { ShareClient } from "./ShareDocuments";

interface ReviewAndSendProps {
  clientName: string;
  clientEmail: string;
  clients?: ShareClient[];
  selectedDocuments: Record<
    string,
    {
      id: string;
      checked: boolean;
      frequency?: string;
    }
  >;
  selectedDocumentsByClient?: Record<string, Record<string, { id: string; checked: boolean; frequency?: string }>>;
  emailContent: string;
  onBack: () => void;
  onComplete: () => void;
  context?: "appointment" | "client-share";
  appointmentId?: string;
  clientId?: string;
  clientGroupId?: string;
}

export const ReviewAndSend: React.FC<ReviewAndSendProps> = ({
  clientName,
  clientEmail,
  clients,
  selectedDocuments,
  selectedDocumentsByClient,
  emailContent,
  onBack,
  onComplete,
  context = "appointment",
  appointmentId: _appointmentId,
  clientId,
  clientGroupId,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: templates } = useShareableTemplates();
  const { data: uploadedFilesData } = useUploadedFiles(clientGroupId);
  const shareDocumentsMutation = useShareDocuments();
  const sendEmailMutation = useSendEmail();

  // Build steps dynamically based on clients
  const steps = useMemo(() => {
    const clientSteps = clients && clients.length > 0
      ? clients.map((client, index) => ({
          number: index + 1,
          label: client.name,
        }))
      : [{ number: 1, label: clientName }];
    
    return [
      ...clientSteps,
      { number: clientSteps.length + 1, label: "Compose Email" },
      { number: clientSteps.length + 2, label: "Review & Send", isActive: true },
    ];
  }, [clients, clientName]);

  // Get the names of selected documents per client
  const getSelectedItemsForClient = (clientId: string) => {
    const items: { name: string; frequency?: string }[] = [];
    const clientDocs = selectedDocumentsByClient?.[clientId] || selectedDocuments;

    Object.entries(clientDocs)
      .filter(([_, doc]) => doc.checked)
      .forEach(([id, doc]) => {
        // Check templates first
        const template = templates?.data?.find((t) => t.id === id);
        if (template) {
          items.push({
            name: template.name,
            frequency: doc.frequency,
          });
          return;
        }

        // Check uploaded files
        const uploadedFile = uploadedFilesData?.files?.find((f) => f.id === id);
        if (uploadedFile) {
          items.push({
            name: uploadedFile.title,
            frequency: doc.frequency,
          });
        }
      });

    return items;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendNow = async () => {
    if (!clientGroupId) {
      console.error("Missing clientGroupId");
      return;
    }

    setIsSending(true);

    try {
      // Handle multiple clients if provided
      if (clients && clients.length > 0 && selectedDocumentsByClient) {
        const clientsData = clients.map((client) => {
          const clientDocs = selectedDocumentsByClient[client.id] || {};
          const selectedTemplateIds: string[] = [];
          const selectedFileIds: string[] = [];
          const frequencies: Record<string, FileFrequency> = {};

          const templatesData = templates?.data || [];
          const templateIdSet = new Set(templatesData.map((t) => t.id));

          Object.entries(clientDocs)
            .filter(([_, doc]) => doc.checked)
            .forEach(([id, doc]) => {
              if (templateIdSet.has(id)) {
                selectedTemplateIds.push(id);
              } else {
                selectedFileIds.push(id);
              }
              if (doc.frequency) {
                frequencies[id] = doc.frequency as FileFrequency;
              }
            });

          return {
            client_id: client.id,
            survey_template_ids: selectedTemplateIds,
            file_ids: selectedFileIds,
            frequencies,
          };
        });

        await shareDocumentsMutation.mutateAsync({
          client_group_id: clientGroupId,
          clients: clientsData,
        });
      } else if (clientId) {
        // Single client fallback
        const selectedTemplateIds: string[] = [];
        const selectedFileIds: string[] = [];
        const frequencies: Record<string, FileFrequency> = {};

        const templatesData = templates?.data || [];
        const templateIdSet = new Set(templatesData.map((t) => t.id));

        Object.entries(selectedDocuments)
          .filter(([_, doc]) => doc.checked)
          .forEach(([id, doc]) => {
            if (templateIdSet.has(id)) {
              selectedTemplateIds.push(id);
            } else {
              selectedFileIds.push(id);
            }
            if (doc.frequency) {
              frequencies[id] = doc.frequency as FileFrequency;
            }
          });

        await shareDocumentsMutation.mutateAsync({
          client_group_id: clientGroupId,
          clients: [
            {
              client_id: clientId,
              survey_template_ids: selectedTemplateIds,
              file_ids: selectedFileIds,
              frequencies,
            },
          ],
        });
      }

      // Send email to client
      const subject =
        context === "appointment"
          ? "Your intake documents are ready"
          : "Documents shared with you";

      await sendEmailMutation.mutateAsync({
        to: clientEmail,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${emailContent.replace(/\n/g, "<br>")}
          </div>
        `,
        text: emailContent,
      });

      setIsSending(false);
      setIsSuccess(true);
    } catch (error) {
      console.error("Failed to share documents:", error);
      setIsSending(false);
      // TODO: Add error handling UI
    }
  };

  const title =
    context === "appointment"
      ? `Send intakes for ${clientName}`
      : `Share documents with ${clientName}`;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>

      <ProgressSteps steps={steps} />

      <div className="space-y-6">
        {context === "appointment" && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-4">
            {clientName} will receive Client Portal access.
          </div>
        )}

        <div className="bg-gray-50 border rounded-lg p-4 flex items-center justify-between">
          <span className="text-gray-600">
            {clientName} will receive an email directing them to your Client
            Portal
          </span>
          <Button
            className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50"
            variant="ghost"
            onClick={onBack}
          >
            View Message
          </Button>
        </div>

        <div className="space-y-8">
          {clients && clients.length > 0 ? (
            clients.map((client) => {
              const clientItems = getSelectedItemsForClient(client.id);
              if (clientItems.length === 0) return null;
              
              return (
                <div key={client.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 bg-gray-100">
                      <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg">
                      Sharing {clientItems.length} item
                      {clientItems.length !== 1 ? "s" : ""} with {client.name}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {clientItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 text-gray-600"
                      >
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600" />
                          <span>{item.name}</span>
                        </div>
                        {item.frequency && (
                          <span className="text-sm text-gray-500">
                            Frequency:{" "}
                            {FILE_FREQUENCY_LABELS[item.frequency as FileFrequency] ||
                              item.frequency}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 bg-gray-100">
                  <AvatarFallback>{getInitials(clientName)}</AvatarFallback>
                </Avatar>
                <h3 className="text-lg">
                  Sharing {getSelectedItemsForClient(clientId || "").length} item
                  {getSelectedItemsForClient(clientId || "").length !== 1 ? "s" : ""} with {clientName}
                </h3>
              </div>

              <div className="space-y-2">
                {getSelectedItemsForClient(clientId || "").map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 text-gray-600"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>{item.name}</span>
                    </div>
                    {item.frequency && (
                      <span className="text-sm text-gray-500">
                        Frequency:{" "}
                        {FILE_FREQUENCY_LABELS[item.frequency as FileFrequency] ||
                          item.frequency}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            className="flex items-center gap-2"
            variant="outline"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Email
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
            onClick={handleSendNow}
          >
            Share & Send Now
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SendingDialog isOpen={isSending} />

      <SuccessDialog
        clientName={clientName}
        isOpen={isSuccess}
        onClose={() => {
          setIsSuccess(false);
          onComplete();
        }}
      />
    </div>
  );
};

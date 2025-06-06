import type React from "react";
import { useState, useMemo } from "react";
import { Button } from "@mcw/ui";
import { ProgressSteps } from "./ProgressSteps";
import { Avatar, AvatarFallback } from "@mcw/ui";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@mcw/ui";
import { SendingDialog } from "./SendingDialog";
import { SuccessDialog } from "./SuccessDialog";
import { useShareableTemplates } from "@/(dashboard)/settings/shareable-documents/hooks/useShareableTemplates";
import { useShareDocuments } from "./hooks/useShareDocuments";
import { FileFrequency, FILE_FREQUENCY_LABELS } from "@mcw/types";
import { useUploadedFiles } from "./hooks/useUploadedFiles";
import { useSendEmail } from "./hooks/useSendEmail";

interface ReviewAndSendProps {
  clientName: string;
  clientEmail: string;
  selectedDocuments: Record<
    string,
    {
      id: string;
      checked: boolean;
      frequency?: string;
    }
  >;
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
  selectedDocuments,
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

  const steps = [
    { number: 1, label: clientName },
    { number: 2, label: "Compose Email" },
    { number: 3, label: "Review & Send", isActive: true },
  ];

  // Get the names of selected documents with frequency info
  const selectedItems = useMemo(() => {
    const items: { name: string; frequency?: string }[] = [];

    Object.entries(selectedDocuments)
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
  }, [selectedDocuments, templates, uploadedFilesData]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendNow = async () => {
    if (!clientId || !clientGroupId) {
      console.error("Missing clientId or clientGroupId");
      return;
    }

    setIsSending(true);

    try {
      // Separate template IDs and file IDs
      const selectedTemplateIds: string[] = [];
      const selectedFileIds: string[] = [];

      // Get templates data to check which are files vs templates
      const templatesData = templates?.data || [];
      const templateIdSet = new Set(templatesData.map((t) => t.id));

      Object.entries(selectedDocuments)
        .filter(([_, doc]) => doc.checked)
        .forEach(([id]) => {
          if (templateIdSet.has(id)) {
            selectedTemplateIds.push(id);
          } else {
            selectedFileIds.push(id);
          }
        });

      // Build frequencies map
      const frequencies: Record<string, FileFrequency> = {};
      Object.entries(selectedDocuments)
        .filter(([_, doc]) => doc.checked && doc.frequency)
        .forEach(([id, doc]) => {
          if (doc.frequency) {
            frequencies[id] = doc.frequency as FileFrequency;
          }
        });

      // Call the API to share documents
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
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50"
                variant="ghost"
              >
                View Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Email Preview</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="prose prose-sm max-h-[60vh] overflow-y-auto">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: emailContent.replace(/\n/g, "<br/>"),
                    }}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 bg-gray-100">
              <AvatarFallback>{getInitials(clientName)}</AvatarFallback>
            </Avatar>
            <h3 className="text-lg">
              Sharing {selectedItems.length} item
              {selectedItems.length !== 1 ? "s" : ""} with {clientName}
            </h3>
          </div>

          <div className="space-y-2">
            {selectedItems.map((item, index) => (
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
        isOpen={isSuccess}
        onClose={() => {
          setIsSuccess(false);
          onComplete();
        }}
        clientName={clientName}
      />
    </div>
  );
};

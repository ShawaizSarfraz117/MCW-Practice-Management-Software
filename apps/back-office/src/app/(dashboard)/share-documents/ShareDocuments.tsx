import type React from "react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@mcw/ui";
import { ProgressSteps } from "./ProgressSteps";
import { DocumentSection } from "./DocumentSection";
import { RemindersDialog } from "./RemindersDialog";
import { ComposeEmail } from "./ComposeEmail";
import { AlertCircle, Loader2, XCircle } from "lucide-react";
import { ReviewAndSend } from "./ReviewAndSend";
import {
  useShareableTemplates,
  getScoredMeasures,
  getIntakeForms,
} from "@/(dashboard)/settings/shareable-documents/hooks/useShareableTemplates";
import { TemplateType } from "@/types/templateTypes";
import { FILE_FREQUENCY_OPTIONS } from "@mcw/types";
import { useUploadedFiles } from "./hooks/useUploadedFiles";

export interface ShareDocumentsProps {
  clientName: string;
  clientEmail: string;
  onClose: () => void;
  // Optional props for customization
  title?: string;
  showReminders?: boolean;
  context?: "appointment" | "client-share";
  appointmentId?: string;
  clientId?: string;
  clientGroupId?: string;
  onSuccess?: (selectedDocumentIds: string[]) => void;
}

interface SelectedDocument {
  id: string;
  checked: boolean;
  frequency?: string;
}

export const ShareDocuments: React.FC<ShareDocumentsProps> = ({
  clientName,
  clientEmail,
  onClose,
  title,
  showReminders: showRemindersInitial = true,
  context = "appointment",
  appointmentId,
  clientId,
  clientGroupId,
  onSuccess,
}) => {
  const [showReminders, setShowReminders] = useState(showRemindersInitial);
  const [currentStep, setCurrentStep] = useState<
    "documents" | "email" | "review"
  >("documents");
  const [selectedDocuments, setSelectedDocuments] = useState<
    Record<string, SelectedDocument>
  >({});
  const [emailContent, setEmailContent] = useState<string>("");

  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useShareableTemplates();
  const {
    data: uploadedFilesData,
    isLoading: filesLoading,
    error: filesError,
  } = useUploadedFiles(clientGroupId);

  const steps = [
    { number: 1, label: clientName, isActive: currentStep === "documents" },
    { number: 2, label: "Compose Email", isActive: currentStep === "email" },
    { number: 3, label: "Review & Send", isActive: currentStep === "review" },
  ];

  // Process the templates into categories
  const documentCategories = useMemo(() => {
    if (!templates?.data) {
      // Return empty categories if no data
      return {
        consentDocuments: [],
        scoredMeasures: [],
        questionnaires: [],
        uploadedFiles: [],
      };
    }

    // Filter consent documents - currently none in the system based on template types
    const consentDocs = templates.data
      .filter(
        (template) =>
          template.name.toLowerCase().includes("consent") &&
          template.type !== TemplateType.INTAKE_FORMS,
      )
      .map((template) => ({
        id: template.id,
        label: template.name,
        checked: template.is_default,
        frequency: false,
        isTemplate: true,
        sharedOn: undefined,
        status: undefined,
      }));

    const scoredMeasures = getScoredMeasures(templates.data).map(
      (template) => ({
        id: template.id,
        label: template.name,
        checked: template.is_default,
        frequency: true, // Always true for scored measures
        isTemplate: true,
        sharedOn: undefined,
        status: undefined,
      }),
    );

    // Intake forms are now Questionnaires
    const questionnaires = getIntakeForms(templates.data).map((template) => ({
      id: template.id,
      label: template.name,
      checked: template.is_default,
      frequency: false,
      isTemplate: true,
      sharedOn: undefined,
      status: undefined,
    }));

    // Process uploaded files
    const uploadedFiles = (uploadedFilesData?.files || [])
      .filter((file) => file.sharingEnabled !== false && !file.isShared)
      .map((file) => ({
        id: file.id,
        label: file.title,
        checked: false,
        frequency: false,
        isTemplate: false,
        isShared: file.isShared,
        sharedOn: file.sharedAt,
        status: file.status || "Not sent",
      }));

    return {
      consentDocuments: consentDocs,
      scoredMeasures,
      questionnaires,
      uploadedFiles,
    };
  }, [templates, uploadedFilesData]);

  // Initialize selected documents when templates load
  useEffect(() => {
    if (documentCategories) {
      const initialSelected: Record<string, SelectedDocument> = {};

      // Combine all documents
      const allDocs = [
        ...documentCategories.consentDocuments,
        ...documentCategories.scoredMeasures,
        ...documentCategories.questionnaires,
        ...documentCategories.uploadedFiles,
      ];

      // Initialize with default checked state
      allDocs.forEach((doc) => {
        initialSelected[doc.id] = {
          id: doc.id,
          checked: doc.checked,
          frequency:
            doc.checked && doc.frequency
              ? FILE_FREQUENCY_OPTIONS.ONCE
              : undefined,
        };
      });

      setSelectedDocuments(initialSelected);
    }
  }, [documentCategories]);

  // Handle checkbox change
  const handleDocumentToggle = (docId: string) => {
    setSelectedDocuments((prev) => {
      const newCheckedState = !prev[docId]?.checked;

      // Find if this is a scored measure
      const isScoredMeasure = documentCategories?.scoredMeasures.some(
        (item) => item.id === docId,
      );

      return {
        ...prev,
        [docId]: {
          ...prev[docId],
          checked: newCheckedState,
          // Set default frequency for scored measures when checked
          frequency:
            newCheckedState && isScoredMeasure
              ? prev[docId]?.frequency || FILE_FREQUENCY_OPTIONS.ONCE
              : prev[docId]?.frequency,
        },
      };
    });
  };

  // Handle frequency change
  const handleFrequencyChange = (docId: string, frequency: string) => {
    setSelectedDocuments((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        frequency,
      },
    }));
  };

  // Handle successful completion
  const handleComplete = () => {
    const selectedIds = Object.entries(selectedDocuments)
      .filter(([_, doc]) => doc.checked)
      .map(([id]) => id);

    if (onSuccess) {
      onSuccess(selectedIds);
    }
    onClose();
  };

  if (currentStep === "review") {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <ReviewAndSend
          clientName={clientName}
          clientEmail={clientEmail}
          selectedDocuments={selectedDocuments}
          emailContent={emailContent}
          onBack={() => setCurrentStep("email")}
          onComplete={handleComplete}
          context={context}
          appointmentId={appointmentId}
          clientId={clientId}
          clientGroupId={clientGroupId}
        />
      </div>
    );
  }

  if (currentStep === "email") {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <ComposeEmail
          clientName={clientName}
          selectedDocuments={selectedDocuments}
          onBack={() => setCurrentStep("documents")}
          onContinue={(content?: string) => {
            if (content) setEmailContent(content);
            setCurrentStep("review");
          }}
          emailContent={emailContent}
        />
      </div>
    );
  }

  // Handle loading state
  if (templatesLoading || filesLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-600" />
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (templatesError || filesError || !documentCategories) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">Failed to load documents</p>
          <Button variant="outline" onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      </div>
    );
  }

  const displayTitle =
    title ||
    (context === "appointment"
      ? `Send intakes for ${clientName}`
      : `Share documents with ${clientName}`);

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-6">{displayTitle}</h2>

        <ProgressSteps steps={steps} />

        {!clientEmail && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  {clientName} will not receive Client Portal access.
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  No email address on file.
                </p>
              </div>
            </div>
          </div>
        )}

        {context === "appointment" && clientEmail && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span>{clientName} will receive Client Portal access.</span>
          </div>
        )}

        <div className="mb-6">
          {!clientEmail ? (
            <div className="border rounded-lg p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{clientName}</span>
                <span className="text-sm text-gray-500">
                  • No email on file
                </span>
              </div>
              <Button
                variant="link"
                className="text-blue-600 hover:text-blue-700 text-sm"
                onClick={() => {
                  // Navigate to edit client page to add email
                  window.location.href = `/clients/${clientId}/edit`;
                }}
              >
                Add Email
              </Button>
            </div>
          ) : (
            <div className="text-sm mb-2">
              {clientName} • {clientEmail}
            </div>
          )}
          <h3 className="text-lg font-medium mb-4">{clientName}'s items</h3>

          <div className="space-y-8">
            <DocumentSection
              items={documentCategories.consentDocuments}
              title="Consent Documents"
              selectedDocuments={selectedDocuments}
              onToggle={handleDocumentToggle}
              onFrequencyChange={handleFrequencyChange}
              context={context}
              emptyMessage="No consent documents available"
            />
            <DocumentSection
              items={documentCategories.scoredMeasures}
              title="Scored measures"
              selectedDocuments={selectedDocuments}
              onToggle={handleDocumentToggle}
              onFrequencyChange={handleFrequencyChange}
              context={context}
            />
            <DocumentSection
              items={documentCategories.questionnaires}
              title="Questionnaires"
              selectedDocuments={selectedDocuments}
              onToggle={handleDocumentToggle}
              onFrequencyChange={handleFrequencyChange}
              context={context}
            />
            <DocumentSection
              items={documentCategories.uploadedFiles}
              title="Uploaded Files"
              selectedDocuments={selectedDocuments}
              onToggle={handleDocumentToggle}
              onFrequencyChange={handleFrequencyChange}
              context={context}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentStep("email")}
            disabled={!clientEmail}
          >
            Continue to Email
          </Button>
        </div>

        {showReminders && context === "appointment" && (
          <RemindersDialog
            clientEmail={clientEmail}
            clientName={clientName}
            isOpen={showReminders}
            onClose={() => setShowReminders(false)}
          />
        )}
      </div>
    </div>
  );
};

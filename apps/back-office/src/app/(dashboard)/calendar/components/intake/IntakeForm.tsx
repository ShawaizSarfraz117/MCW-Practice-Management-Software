import type React from "react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@mcw/ui";
import { ProgressSteps } from "./ProgressSteps";
import { DocumentSection } from "./DocumentSection";
import { RemindersDialog } from "./RemindersDialog";
import { ComposeEmail } from "./ComposeEmail";
import { AlertCircle, Loader2 } from "lucide-react";
import { ReviewAndSend } from "./ReviewAndSend";
import {
  useShareableTemplates,
  getConsentForms,
  getScoredMeasures,
  getIntakeForms,
  filterTemplatesByType,
} from "@/(dashboard)/settings/shareable-documents/hooks/useShareableTemplates";
import { TemplateType } from "@/types/templateTypes";

interface IntakeFormProps {
  clientName: string;
  clientEmail: string;
  onClose: () => void;
}

interface SelectedDocument {
  id: string;
  checked: boolean;
  frequency?: string;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({
  clientName,
  clientEmail,
  onClose,
}) => {
  const [showReminders, setShowReminders] = useState(true);
  const [currentStep, setCurrentStep] = useState<
    "documents" | "email" | "review"
  >("documents");
  const [selectedDocuments, setSelectedDocuments] = useState<
    Record<string, SelectedDocument>
  >({});

  const { data: templates, isLoading, error } = useShareableTemplates();

  const steps = [
    { number: 1, label: clientName, isActive: currentStep === "documents" },
    { number: 2, label: "Compose Email", isActive: currentStep === "email" },
    { number: 3, label: "Review & Send", isActive: currentStep === "review" },
  ];

  // Process the templates into categories
  const documentCategories = useMemo(() => {
    if (!templates?.data) return null;

    const consentDocs = getConsentForms(templates.data).map((template) => ({
      id: template.id,
      label: template.name,
      checked: template.is_default,
      frequency: false,
    }));

    const scoredMeasures = getScoredMeasures(templates.data).map(
      (template) => ({
        id: template.id,
        label: template.name,
        checked: template.is_default,
        frequency: template.frequency_options !== null,
      }),
    );

    const intakeForms = getIntakeForms(templates.data).map((template) => ({
      id: template.id,
      label: template.name,
      checked: template.is_default,
      frequency: false,
    }));

    const otherDocuments = filterTemplatesByType(
      templates.data,
      TemplateType.OTHER_DOCUMENTS,
    )
      .filter((template) => !template.name.toLowerCase().includes("consent"))
      .map((template) => ({
        id: template.id,
        label: template.name,
        checked: template.is_default,
        frequency: false,
      }));

    return {
      consentDocuments: consentDocs,
      scoredMeasures,
      questionnaires: intakeForms,
      demographicsForms: otherDocuments,
    };
  }, [templates]);

  // Initialize selected documents when templates load
  useEffect(() => {
    if (documentCategories) {
      const initialSelected: Record<string, SelectedDocument> = {};

      // Combine all documents
      const allDocs = [
        ...documentCategories.consentDocuments,
        ...documentCategories.scoredMeasures,
        ...documentCategories.questionnaires,
        ...documentCategories.demographicsForms,
      ];

      // Initialize with default checked state
      allDocs.forEach((doc) => {
        initialSelected[doc.id] = {
          id: doc.id,
          checked: doc.checked,
          frequency: doc.frequency ? "once" : undefined,
        };
      });

      setSelectedDocuments(initialSelected);
    }
  }, [documentCategories]);

  // Handle checkbox change
  const handleDocumentToggle = (docId: string) => {
    setSelectedDocuments((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        checked: !prev[docId]?.checked,
      },
    }));
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

  if (currentStep === "review") {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <ReviewAndSend
          clientName={clientName}
          selectedDocuments={selectedDocuments}
          onBack={() => setCurrentStep("email")}
          onComplete={onClose}
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
          onContinue={() => setCurrentStep("review")}
        />
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
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
  if (error || !documentCategories) {
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

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-6">
          Send intakes for {clientName}
        </h2>

        <ProgressSteps steps={steps} />

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <span>{clientName} will receive Client Portal access.</span>
        </div>

        <div className="mb-6">
          <div className="text-sm mb-2">
            {clientName} • {clientEmail}
          </div>
          <h3 className="text-lg font-medium mb-4">{clientName}'s items</h3>

          <div className="space-y-8">
            <DocumentSection
              items={documentCategories.consentDocuments}
              title="Consent Documents"
              selectedDocuments={selectedDocuments}
              onToggle={handleDocumentToggle}
              onFrequencyChange={handleFrequencyChange}
            />
            <DocumentSection
              items={documentCategories.scoredMeasures}
              title="Scored measures"
              selectedDocuments={selectedDocuments}
              onToggle={handleDocumentToggle}
              onFrequencyChange={handleFrequencyChange}
            />
            <DocumentSection
              items={documentCategories.questionnaires}
              title="Questionnaires"
              selectedDocuments={selectedDocuments}
              onToggle={handleDocumentToggle}
              onFrequencyChange={handleFrequencyChange}
            />
            <DocumentSection
              items={documentCategories.demographicsForms}
              title="Other Documents"
              selectedDocuments={selectedDocuments}
              onToggle={handleDocumentToggle}
              onFrequencyChange={handleFrequencyChange}
            />

            {/* Show message if no documents available */}
            {documentCategories.consentDocuments.length === 0 &&
              documentCategories.scoredMeasures.length === 0 &&
              documentCategories.questionnaires.length === 0 &&
              documentCategories.demographicsForms.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No shareable documents available. Please add documents in
                  Settings → Shareable Documents.
                </div>
              )}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setCurrentStep("email")}
          >
            Continue to Email
          </Button>
        </div>

        <RemindersDialog
          clientEmail={clientEmail}
          clientName={clientName}
          isOpen={showReminders}
          onClose={() => setShowReminders(false)}
        />
      </div>
    </div>
  );
};

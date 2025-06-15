import type React from "react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@mcw/ui";
import { ProgressSteps } from "./ProgressSteps";
import { DocumentSection } from "./DocumentSection";
import { RemindersDialog } from "./RemindersDialog";
import { ComposeEmail } from "./ComposeEmail";
import { AlertCircle, Loader2, XCircle, Check } from "lucide-react";
import { ReviewAndSend } from "./ReviewAndSend";
import { useQuery } from "@tanstack/react-query";
import {
  useShareableTemplates,
  getScoredMeasures,
  getIntakeForms,
} from "@/(dashboard)/settings/shareable-documents/hooks/useShareableTemplates";
import { TemplateType } from "@/types/templateTypes";
import {
  FILE_FREQUENCY_OPTIONS,
  DocumentCategories,
  ClientFileResponse,
} from "@mcw/types";
import { useUploadedFiles } from "./hooks/useUploadedFiles";
import { useClientGroupFiles } from "@/(dashboard)/clients/hooks/useClientFiles";

export interface ShareClient {
  id: string;
  name: string;
  email?: string;
}

export interface ShareDocumentsProps {
  // Support both single client and multi-client scenarios
  clientName?: string;
  clientEmail?: string;
  clients?: ShareClient[];
  onClose: () => void;
  // Optional props for customization
  title?: string;
  showReminders?: boolean;
  context?: "appointment" | "client-share";
  appointmentId?: string;
  clientId?: string;
  clientGroupId?: string;
  onSuccess?: (
    selectedDocumentIds: string[] | Record<string, string[]>,
  ) => void;
}

interface SelectedDocument {
  id: string;
  checked: boolean;
  frequency?: string;
  disabled?: boolean;
}

type ClientDocumentState = Record<string, SelectedDocument>;
type AllClientsDocumentState = Record<string, ClientDocumentState>;

export const ShareDocuments: React.FC<ShareDocumentsProps> = ({
  clientName,
  clientEmail,
  clients: clientsProp,
  onClose,
  title,
  showReminders: showRemindersInitial = true,
  context = "appointment",
  appointmentId,
  clientId,
  clientGroupId,
  onSuccess,
}) => {
  // Normalize props to always work with array of clients
  const clients = useMemo(() => {
    if (clientsProp) {
      return clientsProp;
    }
    if (clientName) {
      return [{ id: clientId || "1", name: clientName, email: clientEmail }];
    }
    return [];
  }, [clientsProp, clientName, clientEmail, clientId]);

  const isMultiClient = clients.length > 1;
  const [showReminders, setShowReminders] = useState(showRemindersInitial);
  const [currentStep, setCurrentStep] = useState<string>("client-0");
  const [selectedDocumentsByClient, setSelectedDocumentsByClient] =
    useState<AllClientsDocumentState>({});
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

  // Fetch already shared files when in client-share context
  const { data: _sharedFilesData } = useClientGroupFiles(
    clientGroupId || "",
    clients,
    context === "client-share", // Only fetch when sharing from client files tab
  );

  // Fetch shared files details per client to get template IDs
  const { data: clientSharedFilesData } = useQuery({
    queryKey: ["client-shared-files", clients.map((c) => c.id), context],
    queryFn: async () => {
      if (context !== "client-share" || !clients.length) return null;

      const clientData = new Map();

      for (const client of clients) {
        const response = await fetch(
          `/api/client/files?client_id=${client.id}`,
        );
        if (response.ok) {
          const data = await response.json();
          clientData.set(client.id, data.sharedFiles || []);
        }
      }

      return clientData;
    },
    enabled: context === "client-share" && clients.length > 0,
  });

  const steps = useMemo(() => {
    const clientSteps = clients.map((client, index) => ({
      number: index + 1,
      label: client.name,
      isActive: currentStep === `client-${index}`,
    }));

    return [
      ...clientSteps,
      {
        number: clientSteps.length + 1,
        label: "Compose Email",
        isActive: currentStep === "email",
      },
      {
        number: clientSteps.length + 2,
        label: "Review & Send",
        isActive: currentStep === "review",
      },
    ];
  }, [clients, currentStep]);

  // Create a map of already shared files for quick lookup
  const sharedFilesMap = useMemo(() => {
    const map = new Map<
      string,
      Map<string, { frequency?: string; status?: string; sharedAt?: string }>
    >(); // clientId -> Map of fileId -> file data

    if (clientSharedFilesData && context === "client-share") {
      console.log("Client shared files data:", clientSharedFilesData);

      // Process the shared files data for each client
      clientSharedFilesData.forEach((sharedFiles, clientId) => {
        if (!map.has(clientId)) {
          map.set(clientId, new Map());
        }

        const clientMap = map.get(clientId)!;

        sharedFiles.forEach((file: ClientFileResponse) => {
          const fileData = {
            frequency: file.frequency || undefined,
            status: file.status,
            sharedAt: file.shared_at || undefined,
          };

          // Check if it's a survey template
          if (file.ClientGroupFile?.survey_template_id) {
            clientMap.set(file.ClientGroupFile.survey_template_id, fileData);
          }

          // Also add the file ID itself (for uploaded files)
          if (file.ClientGroupFile?.id) {
            clientMap.set(file.ClientGroupFile.id, fileData);
          }
        });
      });
    }

    console.log("Shared files map:", map);
    return map;
  }, [clientSharedFilesData, context]);

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
      .filter((file) => !file.isShared)
      .map((file) => ({
        id: file.id,
        label: file.title,
        checked: false,
        frequency: false,
        isTemplate: false,
        isShared: file.isShared,
        sharedOn: file.sharedAt || undefined,
        status: file.status || "Not sent",
      }));

    return {
      consentDocuments: consentDocs,
      scoredMeasures,
      questionnaires,
      uploadedFiles,
    };
  }, [templates, uploadedFilesData]);

  // Initialize selected documents for all clients when templates load
  useEffect(() => {
    if (documentCategories && clients.length > 0) {
      const initialState: AllClientsDocumentState = {};

      clients.forEach((client) => {
        const clientDocuments: ClientDocumentState = {};
        const clientSharedFiles = sharedFilesMap.get(client.id) || new Map();

        // Combine all documents
        const allDocs = [
          ...documentCategories.consentDocuments,
          ...documentCategories.scoredMeasures,
          ...documentCategories.questionnaires,
          ...documentCategories.uploadedFiles,
        ];

        // Initialize with default checked state
        allDocs.forEach((doc) => {
          // Check if this document is already shared with this client
          const sharedFileData = clientSharedFiles.get(doc.id);
          const isAlreadyShared = !!sharedFileData;

          if (context === "client-share") {
            console.log(
              `Checking doc ${doc.id} (${doc.label}) for client ${client.id}:`,
              {
                isAlreadyShared,
                sharedFileData,
                clientSharedFiles: Array.from(clientSharedFiles.keys()),
              },
            );
          }

          clientDocuments[doc.id] = {
            id: doc.id,
            checked: isAlreadyShared || doc.checked, // Auto-check if already shared
            frequency:
              sharedFileData?.frequency ||
              ((isAlreadyShared || doc.checked) && doc.frequency
                ? FILE_FREQUENCY_OPTIONS.ONCE
                : undefined),
            disabled: isAlreadyShared, // Mark as disabled if already shared
          };
        });

        initialState[client.id] = clientDocuments;
      });

      setSelectedDocumentsByClient(initialState);
    }
  }, [documentCategories, clients, sharedFilesMap]);

  // Handle checkbox change
  const handleDocumentToggle = (docId: string, clientId: string) => {
    setSelectedDocumentsByClient((prev) => {
      const clientDocs = prev[clientId] || {};
      const doc = clientDocs[docId];

      // Don't toggle if document is disabled (already shared)
      if (doc?.disabled) {
        return prev;
      }

      const newCheckedState = !doc?.checked;

      // Find if this is a scored measure
      const isScoredMeasure = documentCategories?.scoredMeasures.some(
        (item) => item.id === docId,
      );

      return {
        ...prev,
        [clientId]: {
          ...clientDocs,
          [docId]: {
            ...clientDocs[docId],
            checked: newCheckedState,
            // Set default frequency for scored measures when checked
            frequency:
              newCheckedState && isScoredMeasure
                ? clientDocs[docId]?.frequency || FILE_FREQUENCY_OPTIONS.ONCE
                : clientDocs[docId]?.frequency,
          },
        },
      };
    });
  };

  // Handle frequency change
  const handleFrequencyChange = (
    docId: string,
    frequency: string,
    clientId: string,
  ) => {
    setSelectedDocumentsByClient((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        [docId]: {
          ...prev[clientId][docId],
          frequency,
        },
      },
    }));
  };

  // Check if any documents are selected across all clients
  const hasAnyDocumentsSelected = () => {
    return Object.entries(selectedDocumentsByClient).some(([_, clientDocs]) =>
      Object.values(clientDocs).some((doc) => doc.checked),
    );
  };

  // Check if at least one client has an email
  const hasAnyClientWithEmail = () => {
    return clients.some((client) => client.email);
  };

  // Handle successful completion
  const handleComplete = () => {
    if (isMultiClient) {
      const result: Record<string, string[]> = {};

      Object.entries(selectedDocumentsByClient).forEach(
        ([clientId, clientDocs]) => {
          const selectedIds = Object.entries(clientDocs)
            .filter(([_, doc]) => doc.checked)
            .map(([id]) => id);

          if (selectedIds.length > 0) {
            result[clientId] = selectedIds;
          }
        },
      );

      if (onSuccess) {
        onSuccess(result);
      }
    } else {
      // Single client mode
      const clientDocs = selectedDocumentsByClient[clients[0]?.id] || {};
      const selectedIds = Object.entries(clientDocs)
        .filter(([_, doc]) => doc.checked)
        .map(([id]) => id);

      if (onSuccess) {
        onSuccess(selectedIds);
      }
    }
    onClose();
  };

  // Get all selected documents across all clients for email/review steps
  const getAllSelectedDocuments = () => {
    const allDocs: Record<
      string,
      { id: string; checked: boolean; frequency?: string }
    > = {};
    Object.values(selectedDocumentsByClient).forEach((clientDocs) => {
      Object.entries(clientDocs).forEach(([docId, doc]) => {
        if (doc.checked && !allDocs[docId]) {
          allDocs[docId] = doc;
        }
      });
    });
    return allDocs;
  };

  // Get current client index
  const currentClientIndex = currentStep.startsWith("client-")
    ? parseInt(currentStep.split("-")[1])
    : -1;
  const currentClient =
    currentClientIndex >= 0 ? clients[currentClientIndex] : null;

  if (currentStep === "review") {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <ReviewAndSend
          appointmentId={appointmentId}
          clientEmail={clients
            .map((c) => c.email)
            .filter(Boolean)
            .join(", ")}
          clientGroupId={clientGroupId}
          clientId={clients[0]?.id}
          clientName={clients.map((c) => c.name).join(" & ")}
          clients={clients}
          context={context}
          emailContent={emailContent}
          selectedDocuments={getAllSelectedDocuments()}
          selectedDocumentsByClient={selectedDocumentsByClient}
          onBack={() => setCurrentStep("email")}
          onComplete={handleComplete}
        />
      </div>
    );
  }

  if (currentStep === "email") {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <ComposeEmail
          clientName={clients.map((c) => c.name).join(" & ")}
          clients={clients}
          emailContent={emailContent}
          selectedDocuments={getAllSelectedDocuments()}
          onBack={() =>
            setCurrentStep(
              clients.length > 0 ? `client-${clients.length - 1}` : "client-0",
            )
          }
          onContinue={(content?: string) => {
            if (content) setEmailContent(content);
            setCurrentStep("review");
          }}
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
          <Button className="mt-4" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  const displayTitle =
    title ||
    (context === "appointment"
      ? `Send intakes for ${clients.map((c) => c.name).join(" & ")}`
      : `Share documents with ${clients.map((c) => c.name).join(" & ")}`);

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-6">{displayTitle}</h2>

        <ProgressSteps steps={steps} />

        {/* Client access alerts */}
        <div className="space-y-3 mb-6">
          {clients.filter((c) => c.email).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>
                {clients
                  .filter((c) => c.email)
                  .map((c) => c.name)
                  .join(" & ")}{" "}
                will receive Client Portal access.
              </span>
            </div>
          )}

          {clients.filter((c) => !c.email).length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    {clients
                      .filter((c) => !c.email)
                      .map((c) => c.name)
                      .join(" & ")}{" "}
                    will not receive Client Portal access.
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    No email address on file.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Display current client's documents */}
        {currentClient && (
          <div>
            <ClientDocumentSection
              client={currentClient}
              context={context}
              documentCategories={documentCategories}
              selectedDocuments={
                selectedDocumentsByClient[currentClient.id] || {}
              }
              sharedFilesMap={sharedFilesMap}
              onFrequencyChange={(docId, freq) =>
                handleFrequencyChange(docId, freq, currentClient.id)
              }
              onToggle={(docId) =>
                handleDocumentToggle(docId, currentClient.id)
              }
            />
          </div>
        )}

        <div className="flex justify-between mt-8">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {currentClientIndex > 0 && (
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentStep(`client-${currentClientIndex - 1}`)
                }
              >
                Back
              </Button>
            )}
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasAnyClientWithEmail() || !hasAnyDocumentsSelected()}
            onClick={() => {
              const nextClientIndex = currentClientIndex + 1;
              if (nextClientIndex < clients.length) {
                setCurrentStep(`client-${nextClientIndex}`);
              } else {
                setCurrentStep("email");
              }
            }}
          >
            {currentClientIndex < clients.length - 1
              ? `Continue to ${clients[currentClientIndex + 1]?.name || "Next"}`
              : "Continue to Email"}
          </Button>
        </div>

        {showReminders && context === "appointment" && clients.length === 1 && (
          <RemindersDialog
            clientEmail={clients[0].email || ""}
            clientName={clients[0].name}
            isOpen={showReminders}
            onClose={() => setShowReminders(false)}
          />
        )}
      </div>
    </div>
  );
};

// Component for rendering document sections for a specific client
interface ClientDocumentSectionProps {
  client: ShareClient;
  documentCategories: DocumentCategories;
  selectedDocuments: ClientDocumentState;
  sharedFilesMap: Map<
    string,
    Map<string, { frequency?: string; status?: string; sharedAt?: string }>
  >;
  context?: "appointment" | "client-share";
  onToggle: (docId: string) => void;
  onFrequencyChange: (docId: string, frequency: string) => void;
}

const ClientDocumentSection: React.FC<ClientDocumentSectionProps> = ({
  client,
  documentCategories,
  selectedDocuments,
  sharedFilesMap,
  context,
  onToggle,
  onFrequencyChange,
}) => {
  return (
    <div className="mb-6">
      {client.email ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="font-medium">
              {client.name} has Client Portal access.
            </span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Any items you share from this screen will only be visible to{" "}
            {client.name}.
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-orange-500">⚠</span>
            <span className="font-medium">
              {client.name} will not receive Client Portal access.
            </span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Any items you share from this screen will only be visible to{" "}
            {client.name}.
          </div>
        </div>
      )}

      <div className="text-gray-600 mb-4">
        {client.name} • {client.email || "No email on file"}
      </div>

      <div className="mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {client.name}'s items
        </span>
      </div>

      <div className="space-y-8">
        <DocumentSection
          context={context}
          emptyMessage="No consent documents available"
          items={documentCategories.consentDocuments.map((doc) => {
            const sharedData = sharedFilesMap.get(client.id)?.get(doc.id);
            return {
              ...doc,
              sharedOn: sharedData?.sharedAt,
              status: sharedData?.status || doc.status,
            };
          })}
          selectedDocuments={selectedDocuments}
          title="Consent Documents"
          onFrequencyChange={onFrequencyChange}
          onToggle={onToggle}
        />
        <DocumentSection
          context={context}
          items={documentCategories.scoredMeasures.map((doc) => {
            const sharedData = sharedFilesMap.get(client.id)?.get(doc.id);
            return {
              ...doc,
              sharedOn: sharedData?.sharedAt,
              status: sharedData?.status || doc.status,
            };
          })}
          selectedDocuments={selectedDocuments}
          title="Scored Measures"
          onFrequencyChange={onFrequencyChange}
          onToggle={onToggle}
        />
        <DocumentSection
          context={context}
          items={documentCategories.questionnaires.map((doc) => {
            const sharedData = sharedFilesMap.get(client.id)?.get(doc.id);
            return {
              ...doc,
              sharedOn: sharedData?.sharedAt,
              status: sharedData?.status || doc.status,
            };
          })}
          selectedDocuments={selectedDocuments}
          title="Questionnaires"
          onFrequencyChange={onFrequencyChange}
          onToggle={onToggle}
        />
        <DocumentSection
          context={context}
          items={documentCategories.uploadedFiles.map((doc) => {
            const sharedData = sharedFilesMap.get(client.id)?.get(doc.id);
            return {
              ...doc,
              sharedOn: sharedData?.sharedAt,
              status: sharedData?.status || doc.status,
            };
          })}
          selectedDocuments={selectedDocuments}
          title="Uploaded Files"
          onFrequencyChange={onFrequencyChange}
          onToggle={onToggle}
        />
      </div>
    </div>
  );
};

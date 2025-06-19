"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Badge } from "@mcw/ui";
import { FileText, ArrowLeft } from "lucide-react";
import DocumentationHistorySidebar from "@/(dashboard)/clients/[id]/components/DocumentationHistorySidebar";
import { ClientInfoHeader } from "@/(dashboard)/clients/[id]/components/ClientInfoHeader";
import { fetchSingleClientGroup } from "@/(dashboard)/clients/services/client.service";
import { ClientGroupFromAPI } from "@/(dashboard)/clients/[id]/edit/components/ClientEdit";
import {
  useTemplates,
  Template,
} from "@/(dashboard)/settings/template-library/hooks/useTemplates";
import { TemplateType } from "@/types/templateTypes";

export default function TemplateSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const clientGroupId = params.id as string;
  const [clientInfo, setClientInfo] = useState<ClientGroupFromAPI | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );

  // Get the first client's ID from the client group
  const clientId = clientInfo?.ClientGroupMembership[0]?.Client?.id;

  const { data: templatesData, isLoading: templatesLoading } = useTemplates({
    is_active: true,
  });

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const data = (await fetchSingleClientGroup({
          id: clientGroupId,
          searchParams: {
            includeProfile: "true",
            includeAdress: "true",
          },
        })) as { data: ClientGroupFromAPI } | null;

        if (data?.data) {
          setClientInfo(data.data);
        }
      } catch (error) {
        console.error("Error fetching client data:", error);
      }
    };

    fetchClientData();
  }, [clientGroupId]);

  const getDiagnosisTemplates = (): Template[] => {
    if (!templatesData?.data) return [];
    return templatesData.data.filter(
      (template: Template) =>
        template.type === TemplateType.DIAGNOSIS_AND_TREATMENT_PLANS,
    );
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleContinue = () => {
    if (selectedTemplate && clientId) {
      // Navigate back to the regular treatment plan flow for now
      // This maintains existing functionality
      router.push(`/clients/${clientGroupId}/diagnosisAndTreatmentPlan/new`);
    }
  };

  const handleSkipTemplate = () => {
    // Navigate to the basic treatment plan creation (current flow)
    router.push(`/clients/${clientGroupId}/diagnosisAndTreatmentPlan/new`);
  };

  const diagnosisTemplates = getDiagnosisTemplates();

  return (
    <div className="px-4 py-8 w-full max-w-6xl mx-auto">
      <ClientInfoHeader
        clientGroupId={clientGroupId}
        clientInfo={clientInfo}
        showDocumentationHistory={true}
        onDocumentationHistoryClick={() => setSidebarOpen(true)}
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Button
              className="flex items-center gap-2"
              size="sm"
              variant="ghost"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Select Treatment Plan Template
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Choose a template to guide your treatment plan creation
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {templatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Loading templates...</p>
            </div>
          ) : diagnosisTemplates.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {diagnosisTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedTemplate?.id === template.id
                            ? "border-green-600 bg-green-600"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedTemplate?.id === template.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {template.name}
                          </span>
                          {template.is_default && (
                            <Badge className="text-xs" variant="secondary">
                              Default
                            </Badge>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <Button
                  className="text-gray-600 hover:text-gray-900"
                  variant="ghost"
                  onClick={handleSkipTemplate}
                >
                  Continue without template
                </Button>
                <Button
                  className="bg-green-700 hover:bg-green-800 disabled:bg-gray-300"
                  disabled={!selectedTemplate}
                  onClick={handleContinue}
                >
                  Continue with selected template
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No templates available
              </h3>
              <p className="text-gray-600 mb-6">
                There are no diagnosis and treatment plan templates available.
              </p>
              <div className="space-x-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/settings/template-library")}
                >
                  Manage Templates
                </Button>
                <Button
                  className="bg-green-700 hover:bg-green-800"
                  onClick={handleSkipTemplate}
                >
                  Continue without template
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DocumentationHistorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
